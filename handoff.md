# Handoff

> Обновляется после каждой завершённой задачи. Новая сессия начинается с чтения этого файла.

## Текущее состояние
- **Последнее изменение**: TASK-039 — `inspector cleanup + compact flow-order hint`
- **Статус проекта**: backlog v1 закрыт + post-v1 fix закрыт + TASK-018–039 закрыты
- **Что сделано в TASK-039**:
  - `apps/web/src/components/editor/NodeSidebar.tsx` — collapsed `Порядок сборки` ужат в compact one-line cue с меньшим контейнером; expanded state оставляет полный flow-order affordance без постоянного vertical overhead
  - `apps/web/src/components/editor/ConfigPanel.tsx` — правый inspector пересобран в более строгий rail: compact header, единый summary block, quieter empty state и calmer connection/settings sections без лишней вложенности
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — правый desktop rail слегка расширен, сохраняя приоритет левого toolbox
  - **Проверки TASK-039**:
    - `pnpm --filter @mini-zapier/web build`
- **Что сделано в TASK-038**:
  - `apps/web/src/components/editor/NodeSidebar.tsx` — flow-order hint сделан collapsible; после появления узлов он автоматически схлопывается, но остаётся доступным вручную
  - `apps/web/src/components/editor/ConfigPanel.tsx` — правый inspector переработан в более современный rail-style и теперь ближе к левой библиотеке по header hierarchy, density и section composition
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — desktop grid слегка расширен под правый inspector, не ломая приоритет node library
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — добавлены строки для collapsible guidance/drag hint
  - **Проверки TASK-038**:
    - `pnpm --filter @mini-zapier/web build`
- **Что сделано в TASK-037**:
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — desktop editor grid updated so the left node library rail is now wider than the right inspector
  - `apps/web/src/components/editor/NodeSidebar.tsx` — библиотека узлов переведена в cleaner tool-rail: compact header, short flow-order cue, flatter section hierarchy и более плотные draggable rows вместо stacked nested cards
  - Визуальный акцент left rail упрощён: меньше тяжёлых tinted containers, больше scanability и clear tool-list feel
  - **Проверки TASK-037**:
    - `pnpm --filter @mini-zapier/web build`
- **Что сделано в TASK-036**:
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — desktop grid rails widened to better fit RU copy without crushing the canvas
  - `apps/web/src/components/editor/NodeSidebar.tsx` — левая библиотека пересобрана в cleaner list-driven layout: flatter onboarding steps, stronger section headers, simpler draggable items without nested badge noise
  - `apps/web/src/components/editor/ConfigPanel.tsx` — empty inspector state перепакован в более собранный placeholder с hero-card и compact step list
  - **Проверки TASK-036**:
    - `pnpm --filter @mini-zapier/web build`
- **Что сделано в TASK-035**:
  - `apps/web/src/layouts/EditorLayout.tsx`, `apps/web/src/pages/WorkflowEditorPage.tsx` — editor route переведён в desktop `h-screen` shell с `overflow-hidden`; workspace grid теперь использует `minmax(0,1fr)`, поэтому canvas и rails перестали раздувать страницу по высоте
  - `apps/web/src/components/editor/FlowCanvas.tsx` — canvas shell получил корректный `min-h-0`, header слегка уплотнён, чтобы освободить больше vertical space под рабочую область
  - `apps/web/src/components/editor/NodeSidebar.tsx`, `apps/web/src/components/editor/ConfigPanel.tsx` — левая palette и правый inspector уплотнены по padding/typography/card density без изменения editor mechanics
  - **Проверки TASK-035**:
    - `pnpm --filter @mini-zapier/web build`
- **Что сделано в TASK-034**:
  - `apps/web/src/locale/*` — добавлены словари `en`/`ru`, shared locale helpers, `LocaleProvider` и `useLocale` без новой зависимости
  - `apps/web/src/components/AppHeader.tsx` — добавлен переключатель `EN / RU` в header с persistence через `localStorage`
  - `apps/web/src/pages/*`, `apps/web/src/components/dashboard/*`, `apps/web/src/components/execution/*`, `apps/web/src/components/editor/*`, `apps/web/src/components/ui/*` — user-facing copy вынесен в централизованные словари
  - `apps/web/src/lib/api/client.ts`, `apps/web/src/stores/workflow-editor.store.ts` — frontend fallback/error copy и workflow validation переведены на locale-aware messages без изменения routing/API/editor mechanics
  - `LocaleProvider` теперь управляет `document.documentElement.lang`, форматированием дат/времени/длительностей и сохранением выбора языка между перезагрузками
  - **Проверки TASK-034**:
    - `pnpm --filter @mini-zapier/web build`
    - headless smoke на локальном `vite preview` + mock API: `login`, `dashboard`, `workflow editor`, `execution history`, `404`, `empty states`, `header switcher`, persistence после reload
- **Follow-up после TASK-034**:
  - `apps/web/src/components/editor/nodes/ActionNode.tsx`, `TriggerNode.tsx`, `apps/web/src/components/execution/StepLogViewer.tsx` — стандартные названия шагов (`HTTP Request`, и т.п.) сохранены как canonical labels, сырые enum-коды (`HTTP_REQUEST`, `DATA_TRANSFORM`) убраны из UI
  - `apps/web/src/components/editor/config-forms/DataTransformConfig.tsx`, `HttpRequestConfig.tsx`, `apps/web/src/components/editor/ConnectionCreateDialog.tsx` — оставшиеся hardcoded `aria-label` и template placeholder вынесены в locale dictionaries
  - `apps/web/src/locale/messages.ru.ts` — выправлены отдельные русские UI-строки (`Приостановить`, `Редактировать`, `сервером`) без перевода стандартных technical names
  - **Проверки follow-up**:
    - `pnpm --filter @mini-zapier/web build`
