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
  const hasId = workflowId !== null;
  const url = hasId ? buildWebhookUrl(workflowId) : '';

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(messages.configForms.webhook.copied);
    } catch {
      toast.error(messages.configForms.webhook.copyFailed);
    }
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="muted-label">{messages.configForms.webhook.urlLabel}</span>
        <input
          className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700"
          data-testid="webhook-url-input"
          readOnly
          title={hasId ? url : undefined}
          value={hasId ? url : messages.configForms.webhook.saveWorkflowPlaceholder}
        />
      </label>

      <div className="flex gap-2">
        <button
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!hasId}
          onClick={() => copyToClipboard(url)}
          type="button"
        >
          {messages.configForms.webhook.copyUrl}
        </button>
        <button
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!hasId}
          onClick={() => copyToClipboard(buildCurlCommand(url))}
          type="button"
        >
          {messages.configForms.webhook.copyCurl}
        </button>
      </div>

      <div className="space-y-2">
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
          {messages.configForms.webhook.info}
        </p>
        <p className="px-4 text-xs leading-5 text-slate-400">
          {messages.configForms.webhook.dedupe}
        </p>
      </div>
    </div>
  );
}
