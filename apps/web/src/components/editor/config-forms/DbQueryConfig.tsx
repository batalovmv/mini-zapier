import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  introspectColumns,
  introspectTables,
  testDbQuery,
  type ColumnInfo,
} from '../../../lib/api/introspection';
import { getApiErrorMessage } from '../../../lib/api/client';
import { useLocale } from '../../../locale/LocaleProvider';
import type { ConfigUpdater } from '../ConfigPanel';
import { TemplatedField } from '../templated-input/TemplatedField';
import { RawJsonFallback } from './RawJsonFallback';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FilterRow {
  column: string;
  operator: string;
  value: string;
}

interface BuilderState {
  table: string;
  columns: string[];
  filters: FilterRow[];
  orderBy: { column: string; direction: 'ASC' | 'DESC' };
  limit: number;
}

interface DbQueryConfigProps {
  config: Record<string, unknown>;
  onChange: ConfigUpdater;
  connectionId: string | null;
}

/* ------------------------------------------------------------------ */
/*  Operators                                                          */
/* ------------------------------------------------------------------ */

const UNARY_OPERATORS = new Set(['IS NULL', 'IS NOT NULL']);

const OPERATORS = [
  '=',
  '!=',
  '>',
  '<',
  'LIKE',
  'IS NULL',
  'IS NOT NULL',
] as const;

