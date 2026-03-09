# Handoff

> Обновляется после каждой завершённой задачи. Новая сессия начинается с чтения этого файла.

## Текущее состояние
- **Последняя задача**: TASK-015 (done)
- **Статус проекта**: backend scope v1 остаётся закрытым до `TASK-012`, а для `apps/web` закрыт `TASK-015`: dashboard и workflow editor теперь работают поверх существующего API; по backlog из frontend core остаётся `TASK-016` (history / step logs), следующий шаг — `TASK-016`
- **Что сделано**:
  - В `apps/web/package.json` добавлен `reactflow`, а в `apps/web/src/main.tsx` подключён `reactflow/dist/style.css`
  - Добавлен Zustand store `apps/web/src/stores/workflow-editor.store.ts` строго по scope `TASK-015`:
    - `nodes`, `edges`, `onNodesChange`, `onEdgesChange`, `onConnect`
    - `selectedNodeId`, `selectNode`
    - `workflowId`, `workflowName`, `workflowStatus`, `workflowVersion`
    - `addNode`, `updateNodeConfig`, `removeNode`
    - `loadWorkflow()` и `saveWorkflow()` с маппингом `API <-> React Flow`
  - Добавлены editor-компоненты `apps/web/src/components/editor/`:
    - `FlowCanvas.tsx` с React Flow canvas, `screenToFlowPosition` в `onDrop`, custom node types, background grid и controls
    - `NodeSidebar.tsx` с секциями `Triggers` / `Actions` и draggable palette для 3 trigger + 5 action типов
    - `ConfigPanel.tsx` с формой по `nodeType`, dropdown для `GET /api/connections` и `Delete Node`
    - `nodes/TriggerNode.tsx` и `nodes/ActionNode.tsx` с кастомным render для trigger/action нод
    - 8 config forms в `config-forms/`: `Webhook`, `Cron`, `EmailTrigger`, `HttpRequest`, `EmailAction`, `Telegram`, `DbQuery`, `DataTransform`
  - `WorkflowEditorPage.tsx` перестал быть placeholder:
    - layout `sidebar | canvas | config panel`
    - toolbar с `workflow name`, `status badge`, `Save`, `Activate/Pause`, `Run`
    - `GET /api/workflows/:id` для load existing workflow
    - `POST /api/workflows` для `/workflows/new/edit`, `PUT /api/workflows/:id` для existing workflow
    - `PATCH /api/workflows/:id/status` и `POST /api/workflows/:id/execute` подключены к кнопкам toolbar
  - В editor store добавлена клиентская защита линейных связей без изменения backend scope:
    - не создаётся второй outgoing edge от той же ноды
    - не создаётся второй incoming edge в target action
    - не создаётся cycle/self-link
  - Smoke-проверка `TASK-015` прошла:
    - `npm install reactflow --save --no-package-lock --prefer-offline --fetch-timeout=600000 --fetch-retries=5` в `apps/web`
    - `npm run build` в `apps/web` → успешно
    - временный API: `node --env-file=..\\..\\.env dist/main.js` в `apps/api` на `PORT=3001`
    - временный web: `node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5177` в `apps/web` с `VITE_API_PROXY_TARGET=http://127.0.0.1:3001`
    - `GET http://127.0.0.1:5177/workflows/new/edit` → `200`
    - `GET http://127.0.0.1:5177/api/workflows?page=1&limit=1` через Vite proxy → `200`
    - editor-compatible API smoke на временном workflow:
      - `POST /api/workflows` → `201`
      - `GET /api/workflows/:id` → `200`
      - `PUT /api/workflows/:id` → `200`, `version=2`
      - `PATCH /api/workflows/:id/status` → `200`, `ACTIVE`
      - `POST /api/workflows/:id/execute` → `202`
      - временный workflow `cmmj4bc0e0000wy8ceyh3mrcq` после smoke удалён через `DELETE /api/workflows/:id` → `204`
- **Что сломано**:
  - Критичных поломок по закрытому scope `TASK-015` не выявлено
- **Частично сделано**:
  - `ExecutionHistoryPage` всё ещё placeholder-only до `TASK-016`
  - Полноценный интерактивный browser smoke для drag-and-drop/click-through editor canvas в этой сессии не запускался; подтверждены сборка, route/proxy и API wiring editor-а
- **Root scripts**:
  - `pnpm dev:api` работает, если порт `3000` свободен; для локального smoke можно временно запускать API на `3001`
  - `pnpm dev:worker` работает
  - `pnpm dev:web` работает, если порт `5173` свободен
  - `pnpm build:web` работает

## Следующий шаг
**TASK-016**: Execution History + Step Log Viewer

## Блокеры
- На машине во время проверки порт `3000` был занят внешним процессом (`D:\TZ\Finance_tracker\src\server.ts`), а порт `5173` — внешним Vite-процессом (`D:\TZ\Finance_tracker\client`). Для smoke-проверок использовались `3001`, `5174`, `5175`, `5176`, `5177`.
- В этом workspace `pnpm install` всё ещё зависает без вывода. Для `TASK-013` зависимости `apps/web` были установлены локально через `npm install --prefer-offline`, из-за чего `pnpm-lock.yaml` не обновлялся.
- `apps/web/package.json` использует `"@mini-zapier/shared": "file:../../packages/shared"` как обход зависающего `pnpm install` и несовместимости `npm` с `workspace:*`.

## Важные заметки
- **Порты инфраструктуры**: PostgreSQL=**5434**, Redis=**6380**
- Для `apps/web` Vite proxy по умолчанию шлёт `/api/*` на `http://localhost:3000`; для локального smoke можно переопределить target через `VITE_API_PROXY_TARGET`
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
| TASK-012 | done | см. `git log` (`TASK-012: StatsController + Swagger + global middleware`) | `/api/stats`, Swagger UI `/api/docs`, global ValidationPipe/CORS/exception filter, DTO validation + runtime smoke |
| TASK-013 | done | см. `git log` (`TASK-013: Frontend scaffold + API client + layout`) | apps/web scaffold, Tailwind, router, AppLayout, typed axios client, build + dev/proxy smoke |
| TASK-014 | done | см. `git log` (`TASK-014: Dashboard page`) | Zustand dashboard store, live stats cards, workflow cards with Edit/Run/Pause-Activate/Delete, Vite proxy + API smoke |
| TASK-015 | done | см. `git log` (`TASK-015: Workflow Editor (React Flow)`) | React Flow workflow editor, Zustand editor store, drag-and-drop sidebar/canvas/config panel, load-save-status-run wiring, build + route/API smoke |
| docs | done | — | spec-v1, backlog, decisions, test-checklist, CLAUDE.md — согласованы (см. git log) |
