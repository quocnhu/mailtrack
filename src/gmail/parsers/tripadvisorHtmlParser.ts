import * as cheerio from 'cheerio';
import { TripadvisorBookingDto } from '@/gmail/dto/tripadvisor-booking.dto';

export class TripAdvisorHtmlParser {
  /**
   * Cleans, trims, and parses messy TripAdvisor/Bókun HTML payloads into a structured JSON DTO
   */
  public static parse(htmlBody: string): TripadvisorBookingDto {
    const $ = cheerio.load(htmlBody);
    const result: Record<string, string> = {
      templateProvider: 'tripadvisor'
    };

    const mappingRules: Record<string, string> = {
      'Booking ref.': 'bookingRef',
      'Product booking ref.': 'productBookingRef',
      'Ext. booking ref': 'extBookingRef',
      'Product': 'product',
      'Supplier': 'supplier',
      'Sold by': 'soldBy',
      'Booking channel': 'bookingChannel',
      'Customer': 'customerName',
      'Customer email': 'customerEmail',
      'Customer phone': 'customerPhone',
      'Date': 'date',
      'Rate': 'rate',
      'PAX': 'pax',
      'Pick-up': 'pickup',
      'Guided languages': 'guidedLanguages',
      'Created': 'created',
      'Notes': 'notes'
    };

    $('table tr').each((_, row) => {
      const firstCell = $(row).find('td').first();
      const secondCell = $(row).find('td').last();

      const rawLabel = firstCell.find('strong').text().trim();
      const targetKey = mappingRules[rawLabel];

      if (targetKey) {
        const hyperLinkText = secondCell.find('a').text().trim();
        let cleanValue = hyperLinkText || secondCell.text().trim();

        // TRIMMING JUNK SPACE
        cleanValue = cleanValue.replace(/\s+/g, ' ').trim();
        result[targetKey] = cleanValue;
      }
    });

    // Extract pricing from the multi-line Notes text block
    if (result.notes) {
      const finalPriceMatch = result.notes.match(/Viator amount:\s*([A-Za-z0-9.$ ]+)/i);
      result.viatorAmount = finalPriceMatch ? finalPriceMatch[1].trim() : 'N/A';
      delete result.notes;
    }

    return {
      provider: result.templateProvider,// "tripadvisor" not included in the orginal html
      bookingRef: result.bookingRef || null, //
      productBookingRef: result.productBookingRef || null,
      extBookingRef: result.extBookingRef || null,
      tourName: result.product || null, //
      supplier: result.supplier || null,
      soldBy: result.soldBy || null,
      bookingChannel: result.bookingChannel || null,
      customer: result.customerName || null,
      customerEmail: result.customerEmail || null,
      customerPhone: result.customerPhone || null,
      date: result.date || null,
      rate: result.rate || null,
      pax: result.pax || null,
      pickUp: result.pickup || null,
      guidedLanguages: result.guidedLanguages || null,
      extras: null,
      inclusions: null,
      bookingLanguages: null,
      cost: result.viatorAmount || null,
      createdAt: result.created || null,

    };
  }
}