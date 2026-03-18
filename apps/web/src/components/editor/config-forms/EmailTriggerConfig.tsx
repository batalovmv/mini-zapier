import { useLocale } from '../../../locale/LocaleProvider';

interface EmailTriggerConfigProps {
  workflowId: string | null;
}

function buildInboundEmailUrl(
  workflowId: string | null,
  saveWorkflowPlaceholder: string,
): string {
  if (!workflowId) {
    return saveWorkflowPlaceholder;
  }

  return `${window.location.origin}/api/inbound-email/${workflowId}`;
}

export function EmailTriggerConfig({ workflowId }: EmailTriggerConfigProps) {
  const { messages } = useLocale();
  const t = messages.configForms.emailTrigger;
  const url = buildInboundEmailUrl(workflowId, t.saveWorkflowPlaceholder);
  const hasId = workflowId !== null;

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
            readOnly
            title={hasId ? url : undefined}
            value={url}
          />
        </label>
      </div>

      <div className="rounded-[1.15rem] border border-slate-900/10 bg-slate-50/70 px-4 py-3">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500">
          {t.helpEyebrow}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {t.providerInfo}
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {t.signatureInfo}
        </p>
      </div>
    </div>
  );
}
