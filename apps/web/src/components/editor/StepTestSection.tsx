import { ActionType } from '@mini-zapier/shared';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  getApiErrorMessage,
  isMissingApiRouteError,
} from '../../lib/api/client';
import { testStep } from '../../lib/api/executions';
import { computeChainOrder } from '../../lib/editor-chain';
import { useLocale } from '../../locale/LocaleProvider';
import { useWorkflowEditorStore } from '../../stores/workflow-editor.store';

const railSectionClass =
  'editor-inspector-panel editor-inspector-panel-secondary px-3.5 py-3';

interface StepTestSectionProps {
  workflowId: string | null;
  nodeId: string;
  nodeType: string;
  config: Record<string, unknown>;
  connectionId: string | null;
  requiresConnection: boolean;
}

export function StepTestSection({
  workflowId,
  nodeId,
  nodeType,
  config,
  connectionId,
  requiresConnection,
}: StepTestSectionProps) {
  const { messages } = useLocale();
  const t = messages.stepTest;

  const nodes = useWorkflowEditorStore((s) => s.nodes);
  const edges = useWorkflowEditorStore((s) => s.edges);
  const stepTestResults = useWorkflowEditorStore((s) => s.stepTestResults);
  const setStepTestResult = useWorkflowEditorStore((s) => s.setStepTestResult);

  const existingResult = stepTestResults[nodeId] ?? null;

  const previousStepOutput = useMemo(() => {
    const chain = computeChainOrder(nodes, edges);
    const myIndex = chain.indexOf(nodeId);

    if (myIndex <= 1) return undefined;

    const prevNodeId = chain[myIndex - 1];

    if (!prevNodeId) return undefined;

    const prevResult = stepTestResults[prevNodeId];

    if (prevResult?.status === 'SUCCESS' && prevResult.outputData !== undefined) {
      return prevResult.outputData;
    }

    return undefined;
  }, [nodes, edges, nodeId, stepTestResults]);

  const defaultInputText = useMemo(() => {
    if (previousStepOutput !== undefined) {
      return JSON.stringify(previousStepOutput, null, 2);
    }

    return '{}';
  }, [previousStepOutput]);

  const [inputText, setInputText] = useState(defaultInputText);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [inputExpanded, setInputExpanded] = useState(true);
  const [outputExpanded, setOutputExpanded] = useState(true);
  const [unsupportedMessage, setUnsupportedMessage] = useState<string | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const lastSyncedInputRef = useRef(defaultInputText);
  const previousResultRef = useRef(existingResult);
  const previousUnsupportedMessageRef = useRef<string | null>(null);
  const hasConnectionBlocker = requiresConnection && connectionId === null;

  useEffect(() => {
    if (running) {
      return;
    }

    const shouldResync = inputText === lastSyncedInputRef.current;

    if (shouldResync) {
      setInputText(defaultInputText);
      setJsonError(null);
    }

    lastSyncedInputRef.current = defaultInputText;
  }, [defaultInputText, inputText, running]);

  useEffect(() => {
    const hasNewResult =
      existingResult !== null && existingResult !== previousResultRef.current;
    const hasNewFailure =
      hasNewResult && existingResult?.status === 'FAILED';
    const hasNewUnsupportedMessage =
      unsupportedMessage !== null &&
      unsupportedMessage !== previousUnsupportedMessageRef.current;

    if (hasNewResult || hasNewFailure || hasNewUnsupportedMessage) {
      setOpen(true);
    }

    previousResultRef.current = existingResult;
    previousUnsupportedMessageRef.current = unsupportedMessage;
  }, [existingResult, unsupportedMessage]);

  const handleTest = useCallback(async () => {
    if (!workflowId || hasConnectionBlocker || unsupportedMessage !== null) {
      return;
    }

    let parsedInput: unknown;

    try {
      parsedInput = JSON.parse(inputText);
    } catch {
      setJsonError(t.invalidJson);
      return;
    }

    setJsonError(null);
    setUnsupportedMessage(null);
    setRunning(true);

    try {
      const result = await testStep(workflowId, {
        nodeType: nodeType as ActionType,
        config,
        connectionId,
        inputData: parsedInput,
      });

      setStepTestResult(nodeId, result);
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, {
        ...messages.errors,
        missingApiRoute: t.unsupported,
      });

      if (isMissingApiRouteError(error)) {
        setUnsupportedMessage(errorMessage);
        return;
      }

      setStepTestResult(nodeId, {
        status: 'FAILED',
        errorMessage,
        durationMs: 0,
      });
    } finally {
      setRunning(false);
    }
  }, [
    workflowId,
    hasConnectionBlocker,
    inputText,
    nodeType,
    config,
    connectionId,
    nodeId,
    setStepTestResult,
    t.invalidJson,
    t.unsupported,
    messages.errors,
  ]);

  const disabled =
    hasConnectionBlocker || !workflowId || unsupportedMessage !== null;
  const summaryText =
    unsupportedMessage !== null
      ? t.testButtonUnsupported
      : hasConnectionBlocker
        ? t.connectionRequiredSummary
        : !workflowId
          ? t.testButtonSaveFirst
          : existingResult
            ? existingResult.status === 'SUCCESS'
              ? t.lastResultSuccess
              : t.lastResultFailed
            : t.sectionDescription;
  const buttonTitle =
    unsupportedMessage !== null
      ? t.testButtonUnsupported
      : hasConnectionBlocker
        ? t.testButtonChooseConnectionFirst
        : !workflowId
          ? t.testButtonSaveFirst
          : undefined;

  return (
    <section className={railSectionClass}>
      <div className="editor-inspector-panel-head">
        <div className="editor-inspector-copy">
          <h3 className="text-sm font-semibold tracking-tight text-slate-900">
            {t.sectionEyebrow}
          </h3>
          <p className="editor-inspector-note">
            {summaryText}
          </p>
        </div>
        <button
          className="editor-inspector-toggle"
          aria-expanded={open}
          data-testid="step-test-toggle"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          {open ? t.closeSection : t.openSection}
        </button>
      </div>

      {!open ? null : (
        <div className="mt-3 space-y-3 border-t border-slate-900/8 pt-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="min-w-0">
                <p className="editor-inspector-eyebrow">
                  {t.inputDataLabel}
                </p>
                {previousStepOutput !== undefined ? (
                  <p className="editor-inspector-note">
                    {t.inputDataFromPrevious}
                  </p>
                ) : null}
              </div>
              <button
                className="editor-inspector-link"
                onClick={() => setInputExpanded((v) => !v)}
                type="button"
              >
                {inputExpanded ? t.collapseInput : t.expandInput}
              </button>
            </div>

            {inputExpanded ? (
              <div className="space-y-2">
                <textarea
                  className="min-h-[7rem] w-full rounded-xl border border-slate-900/10 bg-white px-3 py-2.5 font-mono text-xs text-slate-800 outline-none transition focus:border-amber-500"
                  onChange={(e) => {
                    setInputText(e.target.value);
                    setJsonError(null);
                  }}
                  placeholder={t.inputDataPlaceholder}
                  rows={5}
                  value={inputText}
                />

                {jsonError ? (
                  <p className="text-xs text-rose-600">{jsonError}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              className="rounded-full border border-slate-900/10 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled || running}
              onClick={() => void handleTest()}
              title={buttonTitle}
              type="button"
            >
              {running ? t.testRunning : t.testButton}
            </button>
          </div>

          {unsupportedMessage ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs leading-5 text-amber-700 break-words whitespace-pre-wrap">
              {unsupportedMessage}
            </div>
          ) : null}

          {existingResult ? (
            <div className="space-y-3 border-t border-slate-900/8 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    existingResult.status === 'SUCCESS'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {existingResult.status === 'SUCCESS'
                    ? t.successStatus
                    : t.failedStatus}
                </span>
                <span className="text-xs text-slate-400">
                  {t.duration(existingResult.durationMs)}
                </span>
              </div>

              {existingResult.errorMessage ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50/90 px-3 py-2 text-xs leading-5 text-rose-700 break-words whitespace-pre-wrap">
                  {existingResult.errorMessage}
                </div>
              ) : null}

              {existingResult.status === 'SUCCESS' &&
              existingResult.outputData !== undefined ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <p className="editor-inspector-eyebrow">
                      {t.outputDataLabel}
                    </p>
                    <button
                      className="editor-inspector-link"
                      onClick={() => setOutputExpanded((v) => !v)}
                      type="button"
                    >
                      {outputExpanded ? t.collapseOutput : t.expandOutput}
                    </button>
                  </div>

                  {outputExpanded ? (
                    <pre className="max-h-48 overflow-auto rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-mono text-[11px] text-slate-700 whitespace-pre-wrap break-words">
                      {JSON.stringify(existingResult.outputData, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ) : null}

              {existingResult.status === 'SUCCESS' &&
              existingResult.outputDataSchema &&
              existingResult.outputDataSchema.length > 0 ? (
                <p className="text-xs text-emerald-600">
                  {t.fieldsUpdated}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
