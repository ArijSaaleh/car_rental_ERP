import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserRole } from '../enums';

/**
 * Tenant Interceptor - Ensures multi-tenant data isolation
 * Automatically filters queries by agency_id based on the authenticated user
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user) {
      // Super admins can access all tenants
      if (user.role === UserRole.SUPER_ADMIN) {
        request.tenantId = request.params.agencyId || request.query.agencyId || null;
      } else {
        // Regular users are restricted to their agency
        if (!user.agencyId) {
          throw new UnauthorizedException('User must be associated with an agency');
        }
        request.tenantId = user.agencyId;
      }

      // Attach tenant context to request for use in services
      request.tenant = {
        agencyId: request.tenantId,
        userId: user.id,
        userRole: user.role,
      };
    }

    return next.handle();
  }
}
