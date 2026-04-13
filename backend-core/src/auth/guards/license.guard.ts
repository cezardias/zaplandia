import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { BillingService } from '../../billing/billing.service';

@Injectable()
export class LicenseGuard implements CanActivate {
    constructor(private billingService: BillingService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.tenantId) {
            return true; // Let AuthGuard handle this
        }

        // Bypass for superadmin to avoid lockouts
        if (user.role === 'superadmin') {
            return true;
        }

        const subscription = await this.billingService.getTenantSubscription(user.tenantId);

        if (subscription.isExpired) {
            throw new HttpException({
                message: 'Assinatura Expirada ou Trial Encerrado.',
                error: 'Payment Required',
                statusCode: HttpStatus.PAYMENT_REQUIRED,
                isExpired: true,
                trialRemainingDays: 0
            }, HttpStatus.PAYMENT_REQUIRED);
        }

        return true;
    }
}
