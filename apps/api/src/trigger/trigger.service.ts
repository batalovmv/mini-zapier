import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import { TriggerType, WorkflowStatus } from '@mini-zapier/shared';
import {
  Workflow as PrismaWorkflow,
  WorkflowEdge as PrismaWorkflowEdge,
  WorkflowNode as PrismaWorkflowNode,
} from '@prisma/client';

import { ExecutionService } from '../execution/execution.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CRON_TRIGGER_QUEUE_NAME,
  CronTriggerJobData,
  CronTriggerStrategy,
} from './strategies/cron.trigger';

declare const process: {
  env: Record<string, string | undefined>;
};

type WorkflowWithGraph = PrismaWorkflow & {
  nodes: PrismaWorkflowNode[];
  edges: PrismaWorkflowEdge[];
};

@Injectable()
export class TriggerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TriggerService.name);
  private cronWorker?: Worker<CronTriggerJobData>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly executionService: ExecutionService,
    private readonly cronTriggerStrategy: CronTriggerStrategy,
  ) {}

  async onModuleInit(): Promise<void> {
    this.cronWorker = new Worker<CronTriggerJobData>(
      CRON_TRIGGER_QUEUE_NAME,
      async (job) => {
        await this.handleCronJob(job);
      },
      {
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: this.parseRedisPort(process.env.REDIS_PORT),
        },
      },
    );

    this.cronWorker.on('failed', (job, error) => {
      this.logger.error(
        `Cron job "${job?.id ?? 'unknown'}" failed: ${error.message}`,
      );
    });

    await this.cronWorker.waitUntilReady();
    await this.reconcileCronTriggers();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.cronWorker) {
      await this.cronWorker.close();
    }
  }

  async handleWorkflowStatusChanged(
    previousWorkflow: WorkflowWithGraph,
    updatedWorkflow: WorkflowWithGraph,
  ): Promise<void> {
    const wasActiveCronWorkflow = this.isActiveCronWorkflow(previousWorkflow);
    const isActiveCronWorkflow = this.isActiveCronWorkflow(updatedWorkflow);

    if (!wasActiveCronWorkflow && !isActiveCronWorkflow) {
      return;
    }

    if (wasActiveCronWorkflow && !isActiveCronWorkflow) {
      await this.cronTriggerStrategy.unregister(updatedWorkflow.id);
      return;
    }

    if (!wasActiveCronWorkflow && isActiveCronWorkflow) {
      await this.registerCronWorkflow(updatedWorkflow);
    }
  }

  async handleWorkflowDefinitionUpdated(
    previousWorkflow: WorkflowWithGraph,
    updatedWorkflow: WorkflowWithGraph,
  ): Promise<void> {
    const wasActiveCronWorkflow = this.isActiveCronWorkflow(previousWorkflow);
    const isActiveCronWorkflow = this.isActiveCronWorkflow(updatedWorkflow);

    if (!wasActiveCronWorkflow && !isActiveCronWorkflow) {
      return;
    }

    if (wasActiveCronWorkflow) {
      await this.cronTriggerStrategy.unregister(updatedWorkflow.id);
    }

    if (isActiveCronWorkflow) {
      await this.registerCronWorkflow(updatedWorkflow);
    }
  }

  private async reconcileCronTriggers(): Promise<void> {
    const activeCronWorkflows = await this.prisma.workflow.findMany({
      where: {
        status: WorkflowStatus.ACTIVE,
        nodes: {
          some: {
            nodeKind: 'trigger',
            nodeType: TriggerType.CRON,
          },
        },
      },
      include: {
        nodes: true,
        edges: true,
      },
    });

    for (const workflow of activeCronWorkflows) {
      try {
        await this.registerCronWorkflow(workflow);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown reconciliation error.';

        this.logger.error(
          `Failed to reconcile cron workflow "${workflow.id}": ${message}`,
        );
      }
    }

    this.logger.log(
      `Cron reconciliation completed for ${activeCronWorkflows.length} active workflow(s).`,
    );
  }

  private async handleCronJob(job: Job<CronTriggerJobData>): Promise<void> {
    const workflow = await this.prisma.workflow.findUnique({
      where: {
        id: job.data.workflowId,
      },
      include: {
        nodes: true,
        edges: true,
      },
    });

    if (!workflow) {
      this.logger.warn(
        `Skipping cron job for missing workflow "${job.data.workflowId}".`,
      );
      return;
    }

    if (!this.isActiveCronWorkflow(workflow)) {
      this.logger.warn(
        `Skipping cron job for workflow "${workflow.id}" because it is no longer ACTIVE with a CRON trigger.`,
      );
      return;
    }

    const scheduledAt = this.getScheduledAt(job);
    const idempotencyKey = `${job.data.cronExpression}:${scheduledAt}`;

    const result = await this.executionService.startExecution(
      workflow.id,
      { scheduledAt },
      TriggerType.CRON,
      idempotencyKey,
    );

    if (result.duplicate) {
      this.logger.debug(
        `Cron job for workflow "${workflow.id}" was deduplicated with key "${idempotencyKey}".`,
      );
    }
  }

  private async registerCronWorkflow(workflow: WorkflowWithGraph): Promise<void> {
    const triggerNode = this.getCronTriggerNode(workflow);

    if (!triggerNode) {
      return;
    }

    await this.cronTriggerStrategy.register(workflow, triggerNode);
  }

  private isActiveCronWorkflow(workflow: WorkflowWithGraph): boolean {
    return (
      workflow.status === WorkflowStatus.ACTIVE &&
      this.getCronTriggerNode(workflow) !== undefined
    );
  }

  private getCronTriggerNode(
    workflow: WorkflowWithGraph,
  ): PrismaWorkflowNode | undefined {
    return workflow.nodes.find(
      (node) =>
        node.nodeKind === 'trigger' && node.nodeType === TriggerType.CRON,
    );
  }

  private getScheduledAt(job: Job<CronTriggerJobData>): string {
    const scheduledAtMillis =
      typeof job.opts.prevMillis === 'number' ? job.opts.prevMillis : job.timestamp;

    return new Date(scheduledAtMillis).toISOString();
  }

  private parseRedisPort(value: string | undefined): number {
    if (value === undefined) {
      return 6380;
    }

    const parsedValue = Number.parseInt(value, 10);

    if (Number.isNaN(parsedValue) || parsedValue <= 0) {
      return 6380;
    }

    return parsedValue;
  }
}
