import { useState } from 'react';

import { useLocale } from '../../../locale/LocaleProvider';
import type { ConfigUpdater } from '../ConfigPanel';
import { RawJsonFallback } from './RawJsonFallback';
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
  const t = messages.configForms.emailAction;
  const [showJson, setShowJson] = useState(false);

  return (
    <div className="space-y-5">
      <TemplatedField
        config={config}
        configKey="to"
        label={t.to}
        onChange={onChange}
        placeholder={t.toPlaceholder}
      />

      <TemplatedField
        config={config}
        configKey="subject"
        label={t.subject}
        onChange={onChange}
        placeholder={t.subjectPlaceholder}
      />

      <TemplatedField
        config={config}
        configKey="body"
        label={t.body}
        multiline
        onChange={onChange}
        placeholder={t.bodyPlaceholder}
      />

      <RawJsonFallback
        config={config}
        onChange={onChange}
        open={showJson}
        onToggle={() => setShowJson((v) => !v)}
        showLabel={t.showJson}
        hideLabel={t.hideJson}
      />
    </div>
  );
}
