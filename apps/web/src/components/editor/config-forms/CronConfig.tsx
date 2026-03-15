import { useCallback, useMemo, useState } from 'react';
import { CronExpressionParser } from 'cron-parser';

import { useLocale } from '../../../locale/LocaleProvider';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor.store';
import type { ConfigUpdater } from '../ConfigPanel';

interface CronConfigProps {
  config: Record<string, unknown>;
  onChange: ConfigUpdater;
}

type Preset = 'none' | 'every_minute' | 'every_hour' | 'every_day' | 'every_week' | 'custom';

const DAY_BITS = [1, 2, 3, 4, 5, 6, 0] as const; // Mon–Sun (cron: 1=Mon … 0=Sun)

function detectPreset(cron: string): { preset: Preset; hour: string; minute: string; days: number[] } {
  const defaults = { hour: '09', minute: '00', days: [1, 2, 3, 4, 5] };

  if (!cron || cron.trim() === '') return { preset: 'none', ...defaults };

  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return { preset: 'custom', ...defaults };

  const [min, hr, dom, mon, dow] = parts;

  if (min === '*' && hr === '*' && dom === '*' && mon === '*' && dow === '*') {
    return { preset: 'every_minute', ...defaults };
  }

  if (/^\d+$/.test(min) && hr === '*' && dom === '*' && mon === '*' && dow === '*') {
    return { preset: 'every_hour', hour: '00', minute: min.padStart(2, '0'), days: defaults.days };
  }

  if (/^\d+$/.test(min) && /^\d+$/.test(hr) && dom === '*' && mon === '*' && dow === '*') {
    return {
      preset: 'every_day',
      hour: hr.padStart(2, '0'),
      minute: min.padStart(2, '0'),
      days: defaults.days,
    };
  }

  if (/^\d+$/.test(min) && /^\d+$/.test(hr) && dom === '*' && mon === '*' && /^[\d,]+$/.test(dow)) {
    const days = dow.split(',').map(Number).map((d) => (d === 7 ? 0 : d));
    return {
      preset: 'every_week',
      hour: hr.padStart(2, '0'),
      minute: min.padStart(2, '0'),
      days,
    };
  }

  return { preset: 'custom', ...defaults };
}

function buildCron(preset: Preset, hour: string, minute: string, days: number[]): string {
  switch (preset) {
    case 'none':
      return '';
    case 'every_minute':
      return '* * * * *';
    case 'every_hour':
      return `${Number(minute)} * * * *`;
    case 'every_day':
      return `${Number(minute)} ${Number(hour)} * * *`;
    case 'every_week': {
      const sorted = [...days].sort((a, b) => a - b);
      return `${Number(minute)} ${Number(hour)} * * ${sorted.join(',')}`;
    }
    case 'custom':
      return '';
  }
}

function computeNextRun(cron: string, tz: string | null): string | null {
  try {
    const expression = CronExpressionParser.parse(cron, { tz: tz ?? undefined });
    const next = expression.next().toDate();
    const formatter = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: tz ?? undefined,
    });
    return formatter.format(next);
  } catch {
    return null;
  }
}

const inputClass =
  'mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500';

const presetBtnBase =
  'rounded-full border px-3 py-1.5 text-xs font-semibold transition';
const presetBtnActive =
  'border-amber-400 bg-amber-50 text-amber-800 shadow-sm';
const presetBtnInactive =
  'border-slate-900/10 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50/50';

const dayBtnBase =
  'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition';
const dayBtnActive =
  'border-amber-400 bg-amber-50 text-amber-800';
const dayBtnInactive =
  'border-slate-900/10 bg-white text-slate-500 hover:border-amber-300';

