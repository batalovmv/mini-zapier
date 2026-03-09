import { WorkflowDto } from '@mini-zapier/shared';
import { create } from 'zustand';

import { getStats } from '../lib/api/stats';
import { StatsResponse } from '../lib/api/types';
import {
  deleteWorkflow as deleteWorkflowRequest,
  listWorkflows,
} from '../lib/api/workflows';

interface DashboardStore {
  workflows: WorkflowDto[];
  stats: StatsResponse | null;
  loading: boolean;
  fetchWorkflows: () => Promise<WorkflowDto[]>;
  fetchStats: () => Promise<StatsResponse>;
  deleteWorkflow: (workflowId: string) => Promise<void>;
}

const WORKFLOW_PAGE_SIZE = 100;

let pendingRequests = 0;

async function runWithLoading<T>(
  set: (partial: Partial<DashboardStore> | ((state: DashboardStore) => Partial<DashboardStore>)) => void,
  operation: () => Promise<T>,
): Promise<T> {
  pendingRequests += 1;
  set({ loading: true });

  try {
    return await operation();
  } finally {
    pendingRequests = Math.max(0, pendingRequests - 1);
    set({ loading: pendingRequests > 0 });
  }
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  workflows: [],
  stats: null,
  loading: false,

  async fetchWorkflows() {
    return runWithLoading(set, async () => {
      const response = await listWorkflows({
        page: 1,
        limit: WORKFLOW_PAGE_SIZE,
      });

      set({ workflows: response.items });

      return response.items;
    });
  },

  async fetchStats() {
    return runWithLoading(set, async () => {
      const stats = await getStats();

      set({ stats });

      return stats;
    });
  },

  async deleteWorkflow(workflowId: string) {
    await runWithLoading(set, async () => {
      await deleteWorkflowRequest(workflowId);

      set((state) => ({
        workflows: state.workflows.filter((workflow) => workflow.id !== workflowId),
      }));
    });
  },
}));
