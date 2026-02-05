import { Controller, Post, Body, UseGuards, Request, Get, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() req) {
        const user = await this.authService.validateUser(req.email, req.password);
        if (!user) {
            throw new UnauthorizedException('Credenciais inválidas');
        }
        return this.authService.login(user);
    }

    @Post('register')
    async register(@Body() createUserDto) {
        // ✅ SECURITY: Public registration can ONLY create USER role
        // This prevents privilege escalation attacks
        const safeUserData = {
            ...createUserDto,
            role: 'user', // Force USER role, ignore any role sent by client
        };

        return this.authService.register(safeUserData);
    }
}
