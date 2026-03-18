import { create } from 'zustand';

import { getDashboardSummary } from '../lib/api/stats';
import {
  DashboardRecentExecutionSummary,
  DashboardSummaryResponse,
  DashboardSummaryStats,
  DashboardWorkflowSummary,
} from '../lib/api/types';
import { deleteWorkflow as deleteWorkflowRequest } from '../lib/api/workflows';

interface DashboardStore {
  workflows: DashboardWorkflowSummary[];
  recentExecutions: DashboardRecentExecutionSummary[];
  stats: DashboardSummaryStats | null;
  loading: boolean;
  fetchDashboardSummary: () => Promise<DashboardSummaryResponse>;
  deleteWorkflow: (workflowId: string) => Promise<void>;
}

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
  recentExecutions: [],
  stats: null,
  loading: false,

  async fetchDashboardSummary() {
    return runWithLoading(set, async () => {
      const summary = await getDashboardSummary();

      set({
        workflows: summary.workflows,
        recentExecutions: summary.recentExecutions,
        stats: summary.stats,
      });

      return summary;
    });
  },

  async deleteWorkflow(workflowId: string) {
    await runWithLoading(set, async () => {
      await deleteWorkflowRequest(workflowId);

      set((state) => ({
        workflows: state.workflows.filter((workflow) => workflow.id !== workflowId),
        recentExecutions: state.recentExecutions.filter(
          (execution) => execution.workflowId !== workflowId,
        ),
      }));
    });
  },
}));
