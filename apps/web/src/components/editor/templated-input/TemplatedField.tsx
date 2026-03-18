import { useCallback, useRef, useState } from 'react';

import { useLocale } from '../../../locale/LocaleProvider';
import type { ConfigUpdater } from '../ConfigPanel';
import { FieldPicker } from '../FieldPicker';
import { ChipInspector } from './ChipInspector';
import { serializeFromDom } from './parse';
import { TemplatedInput, type TemplatedInputHandle } from './TemplatedInput';

interface ConfigKeyProps {
  configKey: string;
  config: Record<string, unknown>;
  onChange: ConfigUpdater;
  value?: undefined;
  onValueChange?: undefined;
}

interface ControlledProps {
  value: string;
  onValueChange: (value: string) => void;
  configKey?: undefined;
  config?: undefined;
  onChange?: undefined;
}

type TemplatedFieldProps = (ConfigKeyProps | ControlledProps) & {
  label: string;
  multiline?: boolean;
  placeholder?: string;
  ariaLabel?: string;
};

export function TemplatedField(props: TemplatedFieldProps) {
  const { label, multiline = false, placeholder, ariaLabel } = props;
  const { messages } = useLocale();
  const t = messages.configForms.templatedInput;

  const [mode, setMode] = useState<'visual' | 'code'>('visual');
  const [inspectedChip, setInspectedChip] = useState<{
    path: string | null;
    raw: string;
    chipEl: HTMLElement;
  } | null>(null);
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);
  const replacingChipRef = useRef<HTMLElement | null>(null);
  const templatedRef = useRef<TemplatedInputHandle>(null);
  const codeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Value read/write helpers ---
  const currentValue =
    props.value !== undefined
      ? props.value
      : typeof props.config![props.configKey!] === 'string'
        ? (props.config![props.configKey!] as string)
        : '';

  const setValue = useCallback(
    (newValue: string) => {
      if (props.onValueChange !== undefined) {
        props.onValueChange(newValue);
      } else {
        const key = props.configKey!;
        props.onChange!((prev) => ({ ...prev, [key]: newValue }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.onValueChange, props.onChange, props.configKey],
  );

  // --- FieldPicker handlers ---
  function handleFieldPickerOpenChange(open: boolean) {
    setFieldPickerOpen(open);
  }

  function handleFieldSelect(fieldStr: string) {
    // Replacing an existing chip?
    if (replacingChipRef.current) {
      const chipEl = replacingChipRef.current;
      replacingChipRef.current = null;

      if (mode === 'visual' && templatedRef.current) {
        // Remove old chip and insert new one at its position
        const parent = chipEl.parentElement;

        if (parent) {
          // Replace the chip DOM node with a placeholder, then insert new chip
          const placeholder = document.createTextNode('');
          parent.replaceChild(placeholder, chipEl);

          // Now insert new chip via imperative handle at caret
          // But first set caret to the placeholder position
          const sel = document.getSelection();

          if (sel) {
            const range = document.createRange();
            range.setStart(placeholder, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }

        templatedRef.current.insertChipAtCaret(fieldStr);
      } else {
        // Code mode: replace is unusual, just append
        setValue(currentValue + fieldStr);
      }

      setInspectedChip(null);

      return;
    }

    // Normal insert
    if (mode === 'visual' && templatedRef.current) {
      templatedRef.current.insertChipAtCaret(fieldStr);
    } else if (mode === 'code') {
      // Insert at cursor in plain input/textarea
      const el = codeInputRef.current;
      const start = el?.selectionStart ?? currentValue.length;
      const end = el?.selectionEnd ?? currentValue.length;
      const newValue =
        currentValue.slice(0, start) + fieldStr + currentValue.slice(end);
      setValue(newValue);

      requestAnimationFrame(() => {
        if (el) {
          const cursorPos = start + fieldStr.length;
          el.setSelectionRange(cursorPos, cursorPos);
          el.focus();
        }
      });
    }
  }

  // --- Chip inspector handlers ---
  function handleChipClick(
    path: string | null,
    raw: string,
    chipEl: HTMLElement,
  ) {
    setInspectedChip({ path, raw, chipEl });
  }

  function handleInspectorReplace() {
    if (inspectedChip) {
      replacingChipRef.current = inspectedChip.chipEl;
      setInspectedChip(null);
      setFieldPickerOpen(true);
    }
  }

  function handleInspectorDelete() {
    if (inspectedChip && mode === 'visual') {
      const chipEl = inspectedChip.chipEl;
      chipEl.remove();

      // Re-serialize
      const el = chipEl.closest('[contenteditable]') as HTMLElement | null;

      if (el) {
        el.normalize();
      }

      // Trigger change by reading from the TemplatedInput's parent
      // We need to serialize after removal — use a small trick:
      // set value to current serialized content
      const container = containerRef.current?.querySelector('[contenteditable]') as HTMLElement | null;

      if (container) {
        const serialized = serializeFromDom(container);
        setValue(serialized);
      }
    }

    setInspectedChip(null);
  }

  function handleInspectorClose() {
    setInspectedChip(null);
  }

  // --- Render ---
  const containerRect = containerRef.current?.getBoundingClientRect();
  const chipRect = inspectedChip?.chipEl.getBoundingClientRect();

  return (
    <div className="relative block" ref={containerRef}>
      {label ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="muted-label">{label}</span>
        </div>
      ) : null}

      <div className="mt-2">
        {mode === 'visual' ? (
          <TemplatedInput
            ariaLabel={ariaLabel}
            multiline={multiline}
            onChange={setValue}
            onChipClick={handleChipClick}
            placeholder={placeholder}
            ref={templatedRef}
            value={currentValue}
          />
        ) : multiline ? (
          <textarea
            aria-label={ariaLabel}
            className="min-h-36 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            ref={(el) => {
              codeInputRef.current = el;
            }}
            value={currentValue}
          />
        ) : (
          <input
            aria-label={ariaLabel}
            className="w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            ref={(el) => {
              codeInputRef.current = el;
            }}
            type="text"
            value={currentValue}
          />
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <FieldPicker
          onOpenChange={handleFieldPickerOpenChange}
          onSelect={handleFieldSelect}
          open={fieldPickerOpen}
        />
        <button
          className="rounded-full border border-slate-900/10 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-amber-200 hover:text-amber-700"
          onClick={() => {
            setMode((m) => (m === 'visual' ? 'code' : 'visual'));
            setInspectedChip(null);
          }}
          type="button"
        >
          {mode === 'visual' ? t.editAsCode : t.visualMode}
        </button>
      </div>

      {inspectedChip && containerRect && chipRect ? (
        <ChipInspector
          anchorRect={chipRect}
          containerRect={containerRect}
          onClose={handleInspectorClose}
          onDelete={handleInspectorDelete}
          onReplace={handleInspectorReplace}
          path={inspectedChip.path}
        />
      ) : null}
    </div>
  );
}
