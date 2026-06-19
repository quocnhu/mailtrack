import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '@/prisma/prisma.service';
import * as cheerio from 'cheerio';
import { ParsedEmailDto } from '@/gmail/dto/parsedEmail.dto';
import { TripAdvisorHtmlParser } from '@/gmail/parsers/tripadvisorHtmlParser';
import { WebsiteHtmlParser } from '@/gmail/parsers/websiteHtmlParser';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { RedisService } from '@/redis/redis.service';
import { Mutex } from 'async-mutex'; // Ensure: npm install async-mutex

@Injectable()
export class GmailService implements OnApplicationBootstrap {
  private readonly logger = new Logger(GmailService.name);
  private readonly mutex = new Mutex(); // Prevents overlapping executions
  private oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    @InjectQueue('booking-processing-queue') private readonly bookingQueue: Queue,
  ) {
    this.oauth2Client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        try {
          const profile = await google.gmail({ version: 'v1', auth: this.oauth2Client }).users.getProfile({ userId: 'me' });
          if (profile.data.emailAddress) {
            await this.prisma.gmailAccount.update({
              where: { email: profile.data.emailAddress.toLowerCase() },
              data: { refreshToken: tokens.refresh_token },
            });
          }
        } catch (err) {
          this.logger.error('Failed to save background token refresh:', err);
        }
      }
    });
  }

  async onApplicationBootstrap() {
    const account = await this.prisma.gmailAccount.findFirst();
    if (!account) this.logger.warn('No active Google account found.');
  }

  async processWebhookPayload(base64Data: string): Promise<void> {
    // Lock execution so multiple webhooks don't process the same history ID simultaneously
    await this.mutex.runExclusive(async () => {
      try {
        const rawData = Buffer.from(base64Data, 'base64').toString('utf-8');
        const { emailAddress, historyId } = JSON.parse(rawData);
        const email = emailAddress.toLowerCase();

        const account = await this.prisma.gmailAccount.findUnique({ where: { email } });
        if (!account || !account.refreshToken) return;

        // 1. History Guard: Ignore if we have already processed this history event
        if (Number(historyId) <= Number(account.lastHistoryId)) {
          this.logger.debug(`Ignoring redundant webhook for historyId: ${historyId}`);
          return;
        }

        this.oauth2Client.setCredentials({ refresh_token: account.refreshToken });
        const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

        const historyResponse = await gmail.users.history.list({
          userId: 'me',
          startHistoryId: account.lastHistoryId,
        });

        if (historyResponse.data.history) {
          for (const record of historyResponse.data.history) {
            if (record.messagesAdded) {
              for (const added of record.messagesAdded) {
                const messageId = added.message?.id;
                if (messageId) {
                  // 2. Per-Message Lock: Prevent same message being queued multiple times
                  const lockKey = `lock:msg:${messageId}`;
                  const isLocked = await this.redisService.get(lockKey);
                  
                  if (!isLocked) {
                    await this.redisService.set(lockKey, 'processing', 3600);
                    await this.processMessage(gmail, messageId);
                  }
                }
              }
            }
          }
        }

        await this.prisma.gmailAccount.update({
          where: { email },
          data: { lastHistoryId: String(historyId) },
        });

      } catch (error: any) {
        this.logger.error('Error in webhook processing:', error);
      }
    });
  }

  private async processMessage(gmail: any, messageId: string): Promise<void> {
    try {
      const message = await gmail.users.messages.get({ userId: 'me', id: messageId });
      
      // Only process if it's actually in the INBOX
      if (!message.data.labelIds?.includes('INBOX')) return;

      const parsed: ParsedEmailDto = this.parseEmailBody(message.data);
      if (!parsed.bookingData?.bookingRef) return;

      const bookingCacheKey = this.redisService.getBookingKey(parsed.provider, parsed.bookingData.bookingRef);
      
      await this.bookingQueue.add('process-email-job', { bookingKey: bookingCacheKey, payload: parsed });

      // 3. Mark as Processed: Remove INBOX label so it's not picked up again
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: { ids: [messageId], removeLabelIds: ['INBOX'] }
      });

      this.logger.log(`[SUCCESS] Processed and archived message: ${messageId}`);
    } catch (error) {
      this.logger.error(`Failed to process message ${messageId}:`, error);
    }
  }
