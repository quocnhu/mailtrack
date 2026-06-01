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
        const result = {
            templateProvider: 'tripadvisor'
        };
        const mappingRules = {
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
                cleanValue = cleanValue.replace(/\s+/g, ' ').trim();
                result[targetKey] = cleanValue;
            }
        });
        if (result.notes) {
            const finalPriceMatch = result.notes.match(/Viator amount:\s*([A-Za-z0-9.$ ]+)/i);
            result.viatorAmount = finalPriceMatch ? finalPriceMatch[1].trim() : 'N/A';
            delete result.notes;
        }
        return {
            provider: result.templateProvider,
            bookingRef: result.bookingRef || null,
            productBookingRef: result.productBookingRef || null,
            extBookingRef: result.extBookingRef || null,
            tourName: result.product || null,
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
exports.TripAdvisorHtmlParser = TripAdvisorHtmlParser;
//# sourceMappingURL=tripadvisorHtmlParser.js.map