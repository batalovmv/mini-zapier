import type { ConnectionType } from '@mini-zapier/shared';
import { useEffect, useMemo, useState } from 'react';

import { useLocale } from '../../locale/LocaleProvider';
import { ModalShell } from '../ui/ModalShell';

interface ConnectionCreateDialogProps {
  connectionType: ConnectionType;
  pending: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    credentials: Record<string, string>;
  }) => void;
}

type CredentialEntry = {
  key: string;
  value: string;
};

const defaultCredentialKeys: Record<ConnectionType, string[]> = {
  SMTP: ['host', 'port', 'user', 'pass'],
  TELEGRAM: ['botToken'],
  POSTGRESQL: ['connectionString'],
  WEBHOOK: ['secret'],
};

function createDefaultEntries(connectionType: ConnectionType): CredentialEntry[] {
  return defaultCredentialKeys[connectionType].map((key) => ({
    key,
    value: '',
  }));
}

export function ConnectionCreateDialog({
  connectionType,
  pending,
  onClose,
  onSubmit,
}: ConnectionCreateDialogProps) {
  const { messages } = useLocale();
  const connectionTypeLabel = messages.common.connectionTypeLabels[connectionType];
  const [name, setName] = useState('');
  const [entries, setEntries] = useState<CredentialEntry[]>(
    createDefaultEntries(connectionType),
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setName('');
    setEntries(createDefaultEntries(connectionType));
    setFormError(null);
  }, [connectionType]);

  const hasCredentials = useMemo(
    () => entries.some((entry) => entry.key.trim().length > 0),
    [entries],
  );

  function updateEntry(
    index: number,
    key: keyof CredentialEntry,
    value: string,
  ): void {
    setEntries((currentEntries) =>
      currentEntries.map((entry, entryIndex) =>
        entryIndex === index
          ? {
              ...entry,
              [key]: value,
            }
          : entry,
      ),
    );
  }

  function removeEntry(index: number): void {
    setEntries((currentEntries) =>
      currentEntries.filter((_, entryIndex) => entryIndex !== index),
    );
  }

  function handleSubmit(): void {
    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      setFormError(messages.connectionCreateDialog.connectionNameRequired);
      return;
    }

    const credentials = Object.fromEntries(
      entries
        .map((entry) => [entry.key.trim(), entry.value] as const)
        .filter(([key]) => key.length > 0),
    );

    if (Object.keys(credentials).length === 0) {
      setFormError(messages.connectionCreateDialog.credentialsRequired);
      return;
    }

    setFormError(null);
    onSubmit({
      name: trimmedName,
      credentials,
    });
  }

  return (
    <ModalShell
      actions={
        <>
          <button
            className="rounded-full border border-slate-900/10 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50"
            data-testid="cancel-create-connection-button"
            onClick={onClose}
            type="button"
          >
            {messages.connectionCreateDialog.cancel}
          </button>
          <button
            className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="submit-create-connection-button"
            disabled={pending}
            onClick={handleSubmit}
            type="button"
          >
            {pending
              ? messages.connectionCreateDialog.creating
              : messages.connectionCreateDialog.createConnection}
          </button>
        </>
      }
      description={messages.connectionCreateDialog.description(connectionTypeLabel)}
      eyebrow={messages.connectionCreateDialog.eyebrow}
      onClose={pending ? () => undefined : onClose}
      title={messages.connectionCreateDialog.title(connectionTypeLabel)}
    >
      <div className="space-y-5">
        <label className="block">
          <span className="muted-label">{messages.connectionCreateDialog.connectionName}</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
            data-testid="connection-name-input"
            onChange={(event) => setName(event.target.value)}
            placeholder={messages.connectionCreateDialog.connectionPlaceholder(connectionTypeLabel)}
            type="text"
            value={name}
          />
        </label>

        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="muted-label">{messages.connectionCreateDialog.credentials}</span>
            <button
              className="rounded-full border border-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50"
              data-testid="add-connection-field-button"
              onClick={() =>
                setEntries((currentEntries) => [
                  ...currentEntries,
                  { key: '', value: '' },
                ])
              }
              type="button"
            >
              {messages.connectionCreateDialog.addField}
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {entries.map((entry, index) => (
              <div
                key={`${entry.key}-${index}`}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2"
              >
                <input
                  aria-label={messages.connectionCreateDialog.fieldKeyAriaLabel(index + 1)}
                  className="rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                  onChange={(event) => updateEntry(index, 'key', event.target.value)}
                  placeholder={messages.connectionCreateDialog.fieldPlaceholder}
                  type="text"
                  value={entry.key}
                />
                <input
                  aria-label={messages.connectionCreateDialog.fieldValueAriaLabel(index + 1)}
                  className="rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                  onChange={(event) =>
                    updateEntry(index, 'value', event.target.value)
                  }
                  placeholder={messages.connectionCreateDialog.valuePlaceholder}
                  type="text"
                  value={entry.value}
                />
                <button
                  className="rounded-2xl border border-slate-900/10 px-3 text-sm font-semibold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
                  disabled={entries.length === 1 && hasCredentials}
                  onClick={() => removeEntry(index)}
                  type="button"
                >
                  {messages.connectionCreateDialog.remove}
                </button>
              </div>
            ))}
          </div>
        </div>

        {formError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {formError}
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