- **Follow-up после TASK-033**:
  - `apps/web/src/components/AppHeader.tsx` — header переведён на responsive mobile layout: brand остаётся сверху, nav + logout занимают отдельную строку без horizontal overflow
  - **Проверки follow-up**:
    - `pnpm --filter @mini-zapier/web build`
    - mobile smoke dashboard/editor на `390px` через локальный `vite preview` + Playwright mock API (`scrollWidth === innerWidth`)
- **Что сделано в TASK-018**:
  - **Deploy конфигурация**:
    - `deploy/Dockerfile.api` — multi-stage build с `pnpm deploy --legacy`, Prisma CLI, pg_isready, wget
    - `deploy/Dockerfile.worker` — multi-stage build с `pnpm deploy --legacy`
    - `deploy/docker-compose.prod.yml` — PostgreSQL + Redis + API + Worker, healthchecks, depends_on (reverse proxy вынесен в host nginx на VPS)
    - `deploy/api-entrypoint.sh` — pg_isready wait + prisma migrate deploy + start
    - `deploy/nginx.mini-zapier-api.conf.example` — пример host nginx `location ^~ /mini-zapier/` внутри существующего `api.memelab.ru`, проксирующий в `127.0.0.1:3000`
    - `deploy/deploy.sh` — build + up + health check
    - `deploy/.env.production.example` — all required env vars
    - `vercel.json` — buildCommand, outputDirectory, `/api/*` rewrite to VPS
    - `.dockerignore` — node_modules, dist, .env, .git, etc.
  - **Auth module (backend)**:
    - `apps/api/src/auth/auth.service.ts` — signed cookie HMAC-SHA256, verify, login/logout
    - `apps/api/src/auth/auth.controller.ts` — POST login (public), POST logout, GET me (public, auth-aware)
    - `apps/api/src/auth/auth.guard.ts` — global guard, checks signed cookie, skips @Public()
    - `apps/api/src/auth/public.decorator.ts` — @Public() decorator
    - `apps/api/src/auth/auth.module.ts` — registers guard as APP_GUARD
  - **Health endpoint**: `apps/api/src/health/health.controller.ts` — GET /api/health (public)
  - **Public trigger routes**: `@Public()` added to `TriggerController` (webhooks + inbound-email)
  - **main.ts updates**: cookie-parser middleware, CORS from CORS_ORIGIN env with credentials:true, Swagger disabled in production
  - **app.module.ts**: AuthModule + HealthController registered
  - **Auth module (frontend)**:
    - `apps/web/src/pages/LoginPage.tsx` — login form, redirect if already authenticated
    - `apps/web/src/components/auth/ProtectedRoute.tsx` — checks /api/auth/me, redirects to /login
    - `apps/web/src/lib/api/auth.ts` — login/logout/getMe API functions
    - `apps/web/src/App.tsx` — /login route, product routes wrapped in ProtectedRoute
    - `apps/web/src/layouts/AppLayout.tsx` — Logout button in header
    - `apps/web/src/lib/api/client.ts` — withCredentials: true
  - **package.json updates**:
    - Root: engines.node >=22, packageManager pnpm@10.25.0
    - apps/api: cookie-parser in dependencies, prisma moved from devDependencies to dependencies
  - **Проверки прошли**:
    - `pnpm install --frozen-lockfile`
    - `pnpm build` (shared + api + worker + web)
    - `pnpm --filter @mini-zapier/web run e2e` против `https://mini-zapier-web-silk.vercel.app` (auth + live browser smoke)
- **Что сделано в TASK-019**:
  - `apps/web/src/stores/workflow-editor.store.ts` — `validateWorkflowGraph()` доведён до backend-инвариантов: missing node refs, self-referencing edges, duplicate edges, ровно 1 trigger, ровно 1 outgoing у trigger, max 1 in/out у action, ровно 1 terminal action, cycle/disconnected chain check
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — `handleSave()` сначала запускает client-side validation и показывает ошибки в existing page error banner без запроса в API
  - `apps/web/src/components/editor/FlowCanvas.tsx` — попытка добавить второй trigger блокируется на UI и показывает `Only one trigger is allowed per workflow.`
  - `apps/web/e2e/ui-smoke.spec.ts` — добавлены regression tests на duplicate trigger, save с lone trigger и save с disconnected chains
  - **Проверки TASK-019**:
    - `pnpm --filter @mini-zapier/web run build`
    - `pnpm --filter @mini-zapier/web run e2e` — не прошёл запуск на этой машине, потому что отсутствует env `MINI_ZAPIER_E2E_PASSWORD`
    - live verification на `https://mini-zapier-web-silk.vercel.app` — `PASS` по сценариям: duplicate trigger block, lone trigger pre-save validation, disconnected nodes pre-save validation, happy path save
- **Что сломано**:
  - Критичных известных поломок не выявлено
