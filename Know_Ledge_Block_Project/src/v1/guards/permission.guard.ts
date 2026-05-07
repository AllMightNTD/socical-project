// permission.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from 'src/decorator/permissions.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu API không yêu cầu permission → cho qua
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.user_roles) {
      throw new ForbiddenException('Permission denied');
    }

    // Get all user permission
    const userPermissions = new Set<string>();

    for (const userRole of user.user_roles) {
      const rolePermissions = userRole.role?.role_permissions || [];

      for (const rp of rolePermissions) {
        if (rp.permission?.code) {
          userPermissions.add(rp.permission.code);
        }
      }
    }

    // Check that there is at least one matching permission
    const hasPermission = requiredPermissions.some((p) =>
      userPermissions.has(p),
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have required permission');
    }

    return true;
  }
}
