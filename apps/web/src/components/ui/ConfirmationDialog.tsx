import { useLocale } from '../../locale/LocaleProvider';

import { ModalShell } from './ModalShell';

interface ConfirmationDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmTone?: 'danger' | 'default';
  pending?: boolean;
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
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  const { messages } = useLocale();

  return (
    <ModalShell
      actions={
        <>
          <button
            className="rounded-full border border-slate-900/10 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-500/40 hover:bg-amber-50"
            onClick={onCancel}
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
            {pending ? messages.confirmationDialog.working : confirmLabel}
          </button>
        </>
      }
      description={description}
      eyebrow={messages.confirmationDialog.eyebrow}
      onClose={pending ? () => undefined : onCancel}
      title={title}
    >
      <p className="text-sm leading-6 text-slate-600">
        {messages.confirmationDialog.destructiveNote}
      </p>
    </ModalShell>
  );
}