- **Фактический deploy status**:
  - GitHub repo создан: `batalovmv/mini-zapier`
  - Vercel frontend: `https://mini-zapier-web-silk.vercel.app`
  - VPS checkout: `/opt/mini-zapier`
  - production env создан на VPS: `/opt/mini-zapier/deploy/.env`
  - Stack на VPS поднят: `postgres`, `redis`, `api`, `worker`
  - Public backend path: `https://api.memelab.ru/mini-zapier/api/*`
  - Smoke прошёл:
    - `http://155.212.172.136:3000/api/health` -> timeout from external network
    - `https://api.memelab.ru/mini-zapier/api/health` -> `200` `{"status":"ok"}`
    - `https://mini-zapier-web-silk.vercel.app/api/health` -> `200` `{"status":"ok"}`
    - `GET /api/workflows` через Vercel без cookie -> `401`
    - `POST /api/auth/login` через Vercel -> `200` + `Set-Cookie`
    - `GET /api/auth/me` через Vercel с cookie -> `200`
    - `GET /api/workflows` через Vercel с cookie -> `200`
  - Opus live verification после `TASK-019` прошла: duplicate trigger block, pre-save validation и happy path на deploy подтверждены
- **Что сделано в TASK-020**:
  - Удалены тестовые workflows ("Opus Live Check", "Opus Smoke Test") с production dashboard
  - `deploy/docker-compose.prod.yml` — порт API привязан к loopback: `127.0.0.1:3000:3000` (вместо `0.0.0.0:3000:3000`)
  - `deploy/nginx.mini-zapier-api.conf.example` переименован в `deploy/nginx.mini-zapier-api.conf` — production-ready nginx location block
  - `vercel.json` — rewrite destination изменён с `http://155.212.172.136:3000/api/:path*` на `https://api.memelab.ru/mini-zapier/api/:path*`
  - `deploy/deploy.sh` — без изменений (health check по `127.0.0.1:3000` остаётся корректным)
  - VPS rollout завершён: nginx config применён, stack перезапущен, loopback binding активен, внешний доступ к `:3000` закрыт
  - Итог проверок:
    - raw `:3000` извне недоступен
    - login через Vercel работает, cookie выставляется
    - dashboard в браузере загружается, production dashboard чистый (`0 workflows`)
- **Что сделано в TASK-023**:
  - Удалён dev/scaffold copy из 9 файлов: `"Frontend scaffold"`, `"React Flow editor"`, `"TASK-014/015/016"` references, raw UUID в selected-state
  - `WorkflowEditorPage.tsx` — compact toolbar: single row (← Back | name input | status pill + version | Save/Activate/Run)
  - `WorkflowEditorPage.tsx` — toast cleanup: `"Workflow created successfully."` вместо raw ID, `"Execution started."` вместо raw executionId
  - `DashboardPage.tsx` — toast cleanup: `"execution started"` вместо raw executionId
  - `FlowCanvas.tsx` — `"Editing: HTTP Request"` вместо raw UUID selectedNodeId
  - `LoginPage.tsx` — inline error с очисткой при изменении полей
  - Disabled Activate/Run кнопки получили `title="Save the workflow first"`
  - `NotFoundPage.tsx` — user-facing 404 copy
  - `NodeSidebar.tsx`, `ConfigPanel.tsx` — user-facing описания вместо TASK refs
- **Что сделано в TASK-022**:
  - `apps/api/src/common/validate-env.ts` — fail-fast валидация env (`DATABASE_URL`, `APP_ENCRYPTION_KEY`, `AUTH_PASSWORD`, `AUTH_SESSION_SECRET`) до `NestFactory.create()`
  - `apps/worker/src/common/validate-env.ts` — fail-fast валидация env (`DATABASE_URL`, `APP_ENCRYPTION_KEY`) до `NestFactory.createApplicationContext()`
  - `apps/api/src/main.ts` — вызов `validateApiEnv()` перед bootstrap
  - `apps/worker/src/main.ts` — вызов `validateWorkerEnv()` перед bootstrap
  - `apps/api/src/health/health.controller.ts` — `GET /api/readiness` с проверкой PostgreSQL (Prisma `SELECT 1`) и Redis (ioredis one-shot client, 3s timeout)
  - `apps/api/package.json` — добавлен `ioredis@^5.9.0` как прямая зависимость
  - Задеплоено и проверено на VPS:
    - `GET /api/health` → `200 {"status":"ok"}`
    - `GET /api/readiness` → `200 {"status":"ready","checks":{"postgres":"ok","redis":"ok"}}`
    - Worker стартует с env validation
- **Что сделано в TASK-021**:
  - `@nestjs/throttler@^6.5.0` добавлен в `apps/api/package.json`
  - follow-up: specifier в `apps/api/package.json` и `pnpm-lock.yaml` синхронизирован и зафиксирован как `^6.5.0`
  - `apps/api/src/main.ts` — `trust proxy: 1` для корректного извлечения client IP за nginx
  - `apps/api/src/app.module.ts` — `ThrottlerModule.forRoot()` с двумя named throttlers: `login` (5/60s), `trigger` (30/60s)
  - `apps/api/src/auth/auth.controller.ts` — `@UseGuards(ThrottlerGuard)` + `@Throttle({ login: ... })` на `POST /api/auth/login`
  - `apps/api/src/trigger/trigger.controller.ts` — `@UseGuards(ThrottlerGuard)` + `@Throttle({ trigger: ... })` на webhook и inbound-email
  - `decisions.md` — DEC-013 зафиксирован
  - Задеплоено и проверено: 6-й login request → 429, health/valid login через Vercel работает
