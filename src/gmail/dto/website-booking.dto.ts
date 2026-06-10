// dto/wpte-booking.dto.ts

export class WebsiteBookingDto {
  provider!: string; // "website"
  // ── Trip ──────────────────────────────────────────────────────────────
  tourName!:       string | null;    // "Cu Chi Ben Duoc Tunnels: Authentic & Less Touristy"
  packageName!:    string | null;    // "Shared Group Of 10 Max 7:30 AM"
  tripDate!:       string | null;    // "2026-04-13"
  travellers!:     number | null;    // 5
  priceLines!:     string | null;    // "Adult: 2x$25=$50, Child: 2x$20=$40, Infant: 1x$0=$0"
  subtotal!:       number | null;    // 90
  discount!:       number | null;    // 0
  totalcost!:      number | null;    // 90
  tourType!:       string | null;    // "Shared" (derived from packageName)
  pickUp!:         string | null;    // "Sherwood Residence"
  pickUpAddress!:  string | null;    // "127 Pasteur Street, Ben Nghe Ward, District 1, HCM City"

  // ── Billing ───────────────────────────────────────────────────────────
  billingName!:    string | null;    // "Rikke Nord"
  billingEmail!:   string | null;    // "rikke@nord.dk"
  billingAddress!: string | null;    // "Sherwood Residence, 127 Pasteur Street..."
  billingCity!:    string | null;    // "004520888461" (phone number — WP form bug)
  billingCountry!: string | null;    // null (left blank by customer)

  // ── Meta ──────────────────────────────────────────────────────────────
  bookingLink!:    string | null;    // "https://hanatourist.vip/wp-admin/post.php?post=3286&action=edit"
}
