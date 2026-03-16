import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  ExecutionStatus,
  FieldTreeNode,
  StepStatus,
  StepTestResponse,
  TriggerType,
  WorkflowExecutionDto,
} from '@mini-zapier/shared';
import { buildFieldTree, redactCredentials } from '@mini-zapier/server-utils';
import {
  ExecutionStepLog as PrismaExecutionStepLog,
  Prisma,
  Workflow as PrismaWorkflow,
  WorkflowEdge as PrismaWorkflowEdge,
  WorkflowExecution as PrismaWorkflowExecution,
  WorkflowNode as PrismaWorkflowNode,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { StepTestBodyDto } from './dto/step-test.dto';
import {
  computeChainSignature,
  flattenTreePaths,
  parseSnapshotForChain,
  resolveChainPositions,
} from './available-fields.util';
import { AvailableFieldsResponseDto } from './dto/available-fields-response.dto';
import {
  ExecutionListStatusFilter,
  ListExecutionsQueryDto,
} from './dto/list-executions-query.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

type WorkflowWithGraph = PrismaWorkflow & {
  nodes: PrismaWorkflowNode[];
  edges: PrismaWorkflowEdge[];
};

type WorkflowExecutionWithStepLogs = PrismaWorkflowExecution & {
  stepLogs: PrismaExecutionStepLog[];
};

export interface StartExecutionResult {
  duplicate: boolean;
  executionId?: string;
}

export interface ExecutionListResponse {
  items: WorkflowExecutionDto[];
  total: number;
  page: number;
  limit: number;
  counts: ExecutionCounts;
}

export interface ExecutionCounts {
  all: number;
  success: number;
  failed: number;
  inProgress: number;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

@Injectable()
export class ExecutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  async startManualExecution(
    userId: string,
    workflowId: string,
    triggerData: unknown,
  ): Promise<StartExecutionResult> {
    await this.ensureWorkflowOwnedByUser(userId, workflowId);
    return this.startExecution(workflowId, triggerData);
  }

  async testStep(
    userId: string,
    workflowId: string,
    body: StepTestBodyDto,
  ): Promise<StepTestResponse> {
    await this.ensureWorkflowOwnedByUser(userId, workflowId);

    const connectionId = body.connectionId ?? null;

    if (connectionId) {
      const connection = await this.prisma.connection.findFirst({
        where: { id: connectionId, userId },
        select: { id: true },
      });

      if (!connection) {
        throw new ForbiddenException(
          `Connection "${connectionId}" not found or not owned by user.`,
        );
      }
    }

    return this.queueService.addStepTestJob({
      nodeType: body.nodeType,
      config: body.config,
      connectionId,
      inputData: body.inputData,
    });
  }

  async startExecution(
    workflowId: string,
    triggerData: unknown,
    source?: TriggerType,
    idempotencyKey?: string,
  ): Promise<StartExecutionResult> {
    const normalizedIdempotencyKey =
      this.normalizeOptionalHeaderValue(idempotencyKey);

    if (normalizedIdempotencyKey && source === undefined) {
      throw new BadRequestException(
        'Execution source is required when idempotencyKey is provided.',
      );
    }

    let triggerEventCreated = false;

    const transactionResult = await this.prisma.$transaction(async (tx) => {
      const workflow = await tx.workflow.findUnique({
        where: { id: workflowId },
        include: {
          nodes: true,
          edges: true,
        },
      });

      if (!workflow) {
        throw new NotFoundException(`Workflow "${workflowId}" not found.`);
      }

      if (normalizedIdempotencyKey && source !== undefined) {
        const createResult = await tx.triggerEvent.createMany({
          data: [
            {
              workflowId,
              source,
              idempotencyKey: normalizedIdempotencyKey,
              processed: false,
            },
          ],
          skipDuplicates: true,
        });

        if (createResult.count === 0) {
          return {
            duplicate: true as const,
          };
        }

        triggerEventCreated = true;
      }

      const execution = await tx.workflowExecution.create({
        data: {
          workflowId,
          workflowVersion: workflow.version,
          status: ExecutionStatus.PENDING,
          triggerData: this.normalizeNullableJsonValue(
            triggerData,
            'triggerData',
          ),
          definitionSnapshot: this.buildDefinitionSnapshot(workflow),
        },
        select: { id: true },
      });

      return {
        duplicate: false as const,
        executionId: execution.id,
      };
    });

    if (transactionResult.duplicate) {
      return { duplicate: true };
    }

    const executionId = transactionResult.executionId;

    if (!executionId) {
      throw new InternalServerErrorException('Execution id was not created.');
    }

    let queuedJobId: string | undefined;

    try {
      const job = await this.queueService.addWorkflowExecutionJob(executionId);
      queuedJobId = job.id?.toString();

      if (triggerEventCreated && source !== undefined && normalizedIdempotencyKey) {
        const updateResult = await this.prisma.triggerEvent.updateMany({
          where: {
            workflowId,
            source,
            idempotencyKey: normalizedIdempotencyKey,
          },
          data: {
            processed: true,
          },
        });

        if (updateResult.count === 0) {
          throw new InternalServerErrorException(
            'TriggerEvent was not found after enqueue.',
          );
        }
      }
    } catch {
      if (queuedJobId) {
        await this.queueService.removeWorkflowExecutionJob(queuedJobId);
      }

      await this.cleanupFailedEnqueue(
        workflowId,
        executionId,
        source,
        normalizedIdempotencyKey,
        triggerEventCreated,
      );

      throw new InternalServerErrorException(
        'Failed to enqueue workflow execution.',
      );
    }

    return {
      duplicate: false,
      executionId,
    };
  }

  async getExecutions(
    userId: string,
    workflowId: string,
    query: ListExecutionsQueryDto,
  ): Promise<ExecutionListResponse> {
    await this.ensureWorkflowOwnedByUser(userId, workflowId);

    const page = this.parsePositiveInteger(query.page, 'page', DEFAULT_PAGE);
    const limit = this.parsePositiveInteger(query.limit, 'limit', DEFAULT_LIMIT);
    const where = this.buildExecutionListWhere(workflowId, query.status);

    const [
      total,
      executions,
      allCount,
      successCount,
      failedCount,
      inProgressCount,
    ] = await this.prisma.$transaction([
      this.prisma.workflowExecution.count({
        where,
      }),
      this.prisma.workflowExecution.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.workflowExecution.count({
        where: { workflowId },
      }),
      this.prisma.workflowExecution.count({
        where: {
          workflowId,
          status: ExecutionStatus.SUCCESS,
        },
      }),
      this.prisma.workflowExecution.count({
        where: {
          workflowId,
          status: ExecutionStatus.FAILED,
        },
      }),
      this.prisma.workflowExecution.count({
        where: {
          workflowId,
          status: {
            in: [ExecutionStatus.PENDING, ExecutionStatus.RUNNING],
          },
        },
      }),
    ]);

    return {
      items: executions.map((execution) => this.toWorkflowExecutionDto(execution)),
      total,
      page,
      limit,
      counts: {
        all: allCount,
        success: successCount,
        failed: failedCount,
        inProgress: inProgressCount,
      },
    };
  }

  async getExecution(
    userId: string,
    executionId: string,
  ): Promise<WorkflowExecutionDto> {
    const execution = await this.prisma.workflowExecution.findFirst({
      where: {
        id: executionId,
        workflow: {
          is: {
            userId,
          },
        },
      },
      include: {
        stepLogs: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!execution) {
      throw new NotFoundException(`Execution "${executionId}" not found.`);
    }

    return this.toWorkflowExecutionDto(execution);
  }

  async getAvailableFields(
    userId: string,
    workflowId: string,
  ): Promise<AvailableFieldsResponseDto> {
    const workflow = await this.prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId,
      },
      include: { nodes: true, edges: true },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow "${workflowId}" not found.`);
    }

    const currentNodes = workflow.nodes.map((n) => ({
      id: n.id,
      nodeKind: n.nodeKind,
      nodeType: n.nodeType,
    }));
    const currentEdges = workflow.edges.map((e) => ({
      sourceNodeId: e.sourceNodeId,
      targetNodeId: e.targetNodeId,
    }));
    const currentSignature = computeChainSignature(currentNodes, currentEdges);
    const currentChain = resolveChainPositions(currentNodes, currentEdges);

    const recentExecutions = await this.prisma.workflowExecution.findMany({
      where: {
        workflowId,
        status: ExecutionStatus.SUCCESS,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        stepLogs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const hasExecutions = recentExecutions.length > 0;
    let hasCompatibleExecution = false;

    for (const execution of recentExecutions) {
      const snapshot = parseSnapshotForChain(execution.definitionSnapshot);
      const snapshotSignature = computeChainSignature(
        snapshot.nodes,
        snapshot.edges,
      );

      if (snapshotSignature !== currentSignature) {
        continue;
      }

      hasCompatibleExecution = true;

      const snapshotChain = resolveChainPositions(
        snapshot.nodes,
        snapshot.edges,
      );

      const positions: { position: number; fields: string[]; tree: FieldTreeNode[] }[] = [];
      let hasAnyFields = false;

      // Position 0: trigger data
      const triggerTree = this.resolveFieldTree(
        execution.triggerDataSchema,
        execution.triggerData,
      );
      const triggerFields = flattenTreePaths(triggerTree);
      positions.push({ position: 0, fields: triggerFields, tree: triggerTree });

      if (triggerFields.length > 0) {
        hasAnyFields = true;
      }

      // Position 1..N: step log outputs
      for (let i = 0; i < currentChain.length; i++) {
        const snapshotNodeId = snapshotChain[i];
        const stepLog = snapshotNodeId
          ? execution.stepLogs.find((sl) => sl.nodeId === snapshotNodeId)
          : undefined;
        const tree = stepLog
          ? this.resolveFieldTree(stepLog.outputDataSchema, stepLog.outputData)
          : [];
        const fields = flattenTreePaths(tree);

        positions.push({ position: i + 1, fields, tree });

        if (fields.length > 0) {
          hasAnyFields = true;
        }
      }

      if (!hasAnyFields) {
        continue;
      }

      return {
        sourceExecutionId: execution.id,
        sourceWorkflowVersion: execution.workflowVersion,
        hasExecutions,
        emptyState: null,
        positions,
      };
    }

    return {
      sourceExecutionId: null,
      sourceWorkflowVersion: null,
      hasExecutions,
      emptyState: hasExecutions
        ? hasCompatibleExecution
          ? 'NO_FIELDS'
          : 'INCOMPATIBLE_EXECUTIONS'
        : 'NO_EXECUTIONS',
      positions: [],
    };
  }

  /**
   * Resolves a field tree from a stored schema snapshot, falling back to
   * building one from raw data (with redaction) for legacy executions.
   */
  private resolveFieldTree(
    storedSchema: unknown,
    rawData: unknown,
  ): FieldTreeNode[] {
    if (Array.isArray(storedSchema) && storedSchema.length > 0) {
      return storedSchema as FieldTreeNode[];
    }

    return buildFieldTree(redactCredentials(rawData));
  }

  private async cleanupFailedEnqueue(
    workflowId: string,
    executionId: string,
    source: TriggerType | undefined,
    idempotencyKey: string | undefined,
    triggerEventCreated: boolean,
  ): Promise<void> {
    const operations: Prisma.PrismaPromise<unknown>[] = [
      this.prisma.workflowExecution.delete({
        where: { id: executionId },
      }),
    ];

    if (triggerEventCreated && source !== undefined && idempotencyKey) {
      operations.push(
        this.prisma.triggerEvent.deleteMany({
          where: {
            workflowId,
            source,
            idempotencyKey,
          },
        }),
      );
    }

    await this.prisma.$transaction(operations);
  }

  private async ensureWorkflowOwnedByUser(
    userId: string,
    workflowId: string,
  ): Promise<void> {
    const workflow = await this.prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId,
      },
      select: { id: true },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow "${workflowId}" not found.`);
    }
  }

  private buildExecutionListWhere(
    workflowId: string,
    status?: ExecutionListStatusFilter,
  ): Prisma.WorkflowExecutionWhereInput {
    if (!status) {
      return { workflowId };
    }

    if (status === ExecutionListStatusFilter.IN_PROGRESS) {
      return {
        workflowId,
        status: {
          in: [ExecutionStatus.PENDING, ExecutionStatus.RUNNING],
        },
      };
    }

    return {
      workflowId,
      status,
    };
  }


  private buildDefinitionSnapshot(
    workflow: WorkflowWithGraph,
  ): Prisma.InputJsonObject {
    const nodes = [...workflow.nodes]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((node) => ({
        id: node.id,
        positionX: node.positionX,
        positionY: node.positionY,
        nodeKind: node.nodeKind,
        nodeType: node.nodeType,
        label: node.label,
        config: node.config as Prisma.InputJsonValue,
        connectionId: node.connectionId,
        retryCount: node.retryCount,
        retryBackoff: node.retryBackoff,
        timeoutMs: node.timeoutMs,
      }));

    const edges = [...workflow.edges]
      .sort((left, right) => {
        const sourceComparison = left.sourceNodeId.localeCompare(
          right.sourceNodeId,
        );

        if (sourceComparison !== 0) {
          return sourceComparison;
        }

        return left.targetNodeId.localeCompare(right.targetNodeId);
      })
      .map((edge) => ({
        id: edge.id,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      }));

    return {
      nodes: nodes as Prisma.InputJsonArray,
      edges: edges as Prisma.InputJsonArray,
    };
  }

  private normalizeOptionalHeaderValue(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalizedValue = value.trim();

    return normalizedValue.length > 0 ? normalizedValue : undefined;
  }

  private normalizeNullableJsonValue(
    value: unknown,
    fieldName: string,
  ): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    if (value === undefined || value === null) {
      return Prisma.JsonNull;
    }

    return this.normalizeJsonValue(value, fieldName);
  }

  private normalizeJsonObject(
    value: Record<string, unknown>,
    fieldName: string,
  ): Prisma.InputJsonObject {
    const result: Record<string, Prisma.InputJsonValue | null> = {};

    for (const [key, entryValue] of Object.entries(value)) {
      result[key] = this.normalizeJsonValueOrNull(
        entryValue,
        `${fieldName}.${key}`,
      );
    }

    return result as Prisma.InputJsonObject;
  }

  private normalizeJsonArray(
    value: unknown[],
    fieldName: string,
  ): Prisma.InputJsonArray {
    return value.map((entryValue, index) =>
      this.normalizeJsonValueOrNull(entryValue, `${fieldName}[${index}]`),
    ) as Prisma.InputJsonArray;
  }

  private normalizeJsonValueOrNull(
    value: unknown,
    fieldName: string,
  ): Prisma.InputJsonValue | null {
    if (value === null) {
      return null;
    }

    return this.normalizeJsonValue(value, fieldName);
  }

  private normalizeJsonValue(
    value: unknown,
    fieldName: string,
  ): Prisma.InputJsonValue {
    if (typeof value === 'string' || typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        throw new BadRequestException(
          `${fieldName} must not contain non-finite numbers.`,
        );
      }

      return value;
    }

    if (Array.isArray(value)) {
      return this.normalizeJsonArray(value, fieldName);
    }

    if (isPlainObject(value)) {
      return this.normalizeJsonObject(value, fieldName);
    }

    throw new BadRequestException(
      `${fieldName} must contain only JSON-serializable values.`,
    );
  }

  private parsePositiveInteger(
    value: unknown,
    fieldName: string,
    defaultValue: number,
  ): number {
    if (value === undefined) {
      return defaultValue;
    }

    const normalizedValue =
      typeof value === 'string' ? Number.parseInt(value, 10) : value;

    if (
      typeof normalizedValue !== 'number' ||
      !Number.isInteger(normalizedValue) ||
      normalizedValue <= 0
    ) {
      throw new BadRequestException(
        `${fieldName} must be a positive integer.`,
      );
    }

    return normalizedValue;
  }

  private toWorkflowExecutionDto(
    execution: PrismaWorkflowExecution,
  ): WorkflowExecutionDto;
  private toWorkflowExecutionDto(
    execution: WorkflowExecutionWithStepLogs,
  ): WorkflowExecutionDto;
  private toWorkflowExecutionDto(
    execution: PrismaWorkflowExecution | WorkflowExecutionWithStepLogs,
  ): WorkflowExecutionDto {
    return {
      id: execution.id,
      workflowId: execution.workflowId,
      workflowVersion: execution.workflowVersion,
      status: execution.status as ExecutionStatus,
      triggerData:
        execution.triggerData === null ? undefined : execution.triggerData,
      startedAt: execution.startedAt?.toISOString() ?? null,
      completedAt: execution.completedAt?.toISOString() ?? null,
      errorMessage: execution.errorMessage,
      createdAt: execution.createdAt.toISOString(),
      stepLogs:
        'stepLogs' in execution
          ? execution.stepLogs.map((stepLog) => ({
              id: stepLog.id,
              executionId: stepLog.executionId,
              nodeId: stepLog.nodeId,
              nodeLabel: stepLog.nodeLabel,
              nodeType: stepLog.nodeType,
              status: stepLog.status as StepStatus,
              inputData:
                stepLog.inputData === null ? undefined : stepLog.inputData,
              outputData:
                stepLog.outputData === null ? undefined : stepLog.outputData,
              errorMessage: stepLog.errorMessage,
              retryAttempt: stepLog.retryAttempt,
              truncated: stepLog.truncated,
              startedAt: stepLog.startedAt?.toISOString() ?? null,
              completedAt: stepLog.completedAt?.toISOString() ?? null,
              durationMs: stepLog.durationMs,
              createdAt: stepLog.createdAt.toISOString(),
            }))
          : undefined,
    };
  }
}




