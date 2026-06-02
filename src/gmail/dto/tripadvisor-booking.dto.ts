export class TripadvisorBookingDto {
  provider: string; // "tripadvisor"
  // ── Booking identifiers ───────────────────────────────────────────────
  bookingRef:        string | null;  // "VIA-91235617"
  productBookingRef: string | null;  // "Hana-T130151029"
  extBookingRef:     string | null;  // "1394584387"

  // ── Product ───────────────────────────────────────────────────────────
  tourName:          string | null;  // "107622P40 - Cu Chi-Ben Duoc Tunnels..."
  supplier:          string | null;  // "HANA TOURIST"
  soldBy:            string | null;  // "Viator.com"
  bookingChannel:    string | null;  // "Viator.com"

  // ── Customer ──────────────────────────────────────────────────────────
  customer:          string | null;  // "MUNRO, Rowland"
  customerEmail:     string | null;  // "S-9d0cc5b...@expmessaging.tripadvisor.com"
  customerPhone:     string | null;  // "+61409082488"

  // ── Booking details ───────────────────────────────────────────────────
  date:              string | null;  // "Mon 8.Jun '26 @ 07:30"
  rate:              string | null;  // "Shared Group Of 10 Max"
  pax:               string | null;  // "2 Adult"
  pickUp:            string | null;  // "Liberty Central Saigon Riverside Hotel"
  pickUpAddress:     string | null;  // "65 Le Loi, Ben Nghe, District 1..."
  guidedLanguages:   string | null;  // "(Guided language: English)"
  extras:            string | null;  // empty in this booking

  // ── Notes ─────────────────────────────────────────────────────────────
  inclusions:        string | null;  // "Hotel pickup & drop-off, van, guide..."
  bookingLanguages:  string | null;  // "GUIDE : English"

  // ── Cost ──────────────────────────────────────────────────────────────
  // Not a standalone row — buried inside notes as "Viator amount: USD 39.96"
  totalcost:         string | null;  // "USD 39.96"
  paxTotal:          number | null;  // 2 (extracted from "2 Adult" in pax field)
  tourType:          string | null;  // "Shared" (derived from rate and tourName)

  // ── Meta ──────────────────────────────────────────────────────────────
  createdAt:         string | null;  // "Fri, May 08 2026 @ 01:25"
}