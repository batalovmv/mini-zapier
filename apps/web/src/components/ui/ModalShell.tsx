import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalShellProps {
  eyebrow?: string;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  actions: ReactNode;
}

export function ModalShell({
  eyebrow = 'Dialog',
  title,
  description,
  onClose,
  children,
  actions,
}: ModalShellProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-10 backdrop-blur-sm"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        aria-modal="true"
        className="w-full max-w-xl rounded-3xl border border-slate-900/10 bg-[#fcfaf6] shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="border-b border-slate-900/10 px-6 py-5">
          <p className="muted-label">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
          {description ? (
            <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
          ) : null}
        </div>

        <div className="px-6 py-5">{children}</div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-900/10 px-6 py-5">
          {actions}
        </div>
      </div>
    </div>,
    document.body,
  );
}
