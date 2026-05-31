// src/gmail/dto/tripadvisor-booking.dto.ts

export interface TripAdvisorBookingDto {
  bookingRef: string | null;
  productBookingRef: string | null;
  extBookingRef: string | null;
  product: string | null;
  supplier: string | null;
  soldBy: string | null;
  bookingChannel: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  date: string | null;
  rate: string | null;
  pax: string | null;
  pickup: string | null;
  guidedLanguages: string | null;
  created: string | null;
  viatorAmount: string | null;
  templateProvider: string;
}