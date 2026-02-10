import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Tenant } from './entities/tenant.entity';
export declare class UsersService implements OnModuleInit {
    private usersRepository;
    private tenantsRepository;
    constructor(usersRepository: Repository<User>, tenantsRepository: Repository<Tenant>);
    onModuleInit(): Promise<void>;
    seedSuperAdmin(): Promise<void>;
    findOneByEmail(email: string): Promise<User | null>;
    findAllTenants(): Promise<Tenant[]>;
    create(userData: any): Promise<User>;
    createTenant(tenantData: any): Promise<Tenant>;
    findAll(): Promise<User[]>;
    update(id: string, updateData: any): Promise<User | null>;
    remove(id: string): Promise<void>;
}
