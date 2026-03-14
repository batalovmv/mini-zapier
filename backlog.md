# Backlog

> Статусы: `todo` | `in_progress` | `blocked` | `done`
> Каждая задача выполняется в отдельной сессии. Не расширяй scope.

---

## Срез 1: Webhook → Queue → Worker → HTTP → Logs → History API

### TASK-001: Monorepo scaffold + Docker + shared types
- **Статус**: `done`
- **Цель**: рабочий monorepo с pnpm workspaces, Docker Compose (PG + Redis), shared types package
- **Scope**: pnpm-workspace.yaml, root package.json, tsconfig.base.json, docker-compose.yml, .env, .gitignore, packages/shared (types/enums)
- **Не входит**: NestJS apps, Prisma, любая бизнес-логика
- **Файлы**: корень проекта + packages/shared/
- **Acceptance**: `pnpm install` проходит, `docker compose up -d` стартует PG + Redis, shared types компилируются
- **Проверка**: `pnpm install && docker compose up -d && pnpm --filter @mini-zapier/shared build`

### TASK-002: apps/api scaffold + Prisma schema + migrations
- **Статус**: `done`
- **Цель**: NestJS API приложение с Prisma, все 7 моделей, PrismaModule
- **Scope**:
  - Scaffold NestJS app в apps/api (nest new или вручную)
  - prisma/schema.prisma — полная схема всех 7 моделей (см. spec-v1.md Database Schema)
  - prisma migrate dev
  - PrismaModule + PrismaService (global, OnModuleInit)
  - Зависимость на @mini-zapier/shared
- **Не входит**: контроллеры, сервисы, бизнес-логика, Swagger
- **Файлы**: apps/api/
- **Acceptance**:
  - `pnpm dev:api` стартует на порту 3000
  - Prisma migrate проходит без ошибок
  - PrismaService инжектится и подключается к БД
- **Проверка**: `pnpm --filter @mini-zapier/api prisma migrate dev && pnpm dev:api`

### TASK-003: Common utilities (crypto, redact, truncate)
- **Статус**: `done`
- **Цель**: переиспользуемые серверные утилиты для шифрования, маскировки и truncation
- **Scope**:
  - Создать **`packages/server-utils`** (`@mini-zapier/server-utils`) — отдельный пакет для серверных утилит (НЕ в shared, чтобы не тянуть node crypto в apps/web)
  - `packages/server-utils/src/crypto.util.ts` — encrypt(plaintext, key) / decrypt(ciphertext, key) через AES-256-GCM
  - `packages/server-utils/src/redact.util.ts` — redactCredentials(obj) маскирует значения полей password/token/secret/apiKey/credentials
  - `packages/server-utils/src/truncate.util.ts` — truncatePayload(data, maxBytes=65536) возвращает {data, truncated}
  - Юнит-тесты для всех трёх утилит
  - Добавить `packages/server-utils` в pnpm-workspace.yaml (уже покрыт `packages/*`)
  - apps/api и apps/worker зависят от `@mini-zapier/server-utils`
- **Не входит**: бизнес-модули, NestJS сервисы. `packages/shared` НЕ трогаем — там только types/DTOs
- **Файлы**: packages/server-utils/
- **Acceptance**:
  - encrypt → decrypt roundtrip работает
  - redact маскирует `{password: "secret"}` → `{password: "****"}`
  - truncate обрезает payload > 64KB и возвращает truncated=true
  - Тесты проходят
  - apps/web НЕ зависит от server-utils
- **Проверка**: `pnpm --filter @mini-zapier/server-utils test`

### TASK-004: ConnectionModule CRUD
- **Статус**: `done`
- **Цель**: CRUD для Connection entity с шифрованием credentials и защитой от удаления
- **Scope**:
  - `apps/api/src/connection/connection.module.ts`
  - `apps/api/src/connection/connection.controller.ts` — POST, GET (list), GET (:id), PUT, DELETE
  - `apps/api/src/connection/connection.service.ts` — encrypt на create/update, mask на read, block delete if used
  - `apps/api/src/connection/dto/create-connection.dto.ts` — name, type (ConnectionType enum), credentials (Record<string,string>)
  - `apps/api/src/connection/dto/update-connection.dto.ts`
  - Swagger декораторы на контроллере
- **Не входит**: другие модули, workflow логика
- **Файлы**: apps/api/src/connection/
- **Acceptance**:
  - POST /api/connections — credentials зашифрованы в БД (проверить через prisma studio)
  - GET /api/connections — credentials замаскированы (каждое значение = "****")
  - GET /api/connections/:id — то же
  - DELETE /api/connections/:id — если Connection привязана к WorkflowNode → 409 Conflict
  - DELETE /api/connections/:id — если не используется → 204
- **Проверка**: curl POST/GET/DELETE через Swagger или curl

### TASK-005: WorkflowModule CRUD + linear validation
- **Статус**: `done`
- **Цель**: CRUD workflow с full graph replace, линейной валидацией, версионированием
- **Scope**:
  - `apps/api/src/workflow/workflow.module.ts`
  - `apps/api/src/workflow/workflow.controller.ts` — POST, GET (list), GET (:id), PUT, DELETE, PATCH status
  - `apps/api/src/workflow/workflow.service.ts`:
    - create: сохранить workflow + nodes + edges в одной транзакции, version=1
    - update (PUT): удалить старые nodes/edges, создать новые, version++
    - updateStatus (PATCH): изменить status, НЕ менять version
    - delete: cascade
    - Валидация графа (вынести в отдельный helper):
      - Ровно 1 node с nodeKind="trigger"
      - Trigger имеет ровно 1 outgoing edge
      - Каждый action имеет max 1 incoming + max 1 outgoing edge
      - Ровно 1 terminal action (нет outgoing edges)
      - Нет disconnected nodes (все nodes достижимы от trigger)
  - `apps/api/src/workflow/dto/create-workflow.dto.ts` — name, description?, timezone?, viewport?, nodes[], edges[]
  - `apps/api/src/workflow/dto/update-workflow.dto.ts`
  - Swagger декораторы
- **Не входит**: execution, triggers, actions, queue
- **Файлы**: apps/api/src/workflow/
- **Acceptance**:
  - POST создаёт workflow с nodes+edges, version=1
  - PUT обновляет (full replace), version=2
  - PATCH /status → status меняется, version остаётся
  - Валидация отклоняет: 0 triggers, 2 triggers, trigger без outgoing, disconnected nodes, cycle
  - GET /:id возвращает workflow с nodes+edges
  - GET / возвращает список с пагинацией и фильтром по status
