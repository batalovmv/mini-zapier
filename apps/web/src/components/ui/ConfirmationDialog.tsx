import { useRef } from 'react';

import { useLocale } from '../../locale/LocaleProvider';

import { ModalShell } from './ModalShell';

interface ConfirmationDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmTone?: 'danger' | 'default';
  pending?: boolean;
  pendingTitle?: string;
  pendingDescription?: string;
  pendingLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmationDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmTone = 'default',
  pending = false,
  pendingTitle,
  pendingDescription,
  pendingLabel,
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  const { messages } = useLocale();
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const handleCancel = pending ? () => undefined : onCancel;
  const dialogTitle = pending ? pendingTitle ?? title : title;
  const dialogDescription = pending
    ? pendingDescription ?? description
    : description;
  const dialogNote = pending
    ? messages.confirmationDialog.pendingNote
    : messages.confirmationDialog.destructiveNote;

  return (
    <ModalShell
      actions={
        <>
          <button
            className="rounded-full border border-slate-900/10 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            onClick={handleCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {cancelLabel ?? messages.confirmationDialog.cancel}
          </button>
          <button
            className={[
              'rounded-full px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60',
              confirmTone === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-slate-900 hover:bg-slate-700',
            ].join(' ')}
            disabled={pending}
            onClick={onConfirm}
            type="button"
          >
            {pending ? pendingLabel ?? messages.confirmationDialog.working : confirmLabel}
          </button>
        </>
      }
      description={dialogDescription}
      dismissable={!pending}
      eyebrow={messages.confirmationDialog.eyebrow}
      initialFocusRef={cancelButtonRef}
      onClose={handleCancel}
      title={dialogTitle}
    >
      <p className="text-sm leading-6 text-slate-600">
        {dialogNote}
      </p>
    </ModalShell>
  );
}
