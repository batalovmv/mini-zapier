import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  RefObject,
} from 'react';
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalShellProps {
  eyebrow?: string;
  title: string;
  description?: string;
  dismissable?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
  actions: ReactNode;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

function isFocusable(element: HTMLElement): boolean {
  if (element instanceof HTMLInputElement && element.type === 'hidden') {
    return false;
  }

  const style = window.getComputedStyle(element);

  return !element.hasAttribute('disabled')
    && element.getAttribute('aria-hidden') !== 'true'
    && style.display !== 'none'
    && style.visibility !== 'hidden';
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    isFocusable,
  );
}

export function ModalShell({
  eyebrow = 'Dialog',
  title,
  description,
  dismissable = true,
  initialFocusRef,
  onClose,
  children,
  actions,
}: ModalShellProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const shouldCloseOnBackdropClickRef = useRef(false);

  useEffect(() => {
    const currentDialog = dialogRef.current;

    if (currentDialog === null) {
      return undefined;
    }

    const modalElement: HTMLDivElement = currentDialog;

    const activeElement = document.activeElement;
    restoreFocusRef.current = activeElement instanceof HTMLElement ? activeElement : null;

    const focusTarget = initialFocusRef?.current;
    const fallbackTarget = getFocusableElements(modalElement)[0] ?? modalElement;
    const nextFocusTarget =
      focusTarget instanceof HTMLElement && isFocusable(focusTarget)
        ? focusTarget
        : fallbackTarget;

    nextFocusTarget.focus();

    function handleFocusIn(event: FocusEvent) {
      if (
        event.target instanceof Node
        && !modalElement.contains(event.target)
      ) {
        const nextFocusable = getFocusableElements(modalElement)[0] ?? modalElement;
        nextFocusable.focus();
      }
    }

    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);

      if (
        restoreFocusRef.current instanceof HTMLElement
        && restoreFocusRef.current.isConnected
      ) {
        restoreFocusRef.current.focus();
      }
    };
  }, [initialFocusRef]);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const dialogElement = dialogRef.current;

    if (!dialogElement) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();

      if (dismissable) {
        onClose();
      }

      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = getFocusableElements(dialogElement);

    if (focusableElements.length === 0) {
      event.preventDefault();
      dialogElement.focus();
      return;
    }

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey) {
      if (activeElement === firstFocusable || activeElement === dialogElement) {
        event.preventDefault();
        lastFocusable.focus();
      }

      return;
    }

    if (activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
  }

  function handleBackdropMouseDownCapture(
    event: ReactMouseEvent<HTMLDivElement>,
  ) {
    shouldCloseOnBackdropClickRef.current = event.target === event.currentTarget;
  }

  function handleBackdropClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (!dismissable) {
      return;
    }

    if (
      shouldCloseOnBackdropClickRef.current
      && event.target === event.currentTarget
    ) {
      shouldCloseOnBackdropClickRef.current = false;
      onClose();
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-10 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      onMouseDownCapture={handleBackdropMouseDownCapture}
      role="presentation"
    >
      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-xl rounded-3xl border border-slate-900/10 bg-[#fcfaf6] shadow-2xl"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="border-b border-slate-900/10 px-6 py-5">
          <p className="muted-label">{eyebrow}</p>
          <h2
            className="mt-2 text-2xl font-semibold tracking-tight text-slate-900"
            id={titleId}
          >
            {title}
          </h2>
          {description ? (
            <p
              className="mt-3 text-sm leading-6 text-slate-600"
              id={descriptionId}
            >
              {description}
            </p>
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