- **Root scripts**:
  - `pnpm install --frozen-lockfile` работает
  - `pnpm build` работает
  - `pnpm dev:api` работает, если порт `3000` свободен; для локального smoke по-прежнему удобно использовать `PORT=3001`
  - `pnpm dev:worker` работает
  - `pnpm dev:web` работает, если порт `5173` свободен
  - `pnpm --filter @mini-zapier/web run e2e` запускает Playwright smoke

- **Что сделано в TASK-024**:
  - `.github/workflows/ci.yml` — GitHub Actions CI pipeline
  - **`build` job** (обязательный gate): checkout → pnpm setup → Node 22 + pnpm cache → `pnpm install --frozen-lockfile` → `pnpm build`
  - **`e2e` job** (optional, после build): запускается только на `push` в main И если задана `vars.MINI_ZAPIER_E2E_BASE_URL`; устанавливает Playwright Chromium, прогоняет smoke против deploy URL
  - E2E env: `MINI_ZAPIER_E2E_BASE_URL` и `MINI_ZAPIER_E2E_USERNAME` из repository variables, `MINI_ZAPIER_E2E_PASSWORD` из secrets, `MINI_ZAPIER_E2E_ECHO_URL` из variables
  - Concurrency group `ci-${{ github.ref }}` с `cancel-in-progress: true`

- **Что сделано в TASK-025**:
  - **Backend**: `apps/api/src/execution/available-fields.util.ts` — `resolveChainPositions()`, `extractFieldPaths()`, `computeChainSignature()`, `parseSnapshotForChain()`
  - **Backend**: `apps/api/src/execution/dto/available-fields-response.dto.ts` — DTO + Swagger
  - **Backend**: `execution.service.ts` — `getAvailableFields(workflowId)`: finds compatible SUCCESS execution via chain signature matching, skips empty manual runs, returns field paths per chain position
  - **Backend**: `execution.controller.ts` — `GET /api/workflows/:id/available-fields` endpoint
  - **Frontend**: `apps/web/src/lib/editor-chain.ts` — `computeChainPosition()`, `computeStructuralFingerprint()`
  - **Frontend**: `apps/web/src/stores/workflow-editor.store.ts` — added `savedStructuralFingerprint` field, set in `loadWorkflow()`, cleared in `resetEditor()`
  - **Frontend**: `apps/web/src/lib/api/executions.ts` — `getAvailableFields()` API client
  - **Frontend**: `apps/web/src/lib/api/types.ts` — `AvailableFieldsResponse`, `AvailableFieldsPosition` types
  - **Frontend**: `apps/web/src/components/editor/FieldPicker.tsx` — shared module-level cache with dedup, `useAvailableFields()` hook, `FieldPicker` component with ⚡ dropdown, `insertAtCursor()` and `insertAtCursorRecord()` utilities
  - **Frontend**: Config forms integration — DataTransformConfig (template + mapping values), HttpRequestConfig (url + body + header values), EmailActionConfig (subject + body), TelegramConfig (message)
  - **Excluded**: DbQueryConfig (JSON.parse validation conflicts with raw template insertion)
  - **Key design decisions**:
    - Position-based keying (not nodeId) since server regenerates IDs on every PUT
    - Chain signature (trigger type + ordered action types) for structural compatibility between current workflow and execution snapshot
    - Shared module-level cache with inflight dedup (multiple picker instances = 1 API call)
    - Force refetch on dropdown open (covers Run-from-editor scenario)
    - `savedStructuralFingerprint` in Zustand store (set on load, not on local edits) — when mismatch, picker hides fields and shows "Save workflow to update"
    - `insertAtCursor` uses existing `onChange((prev) => ...)` pattern, no new local state
    - Blank-key guard: picker hidden for mapping/header rows with empty key
    - `available-fields` response now returns `emptyState` (`NO_EXECUTIONS` | `INCOMPATIBLE_EXECUTIONS` | `NO_FIELDS`) so UI shows the correct assistive hint for empty dropdowns
    - Documentation synced with delivered scope: picker is button-driven (`⚡`), `DbQueryConfig` remains excluded from this slice

- **Что сделано в TASK-027**:
  - `apps/web/src/components/editor/config-forms/WebhookConfig.tsx` — полная переработка:
    - **Copy URL** кнопка — копирует полный webhook URL в clipboard
    - **Copy curl** кнопка — копирует однострочную curl-команду с `<your-secret>` placeholder
    - Обе кнопки `disabled` когда `workflowId === null` (workflow ещё не сохранён)
    - URL input: monospace шрифт + `title` tooltip с полным URL
    - `toast.success('Copied!')` при успехе, `toast.error(...)` при отказе clipboard API
    - Hint про `Idempotency-Key` / `X-Event-ID` показан отдельным текстом в UI (не в curl)
    - `X-Webhook-Secret` hint оформлен с `<code>` тегом
  - **Проверки**: `pnpm --filter @mini-zapier/web run build` — OK