// import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
// import { google } from 'googleapis';
// import { PrismaService } from '@/prisma/prisma.service';
// import * as cheerio from 'cheerio';
// import { ParsedEmailDto } from '@/gmail/dto/parsedEmail.dto';
// import { TripAdvisorHtmlParser } from '@/gmail/parsers/tripadvisorHtmlParser';
// import { WebsiteHtmlParser } from '@/gmail/parsers/websiteHtmlParser';
// import type { Queue } from 'bull';
// import { InjectQueue } from '@nestjs/bull'; // Standard NestJS Queue library
// import { RedisService } from '@/redis/redis.service';
// import * as fs from 'fs';
// import * as path from 'path';

// @Injectable()
// export class GmailService implements OnApplicationBootstrap {
//   private readonly logger = new Logger(GmailService.name);
//   private oauth2Client = new google.auth.OAuth2(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET,
//     process.env.GOOGLE_REDIRECT_URI
//   );

//   constructor(
//     private readonly prisma: PrismaService,
//     // 🗄️ The Filing Cabinet (Your Key-Value Cache)
//     private readonly redisService: RedisService,

//     // 🏗️ The Conveyor Belt (Your Redis Queue)
//     @InjectQueue('booking-processing-queue')
//     private readonly bookingQueue: Queue,
//   ) {
//     // 🔄 Listen to hidden background token updates from the Google SDK engine
//     this.oauth2Client.on('tokens', async (tokens) => {
//       try {
//         if (tokens.refresh_token) {
//           this.logger.log('🔄 A brand new refresh token was issued by Google. Updating data stores...');
          
//           // Request identity profile to safely bind token mapping to email
//           const tempGmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
//           const profile = await tempGmail.users.getProfile({ userId: 'me' });
//           const email = profile.data.emailAddress?.toLowerCase();

//           if (email) {
//             await this.prisma.gmailAccount.update({
//               where: { email },
//               data: { refreshToken: tokens.refresh_token },
//             });
//             this.logger.log(`✅ Successfully updated fresh database token for: ${email}`);
//           }
//         }
//       } catch (err) {
//         this.logger.error('Failed to automatically save rotated background credentials:', err);
//       }
//     });
//   }

//   async onApplicationBootstrap() {
//     try {
//       const account = await this.prisma.gmailAccount.findFirst();

//       if (!account || !account.refreshToken) {
//         this.logger.warn('⚠️ No active or authenticated Google Accounts found in database!');
//         const loginUrl = await this.getAuthUrl();
//         this.logger.log(`👉 Please authorize the app by visiting this URL: \n${loginUrl}`);
//       } else {
//         this.logger.log(`✅ System connected. Tracking active mailbox for: ${account.email}`);
//       }
//     } catch (error) {
//       this.logger.error('Failed to run startup database check:', error);
//     }
//   }

//   async getAuthUrl(): Promise<string> {
//     return this.oauth2Client.generateAuthUrl({
//       access_type: 'offline',
//       prompt: 'consent',
//       scope: ['https://www.googleapis.com/auth/gmail.readonly'],
//     });
//   }

//   async handleAuthorizationCode(code: string) {
//     const { tokens } = await this.oauth2Client.getToken(code);
//     this.oauth2Client.setCredentials(tokens);

//     const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
//     const profile = await gmail.users.getProfile({ userId: 'me' });

//     const email = profile.data.emailAddress?.toLowerCase();
//     if (!email) throw new Error('Could not retrieve email address from Google profile.');

//     const watchResult = await gmail.users.watch({
//       userId: 'me',
//       requestBody: { topicName: process.env.GOOGLE_PUBSUB_TOPIC },
//     });

//     const lastHistoryId = String(profile.data.historyId);
//     const watchExpiration = new Date(Number(watchResult.data.expiration));

//     return await this.prisma.gmailAccount.upsert({
//       where: { email },
//       update: {
//         lastHistoryId,
//         watchExpiration,
//         refreshToken: tokens.refresh_token || undefined,
//       },
//       create: {
//         email,
//         lastHistoryId,
//         watchExpiration,
//         refreshToken: tokens.refresh_token || '',
//       },
//     });
//   }

//   async processWebhookPayload(base64Data: string): Promise<void> {
//     let email = 'unknown';
//     try {
//       const rawData = Buffer.from(base64Data, 'base64').toString('utf-8');
//       const { emailAddress, historyId } = JSON.parse(rawData);
//       email = emailAddress.toLowerCase();

