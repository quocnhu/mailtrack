// src/gmail/utils/gmail-parser.util.ts
import * as cheerio from 'cheerio';
import { ParsedEmailDto } from '../dto/parsedEmail.dto';
import { TripAdvisorHtmlParser } from '../parsers/tripadvisorHtmlParser';
import { WebsiteHtmlParser } from '../parsers/websiteHtmlParser';

export class GmailParserUtil {
  static decodeBase64Url(data: string): string {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  static extractParts(payload: any, parts: { mimeType: string; data: string }[] = []): { mimeType: string; data: string }[] {
    if (!payload) return parts;
    if (payload.body?.data) parts.push({ mimeType: payload.mimeType, data: payload.body.data });
    if (payload.parts?.length) {
      for (const part of payload.parts) this.extractParts(part, parts);
    }
    return parts;
  }

  static stripHtml(html: string): string {
    const $ = cheerio.load(html);
    $('style, script, head, img, link, meta, noscript').remove();
    return $.text().replace(/\s{2,}/g, ' ').trim();
  }

  static detectProvider(headers: Record<string, string>): 'tripadvisor' | 'website' | 'unknown' {
    const senderFields = [
      headers['from'] ?? '', headers['reply-to'] ?? '', headers['sender'] ?? '', headers['return-path'] ?? ''
    ].join(' ').toLowerCase();

    if (senderFields.includes('nquocnhu95tourguide@gmail.com')) return 'tripadvisor';
    if (senderFields.includes('nquocnhu95book@gmail.com')) return 'website';
    return 'unknown';
  }

  static parseBookingData(provider: string, htmlBody: string | null): any {
    if (!htmlBody) return null;
    switch (provider) {
      case 'tripadvisor': return TripAdvisorHtmlParser.parse(htmlBody);
      case 'website': return WebsiteHtmlParser.parse(htmlBody);
      default: return null;
    }
  }

  static parseEmailBody(messageData: any): ParsedEmailDto {
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
      ? 'CANCEL' : 'NEW_BOOKING';

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
      textBody, htmlBody, cleanBody, provider, bookingData,
    };
  }
}