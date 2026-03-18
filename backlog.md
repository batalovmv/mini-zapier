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

### TASK-031: Editor empty-state and workspace guidance
- **Статус**: `done`
- **Цель**: сделать пустой editor более направляющим и менее стерильным без изменения product scope
- **Проблема**:
  - пустой canvas выглядел как большая белая плоскость
  - слабый сигнал, с чего начать
  - sidebar и config panel воспринимались как пассивные колонны
- **Что сделано**:
  - empty state canvas переработан в более явный onboarding с акцентом на `trigger -> actions`
  - усилен визуальный drop affordance canvas без изменения editor mechanics
  - sidebar и config panel получили более явную workspace hierarchy и guidance copy
- **Не входит**:
  - новые editor features
  - drag-and-drop redesign
  - resizable/collapsible panels
  - backend/API changes
- **Файлы**:
  - `apps/web/src/components/editor/FlowCanvas.tsx`
  - `apps/web/src/components/editor/NodeSidebar.tsx`
  - `apps/web/src/components/editor/ConfigPanel.tsx`
  - `apps/web/src/index.css`
- **Acceptance**:
  - пустой editor лучше объясняет, что делать первым шагом
  - canvas в empty state выглядит менее пустым и более intentional
  - sidebar и config panel визуально лучше поддерживают workspace feel
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`
  - desktop visual smoke empty editor через локальный `vite preview` + Playwright screenshot с mock auth/connections

### TASK-032: Workflow cards density + status emphasis
- **Статус**: `done`
- **Цель**: сделать workflow cards на dashboard более операционными, чтобы статус и последнее выполнение считывались быстрее
- **Проблема**:
  - карточки workflow выглядят слишком воздушно
  - метаданные и статус не имеют достаточно сильной иерархии
  - кнопки и operational state конкурируют друг с другом по вниманию
- **Что сделано**:
  - переработан spacing и внутренний layout workflow cards
  - усилены статусные акценты и visual hierarchy operational info
  - вторичная мета-информация ужата без потери читаемости
  - все текущие действия карточек и текущее поведение сохранены
- **Не входит**:
  - новые действия
  - bulk actions
  - table view/list mode switch
  - backend/API changes
- **Файлы**:
  - `apps/web/src/components/dashboard/WorkflowCard.tsx`
  - `apps/web/src/components/dashboard/WorkflowList.tsx`
  - `apps/web/src/index.css`
- **Acceptance**:
  - workflow cards легче сканируются списком
  - статус и last execution визуально заметнее, чем вторичные метаданные
  - карточки выглядят плотнее без потери читаемости
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`
  - manual visual smoke на dashboard workflow list

### TASK-033: Global polish of spacing, contrast and accent hierarchy
- **Статус**: `done`
- **Цель**: сделать UI менее просто аккуратным и более собранным визуально, без редизайна и без изменения product scope
- **Проблема**:
  - слишком много поверхностей одинакового визуального веса
  - белые панели и мягкие границы местами сливаются
  - бренду и интерфейсу не хватает характера
- **Что сделано**:
  - обновлены глобальные color/surface tokens, border contrast и shadows для более явного разделения primary и secondary panels
  - header, dashboard и editor workspace получили более собранную accent hierarchy без смены структуры и сценариев
  - editor rails и canvas теперь лучше различаются по визуальному весу, а ключевые CTA выделены заметнее
- **Не входит**:
  - полный redesign
  - новые UI features
  - layout rewrite editor/dashboard
  - backend/API changes
- **Файлы**:
  - `apps/web/src/index.css`
  - `apps/web/src/components/AppHeader.tsx`
  - `apps/web/src/layouts/AppLayout.tsx`
  - `apps/web/src/pages/DashboardPage.tsx`
  - `apps/web/src/components/dashboard/StatsOverview.tsx`
  - `apps/web/src/components/dashboard/WorkflowList.tsx`
  - `apps/web/src/components/dashboard/WorkflowCard.tsx`
  - `apps/web/src/pages/WorkflowEditorPage.tsx`
  - `apps/web/src/components/editor/FlowCanvas.tsx`
  - `apps/web/src/components/editor/NodeSidebar.tsx`
  - `apps/web/src/components/editor/ConfigPanel.tsx`