//       const account = await this.prisma.gmailAccount.findUnique({ where: { email } });
//       if (!account || !account.refreshToken || !account.lastHistoryId) {
//         this.logger.warn(`Skipping sync processing for ${email}: Account has no valid token saved.`);
//         return;
//       }

//       this.oauth2Client.setCredentials({
//         refresh_token: account.refreshToken,
//       });

//       const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

//       const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
//       if (!account.watchExpiration || account.watchExpiration < oneDayFromNow) {
//         this.logger.log(`Watch expiration approaching for ${email}. Renewing watch subscription...`);

//         const watchResult = await gmail.users.watch({
//           userId: 'me',
//           requestBody: { topicName: process.env.GOOGLE_PUBSUB_TOPIC },
//         });

//         await this.prisma.gmailAccount.update({
//           where: { email },
//           data: { watchExpiration: new Date(Number(watchResult.data.expiration)) },
//         });
//       }

//       const historyResponse = await gmail.users.history.list({
//         userId: 'me',
//         startHistoryId: account.lastHistoryId,
//         labelId: 'INBOX',
//       });

//       if (historyResponse.data.history) {
//         for (const record of historyResponse.data.history) {
//           if (record.messagesAdded) {
//             for (const addedRecord of record.messagesAdded) {
//               const messageId = addedRecord.message?.id;
//               const hasInboxLabel = addedRecord.message?.labelIds?.includes('INBOX');

//               if (messageId && hasInboxLabel) {
//                 this.logger.log(`📬 New incoming inbox message detected: ${messageId}`);
//                 await this.processMessage(gmail, messageId);
//               }
//             }
//           }
//         }
//       }

//       await this.prisma.gmailAccount.update({
//         where: { email },
//         data: { lastHistoryId: String(historyId) },
//       });

//     } catch (error: any) {
//       // 🚨 SPECIFIC AUTH FAILURE INTERCEPTION ZONE
//       const errorMsg = error?.message || '';
//       const isInvalidGrant = errorMsg.includes('invalid_grant') || (error?.response?.data?.error === 'invalid_grant');

//       if (isInvalidGrant) {
//         this.logger.error(`❌ [CRITICAL AUTH EXPIRED] The Google refresh token for account ${email} was revoked or has expired.`);
        
//         // Wipe or flag the token field in the database to halt the background crash loops
//         await this.prisma.gmailAccount.update({
//           where: { email },
//           data: { refreshToken: '' }
//         }).catch(() => null);

//         const loginUrl = await this.getAuthUrl();
//         this.logger.warn(`👉 Action Required! Please request a new token by visiting this link: \n${loginUrl}`);
//         return;
//       }

//       this.logger.error('Failed to process incoming webhook sync:', error);
//     }
//   }

//   private async processMessage(gmail: any, messageId: string): Promise<void> {
//     try {
//       const message = await gmail.users.messages.get({ userId: 'me', id: messageId });
//       const parsed: ParsedEmailDto = this.parseEmailBody(message.data);
//       const uniqueRef = parsed.bookingData?.bookingRef;

//       if (!uniqueRef) {
//         this.logger.warn(`Skipping message ${messageId}: No unique booking reference found.`);
//         return;
//       }

//       const bookingCacheKey = this.redisService.getBookingKey(parsed.provider, uniqueRef);
//       const existingCache = await this.redisService.get(bookingCacheKey);
      
//       if (parsed.bookingStatus === 'NEW_BOOKING' && existingCache) {
//         this.logger.log(`[DEDUPLICATED] Dropping duplicate email for key: ${bookingCacheKey}`);
//         return;
//       }

//       await this.redisService.cacheParsedMail(bookingCacheKey, parsed);

//       await this.bookingQueue.add('process-email-job', {
//         bookingKey: bookingCacheKey,
//         payload: parsed
//       });