- **Проверка**: curl с валидным и невалидным payload через Swagger

### TASK-006: ExecutionService + TriggerController (webhook + dedupe)
- **Статус**: `done`
- **Цель**: создание execution с snapshot + атомарный dedupe + enqueue в BullMQ. Webhook endpoint
- **Scope**:
  - `apps/api/src/execution/execution.module.ts`
  - `apps/api/src/execution/execution.controller.ts`:
    - POST /api/workflows/:id/execute — manual trigger (no dedupe)
    - GET /api/workflows/:id/executions — list executions (pagination)
    - GET /api/executions/:id — detail + step logs
  - `apps/api/src/execution/execution.service.ts`:
    - startExecution(workflowId, triggerData, source, idempotencyKey?):
      1. Если idempotencyKey: в DB-транзакции INSERT TriggerEvent ON CONFLICT → return {duplicate: true}
      2. В той же транзакции: создать WorkflowExecution (PENDING, workflowVersion=workflow.version, definitionSnapshot)
      3. definitionSnapshot = {nodes: [...], edges: [...]} — connectionId refs, БЕЗ credentials
      4. Вне транзакции: queue.add({executionId})
      5. Если queue.add упал: compensating delete TriggerEvent + WorkflowExecution, throw 500
      6. TriggerEvent.processed = true
    - getExecution(id), getExecutions(workflowId, pagination)
  - `apps/api/src/trigger/trigger.module.ts`
  - `apps/api/src/trigger/trigger.controller.ts`:
    - POST /api/webhooks/:workflowId — принять body, проверить webhook secret (из Connection type=WEBHOOK привязанной к trigger node), извлечь Idempotency-Key или X-Event-ID header (если есть — dedupe через TriggerEvent), вызвать startExecution
    - Дубль → 200 OK {duplicate: true}
    - Новый → 202 Accepted {executionId}
  - Queue setup: зарегистрировать BullMQ queue 'workflow-execution' в apps/api
- **Не входит**: worker, engine, cron trigger, email trigger
- **Файлы**: apps/api/src/execution/, apps/api/src/trigger/, apps/api/src/queue/
- **Acceptance**:
  - POST /api/webhooks/:id с body и валидным X-Webhook-Secret → TriggerEvent + WorkflowExecution (PENDING) + job в queue
  - Повторный POST с валидным X-Webhook-Secret и тем же Idempotency-Key или X-Event-ID → 200 duplicate, без нового execution
  - POST с валидным X-Webhook-Secret без Idempotency-Key/X-Event-ID → всегда создаёт новый execution (без dedupe)
  - GET /api/executions/:id → execution с status PENDING (worker ещё не запущен)
  - Manual trigger POST /api/workflows/:id/execute → execution без TriggerEvent
- **Проверка**: curl webhook дважды с -H "X-Webhook-Secret: <secret>" и одним Idempotency-Key (или X-Event-ID), проверить в БД что execution один

### TASK-007: apps/worker scaffold + BullMQ processor + execution engine
- **Статус**: `done`
- **Цель**: standalone NestJS worker, chain execution engine, LogService
- **Scope**:
  - `apps/worker/` — NestJS standalone application (NestFactory.createApplicationContext, без HTTP)
  - `apps/worker/src/main.ts` — bootstrap standalone app
  - `apps/worker/src/worker.module.ts` — imports: PrismaModule, BullMQ, ActionModule, LogModule
  - `apps/worker/src/processor/workflow-execution.processor.ts` — @Processor('workflow-execution'), вызывает engine
  - `apps/worker/src/engine/execution-engine.ts`:
    - Берёт execution из БД (с definitionSnapshot)
    - status → RUNNING
    - Извлекает линейную цепочку из snapshot: trigger → action1 → action2 → ...
    - dataContext = execution.triggerData
    - Для каждого action:
      - truncate inputData если > 64KB
      - Создать ExecutionStepLog (RUNNING, nodeLabel, nodeType денормализованно)
      - Расшифровать credentials из Connection по connectionId
      - Вызвать actionRegistry.execute(nodeType, config, credentials, inputData)
      - timeout через AbortController / setTimeout
      - retry: до retryCount раз, exponential backoff (retryBackoff * 2^attempt)
      - Успех: outputData → dataContext, step → SUCCESS
      - Ошибка после всех retry: step → FAILED, execution → FAILED, break
    - Все шаги OK → execution → SUCCESS
  - `apps/worker/src/engine/chain-resolver.ts` — извлекает упорядоченный массив action nodes из snapshot (follow edges от trigger)
  - `apps/worker/src/log/log.service.ts`:
    - createStepLog(executionId, nodeId, nodeLabel, nodeType, inputData)
    - markStepSuccess(stepLogId, outputData, durationMs)
    - markStepFailed(stepLogId, errorMessage, retryAttempt, durationMs)
  - Зависимость на @mini-zapier/shared (types/DTOs) и @mini-zapier/server-utils (crypto, redact, truncate)
  - PrismaModule (переиспользовать schema из apps/api, сгенерить клиент)
- **Не входит**: конкретные action strategies (кроме заглушки/интерфейса), auto-pause
- **Файлы**: apps/worker/
- **Acceptance**:
  - `pnpm dev:worker` стартует, подключается к Redis queue
  - Worker берёт job из queue, обновляет execution status → RUNNING
  - Engine проходит по цепочке нод (с mock/noop action), пишет step logs
  - При ошибке action → step FAILED → execution FAILED
- **Проверка**: запустить api + worker, curl webhook с X-Webhook-Secret, проверить что execution переходит в RUNNING → SUCCESS/FAILED

### TASK-008: HttpRequestAction + auto-pause + E2E smoke
- **Статус**: `done`
- **Цель**: первая реальная action strategy + auto-pause + первый E2E тест
- **Scope**:
  - `apps/worker/src/action/strategies/action-strategy.interface.ts`:
    ```ts
    interface ActionStrategy {
      execute(config: any, credentials: Record<string,string> | null, inputData: any, signal?: AbortSignal): Promise<any>;
    }
    ```
  - `apps/worker/src/action/action.service.ts` — ActionRegistry: Map<ActionType, ActionStrategy>, resolve(nodeType)
  - `apps/worker/src/action/strategies/http-request.action.ts`:
    - axios request с url, method, headers, body из config
    - Template interpolation: заменить `{{input.field}}` на значения из inputData (рекурсивно по вложенным путям)
    - Поддержка signal (AbortController) для timeout
    - Return: {status, headers, data}
  - Auto-pause logic в execution-engine.ts:
    - После FAILED execution: count последних N executions для workflowId
    - Если 5+ подряд FAILED → workflow.status = PAUSED
  - Redaction: убедиться что credentials не попадают в step logs
