import * as cheerio from 'cheerio';
import { TripadvisorBookingDto } from '@/gmail/dto/tripadvisor-booking.dto';

export class TripAdvisorHtmlParser {
  /**
   * Parses complex TripAdvisor/Bókun HTML payloads, calculating totals and normalizing layouts.
   */
  public static parse(htmlBody: string): TripadvisorBookingDto {
    // ── 1. EMERGENCY FALLBACK FOR EMPTY/MISSING HTML PAYLOADS ────────────────────
    if (!htmlBody || htmlBody.trim() === '') {
      return {
        provider: 'tripadvisor',
        bookingRef: null,
        productBookingRef: null,
        extBookingRef: null,
        tourName: null,
        supplier: null,
        soldBy: null,
        bookingChannel: null,
        customer: null,
        customerEmail: null,
        customerPhone: null,
        date: null,
        rate: null,
        pax: null,
        paxTotal: null,
        tourType: 'UNKNOWN',                                         
        pickUp: null,                  
        pickUpAddress: null,                   
        guidedLanguages: null,
        extras: null,
        inclusions: null,
        bookingLanguages: null,
        totalcost: null,
        createdAt: null,
      } as TripadvisorBookingDto;
    }

    const $ = cheerio.load(htmlBody);
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
          let cleanValue = '';
          if (targetKey === 'notes') {
            const lines: string[] = [];
            secondCell.find('div').each((_, div) => {
              const textLine = $(div).text().trim();
              if (textLine) lines.push(textLine);
            });
            cleanValue = lines.length > 0 ? lines.join('\n') : secondCell.text().trim();
          } else {
            cleanValue = secondCell.text().trim();
          }

          if (targetKey !== 'notes') {
            cleanValue = cleanValue.replace(/\s+/g, ' ').trim();
          }
          extractedData[targetKey] = cleanValue;
        }
      }
    });

    // ── 2. POST-PROCESSING & DYNAMIC FIELD MATH ──────────────────────────
    
    // Compute Pax Total dynamically
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

    // Determine Tour Type
    let tourType = 'UNKNOWN'; 
    const combinedContent = `
      ${(extractedData.rate || '').toLowerCase()} 
      ${(extractedData.product || '').toLowerCase()}
    `;
    if (combinedContent.includes('private') || combinedContent.includes('solo')) {
      tourType = 'PRIVATE_TOUR';
    } else if (combinedContent.includes('shared') || combinedContent.includes('group') || combinedContent.includes('max ')) {
      tourType = 'GROUP_TOUR';
    }

    // ── 📅 INTERNATIONAL STANDARD DATE FORMATTING (FIX) ──────────────────
    let isoStandardDate: string | null = null;
    const rawDate = extractedData.date;

    if (rawDate) {
      try {
        // Example input: "Thu 14.May '26 @ 07:30"
        // 1. Clear day text prefix (e.g. "Thu ") and the "@" symbol
        let cleanStr = rawDate.replace(/^[A-Za-z]+\s+/, '').replace('@ ', '');
        
        // 2. Clear out punctuation: "14.May '26 07:30" -> "14 May 26 07:30"
        cleanStr = cleanStr.replace('.', ' ').replace("'", '');

        // 3. Break down tokens
        const [day, monthStr, yearShort, timeStr] = cleanStr.split(' ');
        const [hours, minutes] = timeStr.split(':');

        const monthsMap: Record<string, number> = {
          Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
          Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
        };

        const monthIdx = monthsMap[monthStr];
        const fullYear = 2000 + parseInt(yearShort, 10);

        if (monthIdx !== undefined && !isNaN(fullYear)) {
          // Construct explicit native date instance
          const nativeDateObj = new Date(
            fullYear,
            monthIdx,
            parseInt(day, 10),
            parseInt(hours, 10),
            parseInt(minutes, 10)
          );
          
          // Convert directly to international standard format (2026-05-14T07:30:00.000Z)
          isoStandardDate = nativeDateObj.toISOString();
        }
      } catch (dateError) {
        // Fallback to original string if regex parsing encounters anomalies
        isoStandardDate = rawDate;
      }
    }

    // Extract pricing checks from Note structures
    let rawNotes = extractedData.notes || '';
    let calculatedCost = null;
    const priceMatch = rawNotes.match(/Viator amount:\s*([A-Za-z0-9.$ ]+)/i);
    if (priceMatch) {
      calculatedCost = priceMatch[1].trim();
    }

    // Deep Scraping for Inclusions and Booking Languages inside Notes block
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

    // Smart Split logic for Hotel Name vs Full Street Address
    let pickUpLocation = extractedData.pickup || null;
    let pickUpAddress: string | null = null;

    if (pickUpLocation && pickUpLocation.includes(',')) {
      const commaIndex = pickUpLocation.indexOf(',');
      const isolatedHotel = pickUpLocation.substring(0, commaIndex).trim();
      const isolatedAddress = pickUpLocation.substring(commaIndex + 1).trim();

      pickUpLocation = isolatedHotel;
      pickUpAddress = isolatedAddress;
    }

    let cleanExtras = extractedData.extras || null;
    if (cleanExtras === '') cleanExtras = null;

    // ── 3. RETURN STRONGLY TYPED OBJECT MATED WITH DTO REQUIREMENTS ──────────────
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
      
      // Returns standardized ISO timestamp instead of raw string layout
      date:              isoStandardDate, 
      
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
      totalcost:         calculatedCost,
      createdAt:         extractedData.created || null,
    };
  }
}



