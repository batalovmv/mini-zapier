import toast from 'react-hot-toast';

import { useLocale } from '../../../locale/LocaleProvider';

interface WebhookConfigProps {
  workflowId: string | null;
}

function buildWebhookUrl(workflowId: string): string {
  return `${window.location.origin}/api/webhooks/${workflowId}`;
}

function buildCurlCommand(url: string): string {
  return `curl -X POST ${url} -H "Content-Type: application/json" -H "X-Webhook-Secret: <your-secret>" -d '{"key": "value"}'`;
}

export function WebhookConfig({ workflowId }: WebhookConfigProps) {
  const { messages } = useLocale();
  const t = messages.configForms.webhook;
  const hasId = workflowId !== null;
  const url = hasId ? buildWebhookUrl(workflowId) : '';

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t.copied);
    } catch {
      toast.error(t.copyFailed);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-[1.25rem] border border-slate-900/10 bg-white px-4 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500">
            {t.mainEyebrow}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {t.mainDescription}
          </p>
        </div>

        <label className="block">
          <span className="muted-label">{t.urlLabel}</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700"
            data-testid="webhook-url-input"
            readOnly
            title={hasId ? url : undefined}
            value={hasId ? url : t.saveWorkflowPlaceholder}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-amber-500/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!hasId}
            onClick={() => copyToClipboard(url)}
            type="button"
          >
            {t.copyUrl}
          </button>
          <button
            className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-amber-500/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!hasId}
            onClick={() => copyToClipboard(buildCurlCommand(url))}
            type="button"
          >
            {t.copyCurl}
          </button>
        </div>
      </div>

      <div className="rounded-[1.15rem] border border-slate-900/10 bg-slate-50/70 px-4 py-3">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500">
          {t.helpEyebrow}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {t.info}
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {t.dedupe}
        </p>
      </div>
    </div>
  );
}