- **Не входит**: другие action strategies, cron, email trigger, frontend
- **Файлы**: apps/worker/src/action/
- **Acceptance**:
  - Webhook (с валидным X-Webhook-Secret) → HTTP Request action делает реальный HTTP вызов → step log с response
  - Template `{{input.name}}` в url/body заменяется на значение из triggerData
  - retryCount=2 с невалидным URL → 3 попытки (attempt 0,1,2) в step log
  - 5 подряд FAILED executions → workflow.status = PAUSED
  - credentials из Connection НЕ попадают в step logs
  - definitionSnapshot НЕ содержит расшифрованные credentials
- **Проверка** (E2E smoke test среза 1):
  1. `docker compose up -d`
  2. `pnpm dev:api` + `pnpm dev:worker`
  3. POST /api/connections — создать connection
  4. POST /api/workflows — создать workflow: Webhook trigger → HTTP Request action
  5. PATCH /api/workflows/:id/status → ACTIVE
  6. curl POST /api/webhooks/:workflowId -H "Content-Type: application/json" -H "X-Webhook-Secret: <secret>" -d '{"name":"test"}'
  7. GET /api/executions/:id → status SUCCESS, step logs с input/output
  8. Тест dedupe (Idempotency-Key): curl с X-Webhook-Secret и Idempotency-Key дважды → один execution
  8a. Тест dedupe (X-Event-ID): curl с X-Webhook-Secret и X-Event-ID дважды → один execution
  9. Тест retry: workflow с невалидным URL, retryCount=2 → step log с 3 попытками
  10. Тест auto-pause: 5 failed executions → workflow PAUSED

---

## Срез 2: Cron + Email inbound + остальные actions

### TASK-009: Cron trigger + startup reconciliation
- **Статус**: `done`
- **Цель**: BullMQ repeatable jobs для cron, register/unregister при смене статуса, reconciliation при старте API
- **Scope**:
  - `apps/api/src/trigger/strategies/cron.trigger.ts`:
    - register(workflow, triggerNode): добавить BullMQ repeatable job с cronExpression из config, timezone из workflow
    - unregister(workflowId): удалить repeatable job по ключу
  - `apps/api/src/trigger/trigger.service.ts` — вызывать register/unregister при PATCH status (ACTIVE → register, PAUSED/DRAFT → unregister)
  - `apps/api/src/trigger/trigger.service.ts` — **re-register при PUT /workflows/:id** если workflow ACTIVE: unregister old → register new (cronExpression/timezone могли измениться)
  - `apps/api/src/trigger/trigger.service.ts` — onModuleInit: пересинхронизировать все ACTIVE workflows с cron triggers
  - Cron dedupe: idempotencyKey = `{cronExpression}:{scheduledAt}` (scheduledAt из job opts)
  - BullMQ job handler: при срабатывании cron → вызвать executionService.startExecution()
- **Не входит**: email trigger, UI, actions
- **Файлы**: apps/api/src/trigger/
- **Acceptance**:
  - ACTIVE workflow с Cron trigger → BullMQ repeatable job создаётся
  - PAUSE workflow → job удаляется
  - PUT /workflows/:id для ACTIVE workflow с изменённым cronExpression → old job удаляется, new job создаётся
  - Рестарт apps/api → cron jobs восстанавливаются для всех ACTIVE workflows
  - Каждый cron tick → новый execution с dedupe

### TASK-010: Email inbound trigger
- **Статус**: `done`
- **Цель**: POST /api/inbound-email/:workflowId endpoint для приёма email от провайдера с проверкой подписи
- **Scope**:
  - `apps/api/src/trigger/trigger.controller.ts` — добавить POST /api/inbound-email/:workflowId
  - **Проверка подписи провайдера**: trigger node ссылается на Connection (type=WEBHOOK, содержит signing secret). Проверить HMAC-подпись из header провайдера (X-Signature / аналог) против body + secret. Без валидной подписи → 401
  - Парсинг email data из body провайдера (from, to, subject, text, html)
  - Dedupe по provider event ID (из header или body)
  - Проверить что workflow ACTIVE и trigger node type = EMAIL
  - Вызвать executionService.startExecution(workflowId, emailData, 'email', eventId)
- **Не входит**: IMAP, настройка провайдера, UI
- **Файлы**: apps/api/src/trigger/
- **Acceptance**:
  - POST /api/inbound-email/:workflowId с email payload + валидная подпись → execution создаётся
  - POST без подписи / с невалидной подписью → 401 Unauthorized
  - triggerData содержит {from, to, subject, text}
  - Workflow не ACTIVE → 422
  - Dedupe по event ID работает

### TASK-011: Remaining action strategies (Email, Telegram, DB, Transform)
- **Статус**: `done`
- **Цель**: реализовать оставшиеся 4 action strategy
- **Scope**:
  - `apps/worker/src/action/strategies/email-send.action.ts`:
    - nodemailer transporter из credentials (host, port, user, pass)
    - to, subject, body из config с template interpolation
    - Return: {messageId, accepted}
  - `apps/worker/src/action/strategies/telegram.action.ts`:
    - axios POST https://api.telegram.org/bot{token}/sendMessage
    - chatId, message из config с template interpolation
    - botToken из credentials
    - Return: {messageId, ok}
  - `apps/worker/src/action/strategies/db-query.action.ts`:
    - pg Client из credentials (connectionString или host/port/user/password/database)
    - Параметризованный SQL (query + params из config), template interpolation для params
    - Return: {rows, rowCount}
  - `apps/worker/src/action/strategies/data-transform.action.ts`:
    - mode=template: заменить `{{input.path}}` в строке
    - mode=mapping: для каждого ключа в mapping заменить `{{input.path}}` и собрать результат в объект
    - Return: результирующий объект/строка
  - Зарегистрировать все в ActionRegistry