// import * as cheerio from 'cheerio';
// import { TripadvisorBookingDto } from '@/gmail/dto/tripadvisor-booking.dto';

// export class TripAdvisorHtmlParser {
//   /**
//    * Parses complex TripAdvisor/Bókun HTML payloads, calculating totals and normalizing layouts.
//    */
//   public static parse(htmlBody: string): TripadvisorBookingDto {
//     // ── 1. EMERGENCY FALLBACK FOR EMPTY/MISSING HTML PAYLOADS ────────────────────
//     if (!htmlBody || htmlBody.trim() === '') {
//       return {
//         provider: 'tripadvisor',
//         // Immortal fallback reference to prevent DB conflicts and preserve error timestamp
//         bookingRef: null,
//         productBookingRef: null,
//         extBookingRef: null,
//         tourName: null,
//         supplier: null,
//         soldBy: null,
//         bookingChannel: null,
//         customer: null,
//         customerEmail: null,
//         customerPhone: null,
//         date: null,
//         rate: null,
//         pax: null,
//         paxTotal: null,
//         tourType: 'UNKNOWN',                                         
//         pickUp: null,                  
//         pickUpAddress: null,                   
//         guidedLanguages: null,
//         extras: null,
//         inclusions: null,
//         bookingLanguages: null,
//         totalcost: null,
//         createdAt: null,
//       } as TripadvisorBookingDto;
//     }

//     const $ = cheerio.load(htmlBody);
    
//     // Core dictionary to hold values scraped during our pass
//     const extractedData: Record<string, string> = {};

//     const mappingRules: Record<string, string> = {
//       'booking ref.':         'bookingRef',
//       'product booking ref.': 'productBookingRef',
//       'ext. booking ref':     'extBookingRef',
//       'product':              'product',
//       'supplier':             'supplier',
//       'sold by':              'soldBy',
//       'booking channel':      'bookingChannel',
//       'customer':             'customerName',
//       'customer email':       'customerEmail',
//       'customer phone':       'customerPhone',
//       'date':                 'date',
//       'rate':                 'rate',
//       'pax':                  'pax',
//       'pick-up':              'pickup',
//       'guided languages':     'guidedLanguages',
//       'created':              'created',
//       'notes':                'notes',
//       'extras':               'extras'
//     };

//     $('table tbody tr').each((_, element) => {
//       const cells = $(element).find('td');
      
//       if (cells.length >= 2) {
//         const firstCell = cells.first();
//         const secondCell = cells.last();

//         const rawLabel = firstCell.text().replace(/[:\n]/g, '').trim().toLowerCase();
//         const targetKey = mappingRules[rawLabel];

//         if (targetKey) {
//           let cleanValue = '';

//           if (targetKey === 'notes') {
//             const lines: string[] = [];
//             secondCell.find('div').each((_, div) => {
//               const textLine = $(div).text().trim();
//               if (textLine) lines.push(textLine);
//             });
//             cleanValue = lines.length > 0 ? lines.join('\n') : secondCell.text().trim();
//           } else {
//             // For other fields, take full text content to preserve broken text/link mixes
//             cleanValue = secondCell.text().trim();
//           }

//           // Collapse extra internal spacing
//           if (targetKey !== 'notes') {
//             cleanValue = cleanValue.replace(/\s+/g, ' ').trim();
//           }
          
//           extractedData[targetKey] = cleanValue;
//         }
//       }
//     });

//     // ── 2. POST-PROCESSING & DYNAMIC FIELD MATH ──────────────────────────
    
