import { SupportService } from './support.service';
export declare class SupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    findAll(query: string, category: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(body: any): Promise<any>;
}