- **Что сделано в TASK-028**:
  - **Backend**:
    - `apps/api/src/execution/dto/list-executions-query.dto.ts` — `status` query filter (`SUCCESS` | `FAILED` | `IN_PROGRESS`) для `GET /api/workflows/:id/executions`
    - `apps/api/src/execution/execution.service.ts` — filtered history list + aggregate counts `{all, success, failed, inProgress}` по всему workflow
    - `apps/api/src/execution/execution.controller.ts` — Swagger summary/description обновлены под filter + counts
  - **Frontend**:
    - `apps/web/src/lib/api/types.ts` — history params/response расширены `status` и `counts`
    - `apps/web/src/pages/ExecutionHistoryPage.tsx` — state for active tab, page reset on filter change, polling по `counts.inProgress`
    - `apps/web/src/components/execution/ExecutionTable.tsx` — tabs `All | Success | Failed | In progress`, counters, filter-aware empty states
  - **Проверки TASK-028**:
    - `pnpm --filter @mini-zapier/api build`
    - `pnpm --filter @mini-zapier/web build`

- **Что сделано в TASK-026**:
  - `apps/web/src/components/editor/config-forms/DataTransformConfig.tsx` — mapping rows switched to a two-line layout inside compact cards, so key and value each get full row width; remove control stays compact `×`; placeholders remain `key` / `value`
  - `apps/web/src/components/editor/config-forms/HttpRequestConfig.tsx` — header rows switched to a two-line layout inside compact cards, so header name and value each get full row width; remove control stays compact `×`; placeholders remain `header name` / `header value`
  - `FieldPicker` stays on the second line next to the value input; the existing `h-6 w-6` spacer is preserved for empty keys, so row rhythm stays stable
  - **Проверки TASK-026**:
    - `pnpm --filter @mini-zapier/web run build`
    - browser visual smoke в этой сессии не запускался

- **Что сделано в TASK-029**:
  - `apps/web/src/components/AppHeader.tsx` — вынесен общий sticky header с nav/logout, который переиспользуется обоими layout'ами
  - `apps/web/src/layouts/EditorLayout.tsx` — добавлен отдельный wide layout для editor route без `max-w-[1680px]` на основном контенте
  - `apps/web/src/layouts/AppLayout.tsx` — inline header удалён, обычные страницы продолжают использовать общий centered container
  - `apps/web/src/App.tsx` — editor route вынесен в отдельную ветку под `ProtectedRoute`, dashboard/history остались под `AppLayout`
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — страница переведена на `flex` + `min-h-0` layout; toolbar фиксируется по контенту, рабочая grid-область забирает оставшуюся высоту
  - `apps/web/src/components/editor/FlowCanvas.tsx` — fixed heights `780px/820px` убраны; canvas теперь тянется через `h-full` / `flex-1`
  - `NodeSidebar` и `ConfigPanel` продолжают работать внутри `h-full` flex-контейнеров с независимым vertical scroll в desktop layout
  - **Проверки TASK-029**:
    - `pnpm --filter @mini-zapier/web build`
    - browser visual smoke в этой сессии не запускался

- **Что сделано в TASK-030**:
  - `apps/web/src/pages/DashboardPage.tsx` — hero блок уплотнён: меньше вертикальный размер, компактнее CTA и tighter spacing между dashboard sections
  - `apps/web/src/components/dashboard/StatsOverview.tsx` — усилены заголовок секции, metric card contrast и scanability за счёт tighter panel spacing, pills и более явных value tones
  - `apps/web/src/components/dashboard/WorkflowList.tsx` — усилен section header, tightened panel spacing и снижены зазоры между workflow cards
  - **Проверки TASK-030**:
    - `pnpm --filter @mini-zapier/web build`
    - desktop visual smoke dashboard через локальный `vite preview` + Playwright mock API
- **Что сделано в TASK-031**:
  - `apps/web/src/components/editor/FlowCanvas.tsx` — canvas empty state переработан в более явный onboarding: шаги `trigger -> actions`, drop-zone framing, stronger drag-over hint и промежуточные подсказки после первого шага
  - `apps/web/src/components/editor/NodeSidebar.tsx` — левая библиотека стала более похожа на tool rail: build-order guidance, усиленные section cards для triggers/actions, stronger draggable item hierarchy
  - `apps/web/src/components/editor/ConfigPanel.tsx` — правый inspector получил более явный empty state, workspace guidance и более структурированную иерархию выбранной ноды
  - `apps/web/src/index.css` — добавлены editor-specific surface styles для rail/canvas background hierarchy без изменения editor mechanics
  - **Проверки TASK-031**:
    - `pnpm --filter @mini-zapier/web build`
    - desktop visual smoke empty editor через локальный `vite preview` + Playwright screenshot с mock `GET /api/auth/me` и `GET /api/connections`

- **Что сделано в TASK-032**:
  - `apps/web/src/components/dashboard/WorkflowCard.tsx` — workflow cards переведены в более плотный grid-layout с отдельным operational block для `workflow status` и `last execution`; вторичная мета-информация ужата, action-row визуально приглушён без изменения поведения
  - `apps/web/src/components/dashboard/WorkflowList.tsx` — секция workflow list получила tighter spacing и более scan-friendly section header
  - `apps/web/src/index.css` — добавлены dashboard-specific card surfaces с status accent rail/background для более быстрой навигации по списку
  - **Проверки TASK-032**:
    - `pnpm --filter @mini-zapier/web build`
    - desktop visual smoke dashboard workflow list через локальный `vite preview` + Playwright screenshot с mock `GET /api/auth/me`, `GET /api/stats`, `GET /api/workflows`, `GET /api/workflows/:id/executions`
