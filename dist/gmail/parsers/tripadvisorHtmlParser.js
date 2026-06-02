"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripAdvisorHtmlParser = void 0;
const cheerio = __importStar(require("cheerio"));
class TripAdvisorHtmlParser {
    static parse(htmlBody) {
        const $ = cheerio.load(htmlBody);
        const extractedData = {};
        const mappingRules = {
            'booking ref.': 'bookingRef',
            'product booking ref.': 'productBookingRef',
            'ext. booking ref': 'extBookingRef',
            'product': 'product',
            'supplier': 'supplier',
            'sold by': 'soldBy',
            'booking channel': 'bookingChannel',
            'customer': 'customerName',
            'customer email': 'customerEmail',
            'customer phone': 'customerPhone',
            'date': 'date',
            'rate': 'rate',
            'pax': 'pax',
            'pick-up': 'pickup',
            'guided languages': 'guidedLanguages',
            'created': 'created',
            'notes': 'notes',
            'extras': 'extras'
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
                        const lines = [];
                        secondCell.find('div').each((_, div) => {
                            const textLine = $(div).text().trim();
                            if (textLine)
                                lines.push(textLine);
                        });
                        cleanValue = lines.length > 0 ? lines.join('\n') : secondCell.text().trim();
                    }
                    else {
                        cleanValue = secondCell.text().trim();
                    }
                    if (targetKey !== 'notes') {
                        cleanValue = cleanValue.replace(/\s+/g, ' ').trim();
                    }
                    extractedData[targetKey] = cleanValue;
                }
            }
        });
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
        let tourType = 'UNKNOWN';
        const combinedContent = `
      ${(extractedData.rate || '').toLowerCase()} 
      ${(extractedData.product || '').toLowerCase()}
    `;
        if (combinedContent.includes('private') || combinedContent.includes('solo')) {
            tourType = 'PRIVATE TOUR';
        }
        else if (combinedContent.includes('shared') ||
            combinedContent.includes('group') ||
            combinedContent.includes('max ')) {
            tourType = 'GROUP TOUR';
        }
        let cleanDate = extractedData.date || null;
        if (cleanDate && cleanDate.includes('@')) {
            cleanDate = cleanDate.replace(/\s+/g, ' ').trim();
        }
        let rawNotes = extractedData.notes || '';
        let calculatedCost = null;
        const priceMatch = rawNotes.match(/Viator amount:\s*([A-Za-z0-9.$ ]+)/i);
        if (priceMatch) {
            calculatedCost = priceMatch[1].trim();
        }
        let inclusions = null;
        let bookingLanguages = null;
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
        let pickUpLocation = extractedData.pickup || null;
        let pickUpAddress = null;
        if (pickUpLocation && pickUpLocation.includes(',')) {
            const commaIndex = pickUpLocation.indexOf(',');
            const isolatedHotel = pickUpLocation.substring(0, commaIndex).trim();
            const isolatedAddress = pickUpLocation.substring(commaIndex + 1).trim();
            pickUpLocation = isolatedHotel;
            pickUpAddress = isolatedAddress;
        }
        let cleanExtras = extractedData.extras || null;
        if (cleanExtras === '')
            cleanExtras = null;
        return {
            provider: 'tripadvisor',
            bookingRef: extractedData.bookingRef || null,
            productBookingRef: extractedData.productBookingRef || null,
            extBookingRef: extractedData.extBookingRef || null,
            tourName: extractedData.product || null,
            supplier: extractedData.supplier || null,
            soldBy: extractedData.soldBy || null,
            bookingChannel: extractedData.bookingChannel || null,
            customer: extractedData.customerName || null,
            customerEmail: extractedData.customerEmail || null,
            customerPhone: extractedData.customerPhone || null,
            date: cleanDate,
            rate: extractedData.rate || null,
            pax: extractedData.pax || null,
            paxTotal: paxTotal > 0 ? paxTotal : null,
            tourType,
            pickUp: pickUpLocation,
            pickUpAddress: pickUpAddress,
            guidedLanguages: extractedData.guidedLanguages || null,
            extras: cleanExtras,
            inclusions: inclusions,
            bookingLanguages: bookingLanguages,
            totalcost: calculatedCost,
            createdAt: extractedData.created || null,
        };
    }
}
exports.TripAdvisorHtmlParser = TripAdvisorHtmlParser;
//# sourceMappingURL=tripadvisorHtmlParser.js.map