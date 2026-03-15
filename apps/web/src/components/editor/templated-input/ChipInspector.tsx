import { useEffect, useRef } from 'react';

import { useLocale } from '../../../locale/LocaleProvider';

interface ChipInspectorProps {
  path: string | null;
  anchorRect: DOMRect;
  containerRect: DOMRect;
  onReplace: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ChipInspector({
  path,
  anchorRect,
  containerRect,
  onReplace,
  onDelete,
  onClose,
}: ChipInspectorProps) {
  const { messages } = useLocale();
  const popoverRef = useRef<HTMLDivElement>(null);
  const t = messages.configForms.templatedInput;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick, true);

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick, true);
    };
  }, [onClose]);

  const top = anchorRect.bottom - containerRect.top + 4;
  const left = Math.max(0, anchorRect.left - containerRect.left);

  return (
    <div
      className="absolute z-50 rounded-lg border border-slate-200 bg-white p-2 shadow-md"
      ref={popoverRef}
      style={{ top, left }}
    >
      <div className="mb-1.5 font-mono text-xs text-slate-600">
        {path !== null ? `input.${path}` : 'input'}
      </div>
      <div className="flex gap-1.5">
        <button
          className="rounded px-2 py-0.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50"
          onClick={onReplace}
          type="button"
        >
          {t.replaceField}
        </button>
        <button
          className="rounded px-2 py-0.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
          onClick={onDelete}
          type="button"
        >
          {t.deleteField}
        </button>
      </div>
    </div>
  );
}
