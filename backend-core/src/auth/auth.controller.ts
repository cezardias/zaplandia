import { Controller, Post, Body, UseGuards, Request, Get, UnauthorizedException, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Request() req) {
        // Guard redirects to Google
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Request() req, @Res() res: any) {
        const result = await this.authService.googleLogin(req.user);
        const token = result.access_token;
        // Redireciona para o frontend salvando o token no localStorage via página de callback
        return res.redirect(`https://zaplandia.com.br/auth/callback?token=${token}`);
    }
}