- **Что сделано в TASK-033**:
  - `apps/web/src/index.css` — усилены глобальные surface tokens, contrast borders, shadows и accent hierarchy для primary/secondary panels
  - `apps/web/src/components/AppHeader.tsx`, `apps/web/src/layouts/AppLayout.tsx` — header и page shell получили более выразительный brand/accent framing без смены структуры маршрутов
  - `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/components/dashboard/StatsOverview.tsx`, `apps/web/src/components/dashboard/WorkflowList.tsx`, `apps/web/src/components/dashboard/WorkflowCard.tsx` — dashboard секции, CTA и workflow cards разведены по визуальному весу и считываются быстрее
  - `apps/web/src/pages/WorkflowEditorPage.tsx`, `apps/web/src/components/editor/FlowCanvas.tsx`, `apps/web/src/components/editor/NodeSidebar.tsx`, `apps/web/src/components/editor/ConfigPanel.tsx` — canvas стал главной surface editor, rails и inspector ушли во вторичный вес, spacing и panel contrast выровнены
  - **Проверки TASK-033**:
    - `pnpm --filter @mini-zapier/web build`
    - desktop visual smoke dashboard/editor через локальный `vite preview` + Playwright screenshots с mock `GET /api/auth/me`, `GET /api/stats`, `GET /api/workflows`, `GET /api/workflows/:id/executions`, `GET /api/connections`
## Следующий шаг
Новых TASK в текущем `backlog.md` после `TASK-039` не осталось. Следующий шаг — добавить новый TASK или новый backlog-срез.

## Блокеры
- На текущей машине не задан env `MINI_ZAPIER_E2E_PASSWORD`, поэтому локальный Playwright smoke с login-сценарием сейчас не запускается.

- На машине во время проверки порт `3000` был занят внешним процессом (`D:\TZ\Finance_tracker\src\server.ts`), а порт `5173` — внешним Vite-процессом (`D:\TZ\Finance_tracker\client`). Для smoke-проверок использовались `3001`, `5174`, `5175`, `5176`, `5177`, `5178`.
- `apps/web/package.json` использует `"@mini-zapier/shared": "file:../../packages/shared"` как обход зависающего `pnpm install` и несовместимости `npm` с `workspace:*`.

## Важные заметки
- **Порты инфраструктуры**: PostgreSQL=**5434**, Redis=**6380**
- Workflow node ids в create/update payload теперь трактуются только как client-local references для связи nodes ↔ edges; persisted ids генерируются сервером и приходят обратно в API response
- Для `apps/web` Vite proxy по умолчанию шлёт `/api/*` на `http://localhost:3000`; для локального smoke можно переопределить target через `VITE_API_PROXY_TARGET`
- `apps/web/playwright.config.ts` по умолчанию ждёт `MINI_ZAPIER_E2E_BASE_URL=http://127.0.0.1:5179`; если прогоняешь e2e на другом порту, передай env явно
- В `ExecutionTable` колонка `trigger` сейчас показывает короткий preview из `triggerData`, потому что текущий `WorkflowExecutionDto` не содержит отдельного поля `source`; backend contract не менялся в рамках `TASK-016`
- В `apps/web/package.json` scripts вызывают локальные бинарники через `node ./node_modules/...`, потому что Windows `.bin` shims в этом окружении срабатывали нестабильно
- Для `ConnectionModule` и webhook secret-check нужен `APP_ENCRYPTION_KEY` в env процесса API; в smoke-проверке он передавался явно при запуске на `3001`
- Для `QueueModule` используются `REDIS_HOST`/`REDIS_PORT`; при отсутствии env в коде выставлен fallback на `localhost:6380`
- Для cron scheduling в API используется отдельная BullMQ queue `workflow-cron-trigger`; `workflow-execution` по-прежнему остаётся очередью для standalone worker
- Для `apps/worker` `start`/`start:dev` читают env из корневого `.env`; это покрывает `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `APP_ENCRYPTION_KEY`
- Для `WorkflowModule` отдельная миграция не понадобилась: использована существующая Prisma schema из TASK-002
- Валидация workflow выполняется в `apps/api/src/workflow/workflow.validation.ts`; при сохранении node ids берутся из payload и затем используются в edges как есть
- Для `apps/api` зафиксирован Prisma **6.19.2**: это оставляет классическую `schema.prisma` и стандартный `PrismaClient` без нового Prisma 7 datasource/runtime слоя
- `pnpm dev:api` перед стартом автоматически делает `prisma generate`
- Cron reconciliation живёт в `apps/api/src/trigger/trigger.service.ts` и запускается на старте API; если scheduler потерян в Redis, ACTIVE cron workflow будет заново зарегистрирован
- Inbound email trigger ожидает `X-Signature` и `Connection.credentials.signingSecret`; подпись считается как HMAC-SHA256 по `rawBody`
- Для `TASK-008` `HTTP_REQUEST` реализован без новой dependency: используется встроенный Node `fetch`, но контракт strategy сохранён (`{ status, headers, data }`), non-2xx ответы считаются ошибкой
- После `pnpm install --prefer-offline` `pnpm-lock.yaml` снова является источником истины для workspace; отдельный npm-installed state для `apps/web` больше не нужен
- После следующего изменения `apps/api/prisma/schema.prisma` запускай `pnpm --filter @mini-zapier/api run prisma:migrate -- --name <migration_name>`
- **Auth**: signed cookie HMAC-SHA256, env vars: `AUTH_USERNAME`, `AUTH_PASSWORD`, `AUTH_SESSION_SECRET`; cookie name `mz_session`, Max-Age 7 дней
- **Public endpoints** (не требуют auth): `POST /api/auth/login`, `GET /api/health`, `GET /api/readiness`, `POST /api/webhooks/:workflowId`, `POST /api/inbound-email/:workflowId`, `GET /api/auth/me` (auth-aware: 200/401)
- **Swagger** отключен при `NODE_ENV=production`; доступен только в dev
- **CORS**: origin из `CORS_ORIGIN` env (comma-separated), fallback `http://localhost:5173`; `credentials: true`
- **Docker**: `deploy/docker-compose.prod.yml` использует `build.context: ..`, поэтому на VPS нужен весь репозиторий, а не только папка `deploy`; порт API привязан к `127.0.0.1:3000` (loopback only) и не доступен извне
- **Vercel**: `vercel.json` rewrite `/api/*` направлен на `https://api.memelab.ru/mini-zapier/api/:path*`; frontend URL сейчас `https://mini-zapier-web-silk.vercel.app`
- **Nginx**: `deploy/nginx.mini-zapier-api.conf` — location block для `api.memelab.ru` HTTPS server, проксирует `/mini-zapier/` → `127.0.0.1:3000/`

