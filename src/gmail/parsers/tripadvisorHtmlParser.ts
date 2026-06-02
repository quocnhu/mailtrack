import * as cheerio from 'cheerio';
import { TripadvisorBookingDto } from '@/gmail/dto/tripadvisor-booking.dto';

export class TripAdvisorHtmlParser {
  /**
   * Parses complex TripAdvisor/Bókun HTML payloads, calculating totals and normalizing layouts.
   */
  public static parse(htmlBody: string): TripadvisorBookingDto {
    const $ = cheerio.load(htmlBody);
    
    // Core dictionary to hold values scraped during our pass
    const extractedData: Record<string, string> = {};

    const mappingRules: Record<string, string> = {
      'booking ref.':         'bookingRef',
      'product booking ref.': 'productBookingRef',
      'ext. booking ref':     'extBookingRef',
      'product':              'product',
      'supplier':             'supplier',
      'sold by':              'soldBy',
      'booking channel':      'bookingChannel',
      'customer':             'customerName',
      'customer email':       'customerEmail',
      'customer phone':       'customerPhone',
      'date':                 'date',
      'rate':                 'rate',
      'pax':                  'pax',
      'pick-up':              'pickup',
      'guided languages':     'guidedLanguages',
      'created':              'created',
      'notes':                'notes',
      'extras':               'extras'
    };

    $('table tbody tr').each((_, element) => {
      const cells = $(element).find('td');
      
      if (cells.length >= 2) {
        const firstCell = cells.first();
        const secondCell = cells.last();

        const rawLabel = firstCell.text().replace(/[:\n]/g, '').trim().toLowerCase();
        const targetKey = mappingRules[rawLabel];

        if (targetKey) {
          const hyperLinkText = secondCell.find('a').text().trim();
          let cleanValue = '';

          if (targetKey === 'notes') {
            const lines: string[] = [];
            secondCell.find('div').each((_, div) => {
              const textLine = $(div).text().trim();
              if (textLine) lines.push(textLine);
            });
            cleanValue = lines.length > 0 ? lines.join('\n') : secondCell.text().trim();
          } else {
            // For other fields, take full text content to preserve broken text/link mixes
            cleanValue = secondCell.text().trim();
          }

          // Collapse extra internal spacing
          if (targetKey !== 'notes') {
            cleanValue = cleanValue.replace(/\s+/g, ' ').trim();
          }
          
          extractedData[targetKey] = cleanValue;
        }
      }
    });

    // ── Post-Processing & Dynamic Field Math ──────────────────────────
    
    // 1. Compute Pax Total dynamically (Handles multiple lines like "1 Child 2 Adult 1 Infant")
    let paxTotal = 0;
    if (extractedData.pax) {
      const numbersFound = extractedData.pax.match(/(\d+)\s*(?:Adult|Child|Infant)/gi);
      if (numbersFound) {
        paxTotal = numbersFound.reduce((sum, match) => {
          const digits = match.match(/\d+/);
          return sum + (digits ? parseInt(digits[0], 10) : 0);
        }, 0);
      }
    }

    // 2. Determine Tour Type (Shared vs Private)
    let tourType = 'UNKNOWN'; 
    const combinedContent = `
      ${(extractedData.rate || '').toLowerCase()} 
      ${(extractedData.product || '').toLowerCase()}
    `;

    if (combinedContent.includes('private') || combinedContent.includes('solo')) {
      tourType = 'PRIVATE TOUR';
    } else if (
      combinedContent.includes('shared') || 
      combinedContent.includes('group') || 
      combinedContent.includes('max ')
    ) {
      tourType = 'GROUP TOUR';
    }

    // 3. Clean up the Date structure
    let cleanDate = extractedData.date || null;
    if (cleanDate && cleanDate.includes('@')) {
      cleanDate = cleanDate.replace(/\s+/g, ' ').trim();
    }

    // 4. Extract pricing checks from Note structures
    let rawNotes = extractedData.notes || '';
    let calculatedCost = null;
    const priceMatch = rawNotes.match(/Viator amount:\s*([A-Za-z0-9.$ ]+)/i);
    if (priceMatch) {
      calculatedCost = priceMatch[1].trim();
    }

    // 5. Deep Scraping for Inclusions and Booking Languages inside Notes block
    let inclusions: string | null = null;
    let bookingLanguages: string | null = null;

    if (rawNotes) {
      const inclusionMatch = rawNotes.match(/---\s*Inclusions:\s*---([\s\S]*?)(?:---\s*Booking languages:\s*---|Viator amount:|$)/i);
      if (inclusionMatch && inclusionMatch[1]) {
        inclusions = inclusionMatch[1]
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('---'))
          .join(', ');
      }

      const languageMatch = rawNotes.match(/---\s*Booking languages:\s*---([\s\S]*?)(?:Viator amount:|$)/i);
      if (languageMatch && languageMatch[1]) {
        bookingLanguages = languageMatch[1]
          .split('\n')
          .map(line => line.replace(/GUIDE\s*:/i, '').trim())
          .filter(line => line)
          .join(', ');
      }
    }

    // ✅ NEW: Smart Split logic for Hotel Name vs Full Street Address
    let pickUpLocation = extractedData.pickup || null;
    let pickUpAddress: string | null = null;

    if (pickUpLocation && pickUpLocation.includes(',')) {
      const commaIndex = pickUpLocation.indexOf(',');
      // Extract everything before the first comma as the Hotel Name
      const isolatedHotel = pickUpLocation.substring(0, commaIndex).trim();
      // Extract everything after the first comma as the Street Address
      const isolatedAddress = pickUpLocation.substring(commaIndex + 1).trim();

      pickUpLocation = isolatedHotel;
      pickUpAddress = isolatedAddress;
    }

    let cleanExtras = extractedData.extras || null;
    if (cleanExtras === '') cleanExtras = null;

    return {
      provider: 'tripadvisor',
      bookingRef:        extractedData.bookingRef || null,
      productBookingRef: extractedData.productBookingRef || null,
      extBookingRef:     extractedData.extBookingRef || null,
      tourName:          extractedData.product || null,
      supplier:          extractedData.supplier || null,
      soldBy:            extractedData.soldBy || null,
      bookingChannel:    extractedData.bookingChannel || null,
      customer:          extractedData.customerName || null,
      customerEmail:     extractedData.customerEmail || null,
      customerPhone:     extractedData.customerPhone || null,
      date:              cleanDate,
      rate:              extractedData.rate || null,
      pax:               extractedData.pax || null,
      paxTotal:          paxTotal > 0 ? paxTotal : null,
      tourType,                                         
      pickUp:            pickUpLocation,                  
      pickUpAddress:     pickUpAddress,                   
      guidedLanguages:   extractedData.guidedLanguages || null,
      extras:            cleanExtras,
      inclusions:        inclusions,
      bookingLanguages:  bookingLanguages,
      totalcost:              calculatedCost,
      createdAt:         extractedData.created || null,
    };
  }
}