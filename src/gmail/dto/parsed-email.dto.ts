import { BookingData } from '@/gmail/dto/booking-data.dto';

export type EmailProvider = 'tripadvisor' | 'website' | 'unknown';

export class ParsedEmailDto {
  subject:      string | null;
  from:         string | null;
  to:           string | null;
  date:         string | null;
  messageId:    string | null;
  snippet:      string | null;
  internalDate: string | null;
  textBody:     string | null;
  htmlBody:     string | null;
  cleanBody:    string | null;
  provider:     EmailProvider;
  bookingData:  BookingData | null;  // null if extraction failed or unknown provider
  rawFallback:  string | null;       // cleanBody used when template extraction fails
}