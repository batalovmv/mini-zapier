import { useEffect, useMemo, useRef, useState } from 'react';

import { getApiErrorMessage } from '../lib/api/client';
import { getExecution, listWorkflowExecutions } from '../lib/api/executions';
import {
  computeChainOrder,
  computeStructuralFingerprint,
} from '../lib/editor-chain';
import { useLocale } from '../locale/LocaleProvider';
import { useWorkflowEditorStore } from '../stores/workflow-editor.store';

export type PreviewEmptyReason =
  | 'no-data'
  | 'trigger-action'
  | 'version-mismatch'
  | 'structural-change'
  | 'load-error';

export interface PreviewData {
  inputData: unknown | null;
  source: 'test-run' | 'execution' | null;
  reason: PreviewEmptyReason | null;
  errorMessage: string | null;
  loading: boolean;
}

const EMPTY: PreviewData = {
  inputData: null,
  source: null,
  reason: 'no-data',
  errorMessage: null,
  loading: false,
};

export function usePreviewData(enabled: boolean): PreviewData {
  const { messages } = useLocale();
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
  const executionDataRef = useRef<PreviewData | null>(null);
  const executionContextRef = useRef<string | null>(null);

  const chain = useMemo(
    () => computeChainOrder(nodes, edges),
    [nodes, edges],
  );
  const currentFingerprint = useMemo(
    () => computeStructuralFingerprint(nodes, edges),
    [nodes, edges],
  );

  const myIndex = selectedNodeId ? chain.indexOf(selectedNodeId) : -1;
  // Position 0 = first action after trigger (chain[1])
  const isFirstAction = myIndex === 1;
  const prevNodeId = myIndex > 0 ? chain[myIndex - 1] : null;
  const previewContextKey = [
    workflowId ?? 'workflow:none',
    selectedNodeId ?? 'node:none',
    String(workflowVersion ?? 'version:none'),
    savedFingerprint ?? 'saved:none',
    currentFingerprint,
    prevNodeId ?? 'prev:none',
    isFirstAction ? 'first:yes' : 'first:no',
  ].join('|');

  // Source 1: step test results (not available for pos 0 / first action after trigger)
  const testData = useMemo<PreviewData | null>(() => {
    if (isFirstAction || prevNodeId === null) return null;

    const prevResult = stepTestResults[prevNodeId];

    if (prevResult?.status === 'SUCCESS' && prevResult.outputData !== undefined) {
      return {
        inputData: prevResult.outputData,
        source: 'test-run',
        reason: null,
        errorMessage: null,
        loading: false,
      };
    }

    return null;
  }, [isFirstAction, prevNodeId, stepTestResults]);

  useEffect(() => {
    executionDataRef.current = executionData;
  }, [executionData]);

  useEffect(() => {
    if (executionContextRef.current === previewContextKey) {
      return;
    }

    executionContextRef.current = previewContextKey;
    executionDataRef.current = null;
    setExecutionData(null);
  }, [previewContextKey]);

  useEffect(() => {
    if (!enabled || !workflowId || selectedNodeId === null || myIndex <= 0) {
      return;
    }

    if (testData !== null) {
      return;
    }

    let cancelled = false;
    let requestInFlight = false;
    const shouldShowLoading = executionDataRef.current === null;

    if (shouldShowLoading) {
      setExecutionData({
        inputData: null,
        source: null,
        reason: null,
        errorMessage: null,
        loading: true,
      });
    }

    const loadExecutionPreview = async () => {
      if (requestInFlight) {
        return;
      }

      requestInFlight = true;

      try {
        const list = await listWorkflowExecutions(workflowId, {
          status: 'SUCCESS',
          limit: 1,
        });

        if (cancelled) {
          return;
        }

        const lastExec = list.items?.[0];

        if (!lastExec) {
          setExecutionData({
            inputData: null,
            source: null,
            reason: isFirstAction ? 'trigger-action' : 'no-data',
            errorMessage: null,
            loading: false,
          });
          return;
        }

        const detail = await getExecution(lastExec.id);

        if (cancelled) {
          return;
        }

        if (
          workflowVersion !== null &&
          detail.workflowVersion !== workflowVersion
        ) {
          setExecutionData({
            inputData: null,
            source: null,
            reason: 'version-mismatch',
            errorMessage: null,
            loading: false,
          });
          return;
        }

        if (
          savedFingerprint !== null &&
          currentFingerprint !== savedFingerprint
        ) {
          setExecutionData({
            inputData: null,
            source: null,
            reason: 'structural-change',
            errorMessage: null,
            loading: false,
          });
          return;
        }

        if (isFirstAction) {
          if (detail.triggerData !== undefined && detail.triggerData !== null) {
            setExecutionData({
              inputData: detail.triggerData,
              source: 'execution',
              reason: null,
              errorMessage: null,
              loading: false,
            });
          } else {
            setExecutionData({
              inputData: null,
              source: null,
              reason: 'trigger-action',
              errorMessage: null,
              loading: false,
            });
          }

          return;
        }

        if (prevNodeId && detail.stepLogs) {
          const prevLog = detail.stepLogs.find((step) => step.nodeId === prevNodeId);

          if (prevLog && prevLog.outputData !== undefined) {
            setExecutionData({
              inputData: prevLog.outputData,
              source: 'execution',
              reason: null,
              errorMessage: null,
              loading: false,
            });
            return;
          }
        }

        setExecutionData({
          inputData: null,
          source: null,
          reason: 'no-data',
          errorMessage: null,
          loading: false,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setExecutionData({
          inputData: null,
          source: null,
          reason: 'load-error',
          errorMessage: getApiErrorMessage(error, messages.errors),
          loading: false,
        });
      } finally {
        requestInFlight = false;
      }
    };

    void loadExecutionPreview();

    const intervalId = window.setInterval(() => {
      void loadExecutionPreview();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    enabled,
    testData,
    workflowId,
    selectedNodeId,
    myIndex,
    isFirstAction,
    prevNodeId,
    workflowVersion,
    savedFingerprint,
    currentFingerprint,
    previewContextKey,
    messages.errors,
  ]);

  if (myIndex <= 0 || selectedNodeId === null) return EMPTY;
  if (testData !== null) return testData;
  if (executionData !== null) return executionData;

  if (!enabled) return EMPTY;

  return {
    inputData: null,
    source: null,
    reason: null,
    errorMessage: null,
    loading: true,
  };
}