- **Не входит**: новые action types, UI config forms
- **Файлы**: apps/worker/src/action/strategies/
- **Acceptance**:
  - EmailSend: отправляет email (можно проверить через Mailtrap/MailHog)
  - Telegram: отправляет сообщение (можно проверить с реальным ботом или mock)
  - DbQuery: выполняет SELECT, возвращает rows
  - DataTransform: `{{input.name}}` → реальное значение; mapping mode собирает объект
  - Все берут credentials из Connection (расшифровка в engine)

### TASK-012: StatsController + Swagger + global middleware
- **Статус**: `done`
- **Цель**: GET /api/stats, Swagger UI, глобальные middleware
- **Scope**:
  - `apps/api/src/stats/stats.module.ts`
  - `apps/api/src/stats/stats.controller.ts` — GET /api/stats:
    - totalWorkflows, activeWorkflows, pausedWorkflows
    - totalExecutions, successfulExecutions, failedExecutions
    - successRate (%)
    - recentExecutions (last 10)
  - `apps/api/src/main.ts`:
    - SwaggerModule.setup('/api/docs', ...)
    - app.useGlobalPipes(new ValidationPipe({transform: true, whitelist: true}))
    - app.enableCors({origin: 'http://localhost:5173'})
    - Global exception filter для consistent error responses
  - Swagger декораторы на ВСЕХ контроллерах (@ApiTags, @ApiOperation, @ApiResponse)
- **Не входит**: frontend, новые endpoints
- **Файлы**: apps/api/src/stats/, apps/api/src/main.ts
- **Acceptance**:
  - GET /api/docs → Swagger UI загружается, все endpoints видны
  - GET /api/stats → JSON с агрегациями
  - ValidationPipe отклоняет невалидные body
  - CORS разрешает localhost:5173
- **Проверка**: открыть /api/docs в браузере, попробовать все endpoints

---

## Срез 3-6: Frontend (День 2)

### TASK-013: Frontend scaffold + API client + layout
- **Статус**: `done`
- **Цель**: рабочий React app с routing, Tailwind, API client
- **Scope**:
  - Vite + React + TypeScript в apps/web
  - Tailwind CSS setup
  - React Router: `/` → Dashboard, `/workflows/:id/edit` → Editor, `/workflows/:id/history` → History
  - API client: axios instance с baseURL, api functions для workflows/connections/executions/stats
  - AppLayout + Navbar (logo, nav links: Dashboard, Create Workflow)
  - Зависимость на @mini-zapier/shared для типов
- **Не входит**: компоненты страниц, stores
- **Файлы**: apps/web/
- **Acceptance**:
  - `pnpm dev:web` стартует на порту 5173
  - Routing работает: `/` → Dashboard placeholder, `/workflows/:id/edit` → Editor placeholder
  - API client может вызвать GET /api/workflows (через Vite proxy)
  - Tailwind стили применяются
- **Проверка**: `pnpm dev:web`, открыть http://localhost:5173

### TASK-014: Dashboard page
- **Статус**: `done`
- **Цель**: список workflows, stats, CRUD actions
- **Scope**:
  - `apps/web/src/stores/dashboard.store.ts` (Zustand): workflows[], stats, loading, fetchWorkflows, fetchStats, deleteWorkflow
  - `apps/web/src/pages/DashboardPage.tsx` — layout страницы
  - `apps/web/src/components/dashboard/StatsOverview.tsx` — 4 карточки (total, active, executions, success rate)
  - `apps/web/src/components/dashboard/WorkflowList.tsx` — список карточек
  - `apps/web/src/components/dashboard/WorkflowCard.tsx` — карточка: name, status badge, last execution, кнопки (Edit, Run, Pause/Activate, Delete)
  - Кнопка "Create Workflow" → navigate to `/workflows/new/edit`
  - Confirmation dialog для Delete
- **Не входит**: editor, history, config forms
- **Файлы**: apps/web/src/pages/DashboardPage.tsx, apps/web/src/components/dashboard/, apps/web/src/stores/dashboard.store.ts
- **Acceptance**:
  - Загружается список workflows с сервера
  - Stats cards показывают реальные данные
  - Delete workflow → confirmation → удаляет
  - Run → POST execute → показать notification
  - Pause/Activate → PATCH status
  - Edit → navigate to editor
  - Create → navigate to `/workflows/new/edit`

### TASK-015: Workflow Editor (React Flow)
- **Статус**: `done`
- **Цель**: визуальный drag-and-drop editor для workflow
- **Scope**:
  - `apps/web/src/stores/workflow-editor.store.ts` (Zustand):
    - nodes, edges, onNodesChange, onEdgesChange, onConnect
    - selectedNodeId, selectNode
    - workflowId, workflowName, workflowStatus, workflowVersion
    - addNode, updateNodeConfig, removeNode
    - loadWorkflow(api response → React Flow state), saveWorkflow(React Flow state → API format)
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — layout: sidebar | canvas | config panel
  - `apps/web/src/components/editor/FlowCanvas.tsx`:
    - React Flow с custom node types
    - onDrop handler: screenToFlowPosition, вызов addNode
    - onNodeClick → selectNode
    - Background grid, controls (zoom, fit)
  - `apps/web/src/components/editor/NodeSidebar.tsx`:
    - Секции "Triggers" и "Actions"
    - Draggable items: onDragStart → dataTransfer.setData
  - `apps/web/src/components/editor/ConfigPanel.tsx`:
    - Показывается при selectedNodeId != null
    - Рендерит форму конфигурации по nodeType
    - Connection selector dropdown (GET /api/connections)
    - Delete Node button
  - `apps/web/src/components/editor/nodes/TriggerNode.tsx` — зелёный header, icon, label, source handle (bottom)
  - `apps/web/src/components/editor/nodes/ActionNode.tsx` — синий header, icon, label, target handle (top) + source handle (bottom)
  - 8 config forms в `apps/web/src/components/editor/config-forms/`:
    - WebhookConfig — показывает webhook URL (read-only)
    - CronConfig — cron expression input
    - EmailTriggerConfig — описание setup с провайдером
    - HttpRequestConfig — URL, method dropdown, headers key-value, body textarea
    - EmailActionConfig — to, subject, body
    - TelegramConfig — chatId, message
    - DbQueryConfig — query textarea, params
    - DataTransformConfig — mode selector (template/mapping), template/mapping editor
  - Toolbar: workflow name input, status badge, Save button, Activate/Pause button, Run button
