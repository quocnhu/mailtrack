import type { Response } from 'express';
import { GmailService } from "./gmail.service";
export declare class GmailController {
    private readonly gmailService;
    constructor(gmailService: GmailService);
    redirectToGoogle(res: Response): Promise<void>;
    handleCallback(code: string, res: Response): Promise<Response<any, Record<string, any>>>;
    handlePubSubWebhook(body: any, res: Response): Promise<Response<any, Record<string, any>>>;
}
