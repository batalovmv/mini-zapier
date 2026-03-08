import {
  Body,
  Controller,
  Headers,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Res,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { decrypt } from '@mini-zapier/server-utils';
import { ConnectionType, TriggerType, WorkflowStatus } from '@mini-zapier/shared';
import { Connection as PrismaConnection } from '@prisma/client';

import { ExecutionService } from '../execution/execution.service';
import { PrismaService } from '../prisma/prisma.service';

declare const process: {
  env: Record<string, string | undefined>;
};

interface WebhookWorkflowTriggerNode {
  id: string;
  nodeType: string;
  connectionId: string | null;
  connection: PrismaConnection | null;
}

@ApiTags('triggers')
@Controller('api')
export class TriggerController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly executionService: ExecutionService,
  ) {}

  @Post('webhooks/:workflowId')
  @ApiOperation({ summary: 'Handle incoming webhook trigger' })
  @ApiParam({ name: 'workflowId', description: 'Workflow id' })
  @ApiAcceptedResponse({
    description: 'Execution created and queued.',
    schema: {
      example: {
        executionId: 'cm123execution',
      },
    },
  })
  @ApiOkResponse({
    description: 'Duplicate event detected, no new execution created.',
    schema: {
      example: {
        duplicate: true,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Webhook secret is missing or invalid.' })
  @ApiUnprocessableEntityResponse({
    description: 'Workflow is not ACTIVE or not configured for webhook trigger.',
  })
  @ApiNotFoundResponse({ description: 'Workflow not found.' })
  async handleWebhook(
    @Param('workflowId') workflowId: string,
    @Body() triggerData: unknown,
    @Headers('x-webhook-secret') webhookSecretHeader: string | string[] | undefined,
    @Headers('idempotency-key') idempotencyKeyHeader: string | string[] | undefined,
    @Headers('x-event-id') eventIdHeader: string | string[] | undefined,
    @Res({ passthrough: true })
    response: { status: (code: number) => unknown },
  ): Promise<{ duplicate: true } | { executionId: string }> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      select: {
        id: true,
        status: true,
        nodes: {
          where: {
            nodeKind: 'trigger',
          },
          select: {
            id: true,
            nodeType: true,
            connectionId: true,
            connection: true,
          },
        },
      },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow "${workflowId}" not found.`);
    }

    if (workflow.status !== WorkflowStatus.ACTIVE) {
      throw new UnprocessableEntityException(
        `Workflow "${workflowId}" must be ACTIVE to accept webhooks.`,
      );
    }

    const triggerNode = workflow.nodes[0] as WebhookWorkflowTriggerNode | undefined;

    if (!triggerNode || triggerNode.nodeType !== TriggerType.WEBHOOK) {
      throw new UnprocessableEntityException(
        `Workflow "${workflowId}" is not configured with a WEBHOOK trigger.`,
      );
    }

    const configuredSecret = this.getWebhookSecret(triggerNode.connection);
    const requestSecret = this.normalizeHeaderValue(webhookSecretHeader);

    if (!requestSecret || requestSecret !== configuredSecret) {
      throw new UnauthorizedException('Webhook secret is invalid.');
    }

    const idempotencyKey =
      this.normalizeHeaderValue(idempotencyKeyHeader) ??
      this.normalizeHeaderValue(eventIdHeader);

    const result = await this.executionService.startExecution(
      workflowId,
      triggerData,
      TriggerType.WEBHOOK,
      idempotencyKey,
    );

    if (result.duplicate) {
      response.status(HttpStatus.OK);

      return { duplicate: true };
    }

    response.status(HttpStatus.ACCEPTED);

    return {
      executionId: result.executionId as string,
    };
  }

  private getWebhookSecret(connection: PrismaConnection | null): string {
    if (!connection) {
      throw new UnprocessableEntityException(
        'Webhook trigger must reference a WEBHOOK connection.',
      );
    }

    if (connection.type !== ConnectionType.WEBHOOK) {
      throw new UnprocessableEntityException(
        'Webhook trigger connection must have type WEBHOOK.',
      );
    }

    const plaintext = decrypt(connection.credentials, this.getEncryptionKey());

    let parsedCredentials: unknown;

    try {
      parsedCredentials = JSON.parse(plaintext);
    } catch {
      throw new UnprocessableEntityException(
        'Webhook connection credentials are invalid JSON.',
      );
    }

    if (
      !this.isCredentialsObject(parsedCredentials) ||
      typeof parsedCredentials.secret !== 'string' ||
      parsedCredentials.secret.trim().length === 0
    ) {
      throw new UnprocessableEntityException(
        'Webhook connection credentials must contain a non-empty "secret" field.',
      );
    }

    return parsedCredentials.secret.trim();
  }

  private normalizeHeaderValue(
    value: string | string[] | undefined,
  ): string | undefined {
    const normalizedValue = Array.isArray(value) ? value[0] : value;

    if (typeof normalizedValue !== 'string') {
      return undefined;
    }

    const trimmedValue = normalizedValue.trim();

    return trimmedValue.length > 0 ? trimmedValue : undefined;
  }

  private isCredentialsObject(
    value: unknown,
  ): value is Record<string, unknown> {
    return Object.prototype.toString.call(value) === '[object Object]';
  }

  private getEncryptionKey(): string {
    const encryptionKey = process.env.APP_ENCRYPTION_KEY;

    if (!encryptionKey) {
      throw new InternalServerErrorException(
        'APP_ENCRYPTION_KEY is not configured.',
      );
    }

    return encryptionKey;
  }
}
