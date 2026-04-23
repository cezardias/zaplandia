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
            teamId: any;
        };
    }>;
    register(createUserDto: any): Promise<import("../users/entities/user.entity").User>;
    googleAuth(req: any): Promise<void>;
    googleAuthRedirect(req: any, res: any): Promise<any>;
    facebookAuth(req: any): Promise<void>;
    facebookAuthRedirect(req: any, res: any): Promise<any>;
}
