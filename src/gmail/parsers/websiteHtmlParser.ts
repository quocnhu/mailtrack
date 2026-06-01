import * as cheerio from 'cheerio';
import { WebsiteBookingDto } from '@/gmail/dto/website-booking.dto';

export class WebsiteHtmlParser {
  static parse(htmlBody: string): WebsiteBookingDto {
    const $ = cheerio.load(htmlBody);

    const parseDollar = (raw: string): number =>
      parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;

    // ── Trip fields ───────────────────────────────────────────────────
    let tourName:    string | null = null;
    let packageName: string | null = null;
    let tripDate:    string | null = null;
    let travellers:  number | null = null;
    let subtotal:    number | null = null;
    let discount:    number | null = null;
    let total:       number | null = null;

    // Tour name is inside <b> tag
    tourName = $('td b').first().text().trim() || null;

    // Price lines accumulator
    const priceLinesParts: string[] = [];

    $('tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 2) return;

      const key = cells.eq(0).text().trim();
      const val = cells.eq(1).text().trim();

      if (key === 'Package Name') packageName = val || null;
      if (key === 'Trip Date')    tripDate    = val || null;
      if (key === 'Travellers')   travellers  = parseInt(val) || null;
      if (key === 'Subtotal' && val.startsWith('$')) subtotal = parseDollar(val);
      if (key === 'Discount')     discount    = parseDollar(val);
      if (key === 'Total')        total       = parseDollar(val);

      // Price lines: "2 X $25 = $50"
      const priceMatch = val.match(/^(\d+)\s*[Xx]\s*\$([0-9.]+)\s*=\s*\$([0-9.]+)$/);
      if (priceMatch && key && key !== 'Subtotal') {
        priceLinesParts.push(`${key}: ${priceMatch[1]}x$${priceMatch[2]}=$${priceMatch[3]}`);
      }
    });

    const priceLines = priceLinesParts.length > 0 ? priceLinesParts.join(', ') : null;

    // ── Billing fields ────────────────────────────────────────────────
    let billingName:    string | null = null;
    let billingEmail:   string | null = null;
    let billingAddress: string | null = null;
    let billingCity:    string | null = null;
    let billingCountry: string | null = null;
    let bookingLink:    string | null = null;

    $('tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 2) return;

      const key = cells.eq(0).text().trim();
      const val = cells.eq(1).text().trim();

      if (key === 'Name')            billingName    = val || null;
      if (key === 'Email')           billingEmail   = cells.eq(1).find('a').attr('href')?.replace('mailto:', '') ?? val ?? null;
      if (key === 'Billing Address') billingAddress = val || null;
      if (key === 'City')            billingCity    = val || null;
      if (key === 'Country')         billingCountry = val || null;
    });

    // Booking link
    $('a').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      if (href.includes('wp-admin') && href.includes('action=edit')) {
        bookingLink = href;
      }
    });

    return {
      provider: 'website',
      tourName,
      packageName,
      tripDate,
      travellers,
      priceLines,
      subtotal,
      discount,
      total,
      billingName,
      billingEmail,
      billingAddress,
      billingCity,
      billingCountry,
      bookingLink,
    };
  }
}