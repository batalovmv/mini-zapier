interface EmailTriggerConfigProps {
  workflowId: string | null;
}

function buildInboundEmailUrl(workflowId: string | null): string {
  if (!workflowId) {
    return 'Save workflow to generate /api/inbound-email/:workflowId';
  }

  return `${window.location.origin}/api/inbound-email/${workflowId}`;
}

export function EmailTriggerConfig({ workflowId }: EmailTriggerConfigProps) {
  return (
    <div className="space-y-4">
      <p className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-700">
        Configure your inbound email provider to POST raw email data to the
        endpoint below. The selected WEBHOOK connection supplies the signing
        secret used by `/api/inbound-email/:workflowId`.
      </p>

      <label className="block">
        <span className="muted-label">Inbound email URL</span>
        <input
          className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          readOnly
          value={buildInboundEmailUrl(workflowId)}
        />
      </label>
    </div>
  );
}
