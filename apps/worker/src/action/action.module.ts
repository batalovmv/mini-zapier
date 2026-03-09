import { Module } from '@nestjs/common';

import { ActionService } from './action.service';
import { DataTransformAction } from './strategies/data-transform.action';
import { DbQueryAction } from './strategies/db-query.action';
import { EmailSendAction } from './strategies/email-send.action';
import { HttpRequestAction } from './strategies/http-request.action';
import { NoopAction } from './strategies/noop.action';
import { TelegramAction } from './strategies/telegram.action';

@Module({
  providers: [
    ActionService,
    HttpRequestAction,
    EmailSendAction,
    TelegramAction,
    DbQueryAction,
    DataTransformAction,
    NoopAction,
  ],
  exports: [ActionService],
})
export class ActionModule {}
