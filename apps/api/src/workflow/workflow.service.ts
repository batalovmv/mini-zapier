import { randomUUID } from 'node:crypto';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { NodeKind, WorkflowDto, WorkflowStatus } from '@mini-zapier/shared';
import {
  Prisma,
  Workflow as PrismaWorkflow,
  WorkflowEdge as PrismaWorkflowEdge,
  WorkflowNode as PrismaWorkflowNode,
  WorkflowStatus as PrismaWorkflowStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { TriggerService } from '../trigger/trigger.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { ListWorkflowsQueryDto } from './dto/list-workflows-query.dto';
import { UpdateWorkflowStatusDto } from './dto/update-workflow-status.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import {
  validateLinearWorkflowGraph,
  WorkflowEdgeValidationInput,
  WorkflowNodeValidationInput,
} from './workflow.validation';

declare const process: {
  env: Record<string, string | undefined>;
};

interface NormalizedWorkflowNodeInput extends WorkflowNodeValidationInput {
  id: string;
  positionX: number;
  positionY: number;
  nodeKind: NodeKind;
  nodeType: string;
  label: string;
  config: Prisma.InputJsonObject;
  connectionId: string | null;
  retryCount: number;
  retryBackoff: number;
  timeoutMs: number | null;
}

interface NormalizedWorkflowNode extends WorkflowNodeValidationInput {
  id: string;
  positionX: number;
  positionY: number;
  nodeKind: NodeKind;
  nodeType: string;
  label: string;
  config: Prisma.InputJsonObject;
  connectionId: string | null;
  retryCount: number;
  retryBackoff: number;
  timeoutMs: number | null;
}

interface NormalizedWorkflowEdgeInput extends WorkflowEdgeValidationInput {
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle: string | null;
  targetHandle: string | null;
}

interface NormalizedWorkflowEdge extends WorkflowEdgeValidationInput {
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle: string | null;
  targetHandle: string | null;
}

interface NormalizedWorkflowDefinition {
  name: string;
  description: string | null;
  timezone: string;
  viewport: Prisma.InputJsonObject | typeof Prisma.JsonNull;
  nodes: NormalizedWorkflowNode[];
  edges: NormalizedWorkflowEdge[];
}

export interface WorkflowListResponse {
  items: WorkflowDto[];
  total: number;
  page: number;
  limit: number;
}