- **Не входит**: execution history, polling, step logs viewer
- **Файлы**: apps/web/src/pages/WorkflowEditorPage.tsx, apps/web/src/components/editor/, apps/web/src/stores/workflow-editor.store.ts
- **Acceptance**:
  - Drag node из sidebar → появляется на canvas
  - Соединение нод (edges): drag от source handle к target handle
  - Клик на ноду → config panel с правильной формой
  - Save → PUT /api/workflows/:id (или POST для нового)
  - Load → GET /api/workflows/:id → ноды и edges отображаются на canvas
  - Линейная связь валидируется (нельзя создать два outgoing от одной ноды)
  - Activate/Pause → PATCH status

### TASK-016: Execution History + Step Log Viewer
- **Статус**: `done`
- **Цель**: страница истории выполнений, timeline step logs
- **Scope**:
  - `apps/web/src/pages/ExecutionHistoryPage.tsx` — для конкретного workflow
  - `apps/web/src/components/execution/ExecutionTable.tsx`:
    - Таблица: ID (truncated), status badge (цветной), trigger, started, duration, actions (View)
    - Пагинация
  - `apps/web/src/components/execution/StepLogViewer.tsx`:
    - Вертикальный timeline шагов
    - Каждый шаг: nodeLabel, status badge, duration, retry attempt
    - Collapsible JSON viewer для inputData/outputData
    - Error message если failed
  - Polling каждые 5с если есть RUNNING executions
  - Link из Dashboard → History
- **Не входит**: real-time WebSocket, step log editing
- **Файлы**: apps/web/src/pages/ExecutionHistoryPage.tsx, apps/web/src/components/execution/
- **Acceptance**:
  - Таблица executions загружается для workflow
  - Status badges отображаются с правильными цветами
  - Клик на execution → step logs
  - JSON viewer показывает input/output данные
  - Polling обновляет RUNNING executions

### TASK-017: UI polish + E2E test
- **Статус**: `done`
- **Цель**: loading states, toasts, empty states, полный E2E через UI
- **Scope**:
  - Loading spinners на всех страницах
  - Toast notifications (react-hot-toast): success/error на CRUD операциях
  - Empty states: "Нет workflows", "Нет executions"
  - Error boundaries
  - Confirmation dialogs для деструктивных действий
  - E2E smoke test через UI:
    1. Создать Connection (Webhook secret)
    2. Создать workflow: Webhook → HTTP Request → Data Transform
    3. Настроить каждую ноду через config panel
    4. Сохранить, активировать
    5. curl webhook с -H "X-Webhook-Secret: <secret>" → проверить execution в history → step logs корректны
- **Не входит**: auth, responsive design, i18n
- **Файлы**: все компоненты apps/web
- **Acceptance**:
  - Полный flow от создания до просмотра результатов работает через UI
  - Нет unhandled errors в консоли
  - Loading/empty states везде где нужно
  - Toast на успешные/ошибочные операции

---

## Post-v1: Deployment + Auth

### TASK-018: Deployment config + minimal admin login
- **Статус**: `done`
- **Цель**: deploy-конфигурация (Vercel frontend + VPS Docker backend) и минимальный admin login (signed cookie, без БД/регистрации)
- **Scope**:
  - Docker multi-stage Dockerfiles для API и Worker (`pnpm deploy --legacy`)
  - docker-compose.prod.yml: Caddy + PostgreSQL + Redis + API + Worker
  - Caddy для автоматического TLS
  - vercel.json с rewrite `/api/*` на VPS
  - Minimal auth: signed cookie (HMAC-SHA256), single admin из env vars
  - AuthModule: AuthService, AuthController (login/logout/me), AuthGuard (global), @Public() decorator
  - HealthController: GET /api/health (public)
  - Frontend: LoginPage, ProtectedRoute, Logout кнопка
  - CORS из CORS_ORIGIN env, credentials: true
  - Swagger отключен в production
  - cookie-parser middleware
- **Не входит**: регистрация, RBAC, multi-user, sessions в БД
- **Файлы**: deploy/, vercel.json, .dockerignore, apps/api/src/auth/, apps/api/src/health/, apps/web/src/pages/LoginPage.tsx, apps/web/src/components/auth/
- **Acceptance**:
  - `pnpm install --frozen-lockfile` проходит
  - `pnpm build` проходит
  - POST /api/auth/login с валидными creds → 200 + Set-Cookie
  - GET /api/auth/me с cookie → 200
  - GET /api/workflows без cookie → 401
  - POST /api/auth/logout → clears cookie
  - GET /api/health → 200 (public)
  - POST /api/webhooks/:id → работает без login (public)
  - Swagger отключен при NODE_ENV=production


### TASK-019: Workflow editor validation hardening
- **Статус**: `done`
- **Цель**: запретить невалидные linear-графы на frontend до запроса в API и закрыть duplicate trigger в editor
- **Scope**:
  - `apps/web/src/stores/workflow-editor.store.ts` — duplicate trigger guard в `addNode`, graph validation перед save, `validateWorkflow()` для Zustand store
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — client-side pre-save validation с existing error banner
  - `apps/web/src/components/editor/FlowCanvas.tsx` — user feedback при попытке добавить второй trigger
  - `apps/web/e2e/ui-smoke.spec.ts` — regression tests на duplicate trigger и invalid save paths
- **Не входит**: layout polish, новые editor features, infra/auth changes
- **Acceptance**:
  - второй trigger не добавляется на canvas
  - save с lone trigger блокируется до API request
  - save с disconnected chain блокируется до API request
  - `pnpm --filter @mini-zapier/web run build` проходит
  - smoke spec покрывает invalid-save regression cases
### TASK-020: Production cleanup + origin hardening
- **Статус**: `done`
- **Цель**: убрать прямой публичный доступ к origin API и перевести frontend -> backend на HTTPS origin
- **Scope**:
  - cleanup тестовых workflow на live как prep-step перед infra-изменениями
  - настроить HTTPS origin через host reverse proxy (`nginx`/`caddy`) на VPS
  - перевести `vercel.json` rewrite `/api/*` на `https://` origin
  - закрыть наружный `:3000` firewall'ом / host-level policy
  - убедиться, что login/workflows/webhooks продолжают работать через frontend URL
