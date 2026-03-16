import type { ConnectionDto } from '@mini-zapier/shared';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useLocale } from '../../locale/LocaleProvider';
import { ModalShell } from '../ui/ModalShell';

type ConnectionTypeValue = ConnectionDto['type'];

interface ConnectionFormDialogProps {
  mode: 'create' | 'edit';
  initialType?: ConnectionTypeValue;
  fixedType?: ConnectionTypeValue;
  connection?: ConnectionDto | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    type: ConnectionTypeValue;
    credentials?: Record<string, string>;
  }) => void;
  testIds?: {
    cancelButton?: string;
    submitButton?: string;
    nameInput?: string;
    addFieldButton?: string;
  };
}

type CredentialEntry = {
  key: string;
  value: string;
};

const CONNECTION_TYPE_OPTIONS = [
  'WEBHOOK' as ConnectionTypeValue,
  'SMTP' as ConnectionTypeValue,
  'TELEGRAM' as ConnectionTypeValue,
  'POSTGRESQL' as ConnectionTypeValue,
];
const DEFAULT_CONNECTION_TYPE = 'WEBHOOK' as ConnectionTypeValue;
const defaultCredentialKeys: Record<ConnectionTypeValue, string[]> = {
  WEBHOOK: ['secret'],
  SMTP: ['host', 'port', 'user', 'pass'],
  TELEGRAM: ['botToken'],
  POSTGRESQL: ['connectionString'],
};

function createDefaultEntries(
  connectionType: ConnectionTypeValue,
  connection?: ConnectionDto | null,
): CredentialEntry[] {
  const keys = connection
    ? Object.keys(connection.credentials)
    : defaultCredentialKeys[connectionType];

  return (keys.length > 0 ? keys : ['']).map((key) => ({
    key,
    value: '',
  }));
}

function normalizeEntries(entries: CredentialEntry[]): CredentialEntry[] {
  return entries
    .map((entry) => ({
      key: entry.key.trim(),
      value: entry.value.trim(),
    }))
    .filter((entry) => entry.key.length > 0);
}

