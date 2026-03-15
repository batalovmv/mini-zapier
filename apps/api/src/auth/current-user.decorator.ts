import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AuthenticatedUser } from './auth.service';

interface AuthenticatedRequest {
  authUser?: AuthenticatedUser;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.authUser as AuthenticatedUser;
  },
);
