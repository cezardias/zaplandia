import type { Response } from 'express';
export declare class UploadController {
    uploadFile(file: any): Promise<{
        filename: any;
        originalname: any;
        mimetype: any;
        size: any;
        path: any;
        url: string;
    }>;
    serveFile(filename: string, res: Response): Promise<void>;
}
