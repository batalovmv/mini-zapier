# Backlog

> Статусы: `todo` | `in_progress` | `blocked` | `done`

## Срез 1: Webhook → Queue → Worker → HTTP → Logs → History API

### TASK-001: Monorepo scaffold + Docker + shared types
- **Статус**: `todo`
- **Цель**: рабочий monorepo с pnpm workspaces, Docker Compose (PG + Redis), shared types package
- **Scope**: pnpm-workspace.yaml, root package.json, tsconfig.base.json, docker-compose.yml, .env, .gitignore, packages/shared (types/enums)
- **Не входит**: NestJS apps, Prisma, любая бизнес-логика
- **Файлы**: корень проекта + packages/shared/
- **Acceptance**: `pnpm install` проходит, `docker compose up -d` стартует PG + Redis, shared types компилируются
- **Проверка**: `pnpm install && docker compose up -d && pnpm --filter @mini-zapier/shared build`

### TASK-002: apps/api scaffold + Prisma schema + migrations
- **Статус**: `todo`
- **Цель**: NestJS API приложение с Prisma, все 7 моделей, PrismaModule
- **Scope**: apps/api scaffold (NestJS), prisma/schema.prisma (полная схема), миграция, PrismaModule + PrismaService
- **Не входит**: контроллеры, сервисы, бизнес-логика
- **Файлы**: apps/api/
- **Acceptance**: `pnpm dev:api` стартует, Prisma migrate проходит, PrismaService подключается к БД
- **Проверка**: `pnpm --filter @mini-zapier/api prisma migrate dev && pnpm dev:api`

### TASK-003: Common utilities (crypto, redact, truncate)
- **Статус**: `todo`
- **Цель**: утилиты для шифрования/дешифрования секретов, маскировки в логах, truncation
- **Scope**: apps/api/src/common/crypto.util.ts, redact.util.ts. Переиспользуемые в worker
- **Не входит**: бизнес-модули
- **Файлы**: apps/api/src/common/
- **Acceptance**: encrypt/decrypt работают с APP_ENCRYPTION_KEY, redact маскирует credentials, truncate обрезает > 64KB

### TASK-004: ConnectionModule CRUD
- **Статус**: `todo`
- **Цель**: CRUD для Connection с шифрованием credentials и блокировкой удаления
- **Scope**: connection.module, controller, service, DTO
- **Не входит**: другие модули
- **Файлы**: apps/api/src/connection/
- **Acceptance**: POST создаёт Connection (credentials зашифрованы в БД), GET возвращает masked, DELETE блокируется если используется workflow
- **Проверка**: curl POST/GET/DELETE через Swagger

### TASK-005: WorkflowModule CRUD + linear validation
- **Статус**: `todo`
- **Цель**: CRUD workflow с full graph replace и линейной валидацией
- **Scope**: workflow.module, controller, service, DTOs. Валидация: 1 trigger, linear chain, no disconnected
- **Не входит**: execution, triggers, actions
- **Файлы**: apps/api/src/workflow/
- **Acceptance**: POST/PUT создают/обновляют workflow с nodes+edges в транзакции, version++ при PUT, валидация отклоняет невалидные графы
- **Проверка**: curl с валидным и невалидным workflow через Swagger

### TASK-006: ExecutionService + TriggerController (webhook + dedupe)
- **Статус**: `todo`
- **Цель**: создание execution с snapshot + dedupe + enqueue. Webhook endpoint
- **Scope**: execution.module, controller, service. trigger.module, controller (webhook endpoint). Атомарный dedupe через TriggerEvent
- **Не входит**: worker, engine, cron, email inbound
- **Файлы**: apps/api/src/execution/, apps/api/src/trigger/
- **Acceptance**: POST /api/webhooks/:id создаёт TriggerEvent + WorkflowExecution + BullMQ job. Дубль → 200 no-op. GET /api/executions/:id возвращает execution
- **Проверка**: curl webhook дважды, проверить что второй раз 200 без нового execution