//       this.logger.log(`[SUCCESS] Message ${messageId} successfully cached and queued.`);
//     } catch (error) {
//       this.logger.error(`Error processing message ${messageId}:`, error);
//     }
//   }

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
      headers['from'] ?? '',
      headers['reply-to'] ?? '',
      headers['sender'] ?? '',
      headers['return-path'] ?? '',
    ].join(' ').toLowerCase();

    if (senderFields.includes('nquocnhu95tourguide@gmail.com')) return 'tripadvisor';
    if (senderFields.includes('nquocnhu95book@gmail.com')) return 'website';

    return 'unknown';
  }

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
    const allParts = this.extractParts(messageData.payload);
    const plainPart = allParts.find((p) => p.mimeType === 'text/plain');
    const htmlPart = allParts.find((p) => p.mimeType === 'text/html');

    const textBody = plainPart ? this.decodeBase64Url(plainPart.data) : null;
    const htmlBody = htmlPart ? this.decodeBase64Url(htmlPart.data) : null;

    const cleanBody = textBody ?? (htmlBody ? this.stripHtml(htmlBody) : null);

    const headers: Record<string, string> = {};
    for (const h of messageData.payload?.headers ?? []) {
      headers[h.name.toLowerCase()] = h.value;
    }

    const subject = headers['subject'] ?? '';
    const lowerSubject = subject.toLowerCase();

    const status = lowerSubject.includes('cancel') || lowerSubject.includes('cancellation') || lowerSubject.includes('cancelled')
      ? 'CANCEL'
      : 'NEW_BOOKING';

    const provider = this.detectProvider(headers);
    const bookingData = this.parseBookingData(provider, htmlBody);

    return {
      bookingStatus: status,
      subject: headers['subject'] ?? null,
      from: headers['from'] ?? null,
      to: headers['to'] ?? null,
      date: headers['date'] ?? null,
      messageId: headers['message-id'] ?? null,
      snippet: messageData.snippet ?? null,
      internalDate: messageData.internalDate ?? null,
      textBody,
      htmlBody,
      cleanBody,
      provider,
      bookingData,
    };
  }
}
// import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
// import { google } from 'googleapis';
// import { PrismaService } from '@/prisma/prisma.service';
// import * as cheerio from 'cheerio';
// import { ParsedEmailDto } from '@/gmail/dto/parsedEmail.dto';
// import { TripAdvisorHtmlParser } from '@/gmail/parsers/tripadvisorHtmlParser';
// import { WebsiteHtmlParser } from '@/gmail/parsers/websiteHtmlParser';
// import type { Queue } from 'bull';
// import { InjectQueue } from '@nestjs/bull'; // Standard NestJS Queue library
// import { RedisService } from '@/redis/redis.service';
// import * as fs from 'fs';
// import * as path from 'path';


// @Injectable()
// export class GmailService implements OnApplicationBootstrap {
//   private readonly logger = new Logger(GmailService.name);
//   private oauth2Client = new google.auth.OAuth2(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET,
//     process.env.GOOGLE_REDIRECT_URI
//   );

//   constructor(
//     private readonly prisma: PrismaService,
//     // 🗄️ The Filing Cabinet (Your Key-Value Cache)
//     private readonly redisService: RedisService,

//     // 🏗️ The Conveyor Belt (Your Redis Queue)
//     @InjectQueue('booking-processing-queue')
//     private readonly bookingQueue: Queue,
//   ) {
//     this.oauth2Client.on('tokens', (tokens) => {
//       if (tokens.access_token) {
//         this.logger.log('Access token rotated hiddenly by Google SDK.');
//       }
//     });
//   }

//   async onApplicationBootstrap() {
//     try {
//       const account = await this.prisma.gmailAccount.findFirst();

//       if (!account) {
//         this.logger.warn('⚠️ No active Google Accounts found in database!');
//         const loginUrl = await this.getAuthUrl();
//         this.logger.log(`👉 Please authorize the app by visiting this URL: \n${loginUrl}`);
//       } else {
//         this.logger.log(`✅ System connected. Tracking active mailbox for: ${account.email}`);
//       }
//     } catch (error) {
//       this.logger.error('Failed to run startup database check:', error);
//     }
//   }

//   async getAuthUrl(): Promise<string> {
//     return this.oauth2Client.generateAuthUrl({
//       access_type: 'offline',
//       prompt: 'consent',
//       scope: ['https://www.googleapis.com/auth/gmail.readonly'],
//     });
//   }

//   async handleAuthorizationCode(code: string) {
//     const { tokens } = await this.oauth2Client.getToken(code);
//     this.oauth2Client.setCredentials(tokens);

//     const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
//     const profile = await gmail.users.getProfile({ userId: 'me' });

//     const email = profile.data.emailAddress?.toLowerCase();
//     if (!email) throw new Error('Could not retrieve email address from Google profile.');

//     const watchResult = await gmail.users.watch({
//       userId: 'me',
//       requestBody: { topicName: process.env.GOOGLE_PUBSUB_TOPIC },
//     });

