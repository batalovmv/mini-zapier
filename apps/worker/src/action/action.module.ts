import { Module } from '@nestjs/common';

import { ActionService } from './action.service';
import { NoopAction } from './strategies/noop.action';

@Module({
  providers: [ActionService, NoopAction],
  exports: [ActionService],
})
export class ActionModule {}
