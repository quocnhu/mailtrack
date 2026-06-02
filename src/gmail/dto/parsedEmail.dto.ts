export class ParsedEmailDto {
  bookingStatus: string;
  provider:     string;
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
  bookingData:  Record<string, any> | null;
}