export function CronConfig({ config, onChange }: CronConfigProps) {
  const { messages } = useLocale();
  const workflowTimezone = useWorkflowEditorStore((s) => s.workflowTimezone);
  const cronStr = typeof config.cronExpression === 'string' ? config.cronExpression : '';

  const detected = useMemo(() => detectPreset(cronStr), [cronStr]);

  const [mode, setMode] = useState<'visual' | 'code'>(
    detected.preset === 'custom' ? 'code' : 'visual',
  );
  const [preset, setPreset] = useState<Preset>(detected.preset);
  const [hour, setHour] = useState(detected.hour);
  const [minute, setMinute] = useState(detected.minute);
  const [days, setDays] = useState<number[]>(detected.days);

  const cron = messages.configForms.cron;

  const setCronExpression = useCallback(
    (value: string) => {
      onChange((prev) => ({ ...prev, cronExpression: value }));
    },
    [onChange],
  );

  function handlePresetChange(next: Preset) {
    setPreset(next);
    if (next === 'custom') {
      setMode('code');
      return;
    }
    setMode('visual');
    const expr = buildCron(next, hour, minute, days);
    setCronExpression(expr);
  }

  function handleTimeChange(nextHour: string, nextMinute: string) {
    setHour(nextHour);
    setMinute(nextMinute);
    const expr = buildCron(preset, nextHour, nextMinute, days);
    setCronExpression(expr);
  }

  function handleDayToggle(day: number) {
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
    if (next.length === 0) return; // at least one day
    setDays(next);
    const expr = buildCron(preset, hour, minute, next);
    setCronExpression(expr);
  }

  const nextRun = cronStr ? computeNextRun(cronStr, workflowTimezone) : null;

  const presetButtons: Array<{ key: Preset; label: string }> = [
    { key: 'every_minute', label: cron.presetEveryMinute },
    { key: 'every_hour', label: cron.presetEveryHour },
    { key: 'every_day', label: cron.presetEveryDay },
    { key: 'every_week', label: cron.presetEveryWeek },
    { key: 'custom', label: cron.presetCustom },
  ];

  const dayLabels: Record<number, string> = {
    1: cron.dayMon,
    2: cron.dayTue,
    3: cron.dayWed,
    4: cron.dayThu,
    5: cron.dayFri,
    6: cron.daySat,
    0: cron.daySun,
  };

  const showTimePicker = preset === 'every_day' || preset === 'every_week';
  const showMinutePicker = preset === 'every_hour';
  const showDayPicker = preset === 'every_week';

  return (
    <div className="space-y-4">
      {/* Preset selector */}
      <div>
        <span className="muted-label">{cron.scheduleLabel}</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {presetButtons.map((btn) => (
            <button
              key={btn.key}
              className={`${presetBtnBase} ${preset === btn.key ? presetBtnActive : presetBtnInactive}`}
              onClick={() => handlePresetChange(btn.key)}
              type="button"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Minute picker for "every hour" */}
      {mode === 'visual' && showMinutePicker ? (
        <label className="block">
          <span className="muted-label">{cron.timeLabel}</span>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-slate-500">:</span>
            <input
              className={inputClass + ' !w-20 text-center'}
              max="59"
              min="0"
              onChange={(e) => handleTimeChange(hour, e.target.value.padStart(2, '0'))}
              type="number"
              value={Number(minute)}
            />
            <span className="text-xs text-slate-500">min</span>
          </div>
        </label>
      ) : null}

      {/* Time picker for daily/weekly */}
      {mode === 'visual' && showTimePicker ? (
        <label className="block">
          <span className="muted-label">{cron.timeLabel}</span>
          <div className="mt-2 flex items-center gap-2">
            <input
              className={inputClass + ' !w-20 text-center'}
              max="23"
              min="0"
              onChange={(e) => handleTimeChange(e.target.value.padStart(2, '0'), minute)}
              type="number"
              value={Number(hour)}
            />
            <span className="text-sm text-slate-500">:</span>
            <input
              className={inputClass + ' !w-20 text-center'}
              max="59"
              min="0"
              onChange={(e) => handleTimeChange(hour, e.target.value.padStart(2, '0'))}
              type="number"
              value={Number(minute)}
            />
          </div>
        </label>
      ) : null}

      {/* Day-of-week picker */}
      {mode === 'visual' && showDayPicker ? (
        <div>
          <span className="muted-label">{cron.daysLabel}</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DAY_BITS.map((day) => (
              <button
                key={day}
                className={`${dayBtnBase} ${days.includes(day) ? dayBtnActive : dayBtnInactive}`}
                onClick={() => handleDayToggle(day)}
                type="button"
              >
                {dayLabels[day]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Raw cron input (code mode or always for custom) */}
      {mode === 'code' ? (
        <label className="block">
          <span className="muted-label">{cron.label}</span>
          <input
            className={inputClass}
            onChange={(e) => setCronExpression(e.target.value)}
            placeholder={cron.placeholder}
            type="text"
            value={cronStr}
          />
          <span className="mt-2 block text-xs leading-5 text-slate-500">{cron.help}</span>
        </label>
      ) : null}

      {/* Toggle visual ↔ code */}
      <button
        className="text-xs font-medium text-amber-700 underline decoration-amber-300 underline-offset-2 transition hover:text-amber-900"
        onClick={() => {
          if (mode === 'visual') {
            setMode('code');
          } else {
            // Switching back to visual — re-detect preset from current cron
            const re = detectPreset(cronStr);
            setPreset(re.preset);
            setHour(re.hour);
            setMinute(re.minute);
            setDays(re.days);
            setMode(re.preset === 'custom' ? 'code' : 'visual');
          }
        }}
        type="button"
      >
        {mode === 'visual' ? cron.editAsCode : cron.editVisually}
      </button>

      {/* Next run preview */}
      {cronStr ? (
        <div className="rounded-xl border border-slate-900/8 bg-slate-50/60 px-3 py-2.5">
          <span className="text-xs font-semibold text-slate-500">{cron.nextRun}</span>
          <p className="mt-0.5 text-sm text-slate-800">
            {nextRun ?? cron.nextRunUnknown}
          </p>
          {workflowTimezone ? (
            <p className="mt-1 text-[11px] text-slate-400">
              {cron.timezoneNote(workflowTimezone)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