### TASK-007: apps/worker + BullMQ processor + execution engine
- **Статус**: `todo`
- **Цель**: standalone NestJS worker, BullMQ consumer, chain execution engine, LogService
- **Scope**: apps/worker scaffold, processor, engine (chain iteration), log.service (step logs)
- **Не входит**: конкретные action strategies (кроме HTTP)
- **Файлы**: apps/worker/
- **Acceptance**: worker стартует, берёт job из queue, проходит по цепочке нод, пишет step logs
- **Проверка**: создать workflow + webhook → worker выполняет → step logs в БД

### TASK-008: HttpRequestAction + auto-pause
- **Статус**: `todo`
- **Цель**: HTTP action strategy (axios + template interpolation) + auto-pause после 5 FAILED
- **Scope**: http-request.action.ts, action-strategy.interface, action.service (registry), auto-pause logic
- **Не входит**: другие action strategies
- **Файлы**: apps/worker/src/action/
- **Acceptance**: HTTP action выполняет запрос, template `{{input.field}}` работает. 5 подряд FAILED → workflow.status = PAUSED
- **Проверка**: E2E: curl webhook → HTTP action → step logs. Тест auto-pause с невалидным URL

## Срез 2: Cron + Email inbound + остальные actions

### TASK-009: Cron trigger + startup reconciliation
- **Статус**: `todo`
- **Цель**: BullMQ repeatable jobs для cron, register/unregister при PATCH status, reconciliation при старте
- **Scope**: cron.trigger.ts, trigger.service дополнение, startup hook
- **Файлы**: apps/api/src/trigger/
- **Acceptance**: ACTIVE workflow с cron trigger создаёт repeatable job. При рестарте api cron восстанавливается

### TASK-010: Email inbound trigger
- **Статус**: `todo`
- **Цель**: POST /api/inbound-email/:workflowId + dedupe
- **Scope**: email-inbound.trigger.ts, trigger.controller дополнение
- **Файлы**: apps/api/src/trigger/
- **Acceptance**: POST inbound-email создаёт execution с email data как triggerData

### TASK-011: Remaining action strategies
- **Статус**: `todo`
- **Цель**: EmailSend, Telegram, DbQuery, DataTransform actions
- **Scope**: 4 action strategy файла
- **Файлы**: apps/worker/src/action/strategies/
- **Acceptance**: каждый action выполняется, credentials берутся из Connection

### TASK-012: StatsController + Swagger + global setup
- **Статус**: `todo`
- **Цель**: GET /api/stats, Swagger setup, ValidationPipe, CORS, exception filter
- **Scope**: stats module, main.ts настройка
- **Файлы**: apps/api/src/stats/, apps/api/src/main.ts
- **Acceptance**: Swagger UI доступен на /api/docs, stats возвращает агрегации

## Срез 3-6: Frontend (День 2)

### TASK-013: Frontend scaffold + API client
- **Статус**: `todo`
- **Цель**: Vite + React + Tailwind + Router + Zustand + API client
- **Scope**: apps/web setup, базовая структура, AppLayout, Navbar
- **Файлы**: apps/web/

### TASK-014: Dashboard page
- **Статус**: `todo`
- **Цель**: stats cards, workflow list, CRUD actions
- **Scope**: DashboardPage, StatsOverview, WorkflowList, WorkflowCard, dashboard store
- **Файлы**: apps/web/src/pages/DashboardPage.tsx, apps/web/src/components/dashboard/

### TASK-015: Workflow Editor
- **Статус**: `todo`
- **Цель**: React Flow canvas, drag-and-drop, custom nodes, config panel, save/load
- **Scope**: FlowCanvas, NodeSidebar, ConfigPanel, TriggerNode, ActionNode, 8 config forms, editor store
- **Файлы**: apps/web/src/pages/WorkflowEditorPage.tsx, apps/web/src/components/editor/

### TASK-016: Execution History page
- **Статус**: `todo`
- **Цель**: execution table, step log viewer, polling
- **Scope**: ExecutionHistoryPage, ExecutionTable, StepLogViewer
- **Файлы**: apps/web/src/pages/ExecutionHistoryPage.tsx, apps/web/src/components/execution/

### TASK-017: UI polish + E2E test
- **Статус**: `todo`
- **Цель**: loading states, toasts, empty states, E2E smoke test через UI
- **Scope**: все компоненты + E2E проверка
- **Acceptance**: полный flow через UI: создать workflow → сохранить → активировать → webhook → history → logs
