import { SupportService } from './support.service';
export declare class SupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    findAll(query: string, category: string): Promise<import("./entities/support-article.entity").SupportArticle[]>;
    findOne(id: string): Promise<import("./entities/support-article.entity").SupportArticle | null>;
    create(body: any): Promise<import("./entities/support-article.entity").SupportArticle[]>;
}
