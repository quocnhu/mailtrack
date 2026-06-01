import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '@/prisma/prisma.service';
import * as cheerio from 'cheerio';
import { ParsedEmailDto} from '@/gmail/dto/parsedEmail.dto';
import { TripAdvisorHtmlParser } from '@/gmail/parsers/tripadvisorHtmlParser';
import { WebsiteHtmlParser } from '@/gmail/parsers/websiteHtmlParser';

@Injectable()
export class GmailService implements OnApplicationBootstrap {
  private readonly logger = new Logger(GmailService.name);
  private oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  constructor(
    private readonly prisma: PrismaService,
  ) {
    this.oauth2Client.on('tokens', (tokens) => {
      if (tokens.access_token) {
        this.logger.log('Access token rotated hiddenly by Google SDK.');
      }
    });
  }

  async onApplicationBootstrap() {
    try {
      const account = await this.prisma.gmailAccount.findFirst();

      if (!account) {
        this.logger.warn('⚠️ No active Google Accounts found in database!');
        const loginUrl = await this.getAuthUrl();
        this.logger.log(`👉 Please authorize the app by visiting this URL: \n${loginUrl}`);
      } else {
        this.logger.log(`✅ System connected. Tracking active mailbox for: ${account.email}`);
      }
    } catch (error) {
      this.logger.error('Failed to run startup database check:', error);
    }
  }

