import * as cheerio from 'cheerio';
import { WebsiteBookingDto } from '@/gmail/dto/website-booking.dto';

export class WebsiteHtmlParser {
  static parse(htmlBody: string): WebsiteBookingDto {
    // ── Fallback object for empty/missing HTML payloads
    if (!htmlBody) {
      return {
        provider: 'website',
        tourName: null,
        packageName: null,
        tourType: 'Shared',
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
      };
    }

    const $ = cheerio.load(htmlBody);

    const parseDollar = (raw: string): number | null => {
      if (!raw) return null;
      const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''));
      return isNaN(parsed) ? null : parsed;
    };

    // ── ✅ FIX: Explicitly type all variables as string | null or number | null
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

      const priceMatch = val.match(/^(\d+)\s*[Xx]\s*\$([0-9.]+)\s*=\s*\$([0-9.]+)$/);
      if (priceMatch && key && key !== 'Subtotal') {
        priceLinesParts.push(`${key}: ${priceMatch[1]}x$${priceMatch[2]}=$${priceMatch[3]}`);
      }
    });

    const priceLines = priceLinesParts.length > 0 ? priceLinesParts.join(', ') : null;

    // ── ✅ FIX: Explicitly typed to stop TypeScript from inferring 'never'
    let billingName: string | null = null;
    let billingEmail: string | null = null;
    let billingAddress: string | null = null;
    let billingCity: string | null = null;
    let billingCountry: string | null = null;
    let bookingLink: string | null = null;

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

    $('a').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      if (href.includes('wp-admin') && href.includes('action=edit')) {
        bookingLink = href || null;
      }
    });

    // ── Tour Type Logic ───────────────────────────────────────────────
    let tourType = 'UNKNOWN';
    const combinedContent = `
      ${(packageName || '').toLowerCase()} 
      ${(tourName || '').toLowerCase()}
    `.replace(/\s+/g, ' ');

    if (combinedContent.includes('private') || combinedContent.includes('solo')) {
      tourType = 'PRIVATE TOUR';
    } else if (
      combinedContent.includes('shared') ||
      combinedContent.includes('group') ||
      combinedContent.includes('max ')
    ) {
      tourType = 'GROUP TOUR';
    }

    // ── Regex-Driven Address Splitting ───────────────────────────────────────
    let pickUpLocation: string | null = null;
    let pickUpAddress: string | null = null;

    // Force TypeScript to treat this as a string | null, breaking the 'never' loop closure
    const forcedAddress = billingAddress as string | null;

    if (forcedAddress && forcedAddress.trim() !== '') {
      // ✅ Works perfectly now! TypeScript treats forcedAddress as a confirmed string here.
      const cleanAddress = forcedAddress.replace(/\s+/g, ' ').trim();

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

    return {
      provider:           'website',
      tourName:           tourName || null,
      packageName:        packageName || null,
      tourType:           tourType || null,
      tripDate:           tripDate || null,
      travellers:         travellers ?? null,
      priceLines:         priceLines || null,
      subtotal:           subtotal ?? null,
      discount:           discount ?? null,
      totalcost:          total ?? null,
      billingName:        billingName || null,
      billingEmail:       billingEmail || null,
      billingAddress:     billingAddress || null,
      pickUp:             pickUpLocation || null,
      pickUpAddress:      pickUpAddress || null,
      billingCity:        billingCity || null,
      billingCountry:     billingCountry || null,
      bookingLink:        bookingLink || null,
    };
  }
}
// import * as cheerio from 'cheerio';
// import { WebsiteBookingDto } from '@/gmail/dto/website-booking.dto';

// export class WebsiteHtmlParser {
//   static parse(htmlBody: string): WebsiteBookingDto {
//     const $ = cheerio.load(htmlBody);

//     const parseDollar = (raw: string): number =>
//       parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;

//     // ── Trip fields ───────────────────────────────────────────────────
//     let tourName:    string | null = null;
//     let packageName: string | null = null;
//     let tripDate:    string | null = null;
//     let travellers:  number | null = null;
//     let subtotal:    number | null = null;
//     let discount:    number | null = null;
//     let total:       number | null = null;

//     // Tour name is inside <b> tag
//     tourName = $('td b').first().text().trim() || null;

//     // Price lines accumulator
//     const priceLinesParts: string[] = [];

//     $('tr').each((_, row) => {
//       const cells = $(row).find('td');
//       if (cells.length < 2) return;

//       const key = cells.eq(0).text().trim();
//       const val = cells.eq(1).text().trim();

//       if (key === 'Package Name') packageName = val || null;
//       if (key === 'Trip Date')    tripDate    = val || null;
//       if (key === 'Travellers')   travellers  = parseInt(val) || null;
//       if (key === 'Subtotal' && val.startsWith('$')) subtotal = parseDollar(val);
//       if (key === 'Discount')     discount    = parseDollar(val);
//       if (key === 'Total')        total       = parseDollar(val);

//       // Price lines: "2 X $25 = $50"
//       const priceMatch = val.match(/^(\d+)\s*[Xx]\s*\$([0-9.]+)\s*=\s*\$([0-9.]+)$/);
//       if (priceMatch && key && key !== 'Subtotal') {
//         priceLinesParts.push(`${key}: ${priceMatch[1]}x$${priceMatch[2]}=$${priceMatch[3]}`);
//       }
//     });

//     const priceLines = priceLinesParts.length > 0 ? priceLinesParts.join(', ') : null;

//     // ── Billing fields ────────────────────────────────────────────────
//     let billingName:    string | null = null;
//     let billingEmail:   string | null = null;
//     let billingAddress: string | null = null;
//     let billingCity:    string | null = null;
//     let billingCountry: string | null = null;
//     let bookingLink:    string | null = null;

//     $('tr').each((_, row) => {
//       const cells = $(row).find('td');
//       if (cells.length < 2) return;

//       const key = cells.eq(0).text().trim();
//       const val = cells.eq(1).text().trim();

//       if (key === 'Name')            billingName    = val || null;
//       if (key === 'Email')           billingEmail   = cells.eq(1).find('a').attr('href')?.replace('mailto:', '') ?? val ?? null;
//       if (key === 'Billing Address') billingAddress = val || null;
//       if (key === 'City')            billingCity    = val || null;
//       if (key === 'Country')         billingCountry = val || null;
//     });

//     // Booking link
//     $('a').each((_, el) => {
//       const href = $(el).attr('href') ?? '';
//       if (href.includes('wp-admin') && href.includes('action=edit')) {
//         bookingLink = href;
//       }
//     });

//     return {
//       provider: 'website',
//       tourName,
//       packageName,
//       tripDate,
//       travellers,
//       priceLines,
//       subtotal,
//       discount,
//       total,
//       billingName,
//       billingEmail,
//       billingAddress,
//       billingCity,
//       billingCountry,
//       bookingLink,
//     };
//   }
// }