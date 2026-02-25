import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            tenantId: any;
        };
    }>;
    register(createUserDto: any): Promise<import("../users/entities/user.entity").User>;
}
