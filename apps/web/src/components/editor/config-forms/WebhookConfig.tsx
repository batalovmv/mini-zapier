interface WebhookConfigProps {
  workflowId: string | null;
}

function buildWebhookUrl(workflowId: string | null): string {
  if (!workflowId) {
    return 'Save workflow to generate /api/webhooks/:workflowId';
  }

  return `${window.location.origin}/api/webhooks/${workflowId}`;
}

export function WebhookConfig({ workflowId }: WebhookConfigProps) {
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="muted-label">Webhook URL</span>
        <input
          className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          readOnly
          value={buildWebhookUrl(workflowId)}
        />
      </label>

      <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
        Incoming requests use this endpoint. If a WEBHOOK connection is attached,
        callers must also send the configured `X-Webhook-Secret`.
      </p>
    </div>
  );
}
