import { Module } from '@nestjs/common';

import { ActionService } from './action.service';
import { HttpRequestAction } from './strategies/http-request.action';
import { NoopAction } from './strategies/noop.action';

@Module({
  providers: [ActionService, HttpRequestAction, NoopAction],
  exports: [ActionService],
})
export class ActionModule {}
