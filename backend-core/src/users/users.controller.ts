import { Controller, Get, Post, Body, UseGuards, Request, ForbiddenException, Param, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UserRole } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    async findAll(@Request() req) {
        const { tenantId, role } = req.user;
        
        // Final clients (USER), Admins and Superadmins can list users of their tenant
        if (![UserRole.USER, UserRole.ADMIN, UserRole.SUPERADMIN].includes(role)) {
            throw new ForbiddenException('Acesso negado.');
        }

        return this.usersService.findAllByTenant(tenantId);
    }

    @Post()
    async create(@Request() req, @Body() userData: any) {
        const { tenantId, role } = req.user;

        // Final clients (USER), Admins and Superadmins can create users for their tenant
        if (![UserRole.USER, UserRole.ADMIN, UserRole.SUPERADMIN].includes(role)) {
            throw new ForbiddenException('Acesso negado.');
        }

        // Force tenantId and default role if not specified
        const finalUserData = {
            ...userData,
            tenantId,
            role: userData.role || UserRole.AGENT // Default to Agent for tenant-created users
        };

        return this.usersService.create(finalUserData);
    }

    @Patch(':id/role')
    async updateRole(@Request() req, @Param('id') id: string, @Body() body: { role: UserRole }) {
        const { tenantId, role: requesterRole } = req.user;

        if (![UserRole.USER, UserRole.ADMIN, UserRole.SUPERADMIN].includes(requesterRole)) {
            throw new ForbiddenException('Acesso negado.');
        }

        // Verify if user belongs to tenant
        const targetUser = await this.usersService.findAllByTenant(tenantId);
        if (!targetUser.find(u => u.id === id)) {
            throw new ForbiddenException('Usuário não pertence à sua conta.');
        }

        return this.usersService.update(id, { role: body.role });
    }
}
