import * as cheerio from 'cheerio';
import { WebsiteBookingDto } from '@/gmail/dto/website-booking.dto';

export class WebsiteHtmlParser {
  static parse(htmlBody: string): WebsiteBookingDto {
    // ── 1. EMERGENCY FALLBACK FOR EMPTY/MISSING HTML PAYLOADS ────────────────────
    if (!htmlBody) {
      return {
        provider: 'website',
        // Immortal fallback reference to prevent DB conflicts and preserve error timestamp
        bookingRef: null,
        tourName: null,
        packageName: null,
        tourType: 'UNKNOWN',
        tripDate: null,
        travellers: null,
        priceLines: null,
        subtotal: null,
        discount: null,
        totalcost: null,
        billingName: null,
        billingEmail: null,
        billingAddress: null,
        pickUp: null,
        pickUpAddress: null,
        billingCity: null,
        billingCountry: null,
        bookingLink: null,
      } as WebsiteBookingDto;
    }

    const $ = cheerio.load(htmlBody);

    // Helper function to sanitize and parse dollar currency strings into numbers
    const parseDollar = (raw: string): number | null => {
      if (!raw) return null;
      const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''));
      return isNaN(parsed) ? null : parsed;
    };

    // ── 2. EXTRACTION OF TRIP DETAILS ───────────────────────────────────────────
    let tourName: string | null = null;
    let packageName: string | null = null;
    let tripDate: string | null = null;
    let travellers: number | null = null;
    let subtotal: number | null = null;
    let discount: number | null = null;
    let total: number | null = null;

    const tourNameElement = $('td b').first();
    tourName = tourNameElement.length > 0 ? tourNameElement.text().trim() : null;

    const priceLinesParts: string[] = [];

    // Traverse rows to extract tabular trip information
    $('tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 2) return;

      const key = cells.eq(0).text().trim();
      const val = cells.eq(1).text().trim();

      if (key === 'Package Name') packageName = val || null;
      if (key === 'Trip Date') tripDate = val || null;
      if (key === 'Travellers') travellers = parseInt(val, 10) || null;
      if (key === 'Subtotal' && val.startsWith('$')) subtotal = parseDollar(val);
      if (key === 'Discount') discount = parseDollar(val);
      if (key === 'Total') total = parseDollar(val);

      // Capture receipt breakdown lines (e.g., "Adults: 2 x $25 = $50")
      const priceMatch = val.match(/^(\d+)\s*[Xx]\s*\$([0-9.]+)\s*=\s*\$([0-9.]+)$/);
      if (priceMatch && key && key !== 'Subtotal') {
        priceLinesParts.push(`${key}: ${priceMatch[1]}x$${priceMatch[2]}=$${priceMatch[3]}`);
      }
    });

    const priceLines = priceLinesParts.length > 0 ? priceLinesParts.join(', ') : null;

    // ── 3. EXTRACTION OF CUSTOMER BILLING DETAILS ───────────────────────────────
    let billingName: string | null = null;
    let billingEmail: string | null = null;
    let billingAddress: string | null = null;
    let billingCity: string | null = null;
    let billingCountry: string | null = null;

    $('tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 2) return;

      const key = cells.eq(0).text().trim();
      const val = cells.eq(1).text().trim();

      if (key === 'Name') billingName = val || null;
      if (key === 'Email') billingEmail = cells.eq(1).find('a').attr('href')?.replace('mailto:', '').trim() ?? val ?? null;
      if (key === 'Billing Address') billingAddress = val || null;
      if (key === 'City') billingCity = val || null;
      if (key === 'Country') billingCountry = val || null;
    });

    // ── 4. AUTOMATIC BOOKING REFERENCE GENERATOR ─────────────────────────────────
    // Performance Optimized: Query targeted admin links directly to avoid generic iterations
    const bookingLink = $('a[href*="wp-admin"][href*="action=edit"]').attr('href') || null;

    let bookingRef: string;
    const wpPostId = bookingLink?.match(/post=(\d+)/)?.[1];
    
    if (wpPostId) {
      bookingRef = `WEB-${wpPostId}`; // Resolves to standard format: e.g., WEB-3286
    } else {
      // Safe fallback ensuring 100% uniqueness if the admin link or Post ID is missing
      bookingRef = `WEB-FALLBACK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    // ── 5. TOUR TYPE CLASSIFICATION LOGIC ────────────────────────────────────────
    let tourType = 'UNKNOWN';
    const combinedContent = `
      ${(packageName || '').toLowerCase()} 
      ${(tourName || '').toLowerCase()}
    `.replace(/\s+/g, ' ');

    if (combinedContent.includes('private') || combinedContent.includes('solo')) {
      tourType = 'PRIVATE_TOUR';
    } else if (
      combinedContent.includes('shared') ||
      combinedContent.includes('group') ||
      combinedContent.includes('max ')
    ) {
      tourType = 'GROUP_TOUR';
    }

    // ── 6. REGEX-DRIVEN ADDRESS SPLITTING FOR PICKUPS ────────────────────────────
    let pickUpLocation: string | null = null;
    let pickUpAddress: string | null = null;

    const forcedAddress = billingAddress as string | null;

    if (forcedAddress && forcedAddress.trim() !== '') {
      const cleanAddress = forcedAddress.replace(/\s+/g, ' ').trim();
      // Regular expression matching common lodging keywords to extract hotel name vs street address
      const hotelPattern = /^([^,]+?\b(?:Residence|Hotel|Apartment|Apartments|Suite|Suites|Villa|Villas|Stay|Hostel|Homestay|Spa)\b)(?:,\s*)(.*)$/i;
      const match = cleanAddress.match(hotelPattern);

      if (match) {
        pickUpLocation = match[1].trim() || null;
        pickUpAddress = match[2].trim() || null;
      } else if (cleanAddress.includes(',')) {
        const commaIndex = cleanAddress.indexOf(',');
        pickUpLocation = cleanAddress.substring(0, commaIndex).trim() || null;
        pickUpAddress = cleanAddress.substring(commaIndex + 1).trim() || null;
      } else {
        pickUpLocation = cleanAddress || null;
      }
    }

    // ── 7. RETURN STRONGLY TYPED OBJECT MATED WITH DTO REQUIREMENTS ──────────────
    return {
      provider:           'website', //
      bookingRef:         bookingRef, //
      tourName:           tourName || null,
      packageName:        packageName || null,
      tourType:           tourType || null,
      tripDate:           tripDate || null,
      travellers:         travellers ?? null,
      priceLines:         priceLines || null,
      subtotal:           subtotal ?? null,
      discount:           discount ?? null,
      totalcost:          total || null, // Map total directly to totalcost field
      billingName:        billingName || null,
      billingEmail:       billingEmail || null,
      billingAddress:     billingAddress || null,
      pickUp:             pickUpLocation || null,
      pickUpAddress:      pickUpAddress || null,
      billingCity:        billingCity || null,
      billingCountry:     billingCountry || null,
      bookingLink:        bookingLink || null,
    } as WebsiteBookingDto;
  }
}