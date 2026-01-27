import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
    constructor(private readonly supportService: SupportService) { }

    @Get('articles')
    findAll(@Query('q') query: string, @Query('category') category: string) {
        return this.supportService.findAll(query, category);
    }

    @Get('articles/:id')
    findOne(@Param('id') id: string) {
        return this.supportService.findOne(id);
    }

    // Admin endpoint to add help content
    @Post('articles')
    create(@Body() body: any) {
        return this.supportService.create(body);
    }
}
