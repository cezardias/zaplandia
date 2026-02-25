import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

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
        // ✅ Create new tenant for EVERY registration to ensure isolation
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 15);

        const companyName = data.companyName || `${data.name}'s Business`;
        const baseSlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const uniqueSlug = `${baseSlug}-${Date.now()}`; // Prevent slug collisions

        const tenant = await this.usersService.createTenant({
            name: companyName,
            slug: uniqueSlug,
            trialEndsAt: trialEndDate,
        });

        console.log(`[SECURITY] New tenant created: ${tenant.name} | ID: ${tenant.id} | Slug: ${tenant.slug}`);

        const user = await this.usersService.create({
            ...data,
            tenantId: tenant.id, // ✅ Explicit tenant assignment
        });

        console.log(`[SECURITY] New user registered: ${user.email} | TenantId: ${user.tenantId}`);

        return user;
    }
}
