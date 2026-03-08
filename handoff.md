# Handoff

> Обновляется после каждой завершённой задачи. Новая сессия начинается с чтения этого файла.

## Текущее состояние
- **Последняя задача**: TASK-008 (done)
- **Статус проекта**: Webhook/manual execution проходят end-to-end через Redis queue и standalone worker; `HTTP_REQUEST` теперь выполняет реальный HTTP вызов, execution пишет step logs и workflow auto-pause срабатывает после 5 подряд `FAILED`
- **Что сделано**:
  - Добавлен standalone `apps/worker`: `NestFactory.createApplicationContext`, `WorkerModule`, локальные `PrismaModule`/`PrismaService`, bootstrap без HTTP
  - Добавлен BullMQ consumer `workflow-execution`: worker подключается к Redis и обрабатывает jobs из очереди `workflow-execution`
  - Реализован `ExecutionEngine`: читает execution c `definitionSnapshot`, переводит execution в `RUNNING`, извлекает линейную action-цепочку из snapshot, прокидывает `dataContext`, расшифровывает credentials по `connectionId`, применяет timeout/retry/backoff и завершает execution в `SUCCESS` или `FAILED`
  - Реализован `LogService`: создаёт денормализованные `ExecutionStepLog`, пишет `nodeLabel`/`nodeType`, делает redaction чувствительных полей и truncation payload > 64KB до записи в БД
  - `ActionService` переведён на `Map<ActionType, ActionStrategy>`; `HTTP_REQUEST` зарегистрирован как первая реальная strategy, остальные action types v1 пока остаются на noop stub
  - Добавлен `HttpRequestAction`: template interpolation для `{{input.*}}` в config, реальный HTTP вызов, поддержка `AbortSignal` и контракт результата `{ status, headers, data }`
  - В `ExecutionEngine` добавлен auto-pause: после обновления execution в `FAILED` worker проверяет последние 5 executions workflow и переводит workflow в `PAUSED`, если все 5 подряд завершились `FAILED`
  - Smoke-проверка `TASK-008` прошла:
    - success workflow `cmmiadsou0001wyiwxecxv37r` → execution `cmmiadspr0004wyiwjkw510af` завершился `SUCCESS`; `HTTP_REQUEST` сходил в `https://httpbin.org/anything`, `{{input.name}}` и `{{input.profile.city}}` корректно подставились в URL/body
    - dedupe подтвердился и для `Idempotency-Key`, и для `X-Event-ID`: повторный webhook вернул `{ duplicate: true }`, лишний execution не создался
    - retry подтвердился на workflow `cmmiadv51000dwyiwduvmpwad`: первый failed execution `cmmiadv5n000gwyiw0xjfl034` сохранил `retryAttempt=2` при `retryCount=2`
    - auto-pause сработал после 5 подряд failed executions: workflow `cmmiadv51000dwyiwduvmpwad` переведён в `PAUSED`, worker записал warning в лог
    - webhook secret не попал ни в `step logs`, ни в `definitionSnapshot`
- **Что сломано**:
  - Реальные action strategies ещё не реализованы для `EMAIL`, `TELEGRAM`, `DB_QUERY`, `DATA_TRANSFORM`: они всё ещё работают через noop stub
- **Частично сделано**:
  - `apps/api` всё ещё без `StatsModule`
  - `apps/web` всё ещё placeholder
- **Root scripts**:
  - `pnpm dev:api` работает
  - `pnpm dev:worker` работает
  - `pnpm dev:web` заработает после TASK-013

## Следующий шаг
**TASK-009**: Cron trigger + startup reconciliation

## Блокеры
- На машине во время проверки порт `3000` был занят внешним процессом (`D:\TZ\Finance_tracker\src\server.ts`). API по умолчанию слушает `3000`, но для локальной smoke-проверки можно временно запускать с `PORT=3001`.

## Важные заметки
- **Порты инфраструктуры**: PostgreSQL=**5434**, Redis=**6380**
- Для `ConnectionModule` и webhook secret-check нужен `APP_ENCRYPTION_KEY` в env процесса API; в smoke-проверке он передавался явно при запуске на `3001`
- Для `QueueModule` используются `REDIS_HOST`/`REDIS_PORT`; при отсутствии env в коде выставлен fallback на `localhost:6380`
- Для `apps/worker` `start`/`start:dev` читают env из корневого `.env`; это покрывает `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `APP_ENCRYPTION_KEY`
- Для `WorkflowModule` отдельная миграция не понадобилась: использована существующая Prisma schema из TASK-002
- Валидация workflow выполняется в `apps/api/src/workflow/workflow.validation.ts`; при сохранении node ids берутся из payload и затем используются в edges как есть
- Для `apps/api` зафиксирован Prisma **6.19.2**: это оставляет классическую `schema.prisma` и стандартный `PrismaClient` без нового Prisma 7 datasource/runtime слоя
- `pnpm dev:api` перед стартом автоматически делает `prisma generate`
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
| docs | done | — | spec-v1, backlog, decisions, test-checklist, CLAUDE.md — согласованы (см. git log) |