/* ------------------------------------------------------------------ */
/*  SQL generation                                                     */
/* ------------------------------------------------------------------ */

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function generateSql(
  builder: BuilderState,
  knownTables: string[],
  knownColumns: string[],
): { query: string; params: unknown[] } | null {
  if (!builder.table || !knownTables.includes(builder.table)) {
    return null;
  }

  const cols =
    builder.columns.length === 0
      ? '*'
      : builder.columns
          .filter((c) => knownColumns.includes(c))
          .map(quoteIdent)
          .join(', ') || '*';

  const params: unknown[] = [];
  const whereClauses: string[] = [];

  for (const f of builder.filters) {
    if (!f.column || !knownColumns.includes(f.column)) continue;

    if (UNARY_OPERATORS.has(f.operator)) {
      whereClauses.push(`${quoteIdent(f.column)} ${f.operator}`);
    } else if (f.value !== '') {
      params.push(f.value);
      const op = f.operator === '!=' ? '<>' : f.operator;
      whereClauses.push(`${quoteIdent(f.column)} ${op} $${params.length}`);
    }
  }

  let sql = `SELECT ${cols} FROM ${quoteIdent(builder.table)}`;

  if (whereClauses.length > 0) {
    sql += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  if (builder.orderBy.column && knownColumns.includes(builder.orderBy.column)) {
    sql += ` ORDER BY ${quoteIdent(builder.orderBy.column)} ${builder.orderBy.direction}`;
  }

  if (builder.limit > 0) {
    sql += ` LIMIT ${builder.limit}`;
  }

  return { query: sql, params };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function serializeParams(params: unknown): string {
  if (!Array.isArray(params)) return '[]';
  return JSON.stringify(params, null, 2);
}

function readBuilderState(config: Record<string, unknown>): BuilderState | null {
  const raw = config._builderState;
  if (
    raw &&
    typeof raw === 'object' &&
    !Array.isArray(raw) &&
    typeof (raw as BuilderState).table === 'string'
  ) {
    return raw as BuilderState;
  }
  return null;
}

const EMPTY_BUILDER: BuilderState = {
  table: '',
  columns: [],
  filters: [],
  orderBy: { column: '', direction: 'ASC' },
  limit: 100,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DbQueryConfig({
  config,
  onChange,
  connectionId,
}: DbQueryConfigProps) {
  const { messages } = useLocale();
  const t = messages.configForms.dbQuery;

  // Backward compat: if _builderState exists → visual, else raw
  const hasBuilderState = readBuilderState(config) !== null;
  const [mode, setMode] = useState<'visual' | 'raw'>(
    hasBuilderState ? 'visual' : 'raw',
  );

  // Raw SQL state
  const [paramsText, setParamsText] = useState(() =>
    serializeParams(config.params),
  );
  const [paramsError, setParamsError] = useState<string | null>(null);

  // Visual builder state
  const [builder, setBuilder] = useState<BuilderState>(
    () => readBuilderState(config) ?? { ...EMPTY_BUILDER },
  );
  const [tables, setTables] = useState<string[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);

  // Test state
  const [testRows, setTestRows] = useState<unknown[] | null>(null);
  const [testRowCount, setTestRowCount] = useState<number | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testRunning, setTestRunning] = useState(false);

  // Raw JSON fallback
  const [jsonOpen, setJsonOpen] = useState(false);

  const knownColumnNames = useMemo(
    () => columns.map((c) => c.name),
    [columns],
  );

  /* ---- Sync raw params from config ---- */
  useEffect(() => {
    setParamsText(serializeParams(config.params));
  }, [config.params]);

  /* ---- Reset builder + test state when connectionId changes (not on mount) ---- */
  const prevConnectionIdRef = useRef(connectionId);

  useEffect(() => {
    const isInitialMount = prevConnectionIdRef.current === connectionId;

    if (!isInitialMount) {
      prevConnectionIdRef.current = connectionId;
    }

    if (!connectionId) {
      setTables([]);
      setColumns([]);
      return;
    }

    // Only reset on actual connection switch, not initial mount
    if (!isInitialMount) {
      setBuilder({ ...EMPTY_BUILDER });
      setColumns([]);
      setTestRows(null);
      setTestRowCount(null);
      setTestError(null);
      setMetaError(null);

      // Clear config query/params so stale SQL cannot be tested against the new connection
      onChange((prev) => ({
        ...prev,
        query: '',
        params: [],
        _builderState: undefined,
      }));
    }

    let cancelled = false;
    setTablesLoading(true);
    setMetaError(null);

    introspectTables(connectionId)
      .then((result) => {
        if (!cancelled) setTables(result.tables);
      })
      .catch((err) => {
        if (!cancelled) {
          setMetaError(getApiErrorMessage(err, messages.errors));
        }
      })
      .finally(() => {
        if (!cancelled) setTablesLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange is stable, intentionally omitted to avoid loops
  }, [connectionId, messages.errors]);

  /* ---- Load columns when table changes ---- */
  useEffect(() => {
    if (!connectionId || !builder.table) {
      setColumns([]);
      return;
    }

    let cancelled = false;
    setColumnsLoading(true);

    introspectColumns(connectionId, builder.table)
      .then((result) => {
        if (!cancelled) setColumns(result.columns);
      })
      .catch((err) => {
        if (!cancelled) {
          setMetaError(getApiErrorMessage(err, messages.errors));
        }
      })
      .finally(() => {
        if (!cancelled) setColumnsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [connectionId, builder.table, messages.errors]);

  /* ---- Push builder → config whenever builder changes ---- */
  const pushBuilderToConfig = useCallback(
    (next: BuilderState) => {
      const result = generateSql(next, tables, knownColumnNames);
      onChange((prev) => ({
        ...prev,
        query: result?.query ?? prev.query ?? '',
        params: result?.params ?? prev.params ?? [],
        _builderState: next,
      }));
    },
    [onChange, tables, knownColumnNames],
  );

  function updateBuilder(patch: Partial<BuilderState>) {
    setBuilder((prev) => {
      const next = { ...prev, ...patch };
      pushBuilderToConfig(next);
      return next;
    });
  }

  /* ---- Raw SQL handlers ---- */
  function handleQueryChange(value: string) {
    onChange((prev) => ({ ...prev, query: value }));
  }

  function handleParamsChange(nextValue: string) {
    setParamsText(nextValue);
    try {
      const parsed = JSON.parse(nextValue);
      if (!Array.isArray(parsed)) {
        setParamsError(t.jsonArrayError);
        return;
      }
      onChange((prev) => ({ ...prev, params: parsed }));
      setParamsError(null);
    } catch {
      setParamsError(t.validJsonError);
    }
  }

  /* ---- Test handler ---- */
  async function handleTest() {
    if (!connectionId) return;

    const query = typeof config.query === 'string' ? config.query : '';
    const params = Array.isArray(config.params) ? config.params : [];

    setTestRunning(true);
    setTestError(null);
    setTestRows(null);
    setTestRowCount(null);

    try {
      const result = await testDbQuery(connectionId, query, params);
      setTestRows(result.rows);
      setTestRowCount(result.rowCount);
    } catch (err) {
      setTestError(getApiErrorMessage(err, messages.errors));
    } finally {
      setTestRunning(false);
    }
  }

  /* ---- SQL preview ---- */
  const sqlPreview = useMemo(() => {
    if (mode === 'raw') {
      return typeof config.query === 'string' ? config.query : '';
    }
    const result = generateSql(builder, tables, knownColumnNames);
    return result?.query ?? '';
  }, [mode, builder, tables, knownColumnNames, config.query]);

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  const modeTabClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold transition ${
      active
        ? 'bg-slate-900 text-white shadow-sm'
        : 'bg-white text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex gap-1.5 rounded-full border border-slate-900/10 bg-slate-50 p-1">
        <button
          className={modeTabClass(mode === 'visual')}
          onClick={() => setMode('visual')}
          type="button"
        >
          {t.modeVisual}
        </button>
        <button
          className={modeTabClass(mode === 'raw')}
          onClick={() => setMode('raw')}
          type="button"
        >
          {t.modeRawSql}
        </button>
      </div>

      {/* ---- VISUAL MODE ---- */}
      {mode === 'visual' && (
        <>
          {!connectionId ? (
            <p className="text-sm leading-6 text-slate-500">
              {t.selectConnectionHint}
            </p>
          ) : (
            <div className="space-y-4">
              {/* Table selector */}
              <label className="block">
                <span className="muted-label">{t.selectTable}</span>
                {tablesLoading ? (
                  <p className="mt-2 text-xs text-slate-400">{t.loadingTables}</p>
                ) : (
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                    onChange={(e) =>
                      updateBuilder({
                        table: e.target.value,
                        columns: [],
                        filters: [],
                        orderBy: { column: '', direction: 'ASC' },
                      })
                    }
                    value={builder.table}
                  >
                    <option value="">{t.selectTable}</option>
                    {tables.map((tbl) => (
                      <option key={tbl} value={tbl}>
                        {tbl}
                      </option>
                    ))}
                  </select>
                )}
                {!tablesLoading && tables.length === 0 && connectionId && (
                  <p className="mt-2 text-xs text-slate-400">{t.noTables}</p>
                )}
              </label>

              {metaError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
                  {t.introspectionError}: {metaError}
                </div>
              )}

              {/* Columns */}
              {builder.table && (
                <div>
                  <span className="muted-label">{t.columns}</span>
                  {columnsLoading ? (
                    <p className="mt-2 text-xs text-slate-400">
                      {t.loadingColumns}
                    </p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <label className="inline-flex items-center gap-1.5 text-sm">
                        <input
                          checked={builder.columns.length === 0}
                          onChange={() => updateBuilder({ columns: [] })}
                          type="radio"
                          name="col-mode"
                        />
                        {t.allColumns}
                      </label>
                      {columns.map((col) => (
                        <label
                          key={col.name}
                          className="inline-flex items-center gap-1.5 text-sm"
                        >
                          <input
                            checked={
                              builder.columns.length === 0 ||
                              builder.columns.includes(col.name)
                            }
                            onChange={(e) => {
                              if (builder.columns.length === 0) {
                                // Switch from "all" to specific
                                updateBuilder({
                                  columns: e.target.checked
                                    ? [col.name]
                                    : columns
                                        .filter((c) => c.name !== col.name)
                                        .map((c) => c.name),
                                });
                              } else {
                                updateBuilder({
                                  columns: e.target.checked
                                    ? [...builder.columns, col.name]
                                    : builder.columns.filter(
                                        (c) => c !== col.name,
                                      ),
                                });
                              }
                            }}
                            type="checkbox"
                          />
                          <span>{col.name}</span>
                          <span className="text-xs text-slate-400">
                            {col.type}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Filters */}
              {builder.table && columns.length > 0 && (
                <div>
                  <span className="muted-label">{t.filters}</span>
                  <div className="mt-2 space-y-2">
                    {builder.filters.map((filter, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          className="w-1/3 rounded-xl border border-slate-900/10 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
                          onChange={(e) => {
                            const next = [...builder.filters];
                            next[index] = { ...filter, column: e.target.value };
                            updateBuilder({ filters: next });
                          }}
                          value={filter.column}
                        >
                          <option value="">{t.columns}</option>
                          {columns.map((col) => (
                            <option key={col.name} value={col.name}>
                              {col.name}
                            </option>
                          ))}
                        </select>

                        <select
                          className="w-24 rounded-xl border border-slate-900/10 bg-white px-2 py-2 text-sm outline-none focus:border-amber-500"
                          onChange={(e) => {
                            const next = [...builder.filters];
                            next[index] = {
                              ...filter,
                              operator: e.target.value,
                            };
                            updateBuilder({ filters: next });
                          }}
                          value={filter.operator}
                        >
                          {OPERATORS.map((op) => (
                            <option key={op} value={op}>
                              {op}
                            </option>
                          ))}
                        </select>

                        {!UNARY_OPERATORS.has(filter.operator) && (
                          <div className="min-w-0 flex-1">
                            <TemplatedField
                              label=""
                              placeholder={t.filterValuePlaceholder}
                              value={filter.value}
                              onValueChange={(val) => {
                                const next = [...builder.filters];
                                next[index] = { ...filter, value: val };
                                updateBuilder({ filters: next });
                              }}
                            />
                          </div>
                        )}

                        <button
                          aria-label={t.removeFilterAriaLabel}
                          className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => {
                            const next = builder.filters.filter(
                              (_, i) => i !== index,
                            );
                            updateBuilder({ filters: next });
                          }}
                          type="button"
                        >
                          &times;
                        </button>
                      </div>
                    ))}

                    <button
                      className="text-xs font-semibold text-amber-600 transition hover:text-amber-700"
                      onClick={() =>
                        updateBuilder({
                          filters: [
                            ...builder.filters,
                            { column: '', operator: '=', value: '' },
                          ],
                        })
                      }
                      type="button"
                    >
                      + {t.addFilter}
                    </button>
                  </div>
                </div>
              )}

              {/* Order by */}
              {builder.table && columns.length > 0 && (
                <div className="flex items-end gap-3">
                  <label className="flex-1">
                    <span className="muted-label">{t.orderBy}</span>
                    <select
                      className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500"
                      onChange={(e) =>
                        updateBuilder({
                          orderBy: {
                            ...builder.orderBy,
                            column: e.target.value,
                          },
                        })
                      }
                      value={builder.orderBy.column}
                    >
                      <option value="">—</option>
                      {columns.map((col) => (
                        <option key={col.name} value={col.name}>
                          {col.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <select
                    className="rounded-2xl border border-slate-900/10 bg-white px-3 py-3 text-sm outline-none focus:border-amber-500"
                    onChange={(e) =>
                      updateBuilder({
                        orderBy: {
                          ...builder.orderBy,
                          direction: e.target.value as 'ASC' | 'DESC',
                        },
                      })
                    }
                    value={builder.orderBy.direction}
                  >
                    <option value="ASC">{t.orderAsc}</option>
                    <option value="DESC">{t.orderDesc}</option>
                  </select>
                </div>
              )}

              {/* Limit */}
              {builder.table && (
                <label className="block">
                  <span className="muted-label">{t.limit}</span>
                  <input
                    className="mt-2 w-24 rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                    min={1}
                    onChange={(e) =>
                      updateBuilder({
                        limit: Math.max(1, Number(e.target.value) || 100),
                      })
                    }
                    type="number"
                    value={builder.limit}
                  />
                </label>
              )}
            </div>
          )}
        </>
      )}

      {/* ---- RAW SQL MODE ---- */}
      {mode === 'raw' && (
        <>
          <label className="block">
            <span className="muted-label">{t.query}</span>
            <textarea
              className="mt-2 min-h-40 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder={t.queryPlaceholder}
              value={typeof config.query === 'string' ? config.query : ''}
            />
          </label>

          <label className="block">
            <span className="muted-label">{t.params}</span>
            <textarea
              className="mt-2 min-h-32 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-amber-500"
              onChange={(e) => handleParamsChange(e.target.value)}
              placeholder={t.paramsPlaceholder}
              value={paramsText}
            />
            <span className="mt-2 block text-xs leading-5 text-slate-500">
              {t.help}
            </span>
            {paramsError && (
              <span className="mt-2 block text-xs font-semibold text-rose-600">
                {paramsError}
              </span>
            )}
          </label>
        </>
      )}

      {/* ---- SQL PREVIEW ---- */}
      {sqlPreview && (
        <div>
          <span className="muted-label">{t.sqlPreview}</span>
          <pre className="mt-2 overflow-x-auto rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 font-mono text-xs leading-5 text-slate-700">
            {sqlPreview}
          </pre>
        </div>
      )}

      {/* ---- TEST BUTTON ---- */}
      {connectionId && (
        <div>
          <button
            className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100 disabled:opacity-50"
            disabled={testRunning || !config.query || (mode === 'raw' && paramsError !== null)}
            onClick={() => void handleTest()}
            type="button"
          >
            {testRunning ? t.testRunning : t.testButton}
          </button>

          {testError && (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
              {t.testError}: {testError}
            </div>
          )}

          {testRows !== null && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-600">
                {t.testResult} &mdash; {t.testRowCount(testRowCount ?? 0)}
              </p>
              <div className="mt-2 max-h-64 overflow-auto rounded-2xl border border-slate-900/10 bg-white">
                {testRows.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-400">
                    {t.testRowCount(0)}
                  </p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        {Object.keys(
                          testRows[0] as Record<string, unknown>,
                        ).map((key) => (
                          <th
                            key={key}
                            className="px-3 py-2 text-left font-semibold text-slate-600"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {testRows.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-slate-50 last:border-0"
                        >
                          {Object.values(
                            row as Record<string, unknown>,
                          ).map((val, j) => (
                            <td
                              key={j}
                              className="px-3 py-2 text-slate-700"
                            >
                              {val === null
                                ? 'NULL'
                                : typeof val === 'object'
                                  ? JSON.stringify(val)
                                  : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- RAW JSON FALLBACK ---- */}
      <RawJsonFallback
        config={config}
        hideLabel={t.hideJson}
        onChange={onChange}
        onToggle={() => setJsonOpen((prev) => !prev)}
        open={jsonOpen}
        showLabel={t.showJson}
      />
    </div>
  );
}
