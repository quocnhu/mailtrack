"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GmailController = void 0;
const common_1 = require("@nestjs/common");
const gmail_service_1 = require("./gmail.service");
let GmailController = class GmailController {
    gmailService;
    constructor(gmailService) {
        this.gmailService = gmailService;
    }
    async redirectToGoogle(res) {
        const url = await this.gmailService.getAuthUrl();
        return res.redirect(url);
    }
    async handleCallback(code, res) {
        if (!code)
            return res.status(common_1.HttpStatus.BAD_REQUEST).json({ error: 'Missing code' });
        const account = await this.gmailService.handleAuthorizationCode(code);
        return res.status(common_1.HttpStatus.OK).json({ status: 'success', email: account.email });
    }
    async handlePubSubWebhook(body, res) {
        if (!body?.message?.data) {
            return res.status(common_1.HttpStatus.OK).json({ status: 'ignored' });
        }
        this.gmailService.processWebhookPayload(body.message.data).catch(() => { });
        return res.status(common_1.HttpStatus.OK).json({ status: 'acknowledged' });
    }
};
exports.GmailController = GmailController;
__decorate([
    (0, common_1.Get)('auth'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GmailController.prototype, "redirectToGoogle", null);
__decorate([
    (0, common_1.Get)('callback'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GmailController.prototype, "handleCallback", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GmailController.prototype, "handlePubSubWebhook", null);
exports.GmailController = GmailController = __decorate([
    (0, common_1.Controller)('gmail'),
    __metadata("design:paramtypes", [gmail_service_1.GmailService])
], GmailController);
//# sourceMappingURL=gmail.controller.js.map