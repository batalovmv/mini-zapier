# Mini-Zapier — Спецификация v1 (ЗАМОРОЖЕНА)

> Этот документ заморожен. Изменения scope только через явное обновление этого файла с обоснованием.

## Продукт
Платформа автоматизации workflow (мини-Zapier). Single-tenant internal tool. Линейные workflow (один trigger → цепочка actions). Не публичный SaaS.

## Стек
- **apps/api**: NestJS + Prisma + Swagger (REST API, CRUD, triggers, cron registration)
- **apps/worker**: NestJS standalone (BullMQ consumer, execution engine, actions, step logs)
- **apps/web**: React + Vite + React Flow + Zustand + Tailwind CSS
- **packages/shared**: только types/enums/DTOs
- **DB**: PostgreSQL
- **Queue**: Redis + BullMQ
- **Infra**: Docker Compose (PostgreSQL + Redis)

## Scope v1

### Включено
- Визуальный редактор workflow (drag-and-drop) на React Flow
- 3 типа триггеров: Webhook, Cron (расписание), Email (inbound webhook)
- 5 типов действий: HTTP Request, Email (SMTP), Telegram, PostgreSQL Query, Data Transform
- Data Transform: только template interpolation `{{input.field}}` + field mapping. Без JS
- Логирование шагов выполнения (денормализованные step logs)
- Обработка ошибок: retry с exponential backoff, timeout, auto-pause после 5 подряд FAILED
- Дашборд: список workflows, история выполнений, базовая статистика
- Connection entity для секретов (шифрование APP_ENCRYPTION_KEY)
- Dedupe через TriggerEvent с idempotencyKey
- definitionSnapshot + workflowVersion для воспроизводимости
- REST API + Swagger документация
- Линейная валидация workflow (1 trigger → chain, без branching/loops)

### НЕ включено в v1
- RBAC, встроенный auth, OAuth
- Marketplace, публичные шаблоны
- Arbitrary JS execution (isolated-vm, vm2)
- IMAP polling для email
- WebSocket для live updates
- Branching, loops, parallel execution в workflows
- Outbox pattern (используется compensating cleanup)
- JSONPath, фильтры в Data Transform

## Архитектура

### Два процесса
- **apps/api** — HTTP-сервер, CRUD, webhook/email endpoints, cron registration, Swagger
- **apps/worker** — standalone NestJS (без HTTP), BullMQ consumer, execution engine, actions

### Линейная валидация workflow
- Ровно 1 trigger
- Trigger имеет ровно 1 outgoing edge
- Action имеет max 1 incoming + max 1 outgoing edge
- Ровно 1 terminal action (без outgoing)
- Нет disconnected nodes

### Execution flow
1. API: в DB-транзакции INSERT TriggerEvent (ON CONFLICT → 200 no-op) + create WorkflowExecution
2. API: queue.add() (вне транзакции, compensating cleanup при падении)
3. Worker: итерация по цепочке нод, dataContext = triggerData → action1 output → action2 output...
4. Step logs: денормализованные (nodeLabel, nodeType, нет FK на WorkflowNode)
5. Credentials: расшифровываются worker'ом в runtime из Connection, не хранятся в snapshot

### Dedupe
- Webhook: только при наличии `Idempotency-Key` или `X-Event-ID` header
- Cron: `{cronExpr}:{scheduledAt}`
- Email: provider event ID
- Без header — не дедуплицируем (избегаем ложных дублей)

### Секреты
- Хранятся в Connection entity (type: SMTP, TELEGRAM, POSTGRESQL, WEBHOOK)
- Шифруются APP_ENCRYPTION_KEY
- Не возвращаются из API (маскируются)
- Не попадают в definitionSnapshot (только connectionId refs)
- Redaction в логах до записи в БД
- Удаление Connection блокируется если используется любым workflow

### Версионирование
- Workflow.version++ только при PUT /workflows/:id (изменение definition)
- PATCH status НЕ меняет version
- WorkflowExecution хранит workflowVersion

