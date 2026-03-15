import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

import {
  CHIP_ATTR,
  CHIP_PATH_ATTR,
  chipLabel,
  normalizeDom,
  normalizePath,
  parseTemplate,
  serializeFromDom,
} from './parse';

export interface TemplatedInputHandle {
  insertChipAtCaret(raw: string): void;
}

interface TemplatedInputProps {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  onChipClick?: (
    path: string | null,
    raw: string,
    chipEl: HTMLElement,
  ) => void;
}

/** Build DOM nodes for a parsed segment array. */
function buildChipSpan(raw: string, path: string | null): HTMLSpanElement {
  const chip = document.createElement('span');
  chip.setAttribute(CHIP_ATTR, raw);
  chip.setAttribute(CHIP_PATH_ATTR, path ?? '');
  chip.contentEditable = 'false';
  chip.className =
    'inline-flex items-center gap-0.5 rounded-md bg-amber-100 text-amber-800 px-1.5 py-0.5 text-xs font-medium cursor-default select-none align-baseline mx-0.5';

  const label = document.createElement('span');
  label.textContent = chipLabel(path);
  label.setAttribute('data-chip-label', '');
  chip.appendChild(label);

  const del = document.createElement('button');
  del.type = 'button';
  del.textContent = '×';
  del.className =
    'ml-0.5 leading-none text-amber-500 hover:text-rose-600 cursor-pointer text-xs';
  del.setAttribute('data-chip-delete', '');
  del.setAttribute('aria-label', 'delete');
  chip.appendChild(del);

  return chip;
}

function renderSegmentsToDom(
  el: HTMLElement,
  value: string,
  multiline: boolean,
): void {
  el.innerHTML = '';
  const segments = parseTemplate(value);

  if (segments.length === 0) {
    return;
  }

  for (const seg of segments) {
    if (seg.type === 'text') {
      if (multiline && seg.value.includes('\n')) {
        const lines = seg.value.split('\n');

        for (let i = 0; i < lines.length; i++) {
          if (i > 0) {
            el.appendChild(document.createElement('br'));
          }

          if (lines[i].length > 0) {
            el.appendChild(document.createTextNode(lines[i]));
          }
        }
      } else {
        el.appendChild(document.createTextNode(seg.value));
      }
    } else {
      el.appendChild(buildChipSpan(seg.raw, seg.path));
    }
  }
}

export const TemplatedInput = forwardRef<
  TemplatedInputHandle,
  TemplatedInputProps
