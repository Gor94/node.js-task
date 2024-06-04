import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const req: Express.Request = context.switchToHttp().getRequest();
    return req?.user;
  },
);
