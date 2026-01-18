import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Tenant } from './entities/tenant.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Tenant)
        private tenantsRepository: Repository<Tenant>,
    ) { }

    async onModuleInit() {
        await this.seedSuperAdmin();
    }

    async seedSuperAdmin() {
        const adminEmail = 'cezar.dias@gmail.com';
        const adminExists = await this.usersRepository.findOne({ where: { email: adminEmail } });

        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('zap@2026', 10);
            const superAdmin = this.usersRepository.create({
                email: adminEmail,
                password: hashedPassword,
                name: 'Cezar Dias',
                role: UserRole.SUPERADMIN,
            });
            await this.usersRepository.save(superAdmin);
            console.log('Super Admin cezar.dias@gmail.com criado com sucesso!');
        }
    }

    async findOneByEmail(email: string): Promise<User | undefined> {
        return this.usersRepository.findOne({
            where: { email },
            select: ['id', 'email', 'password', 'name', 'role', 'tenantId']
        });
    }

    async create(userData: any): Promise<User> {
        const user = this.usersRepository.create(userData);
        return this.usersRepository.save(user);
    }

    async createTenant(tenantData: any): Promise<Tenant> {
        const tenant = this.tenantsRepository.create(tenantData);
        return this.tenantsRepository.save(tenant);
    }
}