>(function TemplatedInput(
  {
    value,
    onChange,
    multiline = false,
    placeholder,
    className,
    ariaLabel,
    onChipClick,
  },
  ref,
) {
  const editableRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastSerializedRef = useRef(value);
  const isComposingRef = useRef(false);

  // ------- Render value → DOM -------
  const syncDom = useCallback(
    (force?: boolean) => {
      const el = editableRef.current;

      if (!el) {
        return;
      }

      // Only re-render if the value changed externally
      if (!force && lastSerializedRef.current === value) {
        return;
      }

      lastSerializedRef.current = value;
      renderSegmentsToDom(el, value, multiline);
    },
    [value, multiline],
  );

  useEffect(() => {
    syncDom(true);
  }, [syncDom]);

  // ------- Serialize DOM → string -------
  const serialize = useCallback(() => {
    const el = editableRef.current;

    if (!el) {
      return value;
    }

    return serializeFromDom(el);
  }, [value]);

  const emitChange = useCallback(() => {
    const serialized = serialize();

    if (serialized !== lastSerializedRef.current) {
      lastSerializedRef.current = serialized;
      onChange(serialized);
    }
  }, [serialize, onChange]);

  // ------- Selection saving -------
  useEffect(() => {
    function handleSelectionChange() {
      const el = editableRef.current;

      if (!el) {
        return;
      }

      const sel = document.getSelection();

      if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // ------- Imperative handle -------
  useImperativeHandle(
    ref,
    () => ({
      insertChipAtCaret(raw: string) {
        const el = editableRef.current;

        if (!el) {
          return;
        }

        const path = normalizePath(
          raw.match(/{{\s*input(?:\.([^}]+))?\s*}}/)?.[1],
        );
        const chip = buildChipSpan(raw, path);

        const sel = document.getSelection();

        // Try to restore saved range
        if (savedRangeRef.current && el.contains(savedRangeRef.current.startContainer)) {
          sel?.removeAllRanges();
          sel?.addRange(savedRangeRef.current);
        }

        if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(chip);

          // Move caret after the chip
          range.setStartAfter(chip);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        } else {
          // Fallback: append at end
          el.appendChild(chip);
        }

        normalizeDom(el, multiline);
        emitChange();
        el.focus();
      },
    }),
    [multiline, emitChange],
  );

  // ------- Event handlers -------
  function handleInput() {
    if (isComposingRef.current) {
      return;
    }

    const el = editableRef.current;

    if (el) {
      normalizeDom(el, multiline);
    }

    emitChange();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');

    if (!text) {
      return;
    }

    const el = editableRef.current;

    if (!el) {
      return;
    }

    const sel = document.getSelection();

    if (!sel || sel.rangeCount === 0) {
      return;
    }

    const range = sel.getRangeAt(0);
    range.deleteContents();

    // Parse pasted text for template tokens
    const segments = parseTemplate(multiline ? text : text.replace(/\n/g, ' '));
    const frag = document.createDocumentFragment();

    for (const seg of segments) {
      if (seg.type === 'text') {
        if (multiline && seg.value.includes('\n')) {
          const lines = seg.value.split('\n');

          for (let i = 0; i < lines.length; i++) {
            if (i > 0) {
              frag.appendChild(document.createElement('br'));
            }

            if (lines[i].length > 0) {
              frag.appendChild(document.createTextNode(lines[i]));
            }
          }
        } else {
          frag.appendChild(document.createTextNode(seg.value));
        }
      } else {
        frag.appendChild(buildChipSpan(seg.raw, seg.path));
      }
    }

    range.insertNode(frag);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);

    normalizeDom(el, multiline);
    emitChange();
  }

  function handleClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;

    // Delete button inside chip
    if (target.hasAttribute('data-chip-delete')) {
      e.stopPropagation();
      const chip = target.closest(`[${CHIP_ATTR}]`) as HTMLElement | null;

      if (chip && editableRef.current?.contains(chip)) {
        chip.remove();
        editableRef.current.normalize();
        emitChange();
      }

      return;
    }

    // Chip label click → inspector
    const chip = target.closest(`[${CHIP_ATTR}]`) as HTMLElement | null;

    if (chip && editableRef.current?.contains(chip) && onChipClick) {
      const raw = chip.getAttribute(CHIP_ATTR) ?? '';
      const pathAttr = chip.getAttribute(CHIP_PATH_ATTR);
      const path = pathAttr === '' ? null : (pathAttr ?? null);
      onChipClick(path, raw, chip);
    }
  }

  const isEmpty = value.length === 0;

  const baseClass =
    'w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus-within:border-amber-500';
  const singleLineClass = 'whitespace-nowrap overflow-x-auto';
  const multiLineClass = 'min-h-36 whitespace-pre-wrap break-words';

  return (
    <div className="relative">
      <div
        aria-label={ariaLabel}
        className={[
          baseClass,
          multiline ? multiLineClass : singleLineClass,
          className ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
        contentEditable
        data-placeholder={placeholder}
        onCompositionEnd={() => {
          isComposingRef.current = false;
          handleInput();
        }}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onClick={handleClick}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        ref={editableRef}
        role="textbox"
        suppressContentEditableWarning
      />
      {isEmpty ? (
        <div className="pointer-events-none absolute left-4 top-3 text-sm text-slate-400">
          {placeholder}
        </div>
      ) : null}
    </div>
  );
});