//     const lastHistoryId = String(profile.data.historyId);
//     const watchExpiration = new Date(Number(watchResult.data.expiration));

//     return await this.prisma.gmailAccount.upsert({
//       where: { email },
//       update: {
//         lastHistoryId,
//         watchExpiration,
//         refreshToken: tokens.refresh_token || undefined,
//       },
//       create: {
//         email,
//         lastHistoryId,
//         watchExpiration,
//         refreshToken: tokens.refresh_token || '',
//       },
//     });
//   }

//   async processWebhookPayload(base64Data: string): Promise<void> {
//     try {
//       const rawData = Buffer.from(base64Data, 'base64').toString('utf-8');
//       const { emailAddress, historyId } = JSON.parse(rawData);
//       const email = emailAddress.toLowerCase();

//       const account = await this.prisma.gmailAccount.findUnique({ where: { email } });
//       if (!account || !account.lastHistoryId) return;

//       this.oauth2Client.setCredentials({
//         refresh_token: account.refreshToken,
//       });

//       const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

//       const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
//       if (!account.watchExpiration || account.watchExpiration < oneDayFromNow) {
//         this.logger.log(`Watch expiration approaching for ${email}. Renewing watch subscription...`);

//         const watchResult = await gmail.users.watch({
//           userId: 'me',
//           requestBody: { topicName: process.env.GOOGLE_PUBSUB_TOPIC },
//         });

//         await this.prisma.gmailAccount.update({
//           where: { email },
//           data: { watchExpiration: new Date(Number(watchResult.data.expiration)) },
//         });
//       }

//       const historyResponse = await gmail.users.history.list({
//         userId: 'me',
//         startHistoryId: account.lastHistoryId,
//         labelId: 'INBOX',
//       });

//       if (historyResponse.data.history) {
//         for (const record of historyResponse.data.history) {
//           if (record.messagesAdded) {
//             for (const addedRecord of record.messagesAdded) {
//               const messageId = addedRecord.message?.id;
//               const hasInboxLabel = addedRecord.message?.labelIds?.includes('INBOX');

//               if (messageId && hasInboxLabel) {
//                 this.logger.log(`📬 New incoming inbox message detected: ${messageId}`);
//                 await this.processMessage(gmail, messageId);
//               }
//             }
//           }
//         }
//       }

//       await this.prisma.gmailAccount.update({
//         where: { email },
//         data: { lastHistoryId: String(historyId) },
//       });

//     } catch (error) {
//       this.logger.error('Failed to process incoming webhook sync:', error);
//     }
//   }

//   private async processMessage(gmail: any, messageId: string): Promise<void> {
//     try {
//       // 1. Fetch the raw email from Gmail API
//       const message = await gmail.users.messages.get({ userId: 'me', id: messageId });

//       // 2. Parse the email body to extract booking details
//       const parsed: ParsedEmailDto = this.parseEmailBody(message.data);
//       const uniqueRef = parsed.bookingData?.bookingRef;

//       // Optional debug stuff you had
//       console.log('html length:', parsed.htmlBody?.length);
//       fs.writeFileSync(
//         path.join(__dirname, `tripadvisor-${Date.now()}.html`),
//         parsed.htmlBody ?? '',
//         'utf8',
//       );
//       console.log('--- Parsed Email ---', parsed);

//       // If there's no booking reference, we can't track duplicates or queue it safely
//       if (!uniqueRef) {
//         this.logger.warn(`Skipping message ${messageId}: No unique booking reference found.`);
//         return;
//       }

//       // ─── REDIS SERVICE: FILING CABINET ──────────────────────────────────
//       // 3. Create the meaningful, semantic key name
//       const bookingCacheKey = this.redisService.getBookingKey(parsed.provider, uniqueRef);

//       // 4. KEY-VALUE MECHANISM: Check if this email was already handled
//       const existingCache = await this.redisService.get(bookingCacheKey);
//       if (parsed.bookingStatus === 'NEW_BOOKING' && existingCache) {
//         this.logger.log(`[DEDUPLICATED] Dropping duplicate email for key: ${bookingCacheKey}`);
//         return; // Stop right here, drop the duplicate!
//       }

//       // 5. KEY-VALUE MECHANISM: Save it to RAM cache for 24 hours to lock it
//       await this.redisService.cacheParsedMail(bookingCacheKey, parsed);