---

## Шаблон для новой сессии

Копируй этот промпт при запуске каждого нового чата:

```
Прочитай файлы в корне проекта D:\TZ\mini-zapier:
1. spec-v1.md — замороженная спецификация
2. decisions.md — архитектурные решения
3. backlog.md — список задач со статусами
4. handoff.md — текущее состояние проекта
5. test-checklist.md — обязательные проверки после каждого среза
6. CLAUDE.md — правила проекта и кода для ИИ-агента

Выполни только TASK-XXX.
Не меняй scope и не добавляй новые функции.
Перед правками перечисли, какие файлы будешь менять.
После завершения:
1. Покажи что сделано
2. Какие проверки выполнены
3. Что осталось
4. Обнови backlog.md (статус задачи → done)
5. Обнови handoff.md: «Текущее состояние», «Следующий шаг», добавь строку в таблицу «История»
6. Сделай git коммит: "TASK-XXX: <краткое описание>"
```

## Правила работы
- Один TASK за сессию
- Не расширяй scope
- Читай spec-v1.md и decisions.md перед началом
- После завершения ОБЯЗАТЕЛЬНО:
  1. backlog.md — статус задачи → `done`
  2. handoff.md — обнови «Текущее состояние», «Следующий шаг», добавь строку в таблицу «История»
  3. git commit

---

## История

