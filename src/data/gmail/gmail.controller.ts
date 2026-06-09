import { Controller, Get, Post, Query, Body, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { GmailService } from '@/gmail/gmail.service';

@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Get('auth')
  async redirectToGoogle(@Res() res: Response) {
    const url = await this.gmailService.getAuthUrl();
    return res.redirect(url);
  }

  @Get('callback')
  async handleCallback(@Query('code') code: string, @Res() res: Response) {
    if (!code) return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing code' });
    const account = await this.gmailService.handleAuthorizationCode(code);
    return res.status(HttpStatus.OK).json({ status: 'success', email: account.email });
  }

  @Post('webhook')
  async handlePubSubWebhook(@Body() body: any, @Res() res: Response) {
    if (!body?.message?.data) {
      return res.status(HttpStatus.OK).json({ status: 'ignored' });
    }

    // Process background sync asynchronously so Google Pub/Sub gets an immediate 200 OK
    this.gmailService.processWebhookPayload(body.message.data).catch(() => {});

    return res.status(HttpStatus.OK).json({ status: 'acknowledged' });
  }
}