  async getAuthUrl(): Promise<string> {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    });
  }

  async handleAuthorizationCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });

    const email = profile.data.emailAddress?.toLowerCase();
    if (!email) throw new Error('Could not retrieve email address from Google profile.');

    const watchResult = await gmail.users.watch({
      userId: 'me',
      requestBody: { topicName: process.env.GOOGLE_PUBSUB_TOPIC },
    });

    const lastHistoryId = String(profile.data.historyId);
    const watchExpiration = new Date(Number(watchResult.data.expiration));

    return await this.prisma.gmailAccount.upsert({
      where: { email },
      update: {
        lastHistoryId,
        watchExpiration,
        refreshToken: tokens.refresh_token || undefined,
      },
      create: {
        email,
        lastHistoryId,
        watchExpiration,
        refreshToken: tokens.refresh_token || '',
      },
    });
  }

  async processWebhookPayload(base64Data: string): Promise<void> {
    try {
      const rawData = Buffer.from(base64Data, 'base64').toString('utf-8');
      const { emailAddress, historyId } = JSON.parse(rawData);
      const email = emailAddress.toLowerCase();

      const account = await this.prisma.gmailAccount.findUnique({ where: { email } });
      if (!account || !account.lastHistoryId) return;

      this.oauth2Client.setCredentials({
        refresh_token: account.refreshToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      if (!account.watchExpiration || account.watchExpiration < oneDayFromNow) {
        this.logger.log(`Watch expiration approaching for ${email}. Renewing watch subscription...`);

        const watchResult = await gmail.users.watch({
          userId: 'me',
          requestBody: { topicName: process.env.GOOGLE_PUBSUB_TOPIC },
        });

        await this.prisma.gmailAccount.update({
          where: { email },
          data: { watchExpiration: new Date(Number(watchResult.data.expiration)) },
        });
      }

      const historyResponse = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: account.lastHistoryId,
        labelId: 'INBOX',
      });

      if (historyResponse.data.history) {
        for (const record of historyResponse.data.history) {
          if (record.messagesAdded) {
            for (const addedRecord of record.messagesAdded) {
              const messageId = addedRecord.message?.id;
              const hasInboxLabel = addedRecord.message?.labelIds?.includes('INBOX');

              if (messageId && hasInboxLabel) {
                this.logger.log(`📬 New incoming inbox message detected: ${messageId}`);
                await this.processMessage(gmail, messageId);
              }
            }
          }
        }
      }

      await this.prisma.gmailAccount.update({
        where: { email },
        data: { lastHistoryId: String(historyId) },
      });

    } catch (error) {
      this.logger.error('Failed to process incoming webhook sync:', error);
    }
  }

  private async processMessage(gmail: any, messageId: string): Promise<void> {
    try {
      const message = await gmail.users.messages.get({ userId: 'me', id: messageId });
      const parsed: ParsedEmailDto = this.parseEmailBody(message.data);

      console.log('--- Parsed Email ---', parsed);

      // console.log('--- Parsed Email ---');
      // console.log('Provider    :', parsed.provider);
      // console.log('Subject     :', parsed.subject);
      // console.log('From        :', parsed.from);
      // console.log('Date        :', parsed.date);
      // console.log('Snippet     :', parsed.snippet);
      // console.log('Clean body preview:\n', parsed.cleanBody?.slice(0, 500));
      // console.log('--------------------');
      // console.log('Full raw message data:', message.data);
      // console.log('html', parsed.htmlBody);
      // console.log('--------------------');
      // console.log('all in one and unparsed', message.data);
    } catch (error) {
      this.logger.error(`Error processing message ${messageId}:`, error);
    }
  }

  private decodeBase64Url(data: string): string {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  private extractParts(
    payload: any,
    parts: { mimeType: string; data: string }[] = [],
  ): { mimeType: string; data: string }[] {
    if (!payload) return parts;

    if (payload.body?.data) {
      parts.push({ mimeType: payload.mimeType, data: payload.body.data });
    }

    if (payload.parts?.length) {
      for (const part of payload.parts) {
        this.extractParts(part, parts);
      }
    }

    return parts;
  }

  private stripHtml(html: string): string {
    const $ = cheerio.load(html);
    $('style, script, head, img, link, meta, noscript').remove();
    return $.text().replace(/\s{2,}/g, ' ').trim();
  }

  private detectProvider(headers: Record<string, string>): 'tripadvisor' | 'website' | 'unknown' {
    const senderFields = [
      headers['from']        ?? '',
      headers['reply-to']    ?? '',
      headers['sender']      ?? '',
      headers['return-path'] ?? '',
    ].join(' ').toLowerCase();

    if (senderFields.includes('nquocnhu95tourguide@gmail.com')) return 'tripadvisor';
    if (senderFields.includes('yourdomain.com')) return 'website';

    return 'unknown';
  }

  /**
   * Routes the HTML body to the correct parser based on detected provider
   */
  private parseBookingData(provider: string, htmlBody: string | null): any {
    if (!htmlBody) return null;

    switch (provider) {
      case 'tripadvisor':
        return TripAdvisorHtmlParser.parse(htmlBody);
      case 'website':
        return WebsiteHtmlParser.parse(htmlBody);
      default:
        return null;
    }
  }

  private parseEmailBody(messageData: any): ParsedEmailDto {
    // ── Stage 1: Decode & Extract MIME Parts ──────────────────────────
    const allParts  = this.extractParts(messageData.payload);
    const plainPart = allParts.find((p) => p.mimeType === 'text/plain');
    const htmlPart  = allParts.find((p) => p.mimeType === 'text/html');

    const textBody = plainPart ? this.decodeBase64Url(plainPart.data) : null;
    const htmlBody = htmlPart  ? this.decodeBase64Url(htmlPart.data)  : null;

    // Prefer plain text; fall back to cheerio-stripped HTML
    const cleanBody = textBody ?? (htmlBody ? this.stripHtml(htmlBody) : null);

    // ── Stage 2: Structure Headers ─────────────────────────────────────
    const headers: Record<string, string> = {};
    for (const h of messageData.payload?.headers ?? []) {
      headers[h.name.toLowerCase()] = h.value;
    }

    // ── Stage 3: Provider Detection ────────────────────────────────────
    const provider = this.detectProvider(headers);

    // ── Stage 4: Deep Structure Scraping (NEW) ──────────────────────────
    const bookingData = this.parseBookingData(provider, htmlBody);

    return {
      subject:      headers['subject']       ?? null,
      from:         headers['from']          ?? null,
      to:           headers['to']            ?? null,
      date:         headers['date']          ?? null,
      messageId:    headers['message-id']    ?? null,
      snippet:      messageData.snippet      ?? null,
      internalDate: messageData.internalDate ?? null,
      textBody,
      htmlBody,
      cleanBody,
      provider,
      bookingData, // ✅ Extracted structured data automatically populates here!
    };
  }
}
