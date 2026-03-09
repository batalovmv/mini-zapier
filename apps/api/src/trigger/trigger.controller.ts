import { createHmac, timingSafeEqual } from 'node:crypto';

import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
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

interface TriggerWorkflowContext {
  id: string;
  status: WorkflowStatus;
  nodes: WebhookWorkflowTriggerNode[];
}

interface RawBodyRequest {
  rawBody?: Buffer;
}

interface InboundEmailData {
  from?: string;
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
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
  @ApiBadRequestResponse({ description: 'Webhook payload is invalid.' })
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
    const workflow = await this.getWorkflowTriggerContext(workflowId);

    this.ensureWorkflowIsActive(workflow, 'webhooks');

    const triggerNode = this.getTriggerNode(
      workflow,
      TriggerType.WEBHOOK,
      'WEBHOOK',
    );

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

  @Post('inbound-email/:workflowId')
  @ApiOperation({ summary: 'Handle incoming email trigger' })
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
    description: 'Duplicate provider event detected, no new execution created.',
    schema: {
      example: {
        duplicate: true,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Email signature is missing or invalid.' })
  @ApiBadRequestResponse({ description: 'Inbound email payload is invalid.' })
  @ApiUnprocessableEntityResponse({
    description: 'Workflow is not ACTIVE or not configured for email trigger.',
  })
  @ApiNotFoundResponse({ description: 'Workflow not found.' })
  async handleInboundEmail(
    @Param('workflowId') workflowId: string,
    @Body() payload: unknown,
    @Headers('x-signature') signatureHeader: string | string[] | undefined,
    @Headers('x-event-id') eventIdHeader: string | string[] | undefined,
    @Req() request: RawBodyRequest,
    @Res({ passthrough: true })
    response: { status: (code: number) => unknown },
  ): Promise<{ duplicate: true } | { executionId: string }> {
    const workflow = await this.getWorkflowTriggerContext(workflowId);

    this.ensureWorkflowIsActive(workflow, 'inbound emails');

    const triggerNode = this.getTriggerNode(workflow, TriggerType.EMAIL, 'EMAIL');
    const signingSecret = this.getEmailSigningSecret(triggerNode.connection);

    this.assertValidEmailSignature(
      signatureHeader,
      request.rawBody,
      signingSecret,
    );

    const emailData = this.parseInboundEmailData(payload);
    const eventId =
      this.normalizeHeaderValue(eventIdHeader) ??
      this.extractProviderEventId(payload);

    const result = await this.executionService.startExecution(
      workflowId,
      emailData,
      TriggerType.EMAIL,
      eventId,
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

  private async getWorkflowTriggerContext(
    workflowId: string,
  ): Promise<TriggerWorkflowContext> {
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

    return workflow as TriggerWorkflowContext;
  }

  private ensureWorkflowIsActive(
    workflow: TriggerWorkflowContext,
    sourceLabel: string,
  ): void {
    if (workflow.status !== WorkflowStatus.ACTIVE) {
      throw new UnprocessableEntityException(
        `Workflow "${workflow.id}" must be ACTIVE to accept ${sourceLabel}.`,
      );
    }
  }

  private getTriggerNode(
    workflow: TriggerWorkflowContext,
    expectedType: TriggerType,
    expectedTypeLabel: string,
  ): WebhookWorkflowTriggerNode {
    const triggerNode = workflow.nodes[0];

    if (!triggerNode || triggerNode.nodeType !== expectedType) {
      throw new UnprocessableEntityException(
        `Workflow "${workflow.id}" is not configured with trigger type ${expectedTypeLabel}.`,
      );
    }

    return triggerNode;
  }

  private getWebhookSecret(connection: PrismaConnection | null): string {
    const credentials = this.getWebhookConnectionCredentials(
      connection,
      'Webhook trigger',
    );

    if (
      typeof credentials.secret !== 'string' ||
      credentials.secret.trim().length === 0
    ) {
      throw new UnprocessableEntityException(
        'Webhook connection credentials must contain a non-empty "secret" field.',
      );
    }

    return credentials.secret.trim();
  }

  private getEmailSigningSecret(connection: PrismaConnection | null): string {
    const credentials = this.getWebhookConnectionCredentials(
      connection,
      'Email trigger',
    );

    if (
      typeof credentials.signingSecret !== 'string' ||
      credentials.signingSecret.trim().length === 0
    ) {
      throw new UnprocessableEntityException(
        'Email trigger connection credentials must contain a non-empty "signingSecret" field.',
      );
    }

    return credentials.signingSecret.trim();
  }

  private getWebhookConnectionCredentials(
    connection: PrismaConnection | null,
    triggerLabel: string,
  ): Record<string, unknown> {
    if (!connection) {
      throw new UnprocessableEntityException(
        `${triggerLabel} must reference a WEBHOOK connection.`,
      );
    }

    if (connection.type !== ConnectionType.WEBHOOK) {
      throw new UnprocessableEntityException(
        `${triggerLabel} connection must have type WEBHOOK.`,
      );
    }

    const plaintext = decrypt(connection.credentials, this.getEncryptionKey());

    let parsedCredentials: unknown;

    try {
      parsedCredentials = JSON.parse(plaintext);
    } catch {
      throw new UnprocessableEntityException(
        `${triggerLabel} connection credentials are invalid JSON.`,
      );
    }

    if (!this.isCredentialsObject(parsedCredentials)) {
      throw new UnprocessableEntityException(
        `${triggerLabel} connection credentials must be an object.`,
      );
    }

    return parsedCredentials;
  }

  private assertValidEmailSignature(
    signatureHeader: string | string[] | undefined,
    rawBody: Buffer | undefined,
    signingSecret: string,
  ): void {
    const signature = this.normalizeHeaderValue(signatureHeader);

    if (!signature) {
      throw new UnauthorizedException('Email signature is invalid.');
    }

    if (!rawBody) {
      throw new InternalServerErrorException(
        'Raw request body is not available for signature verification.',
      );
    }

    const expectedHexSignature = createHmac('sha256', signingSecret)
      .update(rawBody)
      .digest('hex');
    const expectedBase64Signature = createHmac('sha256', signingSecret)
      .update(rawBody)
      .digest('base64');
    const signatureCandidates = this.extractSignatureCandidates(signature);

    const isValid = signatureCandidates.some((candidate) => {
      const normalizedCandidate = candidate.trim();

      return (
        this.safeCompare(normalizedCandidate.toLowerCase(), expectedHexSignature) ||
        this.safeCompare(normalizedCandidate, expectedBase64Signature)
      );
    });

    if (!isValid) {
      throw new UnauthorizedException('Email signature is invalid.');
    }
  }

  private extractSignatureCandidates(signature: string): string[] {
    const candidates = new Set<string>();

    for (const part of signature.split(',')) {
      const trimmedPart = part.trim();

      if (trimmedPart.length === 0) {
        continue;
      }

      candidates.add(trimmedPart);

      const separatorIndex = trimmedPart.indexOf('=');

      if (separatorIndex > -1 && separatorIndex < trimmedPart.length - 1) {
        candidates.add(trimmedPart.slice(separatorIndex + 1).trim());
      }
    }

    return [...candidates];
  }

  private safeCompare(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  }

  private parseInboundEmailData(payload: unknown): InboundEmailData {
    if (!this.isCredentialsObject(payload)) {
      throw new BadRequestException(
        'Inbound email payload must be a JSON object.',
      );
    }

    const emailData: InboundEmailData = {};
    const from = this.pickStringValue(payload, [['from'], ['sender'], ['from', 'email']]);
    const to = this.pickStringValue(payload, [['to'], ['recipient'], ['to', 'email']]);
    const subject = this.pickStringValue(payload, [['subject']]);
    const text = this.pickStringValue(payload, [['text'], ['plain'], ['body-plain']]);
    const html = this.pickStringValue(payload, [['html'], ['body-html']]);

    if (from !== undefined) {
      emailData.from = from;
    }

    if (to !== undefined) {
      emailData.to = to;
    }

    if (subject !== undefined) {
      emailData.subject = subject;
    }

    if (text !== undefined) {
      emailData.text = text;
    }

    if (html !== undefined) {
      emailData.html = html;
    }

    return emailData;
  }

  private extractProviderEventId(payload: unknown): string | undefined {
    if (!this.isCredentialsObject(payload)) {
      return undefined;
    }

    return this.pickStringValue(payload, [
      ['eventId'],
      ['event_id'],
      ['messageId'],
      ['message_id'],
      ['id'],
    ]);
  }

  private pickStringValue(
    payload: Record<string, unknown>,
    paths: string[][],
  ): string | undefined {
    for (const path of paths) {
      const value = this.getValueAtPath(payload, path);

      if (typeof value !== 'string') {
        continue;
      }

      const normalizedValue = value.trim();

      if (normalizedValue.length > 0) {
        return normalizedValue;
      }
    }

    return undefined;
  }

  private getValueAtPath(
    payload: Record<string, unknown>,
    path: string[],
  ): unknown {
    let currentValue: unknown = payload;

    for (const segment of path) {
      if (!this.isCredentialsObject(currentValue)) {
        return undefined;
      }

      currentValue = currentValue[segment];
    }

    return currentValue;
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
