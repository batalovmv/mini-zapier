import { ActionType, type StepTestResponse } from '@mini-zapier/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getApiErrorMessage } from '../../lib/api/client';
import { testStep } from '../../lib/api/executions';
import { computeChainOrder } from '../../lib/editor-chain';
import { useLocale } from '../../locale/LocaleProvider';
import { useWorkflowEditorStore } from '../../stores/workflow-editor.store';

const railSectionClass =
  'rounded-[1.55rem] border border-slate-900/10 bg-white/88 px-4 py-4 shadow-[0_18px_34px_-30px_rgba(15,23,42,0.24)]';

interface StepTestSectionProps {
  workflowId: string | null;
  nodeId: string;
  nodeType: string;
  config: Record<string, unknown>;
  connectionId: string | null;
}

export function StepTestSection({
  workflowId,
  nodeId,
  nodeType,
  config,
  connectionId,
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
  const lastSyncedInputRef = useRef(defaultInputText);

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

  const handleTest = useCallback(async () => {
    if (!workflowId) return;

    let parsedInput: unknown;

    try {
      parsedInput = JSON.parse(inputText);
    } catch {
      setJsonError(t.invalidJson);
      return;
    }

    setJsonError(null);
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
      const errorMessage = getApiErrorMessage(error, messages.errors);

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
    inputText,
    nodeType,
    config,
    connectionId,
    nodeId,
    setStepTestResult,
    t.invalidJson,
    messages.errors,
  ]);

  const disabled = !workflowId;

  return (
    <section className={railSectionClass}>
      <p className="muted-label">{t.sectionEyebrow}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {t.sectionDescription}
      </p>

      {/* Input data */}
      <div className="mt-3">
        <button
          className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
          onClick={() => setInputExpanded((v) => !v)}
          type="button"
        >
          {inputExpanded ? t.collapseInput : t.expandInput}
        </button>

        {inputExpanded ? (
          <div className="mt-2">
            <label className="block">
              <span className="text-xs font-medium text-slate-600">
                {t.inputDataLabel}
              </span>
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-mono text-xs text-slate-800 outline-none transition focus:border-amber-500"
                onChange={(e) => {
                  setInputText(e.target.value);
                  setJsonError(null);
                }}
                placeholder={t.inputDataPlaceholder}
                rows={5}
                value={inputText}
              />
            </label>

            {previousStepOutput !== undefined ? (
              <p className="mt-1 text-[11px] text-slate-400">
                {t.inputDataFromPrevious}
              </p>
            ) : null}

            {jsonError ? (
              <p className="mt-1 text-xs text-rose-600">{jsonError}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Test button */}
      <div className="mt-3">
        <button
          className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 shadow-sm transition hover:border-amber-500/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled || running}
          onClick={() => void handleTest()}
          title={disabled ? t.testButtonSaveFirst : undefined}
          type="button"
        >
          {running ? t.testRunning : t.testButton}
        </button>
      </div>

      {/* Results */}
      {existingResult ? (
        <div className="mt-4 border-t border-slate-900/8 pt-3">
          <div className="flex items-center gap-2">
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
            <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50/90 px-3 py-2 text-xs text-rose-700">
              {existingResult.errorMessage}
            </div>
          ) : null}

          {existingResult.status === 'SUCCESS' &&
          existingResult.outputData !== undefined ? (
            <div className="mt-2">
              <button
                className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
                onClick={() => setOutputExpanded((v) => !v)}
                type="button"
              >
                {outputExpanded ? t.collapseOutput : t.expandOutput}
              </button>

              {outputExpanded ? (
                <pre className="mt-1 max-h-48 overflow-auto rounded-xl border border-slate-900/10 bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-700">
                  {JSON.stringify(existingResult.outputData, null, 2)}
                </pre>
              ) : null}
            </div>
          ) : null}

          {existingResult.status === 'SUCCESS' &&
          existingResult.outputDataSchema &&
          existingResult.outputDataSchema.length > 0 ? (
            <p className="mt-2 text-xs text-emerald-600">{t.fieldsUpdated}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
