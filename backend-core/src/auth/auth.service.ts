import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOneByEmail(email);
        if (user && await bcrypt.compare(pass, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role,
            tenantId: user.tenantId
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenantId,
            }
        };
    }

    async register(data: any) {
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create new tenant for the user
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 15);

        const tenant = await this.usersService.createTenant({
            name: `${data.name}'s Business`,
            slug: data.name.toLowerCase().replace(/ /g, '-'),
            trialEndsAt: trialEndDate,
        });

        return this.usersService.create({
            ...data,
            password: hashedPassword,
            tenantId: tenant.id,
        });
    }
}
