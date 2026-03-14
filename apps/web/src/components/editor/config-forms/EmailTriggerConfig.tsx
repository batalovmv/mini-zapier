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

  return (
    <div className="space-y-4">
      <p className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-700">
        {messages.configForms.emailTrigger.info}
      </p>

      <label className="block">
        <span className="muted-label">{messages.configForms.emailTrigger.urlLabel}</span>
        <input
          className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          readOnly
          value={buildInboundEmailUrl(
            workflowId,
            messages.configForms.emailTrigger.saveWorkflowPlaceholder,
          )}
        />
      </label>
    </div>
  );
}