- **Acceptance**:
  - поверхности и секции лучше различаются по визуальному весу
  - primary actions и ключевые зоны считываются быстрее
  - UI выглядит чуть более выразительным, но остаётся в текущем стиле
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`
  - manual visual smoke на dashboard и editor через локальный `vite preview` + Playwright screenshots с mock API

### TASK-034: Web UI language switcher (EN/RU)
- **Статус**: `done`
- **Цель**: добавить в `apps/web` переключение языка интерфейса между английским и русским без backend changes и без новой зависимости
- **Что сделано**:
  - добавлена лёгкая i18n-инфраструктура в `apps/web`: `LocaleProvider`, `useLocale`, словари `en`/`ru`, locale-aware formatters и persistence через `localStorage`
  - в header добавлен переключатель `EN / RU`, выбранный язык сохраняется между перезагрузками
  - user-facing copy вынесен из страниц, layout'ов, editor panels, config forms, empty/loading/error states и dialogs в централизованные словари
  - форматирование дат, времени и длительностей привязано к выбранной локали
  - текущее поведение роутинга, API и editor mechanics сохранено
- **Не входит**:
  - backend i18n
  - локализация server-side API error messages
  - third-party i18n library
  - любые новые фичи кроме language switcher
- **Файлы**:
  - `apps/web/src/locale/*`
  - `apps/web/src/main.tsx`
  - `apps/web/src/components/AppHeader.tsx`
  - `apps/web/src/pages/*`
  - `apps/web/src/components/dashboard/*`
  - `apps/web/src/components/execution/*`
  - `apps/web/src/components/editor/*`
  - `apps/web/src/components/ui/*`
  - `apps/web/src/lib/api/client.ts`
  - `apps/web/src/stores/workflow-editor.store.ts`
- **Acceptance**:
  - UI переключается между `EN` и `RU` без backend changes
  - выбор языка сохраняется между reload
  - user-facing copy централизован в словарях
  - date/time formatting следует выбранной локали
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`
  - headless smoke на локальном `vite preview` + mock API: login, dashboard, workflow editor, execution history, 404, empty states, header switcher + persistence


### TASK-035: Workflow editor viewport containment + rail density
- **Статус**: `done`
- **Цель**: убрать вертикальный выход editor workspace за viewport на desktop и сделать боковые rail-панели визуально собраннее
- **Проблема**:
  - editor page могла становиться выше viewport, из-за чего canvas и rails уезжали ниже первого экрана
  - левая palette и правый inspector были слишком рыхлыми по вертикали и выглядели тяжелее, чем нужно
- **Что сделано**:
  - `EditorLayout` переведён в desktop `h-screen` shell с `overflow-hidden` внутри main
  - `WorkflowEditorPage` переведён на `minmax(0,1fr)` grid row и внутреннее overflow containment для всех трёх колонок
  - `FlowCanvas` header слегка уплотнён, canvas shell получил корректный `min-h-0`
  - `NodeSidebar` и `ConfigPanel` уплотнены по paddings, typography и card density без изменения editor mechanics
- **Не входит**:
  - resizable/collapsible panels
  - новые editor features
  - backend/API changes
- **Файлы**:
  - `apps/web/src/layouts/EditorLayout.tsx`
  - `apps/web/src/pages/WorkflowEditorPage.tsx`
  - `apps/web/src/components/editor/FlowCanvas.tsx`
  - `apps/web/src/components/editor/NodeSidebar.tsx`
  - `apps/web/src/components/editor/ConfigPanel.tsx`
- **Acceptance**:
  - desktop editor больше не растягивает страницу по высоте из-за workspace shell
  - rails скроллятся внутри своей области, а не раздувают весь page layout
  - боковые панели выглядят плотнее и чище
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

### TASK-036: Workflow editor rail visual cleanup
- **Статус**: `done`
- **Цель**: сделать боковые панели editor визуально чище и пригоднее для русских текстов без изменения editor mechanics
- **Проблема**:
  - левая библиотека и пустой inspector выглядели перегруженно из-за panel-in-panel layout и слишком узких desktop колонок
  - длинные русские тексты ломали ритм и визуально сжимали rails
- **Что сделано**:
  - desktop ширина rails увеличена в editor grid
  - `NodeSidebar` пересобран в более плоскую list-driven композицию с cleaner section cards и без лишних вложенных badges внутри каждого item
  - empty state `ConfigPanel` перепакован в более явный inspector placeholder с одной hero-card и компактным step-list
- **Не входит**:
  - новые editor features
  - changes в workflow mechanics
  - backend/API changes
- **Файлы**:
  - `apps/web/src/pages/WorkflowEditorPage.tsx`
  - `apps/web/src/components/editor/NodeSidebar.tsx`
  - `apps/web/src/components/editor/ConfigPanel.tsx`
- **Acceptance**:
  - desktop rails выглядят шире и чище
  - русские тексты в левой и правой панели читаются без чрезмерного визуального шума
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

### TASK-037: Node library rail redesign
- **Статус**: `done`
- **Цель**: сделать левую библиотеку узлов editor более профессиональной, современной и удобной для сканирования, особенно с русским copy
- **Проблема**:
  - левый rail был визуально уже правого inspector и ощущался вторичным, хотя именно он является главным toolbox editor
  - библиотека узлов выглядела перегруженно из-за нескольких уровней cards/onboarding blocks и медленно сканировалась
- **Что сделано**:
  - левая desktop колонка editor widened и стала шире правой
  - `NodeSidebar` переведён из card-stack layout в cleaner tool-rail: compact header, short flow-order cue, flatter section headers и более плотные draggable node rows
  - цветовой акцент сохранён только как сигнал типа секции/иконки, без тяжёлых tinted panels вокруг каждого уровня
- **Не входит**:
  - новые editor features
  - changes в drag-and-drop mechanics
  - backend/API changes
- **Файлы**:
  - `apps/web/src/components/editor/NodeSidebar.tsx`
  - `apps/web/src/pages/WorkflowEditorPage.tsx`
- **Acceptance**:
  - левый rail визуально primary и шире правого inspector на desktop
  - node library быстрее сканируется списком и не выглядит как набор вложенных карточек
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

### TASK-038: Editor rail parity + collapsible guidance
- **Статус**: `done`
- **Цель**: убрать постоянный visual overhead от guidance в левой библиотеке и привести правый inspector к тому же современному rail-style, что и левая панель
- **Проблема**:
  - flow-order hint в левой библиотеке всегда занимал место, даже когда пользователь уже собрал часть сценария
  - правая панель выглядела визуально слабее и старее обновлённого левого rail
- **Что сделано**:
  - `NodeSidebar` получил collapsible flow-order hint, который автоматически схлопывается после появления узлов и может быть раскрыт вручную
  - `ConfigPanel` переработан в более современный rail-style как для empty state, так и для выбранного узла: cleaner header, flatter sections, tighter meta blocks и более собранная hierarchy
  - desktop editor grid скорректирован так, чтобы правый inspector получил чуть больше пространства, не отбирая приоритет у node library
- **Не входит**:
  - новые editor features
  - changes в workflow logic
  - backend/API changes
- **Файлы**:
  - `apps/web/src/components/editor/NodeSidebar.tsx`
  - `apps/web/src/components/editor/ConfigPanel.tsx`
  - `apps/web/src/pages/WorkflowEditorPage.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - guidance в левой библиотеке можно свернуть и она не держит лишнюю высоту постоянно
  - правый inspector визуально соответствует левому rail по стилю и иерархии
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

### TASK-039: Inspector cleanup + compact flow-order hint
- **Статус**: `done`
- **Цель**: сделать правый inspector визуально строже и современнее, а collapsed hint `Порядок сборки` в левой библиотеке действительно компактным
- **Проблема**:
  - collapsed state блока `Порядок сборки` оставался почти таким же высоким, как expanded version, и продолжал занимать лишнее место
  - правый inspector всё ещё выглядел тяжелее и старее обновлённого левого rail из-за лишних вложенных surfaces и рыхлого header/meta layout
- **Что сделано**:
  - `NodeSidebar` — collapsed guidance переведён в compact one-line cue с отдельным smaller container; expanded state оставляет полный flow-order affordance без постоянного vertical overhead
  - `ConfigPanel` — empty state упрощён до cleaner guidance section без stack из внутренних cards; selected state пересобран в compact header + single summary block + calmer connection/settings hierarchy
  - `WorkflowEditorPage` — правый desktop rail слегка расширен, но левый toolbox остался primary
- **Не входит**:
  - новые editor features
  - backend/API changes
  - resizable/collapsible panels кроме уже существующего guidance toggle слева
- **Файлы**:
  - `apps/web/src/components/editor/NodeSidebar.tsx`
  - `apps/web/src/components/editor/ConfigPanel.tsx`
  - `apps/web/src/pages/WorkflowEditorPage.tsx`
- **Acceptance**:
  - collapsed `Порядок сборки` заметно ниже expanded state и не держит лишнюю высоту
  - правый inspector визуально ближе к левому rail по плотности, hierarchy и modern toolbox feel
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

### TASK-040: Inspector structure refinement
- **Статус**: `done`
- **Цель**: убрать карточную рыхлость правого inspector и привести его к более строгому modern tool-panel виду без изменений editor mechanics
- **Проблема**:
  - правый inspector всё ещё выглядел как длинный form sheet с panel-in-panel layout и дублирующимися блоками состояния
  - empty state оставлял слишком много пустого пространства и не выглядел как собранная рабочая панель
- **Что сделано**:
  - `ConfigPanel` — убрано дублирование connection summary и отдельный нижний footer-shell под destructive action; selected state собран как compact header + optional connection section + settings section с встроенным delete action
  - `ConfigPanel` — empty state центрирован по высоте и пересобран в cleaner guidance stack без лишней тяжёлой карточности
  - `WorkflowEditorPage` — правая desktop rail-колонка выровнена по ширине с левой, чтобы inspector не ломал заголовки и формы
- **Не входит**:
  - новые editor features
  - backend/API changes
  - redesign левой библиотеки узлов
- **Файлы**:
  - `apps/web/src/components/editor/ConfigPanel.tsx`
  - `apps/web/src/pages/WorkflowEditorPage.tsx`
- **Acceptance**:
  - правый inspector визуально плотнее, чище и без дублирующихся connection blocks
  - empty state inspector не выглядит как длинная пустая колонка с одной карточкой сверху
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

### TASK-041: Inspector empty-state rhythm + editor toolbar alignment
- **Статус**: `done`
- **Цель**: убрать мёртвую вертикальную яму в пустом inspector и собрать верхний editor toolbar в более ровную, единообразную action bar композицию
- **Проблема**:
  - empty state правой панели оставлял неестественный разрыв между header и guidance block из-за vertical centering
  - статус, версия и CTA в верхней панели editor выглядели разрозненно по высоте, позициям и визуальному весу
- **Что сделано**:
  - `ConfigPanel` — empty state переведён из centered layout в top-aligned stack, поэтому guidance теперь начинается сразу под header без большой пустой ямы
  - `WorkflowEditorPage` — toolbar пересобран в более собранную action cluster: back button и name field выровнены по baseline, справа status/version/actions получили единый container и одинаковую высоту controls
- **Не входит**:
  - новые editor features
  - backend/API changes
  - redesign левой библиотеки узлов
- **Файлы**:
  - `apps/web/src/components/editor/ConfigPanel.tsx`
  - `apps/web/src/pages/WorkflowEditorPage.tsx`
- **Acceptance**:
  - empty state inspector больше не имеет большого разрыва между header и guidance
  - top toolbar editor выглядит как единый control bar, а не набор плавающих кнопок
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

### TASK-042: Inspector connection semantics clarity
- **Статус**: `done`
- **Цель**: убрать неочевидные числовые бейджи из правого inspector и показать состояние подключений так, чтобы пользователь сразу понимал, что именно отображается
- **Проблема**:
  - голые числа `0/1/4` в inspector выглядели как технические счётчики без объяснения смысла
  - count дублировался в header и в connection section, но не отвечал на главный вопрос: выбрано ли подключение для текущего узла
- **Что сделано**:
  - `ConfigPanel` — connection summary переведён из голых numeric badges в текстовые status pills: `Выбрано: <name>`, `Не выбрано`, `Нет доступных`, `Доступно: N`
  - `ConfigPanel` — убрано дублирование безымянного count между header и connection section; header теперь показывает тип подключения и его состояние, а section — состояние плюс доступность только когда это полезно
  - `messages.en.ts`, `messages.ru.ts` — добавлены locale-aware строки для новых connection status labels
- **Не входит**:
  - backend/API changes
  - redesign форм настройки узлов
  - новые editor features
- **Файлы**:
  - `apps/web/src/components/editor/ConfigPanel.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - inspector больше не показывает голые numeric badges без подписи
  - connection-required nodes явно различают состояния `выбрано`, `не выбрано` и `нет доступных`
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

### TASK-043: Connections management page
- **Статус**: `done`
- **Цель**: вынести управление reusable connections в отдельный раздел сайта, чтобы пользователь мог централизованно создавать, редактировать, удалять и затем переиспользовать свои SMTP/Telegram/PostgreSQL/Webhook подключения в сценариях
- **Проблема**:
  - подключения существовали только как inline-flow внутри editor inspector, поэтому пользователь не видел их как отдельные рабочие ресурсы
  - не было централизованного места, где можно заранее подготовить свои интеграции и потом просто выбирать их в узлах
- **Что сделано**:
  - добавлена новая страница `ConnectionsPage` с отдельным route `/connections` и пунктом navigation в `AppHeader`
  - реализован каталог подключений по типам (`WEBHOOK`, `SMTP`, `TELEGRAM`, `POSTGRESQL`) с create/edit/delete actions и reuse-oriented copy
  - добавлен отдельный `ConnectionFormDialog` для создания и обновления подключений; при редактировании можно переименовать connection без повторного ввода секретов или полностью заменить весь credentials set
  - EN/RU словари расширены строками для новой страницы и её диалогов без backend changes
- **Не входит**:
  - отдельная usage-analytics по workflows, где connection используется
  - bulk actions, search/filtering, tags
  - backend/API changes
- **Файлы**:
  - `apps/web/src/pages/ConnectionsPage.tsx`
  - `apps/web/src/components/connections/ConnectionFormDialog.tsx`
  - `apps/web/src/App.tsx`
  - `apps/web/src/components/AppHeader.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - в UI есть отдельный раздел `Подключения / Connections`
  - пользователь может создать connection заранее, затем редактировать имя или полностью заменить credentials
  - существующие connections читаются как reusable resources, а не как скрытая часть editor inspector
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

---

## Баги / Hotfixes

### TASK-044: DB_QUERY action — сериализация результатов PostgreSQL
- **Статус**: `done`
- **Цель**: fix "Payload must contain only JSON-serializable values" при выполнении DB_QUERY
- **Проблема**: `result.rows` из `pg` содержит нативные JS-объекты (`Date`, `BigInt`, `Buffer`), которые не сериализуются в JSON. При записи step log workflow падает с ошибкой
- **Воспроизведение**: создать workflow с DB_QUERY action, query = `SELECT now() as ts`, выполнить → ОШИБКА
- **Root cause**: `apps/worker/src/action/strategies/db-query.action.ts`, строки 105-108 — `result.rows` возвращается без санитизации
- **Фикс**: обернуть rows в `JSON.parse(JSON.stringify(rows))` или явно маппить типы (Date → ISO string, BigInt → string, Buffer → hex)
- **Scope**: только файл `db-query.action.ts`, возможно утилита-санитайзер в `packages/server-utils`
- **Не входит**: изменения API, frontend, схемы БД
- **Файлы**:
  - `apps/worker/src/action/strategies/db-query.action.ts`
  - опционально `packages/server-utils/src/sanitize.ts`
- **Acceptance**:
  - workflow с `SELECT now(), 123::bigint, 'hello'::text` выполняется без ошибок
  - step log содержит корректные сериализованные значения
  - существующие тесты проходят
- **Проверка**: `pnpm --filter @mini-zapier/worker build && pnpm --filter @mini-zapier/worker test`
---

## Срез 7: User auth + workspace isolation

### TASK-045: Initial user registration
- **Статус**: `done`
- **Цель**: добавить регистрацию и логин пользователей через БД, сохранив текущую модель общего workspace без multi-tenant isolation
- **Проблема**:
  - текущий auth завязан на одну env-пару `AUTH_USERNAME` / `AUTH_PASSWORD`, поэтому пользователь не может зарегистрировать собственный аккаунт
  - в продукте уже есть protected routes, но нет таблицы пользователей и self-service регистрации
- **Что сделано**:
  - добавлена модель `User` в Prisma и миграция для хранения email + passwordHash
  - `apps/api/src/auth/*` переведён на регистрацию и логин по email/password с signed cookie session `mz_session`
  - пароли хэшируются встроенным Node.js `scrypt`, без новой зависимости
  - `apps/web` получил отдельную страницу `/register`, обновлённую `/login` и новый client API для регистрации
  - в первом варианте было принято временное допущение: shared workspace без ownership workflow/connection; это позже исправлено в `TASK-045 follow-up`
- **Не входит**:
  - RBAC, роли, приглашения
  - password reset, email verification
  - owner-based isolation workflows/connections/executions
- **Файлы**:
  - `apps/api/prisma/schema.prisma`
  - `apps/api/prisma/migrations/*`
  - `apps/api/src/auth/`
  - `apps/api/src/common/validate-env.ts`
  - `apps/web/src/App.tsx`
  - `apps/web/src/lib/api/auth.ts`
  - `apps/web/src/pages/LoginPage.tsx`
  - `apps/web/src/pages/RegisterPage.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - `POST /api/auth/register` создаёт нового пользователя, ставит cookie и не требует env-логина
  - `POST /api/auth/login` работает по данным из БД
  - `GET /api/auth/me` возвращает текущего пользователя по cookie
  - в UI доступны отдельные страницы `Login` и `Register`
  - `pnpm --filter @mini-zapier/api build` и `pnpm --filter @mini-zapier/web build` проходят
- **Проверка**:
  - `pnpm --filter @mini-zapier/api run prisma:migrate -- --name add_user_auth`
  - `pnpm --filter @mini-zapier/api build`
  - `pnpm --filter @mini-zapier/web build`
### TASK-045 follow-up: User workspace isolation
- **Статус**: `done`
- **Цель**: исправить auth-срез так, чтобы у каждого пользователя был свой workspace и свои данные, а не общий shared catalog
- **Проблема**:
  - первый вариант `TASK-045` добавил регистрацию, но оставил общий workspace для всех пользователей
  - это противоречит фактическому продуктному требованию: workflows, connections, executions и stats должны быть изолированы по owner
- **Что сделано**:
  - в Prisma добавлены `Workflow.userId` и `Connection.userId` с relation на `User`; добавлена follow-up migration под owner isolation
  - `workflow`, `connection`, `execution`, `stats` API переведены на `currentUser.id` и больше не возвращают чужие данные
  - manual execute, execution history/detail, available fields и dashboard stats теперь режутся по owner
  - при сохранении workflow сервер проверяет, что все referenced connections принадлежат текущему пользователю
  - принято совместимое migration-допущение: `userId` пока nullable на уровне БД, чтобы не ломать legacy rows; старые записи требуют отдельного backfill
- **Не входит**:
  - RBAC, sharing/collaboration
  - password reset, invitations
  - автоматический backfill legacy shared данных на существующем проде
- **Файлы**:
  - `apps/api/prisma/schema.prisma`
  - `apps/api/prisma/migrations/*user_workspace_isolation*`
  - `apps/api/src/auth/current-user.decorator.ts`
  - `apps/api/src/workflow/*`
  - `apps/api/src/connection/*`
  - `apps/api/src/execution/*`
  - `apps/api/src/stats/*`
  - `spec-v1.md`
  - `decisions.md`
  - `test-checklist.md`
  - `handoff.md`
- **Acceptance**:
  - пользователь видит только свои workflows/connections/executions/stats
  - manual execute/history/detail по чужому workflow/execution возвращают `404`
  - workflow не может ссылаться на чужой connection
  - публичные webhook/email/cron triggers продолжают работать по workflow id без auth session
  - `pnpm --filter @mini-zapier/api build`, `pnpm --filter @mini-zapier/worker build`, `pnpm --filter @mini-zapier/web build` проходят
- **Проверка**:
  - `pnpm --filter @mini-zapier/api build`
  - `pnpm --filter @mini-zapier/worker build`
  - `pnpm --filter @mini-zapier/web build`

---

## Срез 8: No-code configuration UX

> Принцип среза: один интерфейс по умолчанию = визуальная форма. Для продвинутых остаётся локальная ссылка `Редактировать как код` или `Показать как JSON` у конкретного поля/блока, без глобального переключателя режима редактора.
> Контекст: `TASK-025` уже дал assistive `FieldPicker` с плоским списком полей из последнего совместимого execution. Задачи ниже развивают это решение до schema/tree-driven UX и визуальных builders для нетехнических пользователей.

### TASK-046: Schema-backed field tree for next-step inputs
- **Статус**: `done`
- **Цель**: заменить плоский список полей на устойчивое schema/tree-представление выходных данных предыдущего шага, которое можно переиспользовать в editor UX
- **Проблема**:
  - текущий `TASK-025` извлекает только плоские dot-paths из последнего совместимого `SUCCESS` execution
  - этого достаточно для assistive dropdown, но недостаточно для древовидного выбора, чипов, step test-run и более дружелюбной визуальной формы
  - новые UX-фазы завязаны на одном ядре: editor должен понимать структуру предыдущего шага (`rows.0.source`, `status`, `data.json.name`), а не только набор строк
- **Scope**:
  - backend: строить и сохранять лёгкий schema snapshot для `triggerData` и `outputData` шагов после реального выполнения workflow; snapshot хранит путь/тип/вложенность и не содержит секреты или полные credentials values
  - backend: расширить API доступных полей так, чтобы editor получал не только плоские `fields[]`, но и древовидную структуру для текущей позиции цепочки + `sourceExecutionId` / `sourceWorkflowVersion`
  - frontend: обновить `FieldPicker` из маленькой `⚡`-иконки в явный affordance `+ Вставить поле` с tree dropdown
  - frontend: подтянуть новый picker во все interpolation surfaces из `TASK-025`, плюс поле `to` в email action
- **Не входит**:
  - token/chip rendering внутри текстовых полей
  - отдельный step test-run
  - полноценная поддержка формального JSON Schema draft-стандарта
  - `DbQueryConfig` JSON params editor
- **Файлы**:
  - `apps/api/src/execution/*`
  - `apps/web/src/components/editor/FieldPicker.tsx`
  - `apps/web/src/lib/api/executions.ts`
  - `apps/web/src/lib/api/types.ts`
  - `apps/web/src/components/editor/config-forms/*`
- **Acceptance**:
  - после успешного запуска workflow picker показывает дерево полей предыдущего шага, а не только плоский список строк
  - первый action после trigger видит структуру `triggerData`; action N видит структуру output предыдущего action
  - manual input `{{input.*}}` остаётся доступным и ничем не блокируется
  - secrets не попадают в schema snapshot и API response
- **Проверка**:
  - выполнить workflow с вложенным JSON payload
  - открыть editor следующего шага и убедиться, что `+ Вставить поле` показывает дерево с dot-path insert
  - `pnpm --filter @mini-zapier/api build`
  - `pnpm --filter @mini-zapier/web build`

### TASK-047: Reusable templated text control with chips
- **Статус**: `done`
- **Цель**: дать всем interpolation-полям единый компонент, где `{{input.path}}` отображается как визуальный чип, а не как сырой текст
- **Проблема**:
  - сейчас даже с `FieldPicker` пользователь видит обычную строку `{{input.rows.0.source}}`, которую трудно быстро сканировать и править
  - нет единого reusable control для Email, Telegram, HTTP и Data Transform
  - принцип "визуально по умолчанию, код для продвинутых" пока не реализован на уровне самих текстовых полей
- **Scope**:
  - создать общий `TemplatedTextInput` / `TemplatedTextarea` поверх raw string config
  - разбирать `{{input.*}}` в inline chips, оставляя остальной текст обычным контентом
  - клик по чипу открывает compact inspector: путь поля, замена, удаление
  - добавить локальную ссылку `Редактировать как код` для конкретного поля с roundtrip без потери данных
  - интегрировать компонент в Email subject/body/to, Telegram message, HTTP url/body/header values, Data Transform template field
- **Не входит**:
  - visual builders для HTTP body / mapping tables
  - preview значений из последнего запуска
  - валидация существования поля на save
- **Файлы**:
  - `apps/web/src/components/editor/`
  - `apps/web/src/components/editor/config-forms/*`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - `{{input.name}}` и другие references отображаются как цветные chips
  - клик по chip показывает путь и позволяет заменить/удалить reference
  - `Редактировать как код` возвращает raw text и обратно без порчи значения
  - один и тот же control переиспользуется минимум в Email, Telegram и HTTP form
- **Проверка**:
  - визуально проверить roundtrip chip mode ↔ raw mode на нескольких формах
  - `pnpm --filter @mini-zapier/web build`

### TASK-048: Cron visual schedule builder
- **Статус**: `done`
- **Цель**: убрать необходимость вручную писать cron-строку для типовых расписаний
- **Проблема**:
  - текущий `CronConfig` — это только raw input `cronExpression`
  - нетехнический пользователь не понимает cron-синтаксис и не видит ближайший запуск
- **Scope**:
  - visual presets: `Каждую минуту`, `Каждый час`, `Каждый день`, `Каждую неделю`, `Своё`
  - для daily/weekly показать time picker, для weekly ещё и выбор дней недели
  - всегда показывать `Следующий запуск` в timezone workflow
  - raw cron field оставить как локальный advanced escape hatch `Редактировать как код`
- **Не входит**:
  - natural language parser
  - несколько расписаний для одного trigger
  - календарные/monthly/yearly builders
- **Файлы**:
  - `apps/web/src/components/editor/config-forms/CronConfig.tsx`
  - `apps/web/src/lib/*`
  - опционально `apps/api/src/trigger/*` если preview удобнее считать сервером
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - пользователь может собрать daily/weekly schedule без знания cron
  - generated cronExpression сохраняется в существующий node config
  - под формой всегда показан следующий запуск с учётом timezone workflow
  - custom cron по-прежнему доступен
- **Проверка**:
  - собрать daily и weekly расписания в UI
  - убедиться, что raw cron корректно заполняется и сохраняется
  - `pnpm --filter @mini-zapier/web build`

### TASK-049: Email + Telegram no-code action forms
- **Статус**: `done`
- **Цель**: довести Email и Telegram actions до состояния "понятно без JSON и без template syntax по умолчанию"
- **Проблема**:
  - формально визуальные поля уже есть, но они всё ещё больше похожи на thin wrapper над raw config
  - Email action не даёт вставлять поля в `to`
  - Telegram action не помогает пользователю получить свой `chatId`
  - у продвинутого пользователя нет явного локального raw fallback внутри конкретной формы
- **Scope**:
  - Email: `to`, `subject`, `body` перевести на reusable templated controls из `TASK-047`, добавить `+ Вставить поле` на все три поля
  - Email: внизу формы добавить локальную ссылку `Показать как JSON` с raw config preview/edit
  - Telegram: `chatId` + helper `Получить мой ID` с inline инструкцией `/start` → `обновить`
  - Telegram: `message` перевести на reusable templated control + `+ Вставить поле`
  - Telegram: локальная ссылка `Показать как JSON`
- **Не входит**:
  - message preview
  - test send
  - отдельная onboarding flow для Telegram bot setup
- **Файлы**:
  - `apps/web/src/components/editor/config-forms/EmailActionConfig.tsx`
  - `apps/web/src/components/editor/config-forms/TelegramConfig.tsx`
  - `apps/web/src/components/editor/*`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - во всех email fields можно вставить поле из picker
  - Telegram form подсказывает как получить `chatId`
  - raw JSON fallback доступен внутри обеих форм
  - базовый happy-path setup Email/Telegram выполняется без ручного чтения структуры config
- **Проверка**:
  - открыть Email и Telegram action в editor
  - проверить insert field, helper copy и raw JSON fallback
  - `pnpm --filter @mini-zapier/web build`

### TASK-050: HTTP Request visual builder
- **Статус**: `done`
- **Цель**: сделать HTTP Request action удобным для нетехнического пользователя без потери полного контроля
- **Проблема**:
  - текущая форма уже лучше raw JSON, но body по сути остаётся большой строкой
  - нет простого visual режима "поля тела запроса как key-value"
  - advanced escape hatch нужен на уровне body, а не всего editor
- **Scope**:
  - URL перевести на reusable templated control
  - Method оставить dropdown
  - Headers оставить таблицей key-value, но values перевести на templated control
  - Body: default visual builder key-value для JSON body + локальная ссылка `Редактировать как JSON`
  - при выборе `POST` / `PUT` / `PATCH` автоматически предлагать `Content-Type: application/json`, если header не задан
  - сохранить совместимость с текущим worker contract
- **Не входит**:
  - OAuth/auth presets
  - multipart/form-data builder
  - отдельный query params builder
- **Файлы**:
  - `apps/web/src/components/editor/config-forms/HttpRequestConfig.tsx`
  - `apps/web/src/components/editor/*`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - можно собрать типичный JSON POST без ручного написания большого raw body
  - values в headers/body поддерживают field insertion и templated chips
  - raw JSON mode остаётся доступным для продвинутых
- **Проверка**:
  - собрать POST request через visual body builder
  - переключиться в JSON mode и обратно без потери данных
  - `pnpm --filter @mini-zapier/web build`

### TASK-051: Data Transform visual mapping builder
- **Статус**: `done`
- **Цель**: сделать Data Transform понятным через явную таблицу "выходное поле ← источник"
- **Проблема**:
  - текущий mapping mode всё ещё требует вручную писать `{{input.*}}` в value
  - нет прямого выбора source field из dropdown/tree для правой колонки
  - template mode нужен продвинутым, но не должен быть стартовой точкой для нетехнических пользователей
- **Scope**:
  - default UI: таблица из двух колонок `Имя поля на выходе` / `Откуда взять`
  - правая колонка использует field selector из `TASK-046`, а не ручной template input
  - поддержать add/remove rows и сохранение текущего mapping contract
  - существующий raw mapping/template оставить доступным через локальную ссылку `Редактировать как JSON` или `Редактировать как код`
- **Не входит**:
  - arbitrary JS
  - JSONPath/filter expressions
  - multi-source expressions в visual mode
- **Файлы**:
  - `apps/web/src/components/editor/config-forms/DataTransformConfig.tsx`
  - `apps/web/src/components/editor/FieldPicker.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - пользователь может собрать mapping вида `клиент <- input.rows.0.name` без ручного ввода template syntax
  - raw mode остаётся доступным для сложных случаев
  - сохранённый config остаётся совместим с текущим worker transform strategy
- **Проверка**:
  - собрать mapping с несколькими полями через visual table
  - проверить raw fallback
  - `pnpm --filter @mini-zapier/web build`

### TASK-052: DB Query metadata introspection + read builder
- **Статус**: `done`
- **Цель**: начать no-code DB Query c безопасного сценария чтения данных
- **Проблема**:
  - текущий `DB_QUERY` — это raw SQL textarea + params JSON, практически непригодно для нетехнических пользователей
  - full CRUD builder слишком большой для одного безопасного среза
- **Scope**:
  - backend: endpoint(ы) introspection таблиц и колонок для выбранного PostgreSQL connection текущего пользователя
  - frontend: visual builder для `Прочитать данные` с выбором таблицы, колонок, фильтров, сортировки и лимита
  - read-only preview сгенерированного SQL
  - кнопка `Тест` для выполнения select и показа результата
  - raw SQL fallback остаётся доступным
- **Не входит**:
  - INSERT / UPDATE / DELETE builders
  - joins, aggregations, group by, transactions
  - schema migration tooling
- **Файлы**:
  - `apps/api/src/connection/*` или новый introspection module
  - `apps/web/src/components/editor/config-forms/DbQueryConfig.tsx`
  - `apps/web/src/lib/api/*`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - пользователь может визуально собрать простой `SELECT`
  - таблицы и колонки подгружаются из connection
  - `Тест` показывает результат без перехода в history page
  - raw SQL fallback остаётся доступным
- **Проверка**:
  - подключить PostgreSQL connection с таблицей
  - собрать и протестировать `SELECT`
  - `pnpm --filter @mini-zapier/api build`
  - `pnpm --filter @mini-zapier/web build`

### TASK-053: DB Query write/update/delete builder
- **Статус**: `done`
- **Цель**: расширить visual DB Query builder на mutation-сценарии после безопасного read-only среза
- **Проблема**:
  - после `TASK-052` no-code пользователь всё ещё не сможет собирать `INSERT`, `UPDATE`, `DELETE`
  - mutation flows требуют отдельных UX-ограничений и более осторожного generated SQL preview
- **Scope**:
  - visual operation switch: `Записать`, `Обновить`, `Удалить`
  - формы полей/значений для insert/update
  - conditions builder для update/delete
  - SQL preview и existing raw SQL fallback
  - тестовое выполнение через тот же preview surface
- **Не входит**:
  - joins/subqueries
  - transaction batches
  - safety approvals beyond existing confirmation inside form
- **Файлы**:
  - `apps/web/src/components/editor/config-forms/DbQueryConfig.tsx`
  - `apps/api/src/*` для mutation preview/test endpoints при необходимости
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - пользователь может собрать простые `INSERT`, `UPDATE`, `DELETE` без ручного SQL
  - generated SQL preview всегда виден перед тестом
  - raw SQL fallback не убран
- **Проверка**:
  - собрать и протестировать mutation scenarios
  - `pnpm --filter @mini-zapier/api build`
  - `pnpm --filter @mini-zapier/web build`

### TASK-054: Step test-run infrastructure
- **Статус**: `done`
- **Цель**: дать editor кнопку `Тест` на уровне конкретного шага и использовать этот результат для обновления field schema
- **Проблема**:
  - сейчас проверить конфигурацию можно только через полный workflow run или manual execute
  - Phase 0 и previews становятся заметно полезнее, если editor умеет прогонять один шаг и сразу обновлять доступные поля
- **Scope**:
  - backend/API: endpoint для test-run конкретного node с mock data или output предыдущего test-run
  - worker/service: single-step execution path без full workflow mutation
  - frontend: кнопка `Тест` в inspector выбранного node, показ результата прямо в editor
  - интеграция с schema snapshot из `TASK-046`, чтобы тест тоже обновлял available field tree
- **Не входит**:
  - full test-suite orchestration по всей цепочке
  - background job history redesign
  - production-facing draft/publish separation
- **Файлы**:
  - `apps/api/src/execution/*`
  - `apps/worker/src/engine/*`
  - `apps/web/src/components/editor/ConfigPanel.tsx`
  - `apps/web/src/lib/api/*`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - у выбранного шага есть кнопка `Тест`
  - шаг можно выполнить с mock data или данными предыдущего теста
  - результат виден в editor и обновляет доступные поля для следующего шага
- **Проверка**:
  - протестировать один action без полного workflow run
  - убедиться, что picker/schema обновились
  - `pnpm --filter @mini-zapier/api build`
  - `pnpm --filter @mini-zapier/worker build`
  - `pnpm --filter @mini-zapier/web build`

### TASK-055: Built-in workflow starter templates
  - **Статус**: `done`
- **Цель**: ускорить старт за счёт готовых внутренних шаблонов workflow без внедрения marketplace
- **Проблема**:
  - даже с лучшими формами новый пользователь всё ещё начинает с пустого canvas
  - в `spec-v1` исключены marketplace и публичные шаблоны, но маленький набор встроенных starter templates остаётся допустимым post-v1 улучшением
- **Scope**:
  - добавить ограниченный набор built-in templates: `Webhook → Telegram notification`, `Cron → Email report`
  - UI выбора шаблона при создании workflow
  - prompt-only setup для пользовательских credentials/configs поверх готовой структуры
  - reuse existing editor/workflow save contracts без отдельного template marketplace backend
- **Не входит**:
  - public marketplace
  - user-generated templates
  - template sharing/import/export
- **Файлы**:
  - `apps/web/src/pages/*`
  - `apps/web/src/components/editor/*`
  - `apps/web/src/lib/*`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - пользователь может создать workflow из готового starter template
  - после выбора шаблона остаётся только заполнить свои connection/config values
  - backend contract workflow save/load не меняется
- **Проверка**:
  - создать workflow из двух starter templates
  - сохранить и открыть их в editor
  - `pnpm --filter @mini-zapier/web build`

### TASK-056: Email/Telegram message preview from last run
- **Статус**: `done`
- **Цель**: показать пользователю, как реально будет выглядеть сообщение до отправки
- **Проблема**:
  - даже с chips и field picker пользователь не видит финальный текст сообщения с подставленными данными
  - для проверки приходится mentally simulate template interpolation или запускать workflow целиком
- **Scope**:
  - preview button в Email и Telegram action forms
  - рендер template с данными последнего compatible execution или последнего step test-run
  - preview panel внутри editor без отправки сообщения наружу
  - чёткий empty state, если данных для preview пока нет
- **Не входит**:
  - actual send/test-send
  - preview для HTTP/DB/Data Transform
  - rich HTML email rendering beyond safe basic preview
- **Файлы**:
  - `apps/web/src/components/editor/config-forms/EmailActionConfig.tsx`
  - `apps/web/src/components/editor/config-forms/TelegramConfig.tsx`
  - `apps/web/src/lib/api/*`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - Email и Telegram forms показывают итоговый message preview на реальных данных
  - preview работает и после обычного execution, и после step test-run
  - при отсутствии данных виден явный empty state вместо молчаливой ошибки
- **Проверка**:
  - выполнить workflow или step test
  - открыть preview в Email и Telegram forms
  - `pnpm --filter @mini-zapier/web build`

### TASK-A: Protect unsaved editor changes
- **Статус**: `done`
- **Цель**: не дать пользователю потерять несохранённые правки при уходе из editor
- **Scope**:
  - dirty indicator в editor toolbar/header
  - определение несохранённых изменений относительно последнего сохранённого состояния
  - confirm при navigation away из editor
  - confirm при клике по header navigation/back, если есть unsaved changes
  - beforeunload guard для вкладки/refresh
- **Не входит**:
  - autosave
  - version diff
  - draft/publish
- **Файлы**:
  - `apps/web/src/components/AppHeader.tsx`
  - `apps/web/src/pages/WorkflowEditorPage.tsx`
  - `apps/web/src/stores/workflow-editor.store.ts`
  - `apps/web/src/hooks/useUnsavedChangesGuard.ts`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - editor показывает явный dirty-state
  - при уходе со страницы/маршрута с несохранёнными правками появляется confirm
  - клики по header navigation/back не уводят без discard confirm
  - закрытие вкладки и refresh показывают browser beforeunload guard
- **Проверка**:
  - изменить workflow в editor и попытаться уйти через header navigation/back
  - обновить страницу/закрыть вкладку с несохранёнными правками
  - `pnpm --filter @mini-zapier/web build`

### TASK-B: Explain rejected editor interactions
- **Статус**: `done`
- **Цель**: убрать silent failures в editor interactions и объяснять пользователю, почему действие отклонено
- **Scope**:
  - явный feedback при невалидном соединении нод в editor
  - объяснение причин отказа: duplicate edge, invalid direction, second incoming/outgoing, cycle risk, invalid target/source
  - сохранить текущие ограничения linear workflow
- **Не входит**:
  - backend contract
  - redesign canvas
  - новые graph capabilities beyond linear workflow
- **Файлы**:
  - `apps/web/src/stores/workflow-editor.store.ts`
  - `apps/web/src/components/editor/FlowCanvas.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - отклонённое соединение больше не выглядит как silent no-op
  - пользователь получает явное объяснение причины отказа
  - existing linear constraints не ослаблены
- **Проверка**:
  - попытаться создать невалидные связи в editor
  - `pnpm --filter @mini-zapier/web build`

### TASK-C: Fix stale test preview and field states
- **Статус**: `done`
- **Цель**: убрать stale state в Step Test, Message Preview и Field Picker
- **Scope**:
  - ресинхронизация input state в StepTestSection
  - корректный reset/update state при смене selected node
  - refresh/invalidation в usePreviewData после save/test/run
  - явный error state для network/API failures вместо ложного no-data/empty state
- **Не входит**:
  - новые preview types
  - full test orchestration
- **Файлы**:
  - `apps/web/src/components/editor/StepTestSection.tsx`
  - `apps/web/src/components/editor/ConfigPanel.tsx`
  - `apps/web/src/hooks/usePreviewData.ts`
  - `apps/web/src/components/editor/MessagePreview.tsx`
  - `apps/web/src/components/editor/FieldPicker.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - Step Test использует актуальные данные и не тянет stale input между узлами
  - Preview обновляется после save/test/run и различает no-data vs error
  - Field Picker не маскирует ошибки загрузки под empty state
- **Проверка**:
  - проверить Step Test, Preview и Field Picker в editor
  - `pnpm --filter @mini-zapier/web build`

### TASK-D: Align connection dialog validation
- **Статус**: `done`
- **Цель**: выровнять UX и валидацию connection dialogs между editor и Connections page
- **Scope**:
  - синхронизировать validation rules между `ConnectionCreateDialog` и `ConnectionFormDialog`
  - одинаково обрабатывать пустые values, обязательные поля и error copy
  - выровнять pending/error behavior
  - не менять backend API
  - не расширять scope на connection test/introspection beyond existing behavior
- **Не входит**:
  - изменения backend API
  - новый flow test/introspection для connections
  - любые изменения вне connection dialogs
- **Файлы**:
  - `apps/web/src/components/connections/ConnectionFormDialog.tsx`
  - `apps/web/src/components/editor/ConnectionCreateDialog.tsx`
- **Acceptance**:
  - создание connection в editor и на странице Connections использует одинаковые правила валидации
  - нельзя создать credentials с пустыми значениями через editor dialog
  - pending/error behavior в обоих dialog выровнен
- **Проверка**:
  - проверить создание connection в editor и на странице Connections
  - `pnpm --filter @mini-zapier/web build`

### TASK-E: Refine notification semantics and destructive flows
- **Статус**: `done`
- **Цель**: привести feedback к типу действия и убрать misleading state в destructive flows
- **Scope**:
  - поправить confirmation dialogs в pending state
  - убрать лишнее дублирование toast + inline в auth flow там, где toast лишний
  - проверить и точечно выровнять CRUD feedback на dashboard/connections/editor без смены общего toaster contract
  - сохранить существующие confirm dialogs для destructive actions
- **Не входит**:
  - backend API changes
  - global toaster redesign
  - unrelated UI refresh
- **Файлы**:
  - `apps/web/src/components/ui/ConfirmationDialog.tsx`
  - `apps/web/src/components/connections/ConnectionFormDialog.tsx`
  - `apps/web/src/pages/DashboardPage.tsx`
  - `apps/web/src/pages/ConnectionsPage.tsx`
  - `apps/web/src/pages/LoginPage.tsx`
  - `apps/web/src/pages/RegisterPage.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - destructive dialogs не выглядят отменяемыми/ожидающими подтверждения после уже начатого удаления
  - auth blocking errors не дублируются одновременно toast-ом и inline блоком
  - create/update/delete feedback использует copy, соответствующий текущему действию
- **Проверка**:
  - проверить login/register error surface
  - проверить delete flows на Dashboard и Connections
  - `pnpm --filter @mini-zapier/web build`

### TASK-F: Improve modal accessibility
- **Статус**: `done`
- **Цель**: улучшить accessibility и focus management модалок
- **Scope**:
  - focus trap внутри `ModalShell`
  - initial focus в диалоге
  - return focus на триггер после закрытия
  - корректные `aria-labelledby` / `aria-describedby`
  - безопасное поведение `Escape` и backdrop close
  - без новой UI-библиотеки
- **Не входит**:
  - новая modal/dialog library
  - redesign dialog UI
  - изменения backend API
- **Файлы**:
  - `apps/web/src/components/ui/ModalShell.tsx`
  - `apps/web/src/components/ui/ConfirmationDialog.tsx`
  - `apps/web/src/components/connections/ConnectionFormDialog.tsx`
- **Acceptance**:
  - keyboard focus остаётся внутри открытой модалки
  - при открытии фокус попадает в содержимое диалога
  - после закрытия фокус возвращается на исходный trigger, если он ещё существует в DOM
  - dialog получает корректные aria-связки с title/description
  - pending dialogs не закрываются через `Escape` и клик по backdrop
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

### TASK-G: Graceful fallback for missing editor API capabilities
- **Статус**: `done`
- **Цель**: убрать сырые `Cannot GET/POST` ошибки в editor и различать пустое состояние от backend deployment mismatch
- **Scope**:
  - нормализовать frontend API errors для missing backend routes
  - в `DB Query` различать `нет таблиц` и `metadata endpoint недоступен`, дать явный fallback в `Raw SQL`
  - в `Step Test` показывать понятное сообщение вместо сырого `Cannot POST`, блокировать повторные бесполезные клики
  - убрать горизонтальный overflow в проблемных error/toggle участках inspector panel
- **Не входит**:
  - изменения backend API
  - VPS redeploy
  - восстановление step test/introspection без обновления production backend
- **Файлы**:
  - `apps/web/src/lib/api/client.ts`
  - `apps/web/src/components/editor/config-forms/DbQueryConfig.tsx`
  - `apps/web/src/components/editor/StepTestSection.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - missing backend routes больше не показываются как сырые `Cannot GET/POST /api/...`
  - `DB Query` не показывает misleading `Таблицы ... не найдены`, если introspection route отсутствует на backend
  - `Step Test` показывает понятный unsupported-state и перестаёт спамить одинаковыми 404
  - длинные route-ошибки и toggles не ломают ширину inspector panel
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

### TASK-H: Support non-public schemas in DB Query visual builder
- **Статус**: `done`
- **Цель**: восстановить visual DB Query для PostgreSQL connections, где рабочие таблицы лежат не только в `public`
- **Scope**:
  - backend introspection возвращает таблицы из доступных non-system schemas, а не только из `public`
  - columns introspection принимает `schema.table` и корректно читает колонки для schema-qualified table refs
  - frontend visual DB builder генерирует SQL с корректным quoting для `schema.table`
  - copy empty-state больше не врёт про `public-схему`, если таблицы ищутся шире
- **Не входит**:
  - redesign visual DB builder
  - schema permissions fixes на стороне пользовательской БД
  - поддержка экзотических quoted identifiers с точкой внутри имени
- **Файлы**:
  - `apps/api/src/connection/introspection.service.ts`
  - `apps/web/src/components/editor/config-forms/DbQueryConfig.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - visual mode видит таблицы из non-public schemas
  - выбор `schema.table` подгружает колонки и позволяет сгенерировать SQL preview
  - `SELECT` / `INSERT` / `UPDATE` / `DELETE` из visual builder корректно quote-ят schema-qualified table refs
  - empty-state сообщает про доступные schemas, а не только про `public`
- **Проверка**:
  - `pnpm --filter @mini-zapier/api build`
  - `pnpm --filter @mini-zapier/web build`

### TASK-I: Clarify editor inspector flow for beginners and power users
- **Статус**: `done`
- **Цель**: сделать правую панель editor понятнее по умолчанию, не убирая ручные advanced-пути для опытных пользователей
- **Scope**:
  - перестроить `ConfigPanel` в явный flow `подключение → настройка → проверка`
  - сделать `Step Test` менее шумным и сворачиваемым по умолчанию
  - спрятать manual JSON / code / extra headers в более явные локальные advanced-блоки вместо равноправных primary controls
  - упростить copy в inspector и ключевых no-code формах (`HTTP Request`, `DB Query`, `Data Transform`, `Email Trigger`)
- **Не входит**:
  - redesign canvas и левой библиотеки узлов
  - новый backend API
  - глобальный app-wide toggle `beginner/pro`
  - полная переработка каждой action form в wizard
- **Файлы**:
  - `apps/web/src/components/editor/ConfigPanel.tsx`
  - `apps/web/src/components/editor/StepTestSection.tsx`
  - `apps/web/src/components/editor/templated-input/TemplatedField.tsx`
  - `apps/web/src/components/editor/config-forms/DataTransformConfig.tsx`
  - `apps/web/src/components/editor/config-forms/DbQueryConfig.tsx`
  - `apps/web/src/components/editor/config-forms/HttpRequestConfig.tsx`
  - `apps/web/src/components/editor/config-forms/RawJsonFallback.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - inspector сначала показывает следующий понятный шаг, а не только техническую свалку controls
  - connection/setup/test читаются как последовательность, а не как три равноправных блока
  - advanced/manual surfaces остаются доступными, но визуально вторичны
  - `DB Query` по умолчанию открывается в visual mode для нового пустого шага
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

### TASK-J: Repair live E2E smoke auth and dashboard contract
- **Статус**: `done`
- **Цель**: вернуть зелёный live Playwright smoke после перехода UI на email-login и локализацию
- **Scope**:
  - обновить `apps/web/e2e/ui-smoke.spec.ts`, чтобы smoke логинился по email-contract c legacy fallback, при отсутствии email самопровиженил валидного test user через публичный register endpoint, жёстко фиксировал EN locale и ждал устойчивые dashboard/editor сигналы вместо хрупкого copy
  - синхронизировать `.github/workflows/ci.yml` с email-based env (`MINI_ZAPIER_E2E_EMAIL`) без ломки legacy repository variable path
  - не менять backend auth API и не расширять smoke suite за пределы текущих сценариев
- **Не входит**:
  - новый auth flow
  - переписывание остальных e2e тестов за пределами `ui-smoke.spec.ts`
  - изменения production data/users вручную
- **Файлы**:
  - `.github/workflows/ci.yml`
  - `apps/web/e2e/ui-smoke.spec.ts`
  - `backlog.md`
  - `handoff.md`
- **Acceptance**:
  - live smoke больше не зависит от заранее созданного prod user, если в CI остался только legacy `MINI_ZAPIER_E2E_USERNAME=admin`
  - smoke использует устойчивый post-login сигнал dashboard вместо хрупкого текста
  - locale в smoke стабилен и не зависит от browser default или сохранённого localStorage
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

### TASK-K: Stabilize inspector panel density + DB Query builder semantics
- **Статус**: `done`
- **Цель**: убрать сжатие и пустоты в правой панели editor, а для PostgreSQL сделать visual builder понятнее и снова пригодным там, где ручной SQL уже работает
- **Scope**:
  - уплотнить общую вёрстку inspector panel на фиксированной узкой rail-ширине, чтобы статусные карточки и advanced-блоки не ужимались по viewport breakpoint'ам
  - перестроить `TemplatedField`/advanced JSON surfaces так, чтобы кнопки field picker/manual edit не создавали лишние пустые строки в повторяющихся формах
  - переименовать режимы и операции `DB Query` в более понятные для новых пользователей формулировки
  - расширить backend introspection до queryable PostgreSQL relations, чтобы visual builder видел не только базовые таблицы из `information_schema.tables`
- **Не входит**:
  - redesign canvas и левой библиотеки узлов
  - новый workflow wizard поверх editor
  - исправление прав/ролей на стороне пользовательской PostgreSQL базы
  - полноценный manual browser QA на production после deploy
- **Файлы**:
  - `apps/api/src/connection/introspection.service.ts`
  - `apps/web/src/components/editor/ConfigPanel.tsx`
  - `apps/web/src/components/editor/config-forms/DbQueryConfig.tsx`
  - `apps/web/src/components/editor/config-forms/RawJsonFallback.tsx`
  - `apps/web/src/components/editor/templated-input/TemplatedField.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - правый inspector больше не сжимает прогресс-карточки и repeated form actions на узкой rail-ширине
  - `TemplatedField` не создаёт отдельную пустую action-строку над каждым полем без label
  - `DB Query` использует понятные режимы `Конструктор` / `Написать SQL` и более ясные operation/source labels
  - visual builder снова показывает доступные PostgreSQL relations там, где ручной SQL test уже может обратиться к ним
  - `pnpm --filter @mini-zapier/api build` и `pnpm --filter @mini-zapier/web build` проходят
- **Проверка**:
  - `pnpm --filter @mini-zapier/api build`
  - `pnpm --filter @mini-zapier/web build`

### TASK-L: Refine inspector menu hierarchy + calm action forms
- **Статус**: `done`
- **Цель**: превратить правую панель editor в более собранную и понятную UX-surface без нагромождения, чтобы пользователь быстрее доходил до настройки текущего шага и не тратил экран на служебные статусы
- **Scope**:
  - убрать из inspector дублирующие и слишком громкие верхние блоки, заменив их на компактную hierarchy header + step summary
  - перестроить секции `Подключение`, `Настройка`, `Проверка`, `Удаление` в более спокойные и плотные surfaces без лишней визуальной конкуренции
  - переписать copy и режимы в `DB Query`, `HTTP Request`, `Data Transform`, manual JSON/manual input так, чтобы они были короче и понятнее новым пользователям на узкой панели
  - снизить вложенность и визуальный шум в advanced/manual subsections без изменения бизнес-логики шагов
- **Не входит**:
  - новый editor workflow wizard или отдельный onboarding
  - redesign canvas, node cards или левой библиотеки узлов
  - изменение backend API, execution flow или connection semantics
  - полноценный browser QA на production после deploy
- **Файлы**:
  - `apps/web/src/components/editor/ConfigPanel.tsx`
  - `apps/web/src/components/editor/StepTestSection.tsx`
  - `apps/web/src/components/editor/config-forms/DataTransformConfig.tsx`
  - `apps/web/src/components/editor/config-forms/DbQueryConfig.tsx`
  - `apps/web/src/components/editor/config-forms/HttpRequestConfig.tsx`
  - `apps/web/src/components/editor/config-forms/RawJsonFallback.tsx`
  - `apps/web/src/components/editor/templated-input/TemplatedField.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - inspector показывает компактный header и step summary вместо громоздкого блока `Что делать сейчас` и oversized status cards
  - активные секции `Подключение` / `Настройка` / `Проверка` / `Удаление` читаются как последовательный workflow, а не как набор равновесных карточек
  - `DB Query`, `HTTP Request`, `Data Transform` и manual edit surfaces используют более короткие и понятные labels для узкой панели
  - repeated/manual/advanced controls больше не создают лишний визуальный шум в верхней части каждого поля
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

### TASK-M: Repair live smoke after inspector copy update
- **Статус**: `done`
- **Цель**: починить production E2E smoke после UX-переименований в `HTTP Request`, чтобы тест больше не зависел от хрупких текстовых labels вроде `Optional headers` / `Show`
- **Scope**:
  - добавить стабильные test hooks в advanced headers block `HTTP Request`
  - перевести Playwright smoke на эти hooks вместо copy-dependent selectors
  - подтвердить, что `apps/web` по-прежнему собирается, а smoke suite парсится локально
- **Не входит**:
  - изменение продуктовой логики `HTTP Request`
  - новый smoke coverage вне уже падающего сценария webhook → HTTP → Data Transform
  - backend/VPS changes
- **Файлы**:
  - `apps/web/src/components/editor/config-forms/HttpRequestConfig.tsx`
  - `apps/web/e2e/ui-smoke.spec.ts`
- **Acceptance**:
  - live smoke больше не ищет тексты `Optional headers` / `Show` в `HTTP Request`
  - у headers advanced block есть стабильные `data-testid` для toggle и add-header action
  - `pnpm --filter @mini-zapier/web build` проходит
  - `pnpm --filter @mini-zapier/web exec playwright test --list` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`
  - `pnpm --filter @mini-zapier/web exec playwright test --list`

### TASK-N1: refactor editor inspector shell
- **Статус**: `done`
- **Цель**: превратить правую панель editor в contextual property inspector выбранного узла без дублирующего progress-UI и без конкуренции вторичных действий с основной настройкой
- **Scope**:
  - убрать верхний progress-summary `1/2/3` и декоративные `AC/TR` из header inspector-а
  - оставить в header только название узла, chip `Триггер/Действие` и одну короткую status line без fake-ready copy
  - упростить секции `Подключение`, `Основное`, `Тест шага с входными данными` и перевести удаление шага в quiet footer action
  - обновить EN/RU copy только для shell inspector-а и `StepTestSection`
- **Не входит**:
  - глубокая переработка `DbQueryConfig` и остальных config forms
  - изменения backend API
  - расширение scope за пределы shell/layout/copy inspector-а
- **Файлы**:
  - `apps/web/src/components/editor/ConfigPanel.tsx`
  - `apps/web/src/components/editor/StepTestSection.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - inspector больше не показывает верхний progress-summary и декоративные `AC/TR`
  - header inspector-а состоит только из названия узла, chip node kind и короткой contextual status line
  - connection section сведён к select + `Создать новое` + low-emphasis `Обновить список`, без summary-card, status pill, required-type helper и numbered badge
  - секция `Настройка` переименована в `Основное`, а `Step Test` стал secondary и свёрнутым по умолчанию
  - delete action вынесен в quiet footer, empty state inspector-а сведён к одному guidance block
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

### TASK-N2: redesign DB query inspector flow
- **Статус**: `done`
- **Цель**: сделать `DB Query` первым fully-aligned action inspector внутри нового shell из `TASK-N1`, чтобы основной путь вёл через предметные решения, а raw SQL оставался secondary expert-path
- **Scope**:
  - убрать верхний mode-toggle `Builder/SQL` из первого экрана `DB Query`
  - перестроить visual flow в порядке `Что сделать` → `Таблица` → operation-specific controls
  - раскрыть операции как: `Read` → fields/filters/sort/limit, `Add` → values, `Change` → values/filters, `Delete` → filters
  - добавить локальную advanced section внутри `DbQueryConfig` для raw SQL, params и `RawJsonFallback`
  - сохранить backward compatibility для `_builderState`, `query` и `params`, включая existing raw SQL steps и metadata-unavailable fallback
  - переименовать локальную SQL-проверку в `Check SQL / Проверить SQL`, оставить её внутри `DbQueryConfig`
- **Не входит**:
  - изменения других action forms
  - изменения `ConfigPanel` shell
  - изменения backend API
  - новые зависимости
- **Файлы**:
  - `apps/web/src/components/editor/config-forms/DbQueryConfig.tsx`
  - `apps/web/src/components/editor/config-forms/RawJsonFallback.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - новый пустой `DB Query` step открывается в visual flow без mode-toggle наверху
  - основной путь начинается с `Action/Что сделать` и `Table/Таблица`
  - existing raw SQL step сохраняет raw SQL и params
  - raw SQL path доступен через local advanced section
  - SQL preview виден только в visual path
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

### TASK-N3: align remaining action forms with inspector shell
- **Статус**: `done`
- **Цель**: выровнять оставшиеся action-формы под inspector-архитектуру из `TASK-N1`/`TASK-N2`, чтобы основной путь вёл через предметную настройку, а manual JSON/helpers оставались во вторичном local advanced layer
- **Scope**:
  - `HTTP Request`: перестроить flow в порядке `method → url → body`, увести headers и `RawJsonFallback` в local advanced section, сохранить compatibility logic для body fields/json и `data-testid` `http-headers-toggle` / `http-add-header-button`
  - `Email Action`: перестроить flow в порядке `to → subject → body`, оставить `MessagePreview` secondary confidence block ниже полей, увести `RawJsonFallback` в local advanced section
  - `Telegram Action`: перестроить flow в порядке `chatId → message`, сделать helper по `chatId` вторичным по визуальному весу, оставить `MessagePreview` secondary confidence block, увести `RawJsonFallback` в local advanced section
  - `Data Transform`: сделать primary path вокруг `mode + active config`, обновить mode-copy под способ формирования output, оставить template/mapping в main path, увести `RawJsonFallback` в local advanced section
  - обновить EN/RU copy и локальный nested layout для `RawJsonFallback`, не меняя `ConfigPanel` shell, `StepTestSection`, `DbQueryConfig`, trigger forms, backend API и зависимости
- **Не входит**:
  - изменения `ConfigPanel` shell, `StepTestSection`, `DbQueryConfig` и trigger-форм
  - изменения backend API
  - новые зависимости
- **Файлы**:
  - `apps/web/src/components/editor/config-forms/HttpRequestConfig.tsx`
  - `apps/web/src/components/editor/config-forms/EmailActionConfig.tsx`
  - `apps/web/src/components/editor/config-forms/TelegramConfig.tsx`
  - `apps/web/src/components/editor/config-forms/DataTransformConfig.tsx`
  - `apps/web/src/components/editor/config-forms/RawJsonFallback.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - все 4 action-формы читаются как часть одной inspector-системы
  - `HTTP Request` больше не показывает headers/raw JSON как равноправные primary blocks
  - `Email` и `Telegram` держат preview как secondary confidence block
  - `Data Transform` оставляет `mode + active config` в main path, а raw JSON уходит в advanced
  - existing behavior body-fields/json, message preview, chatId helper и mapping/template logic не ломается
  - `pnpm --filter @mini-zapier/web build` проходит
  - `pnpm --filter @mini-zapier/web exec playwright test --list` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`
  - `pnpm --filter @mini-zapier/web exec playwright test --list`

### TASK-N4: align trigger forms with inspector shell
- **Статус**: `done`
- **Цель**: выровнять три trigger-формы под inspector-архитектуру из `TASK-N1`/`TASK-N2`/`TASK-N3`, чтобы триггеры читались как contextual property inspectors с одним dominant setup block, без искусственного `Step Test` и без лишних action-like блоков
- **Scope**:
  - `Webhook Trigger`: оставить `webhook URL`, `Copy URL`, `Copy curl` и `webhook-url-input`, сделать URL + copy-actions главным блоком, а security/dedupe увести в secondary help block
  - `Cron Trigger`: перестроить первый экран вокруг visual-first path (`schedule preset + time/day controls`), вынести `Next run` в отдельный secondary confidence block и убрать raw cron expression из primary path в local advanced section
  - `Email Trigger`: сделать inbound URL главным блоком, а provider/signature guidance вынести во secondary help block
  - сохранить честные placeholder-ы для несохранённого workflow и backward compatibility для existing custom cron expressions без потери данных
  - обновить EN/RU copy только для trigger-форм; не менять `StepTestSection`, action-формы, `DbQueryConfig`, backend API и зависимости
- **Не входит**:
  - изменения `StepTestSection`, action-форм, `DbQueryConfig` и backend API
  - новый preview/test behavior для trigger-форм
  - новые зависимости
- **Файлы**:
  - `apps/web/src/components/editor/config-forms/WebhookConfig.tsx`
  - `apps/web/src/components/editor/config-forms/CronConfig.tsx`
  - `apps/web/src/components/editor/config-forms/EmailTriggerConfig.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
  - `ConfigPanel.tsx` — только если нужен compile-fix
- **Acceptance**:
  - `Webhook`, `Cron` и `Email Trigger` читаются как часть одного inspector-pattern
  - у trigger-форм нет ощущения пустого action-inspector
  - `Cron` ведёт visual-first и держит raw cron во вторичном advanced-path
  - `Webhook` и `Email Trigger` держат URL как primary surface, а guidance как secondary block
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

### TASK-N5: finalize inspector status, step-test gating and copy polish
- **Статус**: `done`
- **Цель**: завершить inspector как одну согласованную систему для 3 trigger + 5 action, чтобы header/status, Step Test и финальный copy были честными, компактными и не противоречили shell-архитектуре после `TASK-N1`/`TASK-N2`/`TASK-N3`/`TASK-N4`
- **Scope**:
  - финализировать resolver status line в `ConfigPanel` с предметным приоритетом: `choose connection first` → `save workflow before testing` → `last test succeeded/failed` → `connection: ...` → `main fields are below`
  - использовать `stepTestResults` store в `ConfigPanel` и при необходимости добавить стабильный QA hook для status line
  - передать явный `requiresConnection` в `StepTestSection`; при `connectionId=null` честно блокировать тест кнопкой, summary text и `title`, сохранив blocker для `!workflowId`
  - автоматически раскрывать `Step Test`, когда появляется новый result, unsupported-state или failure
  - обновить только shell/status/step-test copy в `messages.en.ts` / `messages.ru.ts` и удалить только реально мёртвые ключи старой inspector-модели
- **Не входит**:
  - изменения backend API
  - redesign inspector-а или переработка action/trigger forms вне compile-fix
  - trigger-side testing, новые зависимости и изменение execution semantics
- **Файлы**:
  - `apps/web/src/components/editor/ConfigPanel.tsx`
  - `apps/web/src/components/editor/StepTestSection.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - header status line inspector-а правдива, короткая и помогает понять следующий шаг
  - для action с обязательным connection `Step Test` disabled, пока connection не выбран
  - `Step Test` auto-expands после нового результата, unsupported-state и failure
  - EN/RU shell copy не содержит живых следов старой progress/wizard модели там, где ключи действительно больше не используются
  - `pnpm --filter @mini-zapier/web build` проходит
  - `pnpm --filter @mini-zapier/web exec playwright test --list` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`
  - `pnpm --filter @mini-zapier/web exec playwright test --list`

### TASK-N6: repair live smoke after HTTP advanced nesting
- **Статус**: `done`
- **Цель**: вернуть зелёный live E2E smoke после того, как `HTTP Request` advanced headers переехали внутрь local advanced section и текущий сценарий больше не мог дойти до `http-headers-toggle`
- **Scope**:
  - добавить стабильный hook на toggle local advanced section в `HTTP Request`
  - обновить Playwright smoke, чтобы он сначала раскрывал local advanced section, а затем уже работал с `http-headers-toggle` и `http-add-header-button`
  - подтвердить локально, что `apps/web` по-прежнему собирается, а smoke suite парсится
- **Не входит**:
  - изменение продуктовой логики `HTTP Request`
  - новые smoke-сценарии
  - backend/VPS changes
- **Файлы**:
  - `apps/web/src/components/editor/config-forms/HttpRequestConfig.tsx`
  - `apps/web/e2e/ui-smoke.spec.ts`
- **Acceptance**:
  - live smoke больше не пытается кликать `http-headers-toggle`, пока local advanced section ещё скрыт
  - `HTTP Request` advanced section имеет стабильный `data-testid="http-advanced-toggle"`
  - `pnpm --filter @mini-zapier/web build` проходит
  - `pnpm --filter @mini-zapier/web exec playwright test --list` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`
  - `pnpm --filter @mini-zapier/web exec playwright test --list`

### TASK-N7: remove standalone workflow start page
- **Статус**: `done`
- **Цель**: убрать отдельную страницу выбора стартового шаблона, чтобы создание workflow начиналось сразу в editor и не добавляло пустой промежуточный экран
- **Scope**:
  - перевести маршрут `/workflows/new` сразу в `WorkflowEditorPage` внутри `EditorLayout`
  - удалить standalone template picker, template helper и store/editor wiring через `location.state.templateId`
  - синхронизировать Playwright smoke с новым create-route
  - подтвердить локально, что `apps/web` собирается, а smoke suite парсится
- **Не входит**:
  - новый onboarding внутри editor
  - новые starter templates или альтернативный create hub
  - backend/API changes
- **Файлы**:
  - `apps/web/src/App.tsx`
  - `apps/web/src/pages/WorkflowEditorPage.tsx`
  - `apps/web/src/stores/workflow-editor.store.ts`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
  - `apps/web/src/pages/TemplatePickerPage.tsx`
  - `apps/web/src/lib/workflow-templates.ts`
  - `apps/web/e2e/ui-smoke.spec.ts`
- **Acceptance**:
  - `Create workflow` entry points открывают `/workflows/new`, и этот URL сразу рендерит blank editor
  - в web-коде больше нет standalone template picker route/page, template helper и template-based prefill через navigation state
  - Playwright smoke использует новый маршрут `/workflows/new`
  - `pnpm --filter @mini-zapier/web build` проходит
  - `pnpm --filter @mini-zapier/web exec playwright test --list` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`
  - `pnpm --filter @mini-zapier/web exec playwright test --list`

### TASK-N8: stabilize live smoke by removing third-party echo dependency
- **Статус**: `done`
- **Цель**: вернуть зелёный live E2E smoke после того, как deploy перестал проходить не из-за UI-селекторов, а из-за runtime failure в шаге `HTTP Request`, завязанном на внешний `postman-echo`
- **Scope**:
  - убрать обязательную зависимость smoke-сценария webhook → HTTP Request → Data Transform от внешнего echo endpoint
  - перевести default path `HTTP Request` на внутренний публичный `/api/auth/register`, который возвращает стабильный JSON contract `{"ok": true}`
  - сохранить `MINI_ZAPIER_E2E_ECHO_URL` как optional override для ручных/live отладок
  - подтвердить локально, что `apps/web` по-прежнему собирается, а smoke suite парсится
- **Не входит**:
  - изменения backend API
  - новые smoke-сценарии
  - redesign `HTTP Request` action или worker runtime
  - deploy/VPS changes
- **Файлы**:
  - `apps/web/e2e/ui-smoke.spec.ts`
- **Acceptance**:
  - default live smoke больше не зависит от `https://postman-echo.com/post`
  - webhook → HTTP Request → Data Transform остаётся end-to-end сценарием, но использует стабильный internal JSON response contract
  - optional `MINI_ZAPIER_E2E_ECHO_URL` override продолжает работать для ручной отладки
  - `pnpm --filter @mini-zapier/web build` проходит
  - `pnpm --filter @mini-zapier/web exec playwright test --list` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`
  - `pnpm --filter @mini-zapier/web exec playwright test --list`

---

## Срез O: Dashboard как операционная консоль

### TASK-O0: plan dashboard redesign slices
- **Статус**: `done`
- **Цель**: зафиксировать последовательный UX/IA план переработки главной страницы, чтобы следующие срезы выполнялись без расширения scope и без спорной приоритизации
- **Scope**:
  - сверить роль dashboard с текущим продуктом из `spec-v1.md`
  - зафиксировать основные UX/IA проблемы главной страницы
  - разложить redesign на последовательные задачи `TASK-O1`–`TASK-O5` с чёткими границами, acceptance и проверками
  - обновить handoff так, чтобы следующий исполнитель начинал с первого рабочего среза
- **Не входит**:
  - реализация dashboard redesign
  - изменения backend/frontend beyond project docs
  - новые зависимости
- **Файлы**:
  - `backlog.md`
  - `handoff.md`
- **Acceptance**:
  - в backlog добавлены последовательные `TASK-O1`–`TASK-O5`
  - `handoff.md` указывает `TASK-O1` как следующий рабочий шаг
  - planning-срез оформлен отдельной завершённой задачей
- **Проверка**:
  - docs-only task; build/test не требуются

### TASK-O1: dashboard summary data contract
- **Статус**: `done`
- **Цель**: убрать N+1 загрузку и дать dashboard один компактный контракт данных, достаточный для операционной главной страницы
- **Scope**:
  - добавить dedicated dashboard endpoint или безопасное dashboard-mode расширение существующего API без поломки текущих клиентов
  - вернуть summary stats, workflow summaries и recent executions в одном сценарии загрузки
  - получить `lastExecution` per workflow без отдельных HTTP-запросов по каждому сценарию
  - перевести dashboard store/page на новый контракт без визуального redesign
- **Не входит**:
  - новый UI dashboard
  - global executions page
  - redesign editor/connections
  - новые зависимости
- **Файлы**:
  - `apps/api/src/stats/`
  - `apps/api/src/workflow/`
  - `apps/web/src/stores/dashboard.store.ts`
  - `apps/web/src/pages/DashboardPage.tsx`
  - `apps/web/src/lib/api/`
- **Acceptance**:
  - initial load dashboard больше не делает per-workflow `executions` fetch
  - текущая страница продолжает показывать workflows, stats и last execution
  - `pnpm --filter @mini-zapier/api build` проходит
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/api build`
  - `pnpm --filter @mini-zapier/web build`

### TASK-O2: redesign dashboard top-level IA
- **Статус**: `done`
- **Цель**: убрать hero-подход и превратить верх главной страницы в compact operational header с явным attention layer
- **Scope**:
  - заменить большой hero на компактный верхний блок страницы
  - оставить один CTA `Создать сценарий` без дублей в hero/content area
  - добавить attention strip с actionable состояниями вроде `ошибки`, `на паузе`, `активные без запусков`, `черновики`
  - сделать stats-витрину компактнее и вторичной по визуальному весу
- **Не входит**:
  - redesign списка сценариев
  - поиск/фильтры/сортировка
  - новые backend API сверх compile-fix
  - новые зависимости
- **Файлы**:
  - `apps/web/src/pages/DashboardPage.tsx`
  - `apps/web/src/components/dashboard/StatsOverview.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
  - `apps/web/src/index.css`
- **Acceptance**:
  - above-the-fold показывает действия и внимание, а не общий marketing-like текст
  - duplicate CTA убран
  - stats визуально secondary к attention layer
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

### TASK-O3: redesign dashboard workflow list
- **Статус**: `done`
- **Цель**: заменить декоративные workflow cards на более плотный operational list, который быстрее сканируется и лучше поддерживает рабочие действия
- **Scope**:
  - убрать дубль статуса сценария
  - снизить визуальный вес `version/timezone/nodes`
  - поднять в иерархии `name`, короткий summary, `last run`, `status`, `attention reason`
  - выстроить action hierarchy: primary `Открыть/Редактировать`, secondary `Запустить вручную`, quieter status toggle, quiet delete
  - сохранить все текущие действия без изменения продуктовой логики
- **Не входит**:
  - поиск/фильтры/сортировка
  - новый backend API сверх compile-fix
  - global executions page
  - новые зависимости
- **Файлы**:
  - `apps/web/src/components/dashboard/WorkflowList.tsx`
  - `apps/web/src/components/dashboard/WorkflowCard.tsx`
  - `apps/web/src/pages/DashboardPage.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
  - `apps/web/src/index.css`
- **Acceptance**:
  - список сценариев стал плотнее и быстрее сканируется
  - статус сценария не дублируется двумя равноценными блоками
  - все текущие действия сохранены
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

### TASK-O4: add dashboard controls and recent activity
- **Статус**: `done`
- **Цель**: дать пользователю быстрый triage на главной странице через search/filter/sort и recent activity block
- **Scope**:
  - добавить поиск по названию и описанию сценария
  - добавить фильтры по `status` и `attention`
  - добавить сортировку `требуют внимания` / `обновлены недавно` / `по названию`
  - использовать `recentExecutions` для компактного блока последних запусков и ошибок с переходами в историю сценария
  - проработать empty/results states для filtered list
- **Не входит**:
  - отдельная global executions page
  - folders/tags
  - новые зависимости
- **Файлы**:
  - `apps/web/src/pages/DashboardPage.tsx`
  - `apps/web/src/components/dashboard/WorkflowList.tsx`
  - `apps/web/src/components/dashboard/StatsOverview.tsx`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
  - `apps/web/src/index.css`
- **Acceptance**:
  - пользователь может быстро выделить проблемные сценарии
  - на главной есть компактный блок recent runs / recent failures
  - `pnpm --filter @mini-zapier/web build` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`

### TASK-O5: dashboard copy polish, responsive pass and smoke stabilization
- **Статус**: `done`
- **Цель**: завершить redesign главной страницы через copy polish, responsive pass и stabilization тестов после изменения структуры dashboard
- **Scope**:
  - выровнять RU/EN copy под короткий operational tone
  - проверить dashboard на desktop и mobile ширинах
  - добавить/обновить stable test ids там, где DOM dashboard поменялся
  - обновить smoke selectors, если старые завязаны на хрупкую структуру или copy
- **Не входит**:
  - новые продуктовые фичи
  - redesign других страниц
  - новые зависимости
- **Файлы**:
  - `apps/web/src/pages/DashboardPage.tsx`
  - `apps/web/src/components/dashboard/`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
  - `apps/web/e2e/ui-smoke.spec.ts`
- **Acceptance**:
  - RU/EN copy согласован
  - dashboard читается на mobile и desktop
  - `pnpm --filter @mini-zapier/web build` проходит
  - `pnpm --filter @mini-zapier/web exec playwright test --list` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`
  - `pnpm --filter @mini-zapier/web exec playwright test --list`

---

## Срез P: Workflow editor workspace hierarchy

### TASK-P1: rebalance editor workspace layout
- **Статус**: `done`
- **Цель**: уменьшить ощущение трёх тяжёлых равноправных колонок в editor-е, не сужая саму рабочую область по смыслу, и убрать выезжающий overlay `FieldPicker`, который конфликтует с canvas
- **Scope**:
  - сдержать desktop-растяжение editor shell и пересобрать визуальную иерархию `left rail -> canvas -> inspector`
  - сделать левую toolbox-панель и canvas-header короче и тише по chrome/copy
  - упростить empty-state canvas без изменения продуктовой логики drag-and-drop
  - вынести `FieldPicker` в viewport-aware overlay-layer вместо локального `absolute` popover внутри формы
  - обновить только editor-related RU/EN copy для shell/toolbox/canvas
- **Не входит**:
  - новый editor onboarding
  - переработка config-forms, `ConfigPanel`, `StepTestSection` и backend API
  - новые зависимости и отдельный redesign dashboard/other pages
- **Файлы**:
  - `apps/web/src/pages/WorkflowEditorPage.tsx`
  - `apps/web/src/components/editor/NodeSidebar.tsx`
  - `apps/web/src/components/editor/FlowCanvas.tsx`
  - `apps/web/src/components/editor/FieldPicker.tsx`
  - `apps/web/src/index.css`
  - `apps/web/src/locale/messages.en.ts`
  - `apps/web/src/locale/messages.ru.ts`
- **Acceptance**:
  - editor desktop layout больше не растягивается как три одинаково тяжёлые панели на всю ширину
  - left rail и canvas читаются как supporting rails вокруг workspace, а не как конкурирующие page-sections
  - empty-state canvas стал компактнее и спокойнее
  - `FieldPicker` больше не рендерится локальным `absolute` блоком, который может визуально вылезать в сторону canvas
  - `pnpm --filter @mini-zapier/web build` проходит
  - `pnpm --filter @mini-zapier/web exec playwright test --list` проходит
- **Проверка**:
  - `pnpm --filter @mini-zapier/web build`
  - `pnpm --filter @mini-zapier/web exec playwright test --list`