type WorkflowWithGraph = PrismaWorkflow & {
  nodes: PrismaWorkflowNode[];
  edges: PrismaWorkflowEdge[];
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

@Injectable()
export class WorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly triggerService: TriggerService,
  ) {}

  async create(userId: string, createWorkflowDto: CreateWorkflowDto): Promise<WorkflowDto> {
    const normalizedDefinition =
      this.normalizeWorkflowDefinition(createWorkflowDto);

    await this.ensureConnectionsExist(userId, normalizedDefinition.nodes);

    const workflow = await this.prisma.$transaction(async (tx) => {
      const createdWorkflow = await tx.workflow.create({
        data: {
          userId,
          name: normalizedDefinition.name,
          description: normalizedDefinition.description,
          timezone: normalizedDefinition.timezone,
          viewport: normalizedDefinition.viewport,
          version: 1,
        },
      });

      await tx.workflowNode.createMany({
        data: normalizedDefinition.nodes.map((node) => ({
          workflowId: createdWorkflow.id,
          id: node.id,
          positionX: node.positionX,
          positionY: node.positionY,
          nodeKind: node.nodeKind,
          nodeType: node.nodeType,
          label: node.label,
          config: node.config,
          connectionId: node.connectionId,
          retryCount: node.retryCount,
          retryBackoff: node.retryBackoff,
          timeoutMs: node.timeoutMs,
        })),
      });

      if (normalizedDefinition.edges.length > 0) {
        await tx.workflowEdge.createMany({
          data: normalizedDefinition.edges.map((edge) => ({
            workflowId: createdWorkflow.id,
            sourceNodeId: edge.sourceNodeId,
            targetNodeId: edge.targetNodeId,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
          })),
        });
      }

      return tx.workflow.findUnique({
        where: { id: createdWorkflow.id },
        include: {
          nodes: true,
          edges: true,
        },
      });
    });

    if (!workflow) {
      throw new NotFoundException('Workflow was not found after creation.');
    }

    return this.toWorkflowDto(workflow);
  }

  async findAll(
    userId: string,
    query: ListWorkflowsQueryDto,
  ): Promise<WorkflowListResponse> {
    const page = this.parsePositiveInteger(query.page, 'page', DEFAULT_PAGE);
    const limit = this.parsePositiveInteger(query.limit, 'limit', DEFAULT_LIMIT);
    const status = this.normalizeWorkflowStatus(query.status, true);

    const where: Prisma.WorkflowWhereInput = {
      userId,
    };

    if (status !== undefined) {
      where.status = status as PrismaWorkflowStatus;
    }

    const [total, workflows] = await this.prisma.$transaction([
      this.prisma.workflow.count({ where }),
      this.prisma.workflow.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          nodes: true,
          edges: true,
        },
      }),
    ]);

    return {
      items: workflows.map((workflow) => this.toWorkflowDto(workflow)),
      total,
      page,
      limit,
    };
  }

  async findOne(userId: string, id: string): Promise<WorkflowDto> {
    const workflow = await this.getWorkflowWithGraphOrThrow(userId, id);
    return this.toWorkflowDto(workflow);
  }

  async update(
    userId: string,
    id: string,
    updateWorkflowDto: UpdateWorkflowDto,
  ): Promise<WorkflowDto> {
    const previousWorkflow = await this.getWorkflowWithGraphOrThrow(userId, id);

    const normalizedDefinition =
      this.normalizeWorkflowDefinition(updateWorkflowDto);

    await this.ensureConnectionsExist(userId, normalizedDefinition.nodes);

    const workflow = await this.prisma.$transaction(async (tx) => {
      await tx.workflow.update({
        where: { id },
        data: {
          name: normalizedDefinition.name,
          description: normalizedDefinition.description,
          timezone: normalizedDefinition.timezone,
          viewport: normalizedDefinition.viewport,
          version: {
            increment: 1,
          },
        },
      });

      await tx.workflowEdge.deleteMany({
        where: { workflowId: id },
      });

      await tx.workflowNode.deleteMany({
        where: { workflowId: id },
      });

      await tx.workflowNode.createMany({
        data: normalizedDefinition.nodes.map((node) => ({
          workflowId: id,
          id: node.id,
          positionX: node.positionX,
          positionY: node.positionY,
          nodeKind: node.nodeKind,
          nodeType: node.nodeType,
          label: node.label,
          config: node.config,
          connectionId: node.connectionId,
          retryCount: node.retryCount,
          retryBackoff: node.retryBackoff,
          timeoutMs: node.timeoutMs,
        })),
      });

      if (normalizedDefinition.edges.length > 0) {
        await tx.workflowEdge.createMany({
          data: normalizedDefinition.edges.map((edge) => ({
            workflowId: id,
            sourceNodeId: edge.sourceNodeId,
            targetNodeId: edge.targetNodeId,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
          })),
        });
      }

      return tx.workflow.findUnique({
        where: { id },
        include: {
          nodes: true,
          edges: true,
        },
      });
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow "${id}" not found.`);
    }

    await this.triggerService.handleWorkflowDefinitionUpdated(
      previousWorkflow,
      workflow,
    );

    return this.toWorkflowDto(workflow);
  }

  async updateStatus(
    userId: string,
    id: string,
    updateWorkflowStatusDto: UpdateWorkflowStatusDto,
  ): Promise<WorkflowDto> {
    const previousWorkflow = await this.getWorkflowWithGraphOrThrow(userId, id);

    const workflow = await this.prisma.workflow.update({
      where: { id },
      data: {
        status: this.normalizeWorkflowStatus(
          updateWorkflowStatusDto.status,
          false,
        ) as PrismaWorkflowStatus,
      },
      include: {
        nodes: true,
        edges: true,
      },
    });

    await this.triggerService.handleWorkflowStatusChanged(
      previousWorkflow,
      workflow,
    );

    return this.toWorkflowDto(workflow);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.ensureWorkflowOwnedByUser(userId, id);

    await this.prisma.workflow.delete({
      where: { id },
    });
  }

  private async ensureWorkflowOwnedByUser(
    userId: string,
    id: string,
  ): Promise<void> {
    const workflow = await this.prisma.workflow.findFirst({
      where: {
        id,
        userId,
      },
      select: { id: true },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow "${id}" not found.`);
    }
  }

  private async getWorkflowWithGraphOrThrow(
    userId: string,
    id: string,
  ): Promise<WorkflowWithGraph> {
    const workflow = await this.prisma.workflow.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        nodes: true,
        edges: true,
      },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow "${id}" not found.`);
    }

    return workflow;
  }

  private async ensureConnectionsExist(
    userId: string,
    nodes: Pick<NormalizedWorkflowNode, 'connectionId'>[],
  ): Promise<void> {
    const connectionIds = Array.from(
      new Set(
        nodes
          .map((node) => node.connectionId)
          .filter((connectionId): connectionId is string => connectionId !== null),
      ),
    );

    if (connectionIds.length === 0) {
      return;
    }

    const existingConnections = await this.prisma.connection.findMany({
      where: {
        id: {
          in: connectionIds,
        },
        userId,
      },
      select: { id: true },
    });

    const existingConnectionIds = new Set(
      existingConnections.map((connection) => connection.id),
    );
    const missingConnectionIds = connectionIds.filter(
      (connectionId) => !existingConnectionIds.has(connectionId),
    );

    if (missingConnectionIds.length > 0) {
      throw new BadRequestException(
        `Workflow references missing or foreign connections: ${missingConnectionIds.join(', ')}.`,
      );
    }
  }

  private normalizeWorkflowDefinition(
    workflowDto: CreateWorkflowDto | UpdateWorkflowDto,
  ): NormalizedWorkflowDefinition {
    const normalizedNodeInputs = this.normalizeNodes(workflowDto.nodes);
    const normalizedEdgeInputs = this.normalizeEdges(workflowDto.edges);

    validateLinearWorkflowGraph(normalizedNodeInputs, normalizedEdgeInputs);

    const { nodes, edges } = this.assignServerNodeIds(
      normalizedNodeInputs,
      normalizedEdgeInputs,
    );

    return {
      name: this.normalizeRequiredString(workflowDto.name, 'Workflow name'),
      description:
        this.normalizeOptionalString(
          workflowDto.description,
          'Workflow description',
        ) ?? null,
      timezone:
        this.normalizeOptionalString(workflowDto.timezone, 'Workflow timezone') ??
        process.env.DEFAULT_TIMEZONE ??
        'UTC',
      viewport: this.normalizeViewport(workflowDto.viewport),
      nodes,
      edges,
    };
  }

  private normalizeNodes(nodes: unknown): NormalizedWorkflowNodeInput[] {
    if (!Array.isArray(nodes) || nodes.length === 0) {
      throw new BadRequestException(
        'Workflow nodes must be a non-empty array.',
      );
    }

    const normalizedNodes = nodes.map((node, index) =>
      this.normalizeNode(node, index),
    );
    const uniqueNodeIds = new Set(normalizedNodes.map((node) => node.id));

    if (uniqueNodeIds.size !== normalizedNodes.length) {
      throw new BadRequestException('Workflow nodes must have unique ids.');
    }

    return normalizedNodes;
  }

  private normalizeNode(
    node: unknown,
    index: number,
  ): NormalizedWorkflowNodeInput {
    if (!isPlainObject(node)) {
      throw new BadRequestException(
        `Workflow node at index ${index} must be an object.`,
      );
    }

    const nodeKind = this.normalizeNodeKind(node.nodeKind, index);

    return {
      id: this.normalizeRequiredString(node.id, `Workflow node ${index} id`),
      positionX: this.normalizeNumber(
        node.positionX,
        `Workflow node ${index} positionX`,
      ),
      positionY: this.normalizeNumber(
        node.positionY,
        `Workflow node ${index} positionY`,
      ),
      nodeKind,
      nodeType: this.normalizeRequiredString(
        node.nodeType,
        `Workflow node ${index} nodeType`,
      ),
      label: this.normalizeRequiredString(
        node.label,
        `Workflow node ${index} label`,
      ),
      config: this.normalizeJsonObject(
        node.config,
        `Workflow node ${index} config`,
      ),
      connectionId:
        this.normalizeOptionalString(
          node.connectionId,
          `Workflow node ${index} connectionId`,
        ) ?? null,
      retryCount: this.normalizeNonNegativeInteger(
        node.retryCount,
        `Workflow node ${index} retryCount`,
        0,
      ),
      retryBackoff: this.normalizeNonNegativeInteger(
        node.retryBackoff,
        `Workflow node ${index} retryBackoff`,
        0,
      ),
      timeoutMs: this.normalizeNullablePositiveInteger(
        node.timeoutMs,
        `Workflow node ${index} timeoutMs`,
      ),
    };
  }

  private normalizeEdges(edges: unknown): NormalizedWorkflowEdgeInput[] {
    if (!Array.isArray(edges)) {
      throw new BadRequestException('Workflow edges must be an array.');
    }

    return edges.map((edge, index) => this.normalizeEdge(edge, index));
  }

  private normalizeEdge(
    edge: unknown,
    index: number,
  ): NormalizedWorkflowEdgeInput {
    if (!isPlainObject(edge)) {
      throw new BadRequestException(
        `Workflow edge at index ${index} must be an object.`,
      );
    }

    return {
      sourceNodeId: this.normalizeRequiredString(
        edge.sourceNodeId,
        `Workflow edge ${index} sourceNodeId`,
      ),
      targetNodeId: this.normalizeRequiredString(
        edge.targetNodeId,
        `Workflow edge ${index} targetNodeId`,
      ),
      sourceHandle:
        this.normalizeOptionalString(
          edge.sourceHandle,
          `Workflow edge ${index} sourceHandle`,
        ) ?? null,
      targetHandle:
        this.normalizeOptionalString(
          edge.targetHandle,
          `Workflow edge ${index} targetHandle`,
        ) ?? null,
    };
  }

  private assignServerNodeIds(
    nodes: NormalizedWorkflowNodeInput[],
    edges: NormalizedWorkflowEdgeInput[],
  ): Pick<NormalizedWorkflowDefinition, 'nodes' | 'edges'> {
    const clientToServerId = new Map<string, string>();
    const remappedNodes: NormalizedWorkflowNode[] = nodes.map((node) => {
      const serverNodeId = randomUUID();

      clientToServerId.set(node.id, serverNodeId);

      return {
        ...node,
        id: serverNodeId,
      };
    });
    const remappedEdges: NormalizedWorkflowEdge[] = edges.map((edge, index) => {
      const sourceNodeId = clientToServerId.get(edge.sourceNodeId);
      const targetNodeId = clientToServerId.get(edge.targetNodeId);

      if (!sourceNodeId || !targetNodeId) {
        throw new BadRequestException(
          `Workflow edge ${index} references an unknown client node id.`,
        );
      }

      return {
        ...edge,
        sourceNodeId,
        targetNodeId,
      };
    });

    return {
      nodes: remappedNodes,
      edges: remappedEdges,
    };
  }

  private normalizeWorkflowStatus(
    status: unknown,
    allowUndefined: true,
  ): WorkflowStatus | undefined;
  private normalizeWorkflowStatus(
    status: unknown,
    allowUndefined: false,
  ): WorkflowStatus;
  private normalizeWorkflowStatus(
    status: unknown,
    allowUndefined: boolean,
  ): WorkflowStatus | undefined {
    if (status === undefined && allowUndefined) {
      return undefined;
    }

    if (
      typeof status !== 'string' ||
      !Object.values(WorkflowStatus).includes(status as WorkflowStatus)
    ) {
      throw new BadRequestException('Workflow status is invalid.');
    }

    return status as WorkflowStatus;
  }

  private normalizeNodeKind(value: unknown, index: number): NodeKind {
    if (value !== 'trigger' && value !== 'action') {
      throw new BadRequestException(
        `Workflow node ${index} nodeKind must be "trigger" or "action".`,
      );
    }

    return value;
  }

  private normalizeRequiredString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`${fieldName} must be a non-empty string.`);
    }

    return value.trim();
  }

  private normalizeOptionalString(
    value: unknown,
    fieldName: string,
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} must be a string.`);
    }

    const normalizedValue = value.trim();

    if (normalizedValue.length === 0) {
      throw new BadRequestException(`${fieldName} must not be empty.`);
    }

    return normalizedValue;
  }

  private normalizeNumber(value: unknown, fieldName: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new BadRequestException(`${fieldName} must be a finite number.`);
    }

    return value;
  }

  private normalizeNonNegativeInteger(
    value: unknown,
    fieldName: string,
    defaultValue: number,
  ): number {
    if (value === undefined) {
      return defaultValue;
    }

    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value < 0
    ) {
      throw new BadRequestException(
        `${fieldName} must be a non-negative integer.`,
      );
    }

    return value;
  }

  private normalizeNullablePositiveInteger(
    value: unknown,
    fieldName: string,
  ): number | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value <= 0
    ) {
      throw new BadRequestException(`${fieldName} must be a positive integer.`);
    }

    return value;
  }

  private normalizeViewport(
    viewport: unknown,
  ): Prisma.InputJsonObject | typeof Prisma.JsonNull {
    if (viewport === undefined || viewport === null) {
      return Prisma.JsonNull;
    }

    return this.normalizeJsonObject(viewport, 'Workflow viewport');
  }

  private normalizeJsonObject(
    value: unknown,
    fieldName: string,
  ): Prisma.InputJsonObject {
    if (!isPlainObject(value)) {
      throw new BadRequestException(`${fieldName} must be an object.`);
    }

    const result: Record<string, Prisma.InputJsonValue | null> = {};

    for (const [key, entryValue] of Object.entries(value)) {
      result[key] = this.normalizeJsonValue(entryValue, `${fieldName}.${key}`);
    }

    return result as Prisma.InputJsonObject;
  }

  private normalizeJsonArray(
    value: unknown[],
    fieldName: string,
  ): Prisma.InputJsonArray {
    return value.map((entryValue, index) =>
      this.normalizeJsonValue(entryValue, `${fieldName}[${index}]`),
    );
  }

  private normalizeJsonValue(
    value: unknown,
    fieldName: string,
  ): Prisma.InputJsonValue | null {
    if (value === null) {
      return null;
    }

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

  private toWorkflowDto(workflow: WorkflowWithGraph): WorkflowDto {
    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status as WorkflowStatus,
      version: workflow.version,
      timezone: workflow.timezone,
      viewport:
        workflow.viewport === null
          ? null
          : (workflow.viewport as Record<string, unknown>),
      nodes: workflow.nodes.map((node) => ({
        id: node.id,
        positionX: node.positionX,
        positionY: node.positionY,
        nodeKind: node.nodeKind as NodeKind,
        nodeType: node.nodeType,
        label: node.label,
        config: node.config as Record<string, unknown>,
        connectionId: node.connectionId,
        retryCount: node.retryCount,
        retryBackoff: node.retryBackoff,
        timeoutMs: node.timeoutMs ?? undefined,
      })),
      edges: workflow.edges.map((edge) => ({
        id: edge.id,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      })),
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString(),
    };
  }
}
