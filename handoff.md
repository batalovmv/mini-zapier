# Handoff

> Обновляется после каждой завершённой задачи. Новая сессия начинается с чтения этого файла.

## Текущее состояние
- **Последняя задача**: TASK-011 (done)
- **Статус проекта**: worker теперь выполняет все action types из backend scope v1: `HTTP_REQUEST`, `EMAIL`, `TELEGRAM`, `DB_QUERY`, `DATA_TRANSFORM`; API/worker flow из предыдущих срезов остаётся рабочим, следующий backend gap — `TASK-012` (stats + Swagger + global middleware)
- **Что сделано**:
  - В `apps/worker/src/action/strategies/` добавлены реальные стратегии:
    - `email-send.action.ts` — `nodemailer` transporter из credentials (`host`, `port`, `user`, `pass`), template interpolation для `to`, `subject`, `body`, return `{messageId, accepted}`
    - `telegram.action.ts` — `axios POST` в Telegram Bot API с `credentials.botToken`, interpolation для `chatId` и `message`, return `{messageId, ok}`
    - `db-query.action.ts` — `pg Client` из `connectionString` или `host`/`port`/`user`/`password`/`database`, interpolation для `params`, return `{rows, rowCount}`
    - `data-transform.action.ts` — `mode=template` и `mode=mapping` по `{{input.path}}`
  - Добавлен `apps/worker/src/action/strategies/template-interpolation.util.ts`, чтобы новые action strategies использовали общий interpolation/path resolution контракт без изменения `execution-engine`
  - `apps/worker/src/action/action.service.ts` и `apps/worker/src/action/action.module.ts` теперь регистрируют реальные стратегии вместо `noop` для `EMAIL`, `TELEGRAM`, `DB_QUERY`, `DATA_TRANSFORM`
  - `apps/worker/package.json` и `pnpm-lock.yaml` обновлены под runtime/type зависимости `axios`, `nodemailer`, `pg`, `@types/nodemailer`, `@types/pg`
  - Smoke-проверка `TASK-011` прошла:
    - `pnpm --filter @mini-zapier/worker run build`
    - inline registry-check подтвердил, что `ActionRegistry.resolve()` отдаёт новые стратегии
    - inline smoke с mock transport/API подтвердил `EmailSendAction` и `TelegramAction`
    - inline smoke с локальным PostgreSQL (`localhost:5434`) подтвердил `DbQueryAction` через `SELECT $1::text AS name, $2::int AS code`
    - inline smoke подтвердил `DataTransformAction` для `template` и `mapping`
- **Что сломано**:
  - Критичных поломок по уже закрытому backend scope не выявлено
- **Частично сделано**:
  - `apps/api` всё ещё без `StatsModule`, Swagger setup и global middleware из `TASK-012`
  - `apps/web` всё ещё placeholder
- **Root scripts**:
  - `pnpm dev:api` работает
  - `pnpm dev:worker` работает
  - `pnpm dev:web` заработает после TASK-013

## Следующий шаг
**TASK-012**: StatsController + Swagger + global middleware

## Блокеры
- На машине во время проверки порт `3000` был занят внешним процессом (`D:\TZ\Finance_tracker\src\server.ts`). API по умолчанию слушает `3000`, но для локальной smoke-проверки можно временно запускать с `PORT=3001`.
- В этом workspace `pnpm add` / `pnpm install --lockfile-only` зависали без вывода; для `TASK-011` lockfile был синхронизирован по временному чистому `pnpm`-проекту, после чего сборка воркера и smoke-проверки выполнены успешно

## Важные заметки
- **Порты инфраструктуры**: PostgreSQL=**5434**, Redis=**6380**
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
- Для smoke-проверок `TASK-008` использовались тестовые сущности:
  - `Connection`: `cmmiadsob0000wyiwt7amu01e`
  - success `Workflow`: `cmmiadsou0001wyiwxecxv37r`
  - success `Execution`: `cmmiadspr0004wyiwjkw510af`
  - auto-pause `Workflow`: `cmmiadv51000dwyiwduvmpwad`
  - first failed `Execution`: `cmmiadv5n000gwyiw0xjfl034`
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
| TASK-007 | done | см. `git log` (`TASK-007: apps/worker scaffold + BullMQ processor + execution engine`) | standalone worker, BullMQ consumer, chain resolver, retry/timeout wrapper, step logs, success/failure smoke-checked |
| TASK-008 | done | см. `git log` (`TASK-008: HttpRequestAction + auto-pause + E2E smoke`) | real HTTP_REQUEST strategy, template interpolation, retry smoke, 5x failed auto-pause, dedupe + snapshot/log secrecy checks |
| TASK-009 | done | см. `git log` (`TASK-009: Cron trigger + startup reconciliation`) | separate cron queue/worker in API, register/unregister on PATCH status, re-register on PUT, startup reconciliation, cron dedupe smoke-checked |
| TASK-010 | done | см. `git log` (`TASK-010: Email inbound trigger`) | inbound email endpoint, rawBody HMAC verification, ACTIVE/type guards, provider event dedupe, smoke-checked and cleaned up |
| TASK-011 | done | см. `git log` (`TASK-011: Remaining action strategies (Email, Telegram, DB, Transform)`) | real EMAIL/TELEGRAM/DB_QUERY/DATA_TRANSFORM strategies, registry wiring, worker deps/lock update, build + smoke-checked |
| docs | done | — | spec-v1, backlog, decisions, test-checklist, CLAUDE.md — согласованы (см. git log) |
