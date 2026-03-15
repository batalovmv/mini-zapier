import { useLocale } from '../../../locale/LocaleProvider';
import type { ConfigUpdater } from '../ConfigPanel';
import { TemplatedField } from '../templated-input';

interface EmailActionConfigProps {
  config: Record<string, unknown>;
  onChange: ConfigUpdater;
}

export function EmailActionConfig({
  config,
  onChange,
}: EmailActionConfigProps) {
  const { messages } = useLocale();

  return (
    <div className="space-y-5">
      <TemplatedField
        config={config}
        configKey="to"
        label={messages.configForms.emailAction.to}
        onChange={onChange}
        placeholder={messages.configForms.emailAction.toPlaceholder}
      />

      <TemplatedField
        config={config}
        configKey="subject"
        label={messages.configForms.emailAction.subject}
        onChange={onChange}
        placeholder={messages.configForms.emailAction.subjectPlaceholder}
      />

      <TemplatedField
        config={config}
        configKey="body"
        label={messages.configForms.emailAction.body}
        multiline
        onChange={onChange}
        placeholder={messages.configForms.emailAction.bodyPlaceholder}
      />
    </div>
  );
}