//       // ─── BULL QUEUE: CONVEYOR BELT ──────────────────────────────────────
//       // 6. QUEUE MECHANISM: Push the payload onto the belt for Postgres processing
//       await this.bookingQueue.add('process-email-job', {
//         bookingKey: bookingCacheKey, // Tell the worker what the cache key name is
//         payload: parsed             // Send the fully parsed TripAdvisor email structure
//       });

//       this.logger.log(`[SUCCESS] Message ${messageId} successfully cached and queued.`);
//     } catch (error) {
//       this.logger.error(`Error processing message ${messageId}:`, error);
//     }
//   }

//   private decodeBase64Url(data: string): string {
//     const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
//     return Buffer.from(base64, 'base64').toString('utf-8');
//   }

//   private extractParts(
//     payload: any,
//     parts: { mimeType: string; data: string }[] = [],
//   ): { mimeType: string; data: string }[] {
//     if (!payload) return parts;

//     if (payload.body?.data) {
//       parts.push({ mimeType: payload.mimeType, data: payload.body.data });
//     }

//     if (payload.parts?.length) {
//       for (const part of payload.parts) {
//         this.extractParts(part, parts);
//       }
//     }

//     return parts;
//   }

//   private stripHtml(html: string): string {
//     const $ = cheerio.load(html);
//     $('style, script, head, img, link, meta, noscript').remove();
//     return $.text().replace(/\s{2,}/g, ' ').trim();
//   }

//   private detectProvider(headers: Record<string, string>): 'tripadvisor' | 'website' | 'unknown' {
//     const senderFields = [
//       headers['from'] ?? '',
//       headers['reply-to'] ?? '',
//       headers['sender'] ?? '',
//       headers['return-path'] ?? '',
//     ].join(' ').toLowerCase();

//     if (senderFields.includes('nquocnhu95tourguide@gmail.com')) return 'tripadvisor';
//     if (senderFields.includes('nquocnhu95book@gmail.com')) return 'website';

//     return 'unknown';
//   }

//   /**
//    * Routes the HTML body to the correct parser based on detected provider
//    */
//   private parseBookingData(provider: string, htmlBody: string | null): any {
//     if (!htmlBody) return null;

//     switch (provider) {
//       case 'tripadvisor':
//         return TripAdvisorHtmlParser.parse(htmlBody);
//       case 'website':
//         return WebsiteHtmlParser.parse(htmlBody);
//       default:
//         return null;
//     }
//   }

//   private parseEmailBody(messageData: any): ParsedEmailDto {
//     // ── Stage 1: Decode & Extract MIME Parts ──────────────────────────
//     const allParts = this.extractParts(messageData.payload);
//     const plainPart = allParts.find((p) => p.mimeType === 'text/plain');
//     const htmlPart = allParts.find((p) => p.mimeType === 'text/html');

//     const textBody = plainPart ? this.decodeBase64Url(plainPart.data) : null;
//     const htmlBody = htmlPart ? this.decodeBase64Url(htmlPart.data) : null;

//     const cleanBody = textBody ?? (htmlBody ? this.stripHtml(htmlBody) : null);

//     // ── Stage 2: Structure Headers & Detect Status ─────────────────────
//     const headers: Record<string, string> = {};
//     for (const h of messageData.payload?.headers ?? []) {
//       headers[h.name.toLowerCase()] = h.value;
//     }

//     const subject = headers['subject'] ?? '';
//     const lowerSubject = subject.toLowerCase();

//     // ✅ Kept right here with the headers for a cleaner, unified flow
//     const status = lowerSubject.includes('cancel') || lowerSubject.includes('cancellation') || lowerSubject.includes('cancelled')
//       ? 'CANCEL'
//       : 'NEW_BOOKING';

//     // ── Stage 3: Provider Detection ────────────────────────────────────
//     const provider = this.detectProvider(headers);

//     // ── Stage 4: Deep Structure Scraping ────────────────────────────────
//     const bookingData = this.parseBookingData(provider, htmlBody);

//     return {
//       bookingStatus: status,
//       subject: headers['subject'] ?? null,
//       from: headers['from'] ?? null,
//       to: headers['to'] ?? null,
//       date: headers['date'] ?? null,
//       messageId: headers['message-id'] ?? null,
//       snippet: messageData.snippet ?? null,
//       internalDate: messageData.internalDate ?? null,
//       textBody,
//       htmlBody,
//       cleanBody,
//       provider,
//       bookingData,
//     };
//   }
// }