- **Не входит**: rate limiting, readiness/env validation, UI changes
- **Acceptance**:
  - прямой `http://<ip>:3000/api/health` недоступен извне
  - `https://<frontend>/api/health` работает через rewrite
  - login/workflows/webhooks не ломаются после смены origin
- **Проверка**:
  - curl прямого `:3000` с внешней машины -> fail/timeout
  - curl `https://mini-zapier-web-silk.vercel.app/api/health` -> `200`
  - smoke login + GET `/api/workflows` через frontend origin

### TASK-021: Proxy-aware rate limiting
- **Статус**: `done`
- **Цель**: добавить защиту от brute-force и burst abuse на публичные endpoints
- **Depends on**: `TASK-020`
- **Scope**:
  - зафиксировать в `decisions.md` выбор `@nestjs/throttler` как app-level rate limiting mechanism
  - настроить proxy-aware client IP extraction (`X-Forwarded-For` / trust proxy path) после infra-изменений из `TASK-020`
  - добавить throttling на `POST /api/auth/login`
  - добавить throttling на `POST /api/webhooks/:workflowId`
  - добавить throttling на `POST /api/inbound-email/:workflowId`
  - сохранить текущий contract публичных endpoints, меняя только abuse protection
- **Не входит**: nginx/CDN/WAF rules, CAPTCHA, account lockout UX
- **Acceptance**:
  - burst requests режутся по реальному client IP, а не по proxy IP
  - `429` ответы возвращаются в существующем API error shape
  - обычный happy path не ломается
- **Проверка**:
  - серия быстрых запросов на login/webhook/email endpoint приводит к `429`
  - одиночные и умеренные запросы продолжают работать

### TASK-022: Liveness, readiness, env fail-fast
- **Статус**: `done`
- **Цель**: разделить liveness/readiness и заставить API/worker падать при отсутствии критичных env
- **Scope**:
  - оставить `GET /api/health` как liveness endpoint процесса
  - добавить `GET /api/readiness` только в `apps/api` с проверкой PostgreSQL и Redis
  - добавить валидацию обязательных env на старте `apps/api`
  - добавить валидацию обязательных env на старте `apps/worker`
  - не добавлять отдельный HTTP endpoint в worker
- **Не входит**: rate limiting, infra firewall/proxy, мониторинг
- **Acceptance**:
  - `/api/health` отвечает пока процесс жив
  - `/api/readiness` падает при недоступной DB или Redis
  - без критичных env API/worker не стартуют
- **Проверка**:
  - локально/на стенде сломать DB/Redis и увидеть fail readiness
  - убрать обязательный env и убедиться, что API/worker завершаются на старте

### TASK-023: Editor UX hardening + product polish
- **Статус**: `done`
- **Цель**: сделать login/editor понятнее и более продуктовым без изменения product scope
- **Scope**:
  - persistent feedback для `login`, `save`, `run` и status actions, не только toast
  - понятные disabled states и причины для editor actions
  - убрать dev-тексты вроде `Frontend scaffold`, `React Flow editor`, `TASK-015`
  - заменить тех. copy и UUID-подобные selected-state тексты на user-facing copy
  - сжать hero-блок editor в компактный рабочий toolbar
  - сделать только лёгкий cleanup sidebar/config panel copy и spacing без structural rewrite
- **Не входит**: новые editor features, responsive redesign, resizable panels, backend changes
- **Acceptance**:
  - пользователь понимает результат login/save/run даже если toast пропущен
  - на основном editor surface не остаётся dev/scaffold copy
  - happy path editor не ломается
- **Проверка**:
  - manual UX smoke в браузере
  - `pnpm --filter @mini-zapier/web run build`

### TASK-024: CI quality gate
- **Статус**: `done`
- **Цель**: добавить минимальный автоматический quality gate без CD и infra-автоматизации
- **Scope**:
  - один GitHub Actions workflow file: `.github/workflows/ci.yml`
  - triggers: `pull_request` и `push` в `main`
  - обязательный `build` job как минимальный gate
  - `pnpm install --frozen-lockfile`
  - `pnpm build`
  - optional `e2e` job только для `apps/web` smoke
  - `e2e` запускается только если в CI заданы `MINI_ZAPIER_E2E_BASE_URL` и `MINI_ZAPIER_E2E_PASSWORD`
  - `e2e` проверяет уже задеплоенный frontend/backend по `MINI_ZAPIER_E2E_BASE_URL`, без поднятия локального API/web/worker/DB/Redis внутри CI
  - в optional `e2e` job установить Playwright Chromium перед запуском smoke
- **Не входит**: CD pipeline, Docker image build/push, matrix builds, мониторинг, alerting
- **Acceptance**:
  - на `pull_request` и `push` в `main` есть минимальный автоматический gate
  - build воспроизводим в CI
  - `build` job является обязательным базовым gate
  - при отсутствии нужных env/secrets e2e явно skip'ается, а не ломает базовый build gate
  - при наличии env/secrets optional `e2e` job запускается против deploy URL и проходит без локального orchestration
- **Проверка**:
  - workflow успешно выполняется в GitHub Actions
  - падение build роняет pipeline
  - при наличии env/secrets optional `e2e` job стартует после установки Playwright browser
  - падение e2e роняет pipeline, если e2e job включён

---

## Post-v1: UX improvements

### TASK-025: Field picker для template interpolation
- **Статус**: `done`
- **Цель**: дать пользователю выбирать доступные поля из dropdown вместо ручного ввода `{{input.field}}`
- **Проблема**: сейчас при создании mapping в Data Transform, написании `{{input.}}` в HTTP Request body/url, template mode Data Transform, Email subject/body, Telegram message — пользователь должен **угадывать** имена полей. Нет никакой подсказки какие поля доступны. Единственный способ узнать — сходить в History → Step Logs → Output data предыдущего шага и посмотреть JSON. Это плохой UX — новый пользователь не поймёт что писать.
- **Контекст (важно для разработчика)**:
  - Каждый action в цепочке получает `input` — это output предыдущего шага (или triggerData для первого action после trigger)
  - Ноды получают **новые server-side id** при каждом `PUT /workflows/:id` (workflow.service.ts удаляет старые и создаёт новые). Поэтому **нельзя ключевать поля по nodeId** из execution — после любого сохранения маппинг сломается
  - Правильный подход: определять "available input for current action" по **позиции в линейной цепочке** (chain-resolver уже умеет строить упорядоченный массив нод). Для action на позиции N → взять outputData шага N-1 (или triggerData если N=0)
  - API должен возвращать `sourceExecutionId` и `sourceWorkflowVersion`, чтобы UI мог показать "данные из версии X" если workflow изменился с момента последнего execution
  - `FieldPicker` должен быть **assistive UI**, а не механизмом валидации: если данных нет, версия не совпала или поле исчезло, ручной ввод `{{input.*}}` продолжает работать без блокировок
