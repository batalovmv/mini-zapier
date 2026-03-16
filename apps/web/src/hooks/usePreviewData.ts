import { useCallback, useEffect, useMemo, useState } from 'react';

import { getExecution, listWorkflowExecutions } from '../lib/api/executions';
import {
  computeChainOrder,
  computeStructuralFingerprint,
} from '../lib/editor-chain';
import { useWorkflowEditorStore } from '../stores/workflow-editor.store';

export type PreviewEmptyReason =
  | 'no-data'
  | 'trigger-action'
  | 'version-mismatch'
  | 'structural-change';

export interface PreviewData {
  inputData: unknown | null;
  source: 'test-run' | 'execution' | null;
  reason: PreviewEmptyReason | null;
  loading: boolean;
}

const EMPTY: PreviewData = {
  inputData: null,
  source: null,
  reason: 'no-data',
  loading: false,
};

export function usePreviewData(enabled: boolean): PreviewData {
  const nodes = useWorkflowEditorStore((s) => s.nodes);
  const edges = useWorkflowEditorStore((s) => s.edges);
  const selectedNodeId = useWorkflowEditorStore((s) => s.selectedNodeId);
  const workflowId = useWorkflowEditorStore((s) => s.workflowId);
  const workflowVersion = useWorkflowEditorStore((s) => s.workflowVersion);
  const savedFingerprint = useWorkflowEditorStore(
    (s) => s.savedStructuralFingerprint,
  );
  const stepTestResults = useWorkflowEditorStore((s) => s.stepTestResults);

  const [executionData, setExecutionData] = useState<PreviewData | null>(null);
  const [fetchedForWorkflowId, setFetchedForWorkflowId] = useState<
    string | null
  >(null);

  const chain = useMemo(
    () => computeChainOrder(nodes, edges),
    [nodes, edges],
  );

  const myIndex = selectedNodeId ? chain.indexOf(selectedNodeId) : -1;
  // Position 0 = first action after trigger (chain[1])
  const isFirstAction = myIndex === 1;
  const prevNodeId = myIndex > 0 ? chain[myIndex - 1] : null;

  // Source 1: step test results (not available for pos 0 / first action after trigger)
  const testData = useMemo<PreviewData | null>(() => {
    if (isFirstAction || prevNodeId === null) return null;

    const prevResult = stepTestResults[prevNodeId];

    if (prevResult?.status === 'SUCCESS' && prevResult.outputData !== undefined) {
      return {
        inputData: prevResult.outputData,
        source: 'test-run',
        reason: null,
        loading: false,
      };
    }

    return null;
  }, [isFirstAction, prevNodeId, stepTestResults]);

  // Source 2: last execution (lazy fetch)
  const fetchExecution = useCallback(async () => {
    if (!workflowId) return;

    setExecutionData({ inputData: null, source: null, reason: null, loading: true });

    try {
      const list = await listWorkflowExecutions(workflowId, {
        status: 'SUCCESS',
        limit: 1,
      });

      const lastExec = list.items?.[0];

      if (!lastExec) {
        setExecutionData({
          inputData: null,
          source: null,
          reason: isFirstAction ? 'trigger-action' : 'no-data',
          loading: false,
        });
        return;
      }

      const detail = await getExecution(lastExec.id);

      // Version guard
      if (
        workflowVersion !== null &&
        detail.workflowVersion !== workflowVersion
      ) {
        setExecutionData({
          inputData: null,
          source: null,
          reason: 'version-mismatch',
          loading: false,
        });
        return;
      }

      // Structural fingerprint guard
      const currentFingerprint = computeStructuralFingerprint(nodes, edges);
      if (savedFingerprint !== null && currentFingerprint !== savedFingerprint) {
        setExecutionData({
          inputData: null,
          source: null,
          reason: 'structural-change',
          loading: false,
        });
        return;
      }

      // Position 0: use triggerData
      if (isFirstAction) {
        if (detail.triggerData !== undefined && detail.triggerData !== null) {
          setExecutionData({
            inputData: detail.triggerData,
            source: 'execution',
            reason: null,
            loading: false,
          });
        } else {
          setExecutionData({
            inputData: null,
            source: null,
            reason: 'trigger-action',
            loading: false,
          });
        }
        return;
      }

      // Position 1+: find matching step log
      if (prevNodeId && detail.stepLogs) {
        const prevLog = detail.stepLogs.find((s) => s.nodeId === prevNodeId);

        if (prevLog && prevLog.outputData !== undefined) {
          setExecutionData({
            inputData: prevLog.outputData,
            source: 'execution',
            reason: null,
            loading: false,
          });
          return;
        }
      }

      setExecutionData({
        inputData: null,
        source: null,
        reason: 'no-data',
        loading: false,
      });
    } catch {
      setExecutionData({
        inputData: null,
        source: null,
        reason: 'no-data',
        loading: false,
      });
    }
  }, [
    workflowId,
    workflowVersion,
    nodes,
    edges,
    savedFingerprint,
    isFirstAction,
    prevNodeId,
  ]);

  // Reset execution data when workflow changes
  useEffect(() => {
    if (workflowId !== fetchedForWorkflowId) {
      setExecutionData(null);
      setFetchedForWorkflowId(null);
    }
  }, [workflowId, fetchedForWorkflowId]);

  // Trigger fetch when enabled and no test data
  useEffect(() => {
    if (!enabled) return;
    if (testData !== null) return;
    if (executionData !== null) return;
    if (!workflowId) return;

    setFetchedForWorkflowId(workflowId);
    fetchExecution();
  }, [enabled, testData, executionData, workflowId, fetchExecution]);

  if (myIndex <= 0 || selectedNodeId === null) return EMPTY;
  if (testData !== null) return testData;
  if (executionData !== null) return executionData;

  if (!enabled) return EMPTY;

  return { inputData: null, source: null, reason: null, loading: true };
}