function haveSameKeys(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function ConnectionFormDialog({
  mode,
  initialType = DEFAULT_CONNECTION_TYPE,
  fixedType,
  connection,
  pending,
  onClose,
  onSubmit,
  testIds,
}: ConnectionFormDialogProps) {
  const { messages } = useLocale();
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const connectionTypeLabels =
    messages.common.connectionTypeLabels as Record<ConnectionTypeValue, string>;
  const editingConnection = mode === 'edit' ? connection ?? null : null;
  const resolvedInitialType = editingConnection?.type ?? fixedType ?? initialType;
  const [type, setType] = useState<ConnectionTypeValue>(
    resolvedInitialType,
  );
  const [name, setName] = useState(editingConnection?.name ?? '');
  const [entries, setEntries] = useState<CredentialEntry[]>(
    createDefaultEntries(resolvedInitialType, editingConnection),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const typeSelectionLocked = mode === 'create' && fixedType !== undefined;
  const handleClose = pending ? () => undefined : onClose;

  useEffect(() => {
    const nextType = editingConnection?.type ?? fixedType ?? initialType;
    setType(nextType);
    setName(editingConnection?.name ?? '');
    setEntries(createDefaultEntries(nextType, editingConnection));
    setFormError(null);
  }, [editingConnection, fixedType, initialType]);

  useEffect(() => {
    if (mode !== 'create') {
      return;
    }

    setEntries(createDefaultEntries(type));
    setFormError(null);
  }, [mode, type]);

  const typeLabel = connectionTypeLabels[type];
  const suggestedKeys = useMemo(() => defaultCredentialKeys[type], [type]);
  const initialKeys = editingConnection ? Object.keys(editingConnection.credentials) : [];
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

    const normalizedEntries = normalizeEntries(entries);

    if (mode === 'create') {
      if (normalizedEntries.length === 0) {
        setFormError(messages.connectionCreateDialog.credentialsRequired);
        return;
      }

      if (normalizedEntries.some((entry) => entry.value.length === 0)) {
        setFormError(messages.connectionsPage.replaceCredentialsError);
        return;
      }

      setFormError(null);
      onSubmit({
        name: trimmedName,
        type,
        credentials: Object.fromEntries(
          normalizedEntries.map((entry) => [entry.key, entry.value]),
        ),
      });
      return;
    }

    const nextKeys = normalizedEntries.map((entry) => entry.key);
    const hasCredentialValues = normalizedEntries.some(
      (entry) => entry.value.length > 0,
    );
    const hasStructuralCredentialChange = !haveSameKeys(initialKeys, nextKeys);

    if (!hasCredentialValues && !hasStructuralCredentialChange) {
      setFormError(null);
      onSubmit({
        name: trimmedName,
        type,
      });
      return;
    }

    if (normalizedEntries.length === 0) {
      setFormError(messages.connectionCreateDialog.credentialsRequired);
      return;
    }

    if (normalizedEntries.some((entry) => entry.value.length === 0)) {
      setFormError(messages.connectionsPage.replaceCredentialsError);
      return;
    }

    setFormError(null);
    onSubmit({
      name: trimmedName,
      type,
      credentials: Object.fromEntries(
        normalizedEntries.map((entry) => [entry.key, entry.value]),
      ),
    });
  }

  return (
    <ModalShell
      actions={
        <>
          <button
            className="rounded-full border border-slate-900/10 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50"
            data-testid={testIds?.cancelButton}
            disabled={pending}
            onClick={handleClose}
            type="button"
          >
            {messages.connectionCreateDialog.cancel}
          </button>
          <button
            className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid={testIds?.submitButton}
            disabled={pending}
            onClick={handleSubmit}
            type="button"
          >
            {pending
              ? mode === 'create'
                ? messages.connectionCreateDialog.creating
                : messages.connectionsPage.updatingConnection
              : mode === 'create'
                ? messages.connectionCreateDialog.createConnection
                : messages.connectionsPage.updateConnection}
          </button>
        </>
      }
      description={
        mode === 'create'
          ? messages.connectionsPage.createDialogDescription(typeLabel)
          : messages.connectionsPage.editDialogDescription(typeLabel)
      }
      dismissable={!pending}
      eyebrow={messages.connectionsPage.dialogEyebrow}
      initialFocusRef={nameInputRef}
      onClose={handleClose}
      title={
        mode === 'create'
          ? messages.connectionsPage.createDialogTitle(typeLabel)
          : messages.connectionsPage.editDialogTitle(editingConnection?.name ?? typeLabel)
      }
    >
      <div className="space-y-5">
        {mode === 'create' ? (
          typeSelectionLocked ? null : (
            <label className="block">
              <span className="muted-label">{messages.connectionsPage.selectType}</span>
              <select
                className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                disabled={pending}
                onChange={(event) => setType(event.target.value as ConnectionTypeValue)}
                value={type}
              >
                {CONNECTION_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {connectionTypeLabels[option]}
                  </option>
                ))}
              </select>
            </label>
          )
        ) : (
          <div className="app-subpanel-muted px-4 py-4">
            <span className="muted-label">{messages.connectionsPage.selectType}</span>
            <div className="mt-2 flex items-center gap-2.5">
              <span className="app-chip">{typeLabel}</span>
              <span className="text-xs leading-5 text-slate-500">
                {messages.connectionsPage.keepCredentialsHint}
              </span>
            </div>
          </div>
        )}

        <label className="block">
          <span className="muted-label">{messages.connectionCreateDialog.connectionName}</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
            data-testid={testIds?.nameInput}
            disabled={pending}
            onChange={(event) => {
              setName(event.target.value);
              setFormError(null);
            }}
            placeholder={messages.connectionCreateDialog.connectionPlaceholder(typeLabel)}
            ref={nameInputRef}
            type="text"
            value={name}
          />
        </label>

        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="muted-label">{messages.connectionCreateDialog.credentials}</span>
            <button
              className="rounded-full border border-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50"
              data-testid={testIds?.addFieldButton}
              disabled={pending}
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

          <div className="mt-3 rounded-[1.35rem] border border-slate-900/10 bg-slate-50/60 px-4 py-3.5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {messages.connectionsPage.suggestedKeys}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestedKeys.map((key) => (
                <span key={key} className="app-chip px-3 py-1 text-xs font-semibold">
                  {key}
                </span>
              ))}
            </div>
            {type === 'WEBHOOK' ? (
              <p className="mt-3 text-xs leading-5 text-slate-500">
                {messages.connectionsPage.webhookHint}
              </p>
            ) : null}
            {mode === 'edit' ? (
              <p className="mt-3 text-xs leading-5 text-slate-500">
                {messages.connectionsPage.keepCredentialsHint}
              </p>
            ) : null}
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
                  disabled={pending}
                  onChange={(event) => {
                    updateEntry(index, 'key', event.target.value);
                    setFormError(null);
                  }}
                  placeholder={messages.connectionCreateDialog.fieldPlaceholder}
                  type="text"
                  value={entry.key}
                />
                <input
                  aria-label={messages.connectionCreateDialog.fieldValueAriaLabel(index + 1)}
                  className="rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                  disabled={pending}
                  onChange={(event) => {
                    updateEntry(index, 'value', event.target.value);
                    setFormError(null);
                  }}
                  placeholder={
                    mode === 'create'
                      ? messages.connectionCreateDialog.valuePlaceholder
                      : messages.connectionsPage.valuePlaceholderEdit
                  }
                  type="text"
                  value={entry.value}
                />
                <button
                  className="rounded-2xl border border-slate-900/10 px-3 text-sm font-semibold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
                  disabled={pending || (entries.length === 1 && hasCredentials)}
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
