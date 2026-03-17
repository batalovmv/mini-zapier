import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  introspectColumns,
  introspectTables,
  testDbMutation,
  testDbQuery,
  type ColumnInfo,
} from '../../../lib/api/introspection';
import {
  getApiErrorMessage,
  isMissingApiRouteError,
} from '../../../lib/api/client';
import { useLocale } from '../../../locale/LocaleProvider';
import type { ConfigUpdater } from '../ConfigPanel';
import { TemplatedField } from '../templated-input/TemplatedField';
import { RawJsonFallback } from './RawJsonFallback';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DbOperation = 'select' | 'insert' | 'update' | 'delete';

interface FilterRow {
  column: string;
  operator: string;
  value: string;
}

interface SetValueRow {
  column: string;
  value: string;
}

interface BuilderState {
  operation: DbOperation;
  table: string;
  columns: string[];
  filters: FilterRow[];
  orderBy: { column: string; direction: 'ASC' | 'DESC' };
  limit: number;
  setValues: SetValueRow[];
}

interface DbQueryConfigProps {
  config: Record<string, unknown>;
  onChange: ConfigUpdater;
  connectionId: string | null;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
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

const OPERATIONS: DbOperation[] = ['select', 'insert', 'update', 'delete'];

const EMPTY_BUILDER: BuilderState = {
  operation: 'select',
  table: '',
  columns: [],
  filters: [],
  orderBy: { column: '', direction: 'ASC' },
  limit: 100,
  setValues: [],
};

/* ------------------------------------------------------------------ */
/*  SQL generation                                                     */
/* ------------------------------------------------------------------ */

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/** Build WHERE clause from filter rows. Returns { sql, params } fragment. */
function buildWhere(
  filters: FilterRow[],
  knownColumns: string[],
  paramsOffset: number,
): { clause: string; params: unknown[] } {
  const params: unknown[] = [];
  const clauses: string[] = [];

  for (const f of filters) {
    if (!f.column || !knownColumns.includes(f.column)) continue;

    if (UNARY_OPERATORS.has(f.operator)) {
      clauses.push(`${quoteIdent(f.column)} ${f.operator}`);
    } else if (f.value !== '') {
      params.push(f.value);
      const op = f.operator === '!=' ? '<>' : f.operator;
      clauses.push(
        `${quoteIdent(f.column)} ${op} $${paramsOffset + params.length}`,
      );
    }
  }

  return {
    clause: clauses.length > 0 ? ` WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

/** Dedupe setValues by column, keep first occurrence, skip empty/unknown columns. */
function validSetValues(
  rows: SetValueRow[],
  knownColumns: string[],
): SetValueRow[] {
  const seen = new Set<string>();
  const result: SetValueRow[] = [];

  for (const row of rows) {
    if (!row.column || !knownColumns.includes(row.column)) continue;
    if (seen.has(row.column)) continue;
    seen.add(row.column);
    result.push(row);
  }

  return result;
}

function generateSelectSql(
  builder: BuilderState,
  knownTables: string[],
  knownColumns: string[],
): { query: string; params: unknown[] } | null {
  if (!builder.table || !knownTables.includes(builder.table)) return null;

  const cols =
    builder.columns.length === 0
      ? '*'
      : builder.columns
          .filter((c) => knownColumns.includes(c))
          .map(quoteIdent)
          .join(', ') || '*';

  const where = buildWhere(builder.filters, knownColumns, 0);

  let sql = `SELECT ${cols} FROM ${quoteIdent(builder.table)}${where.clause}`;

  if (
    builder.orderBy.column &&
    knownColumns.includes(builder.orderBy.column)
  ) {
    sql += ` ORDER BY ${quoteIdent(builder.orderBy.column)} ${builder.orderBy.direction}`;
  }

  if (builder.limit > 0) {
    sql += ` LIMIT ${builder.limit}`;
  }

  return { query: sql, params: where.params };
}

function generateInsertSql(
  builder: BuilderState,
  knownTables: string[],
  knownColumns: string[],
): { query: string; params: unknown[] } | null {
  if (!builder.table || !knownTables.includes(builder.table)) return null;

  const rows = validSetValues(builder.setValues, knownColumns);
  if (rows.length === 0) return null;

  const colList = rows.map((r) => quoteIdent(r.column)).join(', ');
  const valList = rows.map((_, i) => `$${i + 1}`).join(', ');
  const params = rows.map((r) => r.value);

  return {
    query: `INSERT INTO ${quoteIdent(builder.table)} (${colList}) VALUES (${valList})`,
    params,
  };
}

function generateUpdateSql(
  builder: BuilderState,
  knownTables: string[],
  knownColumns: string[],
): { query: string; params: unknown[] } | null {
  if (!builder.table || !knownTables.includes(builder.table)) return null;

  const rows = validSetValues(builder.setValues, knownColumns);
  if (rows.length === 0) return null;

  const setClauses = rows.map(
    (r, i) => `${quoteIdent(r.column)} = $${i + 1}`,
  );
  const setParams = rows.map((r) => r.value);

  const where = buildWhere(builder.filters, knownColumns, setParams.length);

  return {
    query: `UPDATE ${quoteIdent(builder.table)} SET ${setClauses.join(', ')}${where.clause}`,
    params: [...setParams, ...where.params],
  };
}

function generateDeleteSql(
  builder: BuilderState,
  knownTables: string[],
  knownColumns: string[],
): { query: string; params: unknown[] } | null {
  if (!builder.table || !knownTables.includes(builder.table)) return null;

  const where = buildWhere(builder.filters, knownColumns, 0);

  return {
    query: `DELETE FROM ${quoteIdent(builder.table)}${where.clause}`,
    params: where.params,
  };
}

function generateSql(
  builder: BuilderState,
  knownTables: string[],
  knownColumns: string[],
): { query: string; params: unknown[] } | null {
  switch (builder.operation) {
    case 'select':
      return generateSelectSql(builder, knownTables, knownColumns);
    case 'insert':
      return generateInsertSql(builder, knownTables, knownColumns);
    case 'update':
      return generateUpdateSql(builder, knownTables, knownColumns);
    case 'delete':
      return generateDeleteSql(builder, knownTables, knownColumns);
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function serializeParams(params: unknown): string {
  if (!Array.isArray(params)) return '[]';
  return JSON.stringify(params, null, 2);
}

/** Normalize legacy _builderState (may lack operation/setValues). */
function normalizeBuilderState(raw: unknown): BuilderState | null {
  if (
    !raw ||
    typeof raw !== 'object' ||
    Array.isArray(raw) ||
    typeof (raw as BuilderState).table !== 'string'
  ) {
    return null;
  }

  const r = raw as Partial<BuilderState>;

  return {
    operation: OPERATIONS.includes(r.operation as DbOperation)
      ? (r.operation as DbOperation)
      : 'select',
    table: r.table ?? '',
    columns: Array.isArray(r.columns) ? r.columns : [],
    filters: Array.isArray(r.filters) ? r.filters : [],
    orderBy:
      r.orderBy && typeof r.orderBy === 'object'
        ? r.orderBy
        : { column: '', direction: 'ASC' },
    limit: typeof r.limit === 'number' ? r.limit : 100,
    setValues: Array.isArray(r.setValues) ? r.setValues : [],
  };
}

/** Classify raw SQL by first keyword for test routing. */
function classifyQuery(sql: string): 'read' | 'mutation' | null {
  const trimmed = sql.trim().replace(/;+\s*$/, '');
  if (!trimmed) return null;

  const firstWord = trimmed.split(/\s+/)[0]?.toUpperCase();

  if (firstWord === 'SELECT' || firstWord === 'WITH') return 'read';
  if (
    firstWord === 'INSERT' ||
    firstWord === 'UPDATE' ||
    firstWord === 'DELETE'
  )
    return 'mutation';

  return null;
}

/** Check if generated SQL has an effective WHERE clause. */
function hasEffectiveWhere(sql: string | undefined): boolean {
  if (!sql) return false;
  return /\bWHERE\b/i.test(sql);
}

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

  const opLabels: Record<DbOperation, string> = {
    select: t.opSelect,
    insert: t.opInsert,
    update: t.opUpdate,
    delete: t.opDelete,
  };

  // Backward compat: if _builderState exists → visual, else raw
  const initialBuilderState = normalizeBuilderState(config._builderState);
  const [mode, setMode] = useState<'visual' | 'raw'>(
    initialBuilderState ? 'visual' : 'raw',
  );

  // Raw SQL state
  const [paramsText, setParamsText] = useState(() =>
    serializeParams(config.params),
  );
  const [paramsError, setParamsError] = useState<string | null>(null);

  // Visual builder state
  const [builder, setBuilder] = useState<BuilderState>(
    () => initialBuilderState ?? { ...EMPTY_BUILDER },
  );
  const [tables, setTables] = useState<string[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [metadataUnavailable, setMetadataUnavailable] = useState<string | null>(
    null,
  );

  // Test state
  const [testRows, setTestRows] = useState<unknown[] | null>(null);
  const [testRowCount, setTestRowCount] = useState<number | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testRunning, setTestRunning] = useState(false);
  const [testUnavailable, setTestUnavailable] = useState<string | null>(null);

  // Raw JSON fallback
  const [jsonOpen, setJsonOpen] = useState(false);

  const knownColumnNames = useMemo(
    () => columns.map((c) => c.name),
    [columns],
  );

  /* ---- Clear test results helper ---- */
  function clearTestResults() {
    setTestRows(null);
    setTestRowCount(null);
    setTestError(null);
  }

  /* ---- Sync raw params from config ---- */
  useEffect(() => {
    setParamsText(serializeParams(config.params));
  }, [config.params]);

  /* ---- Sync builder from external _builderState changes (e.g. RawJsonFallback) ---- */
  const builderStateRef = useRef(config._builderState);

  useEffect(() => {
    // Only react to external changes (not our own pushBuilderToConfig calls)
    if (builderStateRef.current === config._builderState) return;
    builderStateRef.current = config._builderState;

    const normalized = normalizeBuilderState(config._builderState);
    if (normalized) {
      setBuilder(normalized);
    } else {
      // _builderState removed or invalid → switch to raw mode
      setMode('raw');
    }

    clearTestResults();
  }, [config._builderState]);

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
      setMetadataUnavailable(null);
      setTestUnavailable(null);
      return;
    }

    // Only reset on actual connection switch, not initial mount
    if (!isInitialMount) {
      setBuilder({ ...EMPTY_BUILDER });
      setColumns([]);
      clearTestResults();
      setMetaError(null);
      setMetadataUnavailable(null);
      setTestUnavailable(null);

      // Clear config query/params so stale SQL cannot be tested against the new connection
      const fresh = { ...EMPTY_BUILDER };
      builderStateRef.current = fresh;
      onChange((prev) => ({
        ...prev,
        query: '',
        params: [],
        _builderState: fresh,
      }));
    }

    let cancelled = false;
    setTablesLoading(true);
    setMetaError(null);
    setMetadataUnavailable(null);

    introspectTables(connectionId)
      .then((result) => {
        if (!cancelled) {
          setTables(result.tables);
          setMetadataUnavailable(null);
        }
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

        const errorMessage = getApiErrorMessage(err, {
          ...messages.errors,
          missingApiRoute: t.metadataUnavailable,
        });

        if (isMissingApiRouteError(err)) {
          setTables([]);
          setColumns([]);
          setMetadataUnavailable(errorMessage);
          return;
        }

        setMetaError(errorMessage);
      })
      .finally(() => {
        if (!cancelled) setTablesLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange is stable, intentionally omitted to avoid loops
  }, [connectionId, messages.errors, t.metadataUnavailable]);

  /* ---- Load columns when table changes ---- */
  useEffect(() => {
    if (!connectionId || !builder.table) {
      setColumns([]);
      return;
    }

    let cancelled = false;
    setColumnsLoading(true);
    setMetaError(null);

    introspectColumns(connectionId, builder.table)
      .then((result) => {
        if (!cancelled) {
          setColumns(result.columns);
          setMetadataUnavailable(null);
        }
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

        const errorMessage = getApiErrorMessage(err, {
          ...messages.errors,
          missingApiRoute: t.metadataUnavailable,
        });

        if (isMissingApiRouteError(err)) {
          setColumns([]);
          setMetadataUnavailable(errorMessage);
          return;
        }

        setMetaError(errorMessage);
      })
      .finally(() => {
        if (!cancelled) setColumnsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [connectionId, builder.table, messages.errors, t.metadataUnavailable]);

  /* ---- Push builder → config whenever builder changes ---- */
  const pushBuilderToConfig = useCallback(
    (next: BuilderState) => {
      const result = generateSql(next, tables, knownColumnNames);
      const patch: Record<string, unknown> = {
        query: result?.query ?? '',
        params: result?.params ?? [],
        _builderState: next,
      };

      // Track our own writes so external-sync effect doesn't re-trigger
      builderStateRef.current = next;

      onChange((prev) => ({ ...prev, ...patch }));
    },
    [onChange, tables, knownColumnNames],
  );

  function updateBuilder(patch: Partial<BuilderState>) {
    setBuilder((prev) => {
      const next = { ...prev, ...patch };
      pushBuilderToConfig(next);
      return next;
    });
    clearTestResults();
  }

  /* ---- Raw SQL handlers ---- */
  function handleQueryChange(value: string) {
    onChange((prev) => ({ ...prev, query: value }));
    clearTestResults();
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

    let query: string;
    let params: unknown[];
    let isMutation: boolean;

    if (mode === 'visual') {
      const result = generateSql(builder, tables, knownColumnNames);
      if (!result) return;
      query = result.query;
      params = result.params;
      isMutation = builder.operation !== 'select';
    } else {
      query = typeof config.query === 'string' ? config.query : '';
      params = Array.isArray(config.params) ? config.params : [];
      const classification = classifyQuery(query);
      if (!classification) return;
      isMutation = classification === 'mutation';
    }

    setTestRunning(true);
    setTestError(null);
    setTestUnavailable(null);
    setTestRows(null);
    setTestRowCount(null);

    try {
      if (isMutation) {
        const result = await testDbMutation(connectionId, query, params);
        setTestRowCount(result.rowCount);
      } else {
        const result = await testDbQuery(connectionId, query, params);
        setTestRows(result.rows);
        setTestRowCount(result.rowCount);
      }
    } catch (err) {
      const errorMessage = getApiErrorMessage(err, {
        ...messages.errors,
        missingApiRoute: t.testUnavailable,
      });

      if (isMissingApiRouteError(err)) {
        setTestUnavailable(errorMessage);
        return;
      }

      setTestError(errorMessage);
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

  /* ---- Test button disabled logic ---- */
  const testDisabled = useMemo(() => {
    if (testRunning) return true;
    if (testUnavailable !== null) return true;

    if (mode === 'visual') {
      const result = generateSql(builder, tables, knownColumnNames);
      return !result;
    }

    // Raw mode
    const query = typeof config.query === 'string' ? config.query : '';
    if (!query) return true;
    if (paramsError !== null) return true;
    if (classifyQuery(query) === null) return true;

    return false;
  }, [
    testRunning,
    mode,
    builder,
    tables,
    knownColumnNames,
    config.query,
    paramsError,
    testUnavailable,
  ]);

  /* ---- Mutation warning ---- */
  const mutationWarning = useMemo(() => {
    if (mode !== 'visual') return null;
    if (
      builder.operation !== 'update' &&
      builder.operation !== 'delete'
    )
      return null;
    if (!builder.table) return null;

    // Check against generated SQL, not filter count
    if (hasEffectiveWhere(sqlPreview)) return null;

    return builder.operation === 'delete'
      ? t.deleteNoFilterWarning
      : t.updateNoFilterWarning;
  }, [mode, builder.operation, builder.table, sqlPreview, t]);

  /* ---- Show result as mutation (rowCount only) vs read (table) ---- */
  const isMutationResult = useMemo(() => {
    if (mode === 'visual') return builder.operation !== 'select';
    const query = typeof config.query === 'string' ? config.query : '';
    return classifyQuery(query) === 'mutation';
  }, [mode, builder.operation, config.query]);

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  const modeTabClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold transition ${
      active
        ? 'bg-slate-900 text-white shadow-sm'
        : 'bg-white text-slate-600 hover:bg-slate-100'
    }`;

  const opTabClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold transition ${
      active
        ? 'bg-amber-500 text-white shadow-sm'
        : 'bg-white text-slate-600 hover:bg-amber-50'
    }`;

  // Fields visible per operation
  const showColumns = builder.operation === 'select';
  const showFilters =
    builder.operation === 'select' ||
    builder.operation === 'update' ||
    builder.operation === 'delete';
  const showOrderBy = builder.operation === 'select';
  const showLimit = builder.operation === 'select';
  const showSetValues =
    builder.operation === 'insert' || builder.operation === 'update';

  return (
    <div className="min-w-0 space-y-5">
      {/* Mode toggle */}
      <div className="flex flex-wrap gap-1.5 rounded-[1.4rem] border border-slate-900/10 bg-slate-50 p-1">
        <button
          className={modeTabClass(mode === 'visual')}
          onClick={() => {
            setMode('visual');
            clearTestResults();
          }}
          type="button"
        >
          {t.modeVisual}
        </button>
        <button
          className={modeTabClass(mode === 'raw')}
          onClick={() => {
            setMode('raw');
            clearTestResults();
          }}
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
          ) : metadataUnavailable ? (
            <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm leading-6 text-amber-800 break-words">
              <p>{metadataUnavailable}</p>
              <button
                className="rounded-full border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                onClick={() => setMode('raw')}
                type="button"
              >
                {t.switchToRawSql}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Operation selector */}
              <div className="flex flex-wrap gap-1.5 rounded-[1.4rem] border border-slate-900/10 bg-slate-50 p-1">
                {OPERATIONS.map((op) => (
                  <button
                    key={op}
                    className={opTabClass(builder.operation === op)}
                    onClick={() =>
                      updateBuilder({
                        operation: op,
                        // Reset operation-specific fields on switch
                        ...(op !== builder.operation
                          ? {
                              columns: [],
                              filters: [],
                              setValues: [],
                              orderBy: { column: '', direction: 'ASC' as const },
                            }
                          : {}),
                      })
                    }
                    type="button"
                  >
                    {opLabels[op]}
                  </button>
                ))}
              </div>

              {/* Table selector */}
              <label className="block">
                <span className="muted-label">{t.selectTable}</span>
                {tablesLoading ? (
                  <p className="mt-2 text-xs text-slate-400">
                    {t.loadingTables}
                  </p>
                ) : (
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                    onChange={(e) =>
                      updateBuilder({
                        table: e.target.value,
                        columns: [],
                        filters: [],
                        setValues: [],
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
                {!tablesLoading &&
                  !metadataUnavailable &&
                  tables.length === 0 &&
                  connectionId && (
                  <p className="mt-2 text-xs text-slate-400">{t.noTables}</p>
                )}
              </label>

              {metaError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm leading-6 text-rose-700 break-words whitespace-pre-wrap">
                  {t.introspectionError}: {metaError}
                </div>
              )}

              {/* Columns (SELECT only) */}
              {showColumns && builder.table && (
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

              {/* Set Values (INSERT / UPDATE) */}
              {showSetValues && builder.table && columns.length > 0 && (
                <div>
                  <span className="muted-label">{t.setValues}</span>
                  <div className="mt-2 space-y-2">
                    {builder.setValues.map((row, index) => (
                      <div key={index} className="flex flex-wrap items-start gap-2">
                        <select
                          className="min-w-[10rem] flex-1 rounded-xl border border-slate-900/10 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
                          onChange={(e) => {
                            const next = [...builder.setValues];
                            next[index] = { ...row, column: e.target.value };
                            updateBuilder({ setValues: next });
                          }}
                          value={row.column}
                        >
                          <option value="">{t.setValueColumn}</option>
                          {columns.map((col) => (
                            <option key={col.name} value={col.name}>
                              {col.name}
                            </option>
                          ))}
                        </select>

                        <div className="min-w-0 flex-1">
                          <TemplatedField
                            label=""
                            placeholder={t.setValuePlaceholder}
                            value={row.value}
                            onValueChange={(val) => {
                              const next = [...builder.setValues];
                              next[index] = { ...row, value: val };
                              updateBuilder({ setValues: next });
                            }}
                          />
                        </div>

                        <button
                          aria-label={t.removeSetValueAriaLabel}
                          className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => {
                            const next = builder.setValues.filter(
                              (_, i) => i !== index,
                            );
                            updateBuilder({ setValues: next });
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
                          setValues: [
                            ...builder.setValues,
                            { column: '', value: '' },
                          ],
                        })
                      }
                      type="button"
                    >
                      + {t.addSetValue}
                    </button>
                  </div>
                </div>
              )}

              {/* Filters (SELECT, UPDATE, DELETE) */}
              {showFilters && builder.table && columns.length > 0 && (
                <div>
                  <span className="muted-label">{t.filters}</span>
                  <div className="mt-2 space-y-2">
                    {builder.filters.map((filter, index) => (
                      <div key={index} className="flex flex-wrap items-start gap-2">
                        <select
                          className="min-w-[10rem] flex-1 rounded-xl border border-slate-900/10 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
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

              {/* Order by (SELECT only) */}
              {showOrderBy && builder.table && columns.length > 0 && (
                <div className="flex flex-wrap items-end gap-3">
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

              {/* Limit (SELECT only) */}
              {showLimit && builder.table && (
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

              {/* Mutation warning */}
              {mutationWarning && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-700">
                  {mutationWarning}
                </div>
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
          <pre className="mt-2 overflow-x-auto rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 font-mono text-xs leading-5 text-slate-700 whitespace-pre-wrap break-words">
            {sqlPreview}
          </pre>
        </div>
      )}

      {/* ---- TEST BUTTON ---- */}
      {connectionId && (
        <div>
          <button
            className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100 disabled:opacity-50"
            disabled={testDisabled}
            onClick={() => void handleTest()}
            type="button"
          >
            {testRunning ? t.testRunning : t.testButton}
          </button>

          {testError && (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm leading-6 text-rose-700 break-words whitespace-pre-wrap">
              {t.testError}: {testError}
            </div>
          )}

          {testUnavailable && (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm leading-6 text-amber-800 break-words whitespace-pre-wrap">
              {testUnavailable}
            </div>
          )}

          {/* Mutation result: rowCount only */}
          {isMutationResult && testRowCount !== null && !testRows && (
            <div className="mt-3 rounded-2xl border border-slate-900/10 bg-white px-4 py-3">
              <p className="text-xs font-semibold text-slate-600">
                {t.testMutationResult(testRowCount)}
              </p>
            </div>
          )}

          {/* Read result: table */}
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
                              className="px-3 py-2 text-slate-700 break-words"
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