//     // Compute Pax Total dynamically (Handles multiple lines like "1 Child 2 Adult 1 Infant")
//     let paxTotal = 0;
//     if (extractedData.pax) {
//       const numbersFound = extractedData.pax.match(/(\d+)\s*(?:Adult|Child|Infant)/gi);
//       if (numbersFound) {
//         paxTotal = numbersFound.reduce((sum, match) => {
//           const digits = match.match(/\d+/);
//           return sum + (digits ? parseInt(digits[0], 10) : 0);
//         }, 0);
//       }
//     }

//     // Determine Tour Type (Shared vs Private)
//     let tourType = 'UNKNOWN'; 
//     const combinedContent = `
//       ${(extractedData.rate || '').toLowerCase()} 
//       ${(extractedData.product || '').toLowerCase()}
//     `;

//     if (combinedContent.includes('private') || combinedContent.includes('solo')) {
//       tourType = 'PRIVATE TOUR';
//     } else if (
//       combinedContent.includes('shared') || 
//       combinedContent.includes('group') || 
//       combinedContent.includes('max ')
//     ) {
//       tourType = 'GROUP TOUR';
//     }

//     // Clean up the Date structure
//     let cleanDate = extractedData.date || null;
//     if (cleanDate && cleanDate.includes('@')) {
//       cleanDate = cleanDate.replace(/\s+/g, ' ').trim();
//     }

//     // Extract pricing checks from Note structures
//     let rawNotes = extractedData.notes || '';
//     let calculatedCost = null;
//     const priceMatch = rawNotes.match(/Viator amount:\s*([A-Za-z0-9.$ ]+)/i);
//     if (priceMatch) {
//       calculatedCost = priceMatch[1].trim();
//     }

//     // Deep Scraping for Inclusions and Booking Languages inside Notes block
//     let inclusions: string | null = null;
//     let bookingLanguages: string | null = null;

//     if (rawNotes) {
//       const inclusionMatch = rawNotes.match(/---\s*Inclusions:\s*---([\s\S]*?)(?:---\s*Booking languages:\s*---|Viator amount:|$)/i);
//       if (inclusionMatch && inclusionMatch[1]) {
//         inclusions = inclusionMatch[1]
//           .split('\n')
//           .map(line => line.trim())
//           .filter(line => line && !line.startsWith('---'))
//           .join(', ');
//       }

//       const languageMatch = rawNotes.match(/---\s*Booking languages:\s*---([\s\S]*?)(?:Viator amount:|$)/i);
//       if (languageMatch && languageMatch[1]) {
//         bookingLanguages = languageMatch[1]
//           .split('\n')
//           .map(line => line.replace(/GUIDE\s*:/i, '').trim())
//           .filter(line => line)
//           .join(', ');
//       }
//     }

//     // Smart Split logic for Hotel Name vs Full Street Address
//     let pickUpLocation = extractedData.pickup || null;
//     let pickUpAddress: string | null = null;

//     if (pickUpLocation && pickUpLocation.includes(',')) {
//       const commaIndex = pickUpLocation.indexOf(',');
//       // Extract everything before the first comma as the Hotel Name
//       const isolatedHotel = pickUpLocation.substring(0, commaIndex).trim();
//       // Extract everything after the first comma as the Street Address
//       const isolatedAddress = pickUpLocation.substring(commaIndex + 1).trim();

//       pickUpLocation = isolatedHotel;
//       pickUpAddress = isolatedAddress;
//     }

//     let cleanExtras = extractedData.extras || null;
//     if (cleanExtras === '') cleanExtras = null;

//     // ── 3. RETURN STRONGLY TYPED OBJECT MATED WITH DTO REQUIREMENTS ──────────────
//     return {
//       provider: 'tripadvisor',
//       bookingRef:        extractedData.bookingRef || null,
//       productBookingRef: extractedData.productBookingRef || null,
//       extBookingRef:     extractedData.extBookingRef || null,
//       tourName:          extractedData.product || null,
//       supplier:          extractedData.supplier || null,
//       soldBy:            extractedData.soldBy || null,
//       bookingChannel:    extractedData.bookingChannel || null,
//       customer:          extractedData.customerName || null,
//       customerEmail:     extractedData.customerEmail || null,
//       customerPhone:     extractedData.customerPhone || null,
//       date:              cleanDate,
//       rate:              extractedData.rate || null,
//       pax:               extractedData.pax || null,
//       paxTotal:          paxTotal > 0 ? paxTotal : null,
//       tourType,                                         
//       pickUp:            pickUpLocation,                  
//       pickUpAddress:     pickUpAddress,                   
//       guidedLanguages:   extractedData.guidedLanguages || null,
//       extras:            cleanExtras,
//       inclusions:        inclusions,
//       bookingLanguages:  bookingLanguages,
//       totalcost:         calculatedCost,
//       createdAt:         extractedData.created || null,
//     };
//   }
// }