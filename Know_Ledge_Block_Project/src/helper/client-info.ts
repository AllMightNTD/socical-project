import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ClientInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const ip =
      request.ip ||
      request.headers['x-forwarded-for'] ||
      request.socket.remoteAddress;
    const userAgent = request.headers['user-agent'];
    return { ip, userAgent };
  },
);