- **Что хотим получить**:
  - Во всех полях где поддерживается `{{input.field}}` — по кнопке `⚡` показывать **dropdown с доступными полями**
  - **Surfaces**: mapping value в Data Transform, template textarea в Data Transform (mode=template), HTTP Request url/body/header values, Email subject/body, Telegram message
  - Список полей берётся из **последнего успешного execution**: для action на позиции N в цепочке → outputData шага N-1, для первого action → triggerData
  - Если workflow ещё ни разу не запускался — показать подсказку "Запустите workflow хотя бы раз чтобы увидеть доступные поля" и оставить ручной ввод
  - Если workflow version изменился с момента execution — показать warning "Поля из версии N, текущая версия M"
  - При выборе поля из dropdown — вставить `{{input.fieldName}}` в текущую позицию курсора
  - Для вложенных объектов поддержать dot-notation: `{{input.data.user.name}}`
- **Scope**:
  - Новый API endpoint: `GET /api/workflows/:id/available-fields` — для каждой позиции в линейной цепочке возвращает: `{position, fields: string[], sourceExecutionId, sourceWorkflowVersion}`. Позиция определяется через chain-resolver по текущему definition (edges), данные берутся из step logs последнего SUCCESS execution
  - Компонент `FieldPicker` — dropdown/autocomplete с иконкой ⚡ рядом с input-полями
  - Интеграция во все interpolation surfaces (см. список выше)
  - Fallback на ручной ввод если нет данных
- **Не входит**: парсинг JSON Schema, предпросмотр значений, валидация что поле существует при save, DbQueryConfig params (нужен отдельный JSON-aware insertion path)
- **Файлы**: apps/api/src/execution/ (новый endpoint), apps/web/src/components/editor/FieldPicker.tsx, все config-forms
- **Acceptance**:
  - В mapping value нажал кнопку `⚡` → dropdown с полями из последнего execution
  - В template textarea Data Transform — тот же picker работает
  - Выбрал поле → вставилось `{{input.fieldName}}`
  - Workflow без executions → подсказка, ручной ввод работает
  - Вложенные поля отображаются через dot-notation
  - После PUT (новые nodeId) picker продолжает работать (привязка по позиции, не по id)
  - Отсутствие данных в picker НЕ блокирует сохранение workflow и НЕ ломает ручной ввод template strings
- **Проверка**: создать workflow, запустить, открыть редактор, убедиться что в config-формах видны поля из triggerData/outputData. Сохранить workflow (PUT), убедиться что picker не сломался

### TASK-026: Config panel layout polish — ширина полей и placeholder clarity
- **Статус**: `done`
- **Цель**: исправить визуальные проблемы в config panel форм, которые мешают работе
- **Проблема**: config panel имеет фиксированную ширину, из-за чего:
  1. **Mapping key/value inputs обрезают текст** — `{{input.total}}` показывается как `{{input.tot...`, `{{input.customer_name}}` как `{{input.cus...`. Пользователь не видит полное значение без клика в поле
  2. **Header key/value тоже обрезаются** — `Content-Ty...` вместо `Content-Type`
  3. **"Add field" в mapping** создаёт строку с placeholder `Field` / `{{input.field}}` — выглядит как заполненные данные, а не placeholder. Не очевидно что это пустая строка
- **Что хотим получить**:
  - Mapping row layout: key и value inputs занимают больше ширины. Варианты: убрать кнопку Remove в иконку ✕, показывать Remove только при hover, или перевести mapping rows в вертикальный layout (key сверху, value снизу)
  - Header key/value: аналогично расширить или перевести в вертикальный layout
  - Новая строка mapping: **пустые поля** с placeholder text (серым цветом, `placeholder=`), а не заполненные значениями `Field`/`{{input.field}}`
- **Не входит**: resizable config panel, drag-and-drop reorder, webhook URL (→ TASK-027)
- **Файлы**: apps/web/src/components/editor/config-forms/DataTransformConfig.tsx, HttpRequestConfig.tsx
- **Acceptance**:
  - `{{input.customer_name}}` полностью видно в mapping value input без скролла
  - Header `Content-Type` / `application/json` полностью видны
  - Новая строка mapping — пустые поля с серым placeholder
- **Проверка**: визуальная проверка в браузере, pnpm build

### TASK-027: Webhook helper — Copy URL, Copy curl, usage hints
- **Статус**: `done`
- **Цель**: помочь пользователю быстро использовать webhook endpoint после создания workflow
- **Проблема**: после создания workflow с Webhook trigger пользователь видит URL в config panel, но:
  1. URL обрезается в узком read-only input и его неудобно копировать
  2. Непонятно как именно вызвать webhook — какие заголовки нужны, в каком формате body
  3. Новый пользователь не знает про обязательный `X-Webhook-Secret` и опциональный `Idempotency-Key`
- **Что хотим получить**:
  - **Copy URL** кнопка — копирует полный webhook URL в clipboard одним кликом
  - **Copy curl** кнопка — копирует готовую curl-команду для тестирования:
    ```
    curl -X POST <url> \
      -H "Content-Type: application/json" \
      -H "X-Webhook-Secret: <your-secret>" \
      -d '{"key": "value"}'
    ```
  - Секрет в curl: показывать `<your-secret>` (не расшифрованный) с подсказкой "замените на секрет из вашего Connection"
  - Опционально: строка с `Idempotency-Key` header в curl примере (закомментированная) + hint что это для дедупликации
  - Toast "Copied!" после каждого копирования
  - URL поле: расширить или сделать monospace с ellipsis + tooltip при hover показывающий полный URL
  - `Copy curl` должен копировать **однострочный** пример команды, чтобы он был пригоден для быстрого paste в обычный терминал и не зависел от shell-specific multiline syntax
