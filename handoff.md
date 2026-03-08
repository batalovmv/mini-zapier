# Handoff

> Обновляется после каждой завершённой задачи. Новая сессия начинается с чтения этого файла.

## Текущее состояние
- **Последняя задача**: TASK-005 (done)
- **Статус проекта**: Workflow CRUD готов; можно переходить к Execution + Trigger layer
- **Что сделано**:
  - Добавлен `WorkflowModule` в `apps/api` с endpoint'ами `POST /api/workflows`, `GET /api/workflows`, `GET /api/workflows/:id`, `PUT /api/workflows/:id`, `PATCH /api/workflows/:id/status`, `DELETE /api/workflows/:id`
  - `WorkflowService` сохраняет workflow + nodes + edges в одной транзакции, а `PUT` делает full graph replace с `version++`
  - `PATCH /status` меняет только `status` и сохраняет текущую `version`
  - Линейная валидация вынесена в отдельный helper: 1 trigger, один outgoing у trigger, max 1 incoming/outgoing у action, ровно 1 terminal action, нет disconnected nodes/duplicate edges/self-loop
  - `GET /api/workflows` возвращает пагинированный список `{items,total,page,limit}` с фильтром по `status`
  - Smoke-проверка прошла: create/update/status/detail/list/delete и негативные кейсы `0 triggers`, `2 triggers`, `trigger without outgoing`, `disconnected`, `cycle`
- **Что сломано**: —
- **Частично сделано**:
  - `apps/api` всё ещё без `ExecutionModule`, `TriggerModule`, `StatsModule`
  - `apps/worker` и `apps/web` всё ещё placeholders
- **Root scripts**:
  - `pnpm dev:api` работает
  - `pnpm dev:worker` заработает после TASK-007
  - `pnpm dev:web` заработает после TASK-013

## Следующий шаг
**TASK-006**: ExecutionService + TriggerController (webhook + dedupe)

## Блокеры
- На машине во время проверки порт `3000` был занят внешним процессом (`D:\TZ\Finance_tracker\src\server.ts`). API по умолчанию слушает `3000`, но для локальной smoke-проверки можно временно запускать с `PORT=3001`.

## Важные заметки
- **Порты инфраструктуры**: PostgreSQL=**5434**, Redis=**6380**
- Для `ConnectionModule` нужен `APP_ENCRYPTION_KEY` в env процесса API; в smoke-проверке он передавался явно при запуске на `3001`
- Для `WorkflowModule` отдельная миграция не понадобилась: использована существующая Prisma schema из TASK-002
- Валидация workflow выполняется в `apps/api/src/workflow/workflow.validation.ts`; при сохранении node ids берутся из payload и затем используются в edges как есть
- Для `apps/api` зафиксирован Prisma **6.19.2**: это оставляет классическую `schema.prisma` и стандартный `PrismaClient` без нового Prisma 7 datasource/runtime слоя
- `pnpm dev:api` перед стартом автоматически делает `prisma generate`
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
| docs | done | — | spec-v1, backlog, decisions, test-checklist, CLAUDE.md — согласованы (см. git log) |
