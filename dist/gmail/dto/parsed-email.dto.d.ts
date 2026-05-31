import { BookingData } from "./booking-data.dto";
export type EmailProvider = 'tripadvisor' | 'website' | 'unknown';
export declare class ParsedEmailDto {
    subject: string | null;
    from: string | null;
    to: string | null;
    date: string | null;
    messageId: string | null;
    snippet: string | null;
    internalDate: string | null;
    textBody: string | null;
    htmlBody: string | null;
    cleanBody: string | null;
    provider: EmailProvider;
    bookingData: BookingData | null;
    rawFallback: string | null;
}
