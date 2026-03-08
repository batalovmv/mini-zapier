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
- **Статус**: `todo`
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
- **Статус**: `todo`
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
- **Статус**: `todo`
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
- **Статус**: `todo`
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
- **Статус**: `todo`
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
- **Статус**: `todo`
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
- **Статус**: `todo`
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
- **Статус**: `todo`
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
- **Статус**: `todo`
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
- **Статус**: `todo`
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
- **Статус**: `todo`
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
- **Статус**: `todo`
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
- **Статус**: `todo`
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
- **Статус**: `todo`
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
- **Статус**: `todo`
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

