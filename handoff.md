# Handoff

> Обновляется после каждой завершённой задачи. Новая сессия начинается с чтения этого файла.

## Текущее состояние
- **Последняя задача**: TASK-017 (done)
- **Статус проекта**: backlog v1 закрыт целиком: backend scope остаётся закрытым до `TASK-012`, а frontend scope `TASK-013` → `TASK-017` завершён, включая UI polish и browser E2E smoke поверх существующего API/worker
- **Что сделано**:
  - В `apps/web` добавлен общий polish-слой без расширения product scope:
    - глобальный `ErrorBoundary` в `src/main.tsx`
    - toast-notifications через `react-hot-toast`
    - переиспользуемые UI-компоненты `Spinner`, `LoadingState`, `EmptyState`, `ModalShell`, `ConfirmationDialog`
  - Dashboard / Editor / History приведены к acceptance `TASK-017`:
    - loading states на страницах и в таблицах теперь показывают spinners, а не только текст
    - empty states для workflow/execution реализованы явно (`Нет workflows`, `Нет executions`)
    - destructive actions подтверждаются модальными dialog-ами:
      - delete workflow в `DashboardPage.tsx`
      - delete node в `ConfigPanel.tsx`
    - success/error toasts добавлены на workflow CRUD / run / status toggle / connection create
  - В editor добавлена минимальная UI-точка создания connection внутри scope acceptance:
    - новый `ConnectionCreateDialog.tsx` использует существующий `POST /api/connections`
    - после создания connection автоматически подставляется в selected node
    - это закрывает требование “полный flow от создания connection до просмотра результатов через UI”
  - Для стабильного browser smoke в dev-only режиме добавлен test hook на линейное соединение нод в `FlowCanvas.tsx`; production build не меняется
  - Добавлен полный E2E smoke через Playwright:
    - `apps/web/playwright.config.ts`
    - `apps/web/e2e/ui-smoke.spec.ts`
    - `apps/web/package.json` scripts: `e2e`, `e2e:headed`
    - сценарий покрывает:
      - создание `WEBHOOK` connection через UI
      - создание workflow `Webhook -> HTTP Request -> Data Transform`
      - настройку нод через config panel
      - save + activate
      - POST webhook с `X-Webhook-Secret`
      - переход в history и проверку step logs / output data
      - cleanup workflow + connection после теста
  - Smoke-проверка `TASK-017` прошла:
    - `docker compose up -d`
    - `npm run build` в `apps/web`
    - временный API: `node --env-file=..\\..\\.env dist/main.js` в `apps/api` на `PORT=3001`
    - временный web: `node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5179` в `apps/web` с `VITE_API_PROXY_TARGET=http://127.0.0.1:3001`
    - worker запущен на существующем dist и обработал UI smoke flow
    - `npm run e2e` в `apps/web` -> `1 passed`
- **Что сломано**:
  - Критичных поломок по закрытому scope `TASK-017` не выявлено
- **Частично сделано**:
  - Частичных хвостов по backlog v1 не осталось
- **Root scripts**:
  - `pnpm dev:api` работает, если порт `3000` свободен; для локального smoke можно временно запускать API на `3001`
  - `pnpm dev:worker` работает
  - `pnpm dev:web` работает, если порт `5173` свободен
  - `pnpm build:web` работает
  - `npm run e2e` в `apps/web` запускает Playwright smoke для `TASK-017`

## Следующий шаг
**Следующий шаг по backlog отсутствует**: v1 scope из `backlog.md` закрыт. Дальше только новый явно поставленный TASK / post-v1 scope.

## Блокеры
- На машине во время проверки порт `3000` был занят внешним процессом (`D:\TZ\Finance_tracker\src\server.ts`), а порт `5173` — внешним Vite-процессом (`D:\TZ\Finance_tracker\client`). Для smoke-проверок использовались `3001`, `5174`, `5175`, `5176`, `5177`, `5178`.
- В этом workspace `pnpm install` всё ещё зависает без вывода. Для `TASK-013` зависимости `apps/web` были установлены локально через `npm install --prefer-offline`, из-за чего `pnpm-lock.yaml` не обновлялся.
- `apps/web/package.json` использует `"@mini-zapier/shared": "file:../../packages/shared"` как обход зависающего `pnpm install` и несовместимости `npm` с `workspace:*`.
- Для smoke `TASK-017` worker в локальном окружении не стартовал “из коробки” из-за неполного install состояния (`apps/worker/node_modules` не содержал top-level `pg`, `nodemailer`, `axios`). Для этой сессии runtime был добран временно вне git. Если понадобится новый backend smoke, сначала проверь локальный install worker dependencies.

## Важные заметки
- **Порты инфраструктуры**: PostgreSQL=**5434**, Redis=**6380**
- Для `apps/web` Vite proxy по умолчанию шлёт `/api/*` на `http://localhost:3000`; для локального smoke можно переопределить target через `VITE_API_PROXY_TARGET`
- `apps/web/playwright.config.ts` по умолчанию ждёт `MINI_ZAPIER_E2E_BASE_URL=http://127.0.0.1:5179`; если прогоняешь e2e на другом порту, передай env явно
- В `ExecutionTable` колонка `trigger` сейчас показывает короткий preview из `triggerData`, потому что текущий `WorkflowExecutionDto` не содержит отдельного поля `source`; backend contract не менялся в рамках `TASK-016`
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
| TASK-016 | done | см. `git log` (`TASK-016: Execution History + Step Log Viewer`) | execution history page, paginated execution table, step log timeline with JSON viewer, 5s polling for RUNNING executions, dashboard history link |
| TASK-017 | done | см. `git log` (`TASK-017: UI polish + E2E test`) | toasts/loading-empty states/error boundary/confirm dialogs, inline connection create in editor, Playwright UI smoke with webhook -> history -> step logs |
| docs | done | — | spec-v1, backlog, decisions, test-checklist, CLAUDE.md — согласованы (см. git log) |