| Task | Status | Коммит | Заметки |
|------|--------|--------|---------|
| TASK-001 | done | b65ea23 | Monorepo scaffold, docker, shared types |
| TASK-002 | done | см. `git log` (`TASK-002: apps/api scaffold + Prisma schema + migrations`) | apps/api scaffold, PrismaModule/Service, 7-model schema, init migration |
| TASK-003 | done | см. `git log` (`TASK-003: Common utilities (crypto, redact, truncate)`) | packages/server-utils, AES-256-GCM crypto utils, redact/truncate tests |
| TASK-004 | done | см. `git log` (`TASK-004: ConnectionModule CRUD`) | ConnectionModule CRUD, encrypted credentials, masked reads, delete guard, Swagger decorators |
| TASK-005 | done | см. `git log` (`TASK-005: WorkflowModule CRUD + linear validation`) | Workflow CRUD, full graph replace, versioning, linear graph validation, paginated list/status filter |
| TASK-006 | done | см. `git log` (`TASK-006: ExecutionService + TriggerController (webhook + dedupe)`) | ExecutionModule, webhook TriggerController, BullMQ queue setup, atomic dedupe, execution snapshot/enqueue smoke-checked |
| TASK-007 | done | см. `git log` (`TASK-007: apps/worker scaffold + BullMQ processor + execution engine`) | standalone worker, BullMQ consumer, chain resolver, retry/timeout wrapper, step logs, success/failure smoke-checked |
| TASK-008 | done | см. `git log` (`TASK-008: HttpRequestAction + auto-pause + E2E smoke`) | real HTTP_REQUEST strategy, template interpolation, retry smoke, 5x failed auto-pause, dedupe + snapshot/log secrecy checks |
| TASK-009 | done | см. `git log` (`TASK-009: Cron trigger + startup reconciliation`) | separate cron queue/worker in API, register/unregister on PATCH status, re-register on PUT, startup reconciliation, cron dedupe smoke-checked |
| TASK-010 | done | см. `git log` (`TASK-010: Email inbound trigger`) | inbound email endpoint, rawBody HMAC verification, ACTIVE/type guards, provider event dedupe, smoke-checked and cleaned up |
| TASK-011 | done | см. `git log` (`TASK-011: Remaining action strategies (Email, Telegram, DB, Transform)`) | real EMAIL/TELEGRAM/DB_QUERY/DATA_TRANSFORM strategies, registry wiring, worker deps/lock update, build + smoke-checked |
| TASK-012 | done | см. `git log` (`TASK-012: StatsController + Swagger + global middleware`) | `/api/stats`, Swagger UI `/api/docs`, global ValidationPipe/CORS/exception filter, DTO validation + runtime smoke |
| TASK-013 | done | см. `git log` (`TASK-013: Frontend scaffold + API client + layout`) | apps/web scaffold, Tailwind, router, AppLayout, typed axios client, build + dev/proxy smoke |
| TASK-014 | done | см. `git log` (`TASK-014: Dashboard page`) | Zustand dashboard store, live stats cards, workflow cards with Edit/Run/Pause-Activate/Delete, Vite proxy + API smoke |
| TASK-015 | done | см. `git log` (`TASK-015: Workflow Editor (React Flow)`) | React Flow workflow editor, Zustand editor store, drag-and-drop sidebar/canvas/config panel, load-save-status-run wiring, build + route/API smoke |
| TASK-016 | done | см. `git log` (`TASK-016: Execution History + Step Log Viewer`) | execution history page, paginated execution table, step log timeline with JSON viewer, 5s polling for RUNNING executions, dashboard history link |
| TASK-017 | done | см. `git log` (`TASK-017: UI polish + E2E test`) | toasts/loading-empty states/error boundary/confirm dialogs, inline connection create in editor, Playwright UI smoke with webhook -> history -> step logs |
| post-v1-fix | done | см. `git log` (`fix: server-generated node IDs + lockfile sync`) | workflow nodes now get server-generated ids with edge remap; lockfile synced via pnpm; `frozen-lockfile`, root build and Playwright smoke pass again |
| docs | done | — | spec-v1, backlog, decisions, test-checklist, CLAUDE.md — согласованы (см. git log) |
| TASK-018 | done | см. `git log` (`TASK-018: deployment config + minimal admin login`) | deploy config (Docker + public VPS API + Vercel), auth module (signed cookie HMAC), health endpoint, frontend login/logout/protected routes |
| TASK-019 | done | см. `git log` (`TASK-019: workflow editor validation hardening`) | duplicate trigger block, pre-save graph validation, invalid-save regression tests |
| TASK-020 | done | см. `git log` (`TASK-020: production cleanup + origin hardening`) | deleted test workflows, loopback port binding, nginx config, vercel HTTPS rewrite |
| TASK-021 | done | см. `git log` (`TASK-021: proxy-aware rate limiting`) | @nestjs/throttler, trust proxy, login 5/60s, trigger 30/60s, deployed+verified |
| TASK-021 follow-up | done | см. `git log` (`TASK-021: sync throttler version spec`) | package.json + pnpm-lock specifier synced to `@nestjs/throttler@^6.5.0` |
| TASK-022 | done | 1c19f92 | liveness/readiness endpoints, env fail-fast for api+worker, ioredis readiness check, deployed+verified |
| TASK-023 | done | 2a624c1 | remove dev copy, compact toolbar, toast cleanup, inline login error, node label in canvas |
| TASK-024 | done | 9c01091, 2ce1a17 | GitHub Actions CI: build gate + optional e2e smoke |
| TASK-025 | done | см. `git log` | Field picker: available-fields API + FieldPicker component + config form integration |
| TASK-025 follow-up | done | см. `git log` (`TASK-025: fix field picker empty states`) | API/UI empty-state reason + backlog/handoff scope sync |
| TASK-026 | done | см. `git log` | two-line mapping/header rows, compact remove controls, clearer empty placeholders |
| TASK-027 | done | см. `git log` | Copy URL/curl buttons, clipboard toasts, Idempotency-Key hint, monospace URL |
| TASK-028 | done | см. `git log` (`TASK-028: execution history status filters + counters`) | History tabs/counters + API status filter/counts |
| TASK-029 | done | см. `git log` (`TASK-029: workflow editor full-width workspace layout`) | shared header + wide editor layout + viewport-aware canvas sizing |
| TASK-030 | done | см. `git log` (`TASK-030: dashboard visual hierarchy pass`) | compact hero, denser stats/workflow hierarchy, desktop smoke screenshot |
| TASK-031 | done | см. `git log` (`TASK-031: editor empty-state and workspace guidance`) | guided empty canvas, stronger workspace rails, desktop smoke screenshot |
| TASK-032 | done | см. `git log` (`TASK-032: workflow cards density and status emphasis`) | denser dashboard cards, stronger status/last execution emphasis, desktop smoke screenshot |
| TASK-033 | done | см. `git log` (`TASK-033: global visual polish and hierarchy pass`) | stronger global surface contrast, accent hierarchy, dashboard/editor desktop smoke screenshots |
| TASK-033 follow-up | done | см. `git log` (`TASK-033: fix mobile header overflow`) | responsive AppHeader fix for narrow screens, 390px smoke recheck |
| TASK-034 | done | см. `git log` (`TASK-034: web language switcher EN/RU`) | locale infrastructure, EN/RU switcher, centralized copy, locale-aware date/time formatting, build + preview smoke with mock API |
| TASK-034 follow-up | done | см. `git log` (`TASK-034: localization copy cleanup`) | canonical node labels kept untranslated, raw enum labels removed from UI, leftover aria-labels localized, RU copy polished |
| TASK-035 | done | см. `git log` (`TASK-035: editor viewport containment + rail density`) | desktop editor shell constrained to viewport, rails compacted, internal scroll preserved |
| TASK-036 | done | см. `git log` (`TASK-036: editor rail visual cleanup`) | wider desktop rails, cleaner node library, simplified empty inspector state |
| TASK-037 | done | см. `git log` (`TASK-037: node library rail redesign`) | left rail widened and rebuilt into a cleaner, more professional toolbox list |
| TASK-038 | done | см. `git log` (`TASK-038: editor rail parity + collapsible guidance`) | left hint collapsible, right inspector redesigned to match the updated rail language |
| TASK-039 | done | см. `git log` (`TASK-039: inspector cleanup + compact flow-order hint`) | compact flow-order cue in left rail, cleaner and denser right inspector hierarchy |