### Truncation
- inputData/outputData в step logs: max 64KB, флаг truncated
- triggerData: max 64KB, без отдельного флага (ограничение v1)
- Redaction применяется до записи в БД

## Database Schema (7 моделей)

### Enums
```
WorkflowStatus:  DRAFT | ACTIVE | PAUSED
ExecutionStatus: PENDING | RUNNING | SUCCESS | FAILED
StepStatus:      PENDING | RUNNING | SUCCESS | FAILED | SKIPPED
TriggerType:     WEBHOOK | CRON | EMAIL
ActionType:      HTTP_REQUEST | EMAIL | TELEGRAM | DB_QUERY | DATA_TRANSFORM
ConnectionType:  SMTP | TELEGRAM | POSTGRESQL | WEBHOOK
```

### Models
1. **Workflow**: id, name, description, status, version, timezone, viewport, timestamps
2. **WorkflowNode**: id, workflowId, positionX/Y, nodeKind, nodeType, label, config(JSON), connectionId?, retryCount, retryBackoff, timeoutMs, timestamps
3. **WorkflowEdge**: id, workflowId, sourceNodeId, targetNodeId, handles, @@unique([source,target])
4. **Connection**: id, name, type, credentials(encrypted JSON), timestamps
5. **WorkflowExecution**: id, workflowId, workflowVersion, status, triggerData, definitionSnapshot, startedAt, completedAt, errorMessage
6. **ExecutionStepLog**: id, executionId, nodeId(no FK), nodeLabel, nodeType, status, inputData, outputData, errorMessage, retryAttempt, truncated, startedAt, completedAt, durationMs
7. **TriggerEvent**: id, workflowId, source, idempotencyKey, processed, @@unique([workflowId, source, idempotencyKey])

## API Endpoints

### Workflows
- `POST /api/workflows` — create (version=1)
- `GET /api/workflows` — list (pagination, status filter)
- `GET /api/workflows/:id` — detail with nodes/edges
- `PUT /api/workflows/:id` — update (full graph replace, version++)
- `DELETE /api/workflows/:id` — delete
- `PATCH /api/workflows/:id/status` — activate/pause/draft

### Connections
- `POST /api/connections` — create (encrypt credentials)
- `GET /api/connections` — list (credentials masked)
- `GET /api/connections/:id` — detail (credentials masked)
- `PUT /api/connections/:id` — update
- `DELETE /api/connections/:id` — delete (blocked if used by any workflow)

### Executions
- `POST /api/workflows/:id/execute` — manual trigger
- `GET /api/workflows/:id/executions` — history (pagination)
- `GET /api/executions/:id` — detail + step logs

### Triggers
- `POST /api/webhooks/:workflowId` — webhook receiver (secret check + dedupe)
- `POST /api/inbound-email/:workflowId` — email inbound webhook

### Stats
- `GET /api/stats` — totalWorkflows, activeWorkflows, totalExecutions, successRate

## Frontend

### Pages
- **Dashboard**: stats cards, workflow list, CRUD actions
- **Workflow Editor**: React Flow canvas, node sidebar, config panel, save/load
- **Execution History**: execution table, step log viewer (timeline + JSON)

### Editor
- Custom node types: TriggerNode, ActionNode
- NodeSidebar: draggable palette (3 triggers + 5 actions)
- ConfigPanel: right sidebar, config form per nodeType, connection selector
- Linear-only connections (validated on save)
- 8 config forms: Webhook, Cron, EmailTrigger, HttpRequest, EmailAction, Telegram, DbQuery, DataTransform

### State Management
- Zustand stores: workflow-editor, dashboard
- API polling every 5s for running executions (no WebSocket)

## Компромиссы v1
- queue.add() вне DB-транзакции → compensating cleanup (outbox pattern в будущем)
- triggerData truncation без отдельного флага
- Polling вместо WebSocket
- Нет auth (single-tenant, доступ через VPN/reverse proxy)
