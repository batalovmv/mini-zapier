import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import {
  ExecutionStatus,
  WorkflowExecutionDto,
  WorkflowStatus,
} from '@mini-zapier/shared';
import {
  ExecutionStatus as PrismaExecutionStatus,
  WorkflowStatus as PrismaWorkflowStatus,
} from '@prisma/client';

import type { AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

const DASHBOARD_WORKFLOW_LIMIT = 100;
const RECENT_EXECUTIONS_LIMIT = 10;

interface ExecutionSummaryRecord {
  id: string;
  workflowId: string;
  workflowVersion: number;
  status: PrismaExecutionStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}

class ExecutionSummaryDto implements WorkflowExecutionDto {
  @ApiProperty({ example: 'cm123execution' })
  id!: string;

  @ApiProperty({ example: 'cm123workflow' })
  workflowId!: string;

  @ApiProperty({ example: 3 })
  workflowVersion!: number;

  @ApiProperty({
    enum: ExecutionStatus,
    enumName: 'ExecutionStatus',
    example: ExecutionStatus.SUCCESS,
  })
  status!: ExecutionStatus;

  @ApiProperty({
    example: '2026-03-09T08:15:00.000Z',
    nullable: true,
    required: false,
  })
  startedAt?: string | null;

  @ApiProperty({
    example: '2026-03-09T08:15:02.000Z',
    nullable: true,
    required: false,
  })
  completedAt?: string | null;

  @ApiProperty({
    example: null,
    nullable: true,
    required: false,
  })
  errorMessage?: string | null;

  @ApiProperty({ example: '2026-03-09T08:15:00.000Z' })
  createdAt!: string;
}

class RecentExecutionStatsDto
  extends ExecutionSummaryDto
  implements WorkflowExecutionDto
{
  @ApiProperty({
    example: { orderId: '1001' },
    nullable: true,
    required: false,
  })
  triggerData?: unknown;
}

class StatsSummaryDto {
  @ApiProperty({ example: 12 })
  totalWorkflows!: number;

  @ApiProperty({ example: 7 })
  activeWorkflows!: number;

  @ApiProperty({ example: 2 })
  pausedWorkflows!: number;

  @ApiProperty({ example: 48 })
  totalExecutions!: number;

  @ApiProperty({ example: 36 })
  successfulExecutions!: number;

  @ApiProperty({ example: 8 })
  failedExecutions!: number;

  @ApiProperty({
    example: 81.82,
    description: 'SUCCESS / (SUCCESS + FAILED) * 100.',
  })
  successRate!: number;
}

class StatsResponseDto extends StatsSummaryDto {
  @ApiProperty({
    type: () => [RecentExecutionStatsDto],
  })
  recentExecutions!: RecentExecutionStatsDto[];
}

class DashboardRecentExecutionDto extends ExecutionSummaryDto {
  @ApiProperty({ example: 'Order sync webhook' })
  workflowName!: string;
}

class DashboardWorkflowSummaryDto {
  @ApiProperty({ example: 'cm123workflow' })
  id!: string;

  @ApiProperty({ example: 'Order sync webhook' })
  name!: string;

  @ApiProperty({
    example: 'Inbound orders to Telegram and CRM.',
    nullable: true,
    required: false,
  })
  description?: string | null;

  @ApiProperty({
    enum: WorkflowStatus,
    enumName: 'WorkflowStatus',
    example: WorkflowStatus.ACTIVE,
  })
  status!: WorkflowStatus;

  @ApiProperty({ example: 4 })
  version!: number;

  @ApiProperty({ example: 'Europe/Moscow' })
  timezone!: string;

  @ApiProperty({ example: 3 })
  nodeCount!: number;

  @ApiProperty({ example: '2026-03-09T08:15:00.000Z' })
  updatedAt!: string;

  @ApiProperty({
    type: () => ExecutionSummaryDto,
    nullable: true,
  })
  lastExecution!: ExecutionSummaryDto | null;
}

class DashboardSummaryResponseDto {
  @ApiProperty({
    type: () => StatsSummaryDto,
  })
  stats!: StatsSummaryDto;

  @ApiProperty({
    type: () => [DashboardWorkflowSummaryDto],
  })
  workflows!: DashboardWorkflowSummaryDto[];

  @ApiProperty({
    type: () => [DashboardRecentExecutionDto],
  })
  recentExecutions!: DashboardRecentExecutionDto[];
}

@ApiTags('stats')
@Controller('api/stats')
export class StatsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get compact dashboard summary' })
  @ApiOkResponse({
    description:
      'Dashboard stats, workflow summaries with last execution, and recent executions.',
    type: DashboardSummaryResponseDto,
  })
  async getDashboardSummary(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<DashboardSummaryResponseDto> {
    const workflowOwnerFilter = { userId: currentUser.id };
    const executionOwnerFilter = { workflow: { is: { userId: currentUser.id } } };

    const [
      totalWorkflows,
      activeWorkflows,
      pausedWorkflows,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      workflows,
      recentExecutions,
    ] = await this.prisma.$transaction([
      this.prisma.workflow.count({
        where: workflowOwnerFilter,
      }),
      this.prisma.workflow.count({
        where: {
          ...workflowOwnerFilter,
          status: PrismaWorkflowStatus.ACTIVE,
        },
      }),
      this.prisma.workflow.count({
        where: {
          ...workflowOwnerFilter,
          status: PrismaWorkflowStatus.PAUSED,
        },
      }),
      this.prisma.workflowExecution.count({
        where: executionOwnerFilter,
      }),
      this.prisma.workflowExecution.count({
        where: {
          ...executionOwnerFilter,
          status: PrismaExecutionStatus.SUCCESS,
        },
      }),
      this.prisma.workflowExecution.count({
        where: {
          ...executionOwnerFilter,
          status: PrismaExecutionStatus.FAILED,
        },
      }),
      this.prisma.workflow.findMany({
        where: workflowOwnerFilter,
        take: DASHBOARD_WORKFLOW_LIMIT,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          version: true,
          timezone: true,
          updatedAt: true,
          _count: {
            select: {
              nodes: true,
            },
          },
          executions: {
            take: 1,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            select: {
              id: true,
              workflowId: true,
              workflowVersion: true,
              status: true,
              startedAt: true,
              completedAt: true,
              errorMessage: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.workflowExecution.findMany({
        where: executionOwnerFilter,
        take: RECENT_EXECUTIONS_LIMIT,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          workflowId: true,
          workflowVersion: true,
          status: true,
          startedAt: true,
          completedAt: true,
          errorMessage: true,
          createdAt: true,
          workflow: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      stats: this.buildStatsSummary(
        totalWorkflows,
        activeWorkflows,
        pausedWorkflows,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
      ),
      workflows: workflows.map((workflow) => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        status: workflow.status as WorkflowStatus,
        version: workflow.version,
        timezone: workflow.timezone,
        nodeCount: workflow._count.nodes,
        updatedAt: workflow.updatedAt.toISOString(),
        lastExecution:
          workflow.executions[0] === undefined
            ? null
            : this.toExecutionSummary(workflow.executions[0]),
      })),
      recentExecutions: recentExecutions.map((execution) => ({
        ...this.toExecutionSummary(execution),
        workflowName: execution.workflow.name,
      })),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiOkResponse({
    description: 'Aggregated workflow and execution statistics.',
    type: StatsResponseDto,
  })
  async getStats(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<StatsResponseDto> {
    const workflowOwnerFilter = { userId: currentUser.id };
    const executionOwnerFilter = { workflow: { is: { userId: currentUser.id } } };

    const [
      totalWorkflows,
      activeWorkflows,
      pausedWorkflows,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      recentExecutions,
    ] = await this.prisma.$transaction([
      this.prisma.workflow.count({
        where: workflowOwnerFilter,
      }),
      this.prisma.workflow.count({
        where: {
          ...workflowOwnerFilter,
          status: PrismaWorkflowStatus.ACTIVE,
        },
      }),
      this.prisma.workflow.count({
        where: {
          ...workflowOwnerFilter,
          status: PrismaWorkflowStatus.PAUSED,
        },
      }),
      this.prisma.workflowExecution.count({
        where: executionOwnerFilter,
      }),
      this.prisma.workflowExecution.count({
        where: {
          ...executionOwnerFilter,
          status: PrismaExecutionStatus.SUCCESS,
        },
      }),
      this.prisma.workflowExecution.count({
        where: {
          ...executionOwnerFilter,
          status: PrismaExecutionStatus.FAILED,
        },
      }),
      this.prisma.workflowExecution.findMany({
        where: executionOwnerFilter,
        take: RECENT_EXECUTIONS_LIMIT,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    ]);

    return {
      ...this.buildStatsSummary(
        totalWorkflows,
        activeWorkflows,
        pausedWorkflows,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
      ),
      recentExecutions: recentExecutions.map((execution) => ({
        ...this.toExecutionSummary(execution),
        triggerData:
          execution.triggerData === null ? undefined : execution.triggerData,
      })),
    };
  }

  private buildStatsSummary(
    totalWorkflows: number,
    activeWorkflows: number,
    pausedWorkflows: number,
    totalExecutions: number,
    successfulExecutions: number,
    failedExecutions: number,
  ): StatsSummaryDto {
    const completedExecutions = successfulExecutions + failedExecutions;

    return {
      totalWorkflows,
      activeWorkflows,
      pausedWorkflows,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate:
        completedExecutions === 0
          ? 0
          : Number(
              ((successfulExecutions / completedExecutions) * 100).toFixed(2),
            ),
    };
  }

  private toExecutionSummary(
    execution: ExecutionSummaryRecord,
  ): ExecutionSummaryDto {
    return {
      id: execution.id,
      workflowId: execution.workflowId,
      workflowVersion: execution.workflowVersion,
      status: execution.status as ExecutionStatus,
      startedAt: execution.startedAt?.toISOString() ?? null,
      completedAt: execution.completedAt?.toISOString() ?? null,
      errorMessage: execution.errorMessage,
      createdAt: execution.createdAt.toISOString(),
    };
  }
}