- **Не входит**: sandbox/test mode, webhook log viewer, inline test-send
- **Файлы**: apps/web/src/components/editor/config-forms/WebhookConfig.tsx
- **Acceptance**:
  - Кнопка "Copy URL" копирует полный webhook URL в clipboard
  - Кнопка "Copy curl" копирует готовую curl команду с placeholder secret
  - Toast "Copied!" после копирования
  - Полный URL виден (tooltip/expanded) без обрезки
- **Проверка**: визуальная проверка, ручное тестирование copy в clipboard, pnpm build

### TASK-028: Execution History — фильтр по статусу + счётчики
- **Статус**: `done`
- **Цель**: дать пользователю быстро находить нужные executions по статусу
- **Проблема**: при большом количестве executions таблица показывает все подряд. Нет возможности отфильтровать только FAILED (чтобы разобраться с ошибками) или увидеть сколько выполнений в каждом статусе.
- **Контекст (важно для разработчика)**:
  - В системе 4 статуса execution: `PENDING`, `RUNNING`, `SUCCESS`, `FAILED` (см. packages/shared execution.ts)
  - Текущий UI уже показывает PENDING как "Queued" (ExecutionTable.tsx)
  - Текущий API `GET /api/workflows/:id/executions` поддерживает только `page`/`limit`, ответ содержит `{items, total, page, limit}` — нет фильтра по статусу и нет счётчиков
  - Для табов со счётчиками нужно расширить API: либо добавить `counts: {all, success, failed, inProgress}` в response, либо отдельный endpoint. Рекомендуется расширить текущий response — один запрос вместо нескольких
  - `counts` должны считаться по **всему workflow**, а не по текущей странице выдачи, иначе табы и счётчики будут misleading
- **Что хотим получить**:
  - Tabs фильтр: **All** | **Success** | **Failed** | **In progress** (PENDING + RUNNING объединены, т.к. пользователю не важна разница)
  - Счётчик рядом с каждым табом: "Failed (3)", "In progress (1)"
  - API: `GET /api/workflows/:id/executions?status=FAILED&page=1&limit=20`
  - API response расширить полем `counts`: `{items, total, page, limit, counts: {all: 15, success: 10, failed: 4, inProgress: 1}}`
  - `status` query param принимает: `SUCCESS`, `FAILED`, `IN_PROGRESS` (маппится на `WHERE status IN ('PENDING','RUNNING')`)
- **Не входит**: текстовый поиск по triggerData, date range picker, export в CSV, real-time WebSocket
- **Файлы**: apps/api/src/execution/execution.controller.ts, apps/api/src/execution/execution.service.ts, apps/api/src/execution/dto/list-executions-query.dto.ts, apps/web/src/pages/ExecutionHistoryPage.tsx, apps/web/src/components/execution/ExecutionTable.tsx
- **Acceptance**:
  - Tabs All | Success | Failed | In progress на странице History
  - Выбор "Failed" показывает только failed executions
  - Счётчики показывают количество в каждой категории (один API запрос)
  - "In progress" показывает PENDING + RUNNING executions вместе
  - API `GET /api/workflows/:id/executions?status=FAILED` возвращает отфильтрованный список + counts
  - При смене tab/filter pagination сбрасывается на страницу 1
- **Проверка**: создать несколько failed executions, проверить фильтрацию, убедиться что counts обновляются
### TASK-029: Workflow Editor full-width workspace layout
- **Статус**: `done`
- **Цель**: дать editor-странице больше полезного пространства под canvas без изменения product scope
- **Проблема**:
  - editor наследовал общий `max-w-[1680px]` layout и был визуально зажат по центру
  - canvas получал остаточную ширину после двух боковых панелей
  - высота canvas и колонок была жёстко ограничена `780px/820px`, из-за чего editor слабо использовал viewport
- **Что хотим получить**:
  - editor использует почти всю ширину viewport с рабочими gutter'ами
  - canvas становится главным surface страницы
  - sidebar и config panel остаются читаемыми и скроллятся независимо
  - editor лучше использует высоту экрана на desktop/laptop
- **Scope**:
  - выделить editor route в отдельный wide layout
  - вынести общий header в переиспользуемый компонент
  - перевести editor page и canvas с fixed-height на flex/min-h-0 layout
  - сохранить текущий stacked fallback для меньших экранов
- **Не входит**: resizable panels, collapse/expand rails, redesign toolbar/forms, backend changes
- **Файлы**: `apps/web/src/App.tsx`, `apps/web/src/components/AppHeader.tsx`, `apps/web/src/layouts/AppLayout.tsx`, `apps/web/src/layouts/EditorLayout.tsx`, `apps/web/src/pages/WorkflowEditorPage.tsx`, `apps/web/src/components/editor/FlowCanvas.tsx`
- **Acceptance**:
  - editor страница визуально шире dashboard/history
  - canvas получает больше ширины за счёт отдельного wide layout
  - fixed heights `780px/820px` убраны, editor использует viewport-aware flex sizing
  - sidebar/config panel не ломают скролл внутри editor layout
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`
  - browser visual smoke в этой сессии не запускался




### TASK-030: Dashboard visual hierarchy pass
- **Статус**: `done`
- **Цель**: сделать dashboard визуально собраннее и понятнее без изменения структуры продукта и без новых фич
- **Проблема**:
  - верхний hero-блок слишком высокий и съедает первый экран
  - hero, stats section и workflow list слишком близки по визуальному весу
  - экран выглядит аккуратно, но иерархия слабая и операционный фокус размыт
- **Что хотим получить**:
  - hero компактнее и полезнее
  - stats и workflow list визуально читаются как более важные рабочие секции
  - первый экран плотнее и информативнее
- **Scope**:
  - уменьшить вертикальный размер hero-блока
  - усилить контраст и иерархию заголовков, подзаголовков и секций
  - подправить spacing и внутренние отступы dashboard panels
  - сохранить существующий контент, действия и API-интеграции
- **Не входит**:
  - новые карточки, фильтры, сортировки, графики
  - изменения editor page
  - backend/API changes
- **Файлы**:
  - `apps/web/src/pages/DashboardPage.tsx`
  - `apps/web/src/components/dashboard/StatsOverview.tsx`
  - `apps/web/src/components/dashboard/WorkflowList.tsx`
  - при необходимости `apps/web/src/index.css`
- **Acceptance**:
  - hero заметно компактнее по высоте
  - stats section и workflow list визуально отделены и легче сканируются
  - dashboard выглядит плотнее, но не перегруженно
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`
  - manual visual smoke на dashboard в desktop width
