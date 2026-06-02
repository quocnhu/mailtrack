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
exports.WebsiteHtmlParser = void 0;
const cheerio = __importStar(require("cheerio"));
class WebsiteHtmlParser {
    static parse(htmlBody) {
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
        const parseDollar = (raw) => {
            if (!raw)
                return null;
            const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''));
            return isNaN(parsed) ? null : parsed;
        };
        let tourName = null;
        let packageName = null;
        let tripDate = null;
        let travellers = null;
        let subtotal = null;
        let discount = null;
        let total = null;
        const tourNameElement = $('td b').first();
        tourName = tourNameElement.length > 0 ? tourNameElement.text().trim() : null;
        const priceLinesParts = [];
        $('tr').each((_, row) => {
            const cells = $(row).find('td');
            if (cells.length < 2)
                return;
            const key = cells.eq(0).text().trim();
            const val = cells.eq(1).text().trim();
            if (key === 'Package Name')
                packageName = val || null;
            if (key === 'Trip Date')
                tripDate = val || null;
            if (key === 'Travellers')
                travellers = parseInt(val, 10) || null;
            if (key === 'Subtotal' && val.startsWith('$'))
                subtotal = parseDollar(val);
            if (key === 'Discount')
                discount = parseDollar(val);
            if (key === 'Total')
                total = parseDollar(val);
            const priceMatch = val.match(/^(\d+)\s*[Xx]\s*\$([0-9.]+)\s*=\s*\$([0-9.]+)$/);
            if (priceMatch && key && key !== 'Subtotal') {
                priceLinesParts.push(`${key}: ${priceMatch[1]}x$${priceMatch[2]}=$${priceMatch[3]}`);
            }
        });
        const priceLines = priceLinesParts.length > 0 ? priceLinesParts.join(', ') : null;
        let billingName = null;
        let billingEmail = null;
        let billingAddress = null;
        let billingCity = null;
        let billingCountry = null;
        let bookingLink = null;
        $('tr').each((_, row) => {
            const cells = $(row).find('td');
            if (cells.length < 2)
                return;
            const key = cells.eq(0).text().trim();
            const val = cells.eq(1).text().trim();
            if (key === 'Name')
                billingName = val || null;
            if (key === 'Email')
                billingEmail = cells.eq(1).find('a').attr('href')?.replace('mailto:', '').trim() ?? val ?? null;
            if (key === 'Billing Address')
                billingAddress = val || null;
            if (key === 'City')
                billingCity = val || null;
            if (key === 'Country')
                billingCountry = val || null;
        });
        $('a').each((_, el) => {
            const href = $(el).attr('href') ?? '';
            if (href.includes('wp-admin') && href.includes('action=edit')) {
                bookingLink = href || null;
            }
        });
        let tourType = 'UNKNOWN';
        const combinedContent = `
      ${(packageName || '').toLowerCase()} 
      ${(tourName || '').toLowerCase()}
    `.replace(/\s+/g, ' ');
        if (combinedContent.includes('private') || combinedContent.includes('solo')) {
            tourType = 'PRIVATE TOUR';
        }
        else if (combinedContent.includes('shared') ||
            combinedContent.includes('group') ||
            combinedContent.includes('max ')) {
            tourType = 'GROUP TOUR';
        }
        let pickUpLocation = null;
        let pickUpAddress = null;
        const forcedAddress = billingAddress;
        if (forcedAddress && forcedAddress.trim() !== '') {
            const cleanAddress = forcedAddress.replace(/\s+/g, ' ').trim();
            const hotelPattern = /^([^,]+?\b(?:Residence|Hotel|Apartment|Apartments|Suite|Suites|Villa|Villas|Stay|Hostel|Homestay|Spa)\b)(?:,\s*)(.*)$/i;
            const match = cleanAddress.match(hotelPattern);
            if (match) {
                pickUpLocation = match[1].trim() || null;
                pickUpAddress = match[2].trim() || null;
            }
            else if (cleanAddress.includes(',')) {
                const commaIndex = cleanAddress.indexOf(',');
                pickUpLocation = cleanAddress.substring(0, commaIndex).trim() || null;
                pickUpAddress = cleanAddress.substring(commaIndex + 1).trim() || null;
            }
            else {
                pickUpLocation = cleanAddress || null;
            }
        }
        return {
            provider: 'website',
            tourName: tourName || null,
            packageName: packageName || null,
            tourType: tourType || null,
            tripDate: tripDate || null,
            travellers: travellers ?? null,
            priceLines: priceLines || null,
            subtotal: subtotal ?? null,
            discount: discount ?? null,
            totalcost: total ?? null,
            billingName: billingName || null,
            billingEmail: billingEmail || null,
            billingAddress: billingAddress || null,
            pickUp: pickUpLocation || null,
            pickUpAddress: pickUpAddress || null,
            billingCity: billingCity || null,
            billingCountry: billingCountry || null,
            bookingLink: bookingLink || null,
        };
    }
}
exports.WebsiteHtmlParser = WebsiteHtmlParser;
//# sourceMappingURL=websiteHtmlParser.js.map