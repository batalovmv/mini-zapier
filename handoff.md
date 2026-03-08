# Handoff

> Обновляется после каждой завершённой задачи. Новая сессия начинается с чтения этого файла.

## Текущее состояние
- **Последняя задача**: TASK-006 (done)
- **Статус проекта**: Execution + webhook ingress готовы; API умеет создавать execution, делать webhook dedupe и ставить jobs в BullMQ queue
- **Что сделано**:
  - Добавлены `ExecutionModule` и `QueueModule` в `apps/api`: `POST /api/workflows/:id/execute`, `GET /api/workflows/:id/executions`, `GET /api/executions/:id`
  - `ExecutionService.startExecution()` делает атомарный dedupe через `TriggerEvent.createMany(..., skipDuplicates: true)`, создаёт `WorkflowExecution` со `status=PENDING`, сохраняет `definitionSnapshot` без credentials и затем enqueue'ит job в BullMQ queue `workflow-execution`
  - При падении `queue.add()` выполняется compensating cleanup: удаляются созданные `WorkflowExecution` и `TriggerEvent`
  - После успешного enqueue `TriggerEvent.processed` помечается в `true`
  - Добавлен `TriggerController` с `POST /api/webhooks/:workflowId`: проверка `X-Webhook-Secret` через `Connection(type=WEBHOOK)`, dedupe по `Idempotency-Key` / `X-Event-ID`, 200 для duplicate и 202 для нового execution
  - Smoke-проверка прошла: manual execute, list/detail executions, webhook success, dedupe по `Idempotency-Key`, dedupe по `X-Event-ID`, webhook без dedupe, 401 на missing/invalid secret, 422 на неактивный workflow, проверка в БД `TriggerEvent.processed=true`, `definitionSnapshot` без credentials, 4 jobs в BullMQ queue
- **Что сломано**:
  - `apps/worker` ещё не реализован, поэтому jobs остаются в очереди, а executions после webhook/manual trigger остаются в статусе `PENDING`
- **Частично сделано**:
  - `apps/api` всё ещё без `StatsModule`
  - `apps/worker` и `apps/web` всё ещё placeholders
- **Root scripts**:
  - `pnpm dev:api` работает
  - `pnpm dev:worker` заработает после TASK-007
  - `pnpm dev:web` заработает после TASK-013

## Следующий шаг
**TASK-007**: apps/worker scaffold + BullMQ processor + execution engine

## Блокеры
- На машине во время проверки порт `3000` был занят внешним процессом (`D:\TZ\Finance_tracker\src\server.ts`). API по умолчанию слушает `3000`, но для локальной smoke-проверки можно временно запускать с `PORT=3001`.

## Важные заметки
- **Порты инфраструктуры**: PostgreSQL=**5434**, Redis=**6380**
- Для `ConnectionModule` и webhook secret-check нужен `APP_ENCRYPTION_KEY` в env процесса API; в smoke-проверке он передавался явно при запуске на `3001`
- Для `QueueModule` используются `REDIS_HOST`/`REDIS_PORT`; при отсутствии env в коде выставлен fallback на `localhost:6380`
- Для `WorkflowModule` отдельная миграция не понадобилась: использована существующая Prisma schema из TASK-002
- Валидация workflow выполняется в `apps/api/src/workflow/workflow.validation.ts`; при сохранении node ids берутся из payload и затем используются в edges как есть
- Для `apps/api` зафиксирован Prisma **6.19.2**: это оставляет классическую `schema.prisma` и стандартный `PrismaClient` без нового Prisma 7 datasource/runtime слоя
- `pnpm dev:api` перед стартом автоматически делает `prisma generate`
- Для smoke-проверки `TASK-006` использовались тестовые сущности:
  - `Connection`: `cmmi8amf60000wyk4tway62fr`
  - `Workflow`: `cmmi8amfw0001wyk4oxvfnrzx`
- После следующего изменения `apps/api/prisma/schema.prisma` запускай `pnpm --filter @mini-zapier/api run prisma:migrate -- --name <migration_name>`

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
| docs | done | — | spec-v1, backlog, decisions, test-checklist, CLAUDE.md — согласованы (см. git log) |
