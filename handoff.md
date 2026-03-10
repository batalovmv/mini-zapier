# Handoff

> Обновляется после каждой завершённой задачи. Новая сессия начинается с чтения этого файла.

## Текущее состояние
- **Последнее изменение**: TASK-018 — `deployment config + minimal admin login`
- **Статус проекта**: backlog v1 закрыт + post-v1 fix закрыт + TASK-018 (deploy + auth) закрыт
- **Что сделано в TASK-018**:
  - **Deploy конфигурация**:
    - `deploy/Dockerfile.api` — multi-stage build с `pnpm deploy --legacy`, Prisma CLI, pg_isready, wget
    - `deploy/Dockerfile.worker` — multi-stage build с `pnpm deploy --legacy`
    - `deploy/docker-compose.prod.yml` — PostgreSQL + Redis + API + Worker, healthchecks, depends_on (reverse proxy вынесен в host nginx на VPS)
    - `deploy/api-entrypoint.sh` — pg_isready wait + prisma migrate deploy + start
    - `deploy/nginx.mini-zapier-api.conf.example` — пример host nginx `location ^~ /mini-zapier/` внутри существующего `api.memelab.ru`, проксирующий в `127.0.0.1:3000`
    - `deploy/deploy.sh` — build + up + health check
    - `deploy/.env.production.example` — all required env vars
    - `vercel.json` — buildCommand, outputDirectory, `/api/*` rewrite to VPS
    - `.dockerignore` — node_modules, dist, .env, .git, etc.
  - **Auth module (backend)**:
    - `apps/api/src/auth/auth.service.ts` — signed cookie HMAC-SHA256, verify, login/logout
    - `apps/api/src/auth/auth.controller.ts` — POST login (public), POST logout, GET me (public, auth-aware)
    - `apps/api/src/auth/auth.guard.ts` — global guard, checks signed cookie, skips @Public()
    - `apps/api/src/auth/public.decorator.ts` — @Public() decorator
    - `apps/api/src/auth/auth.module.ts` — registers guard as APP_GUARD
  - **Health endpoint**: `apps/api/src/health/health.controller.ts` — GET /api/health (public)
  - **Public trigger routes**: `@Public()` added to `TriggerController` (webhooks + inbound-email)
  - **main.ts updates**: cookie-parser middleware, CORS from CORS_ORIGIN env with credentials:true, Swagger disabled in production
  - **app.module.ts**: AuthModule + HealthController registered
  - **Auth module (frontend)**:
    - `apps/web/src/pages/LoginPage.tsx` — login form, redirect if already authenticated
    - `apps/web/src/components/auth/ProtectedRoute.tsx` — checks /api/auth/me, redirects to /login
    - `apps/web/src/lib/api/auth.ts` — login/logout/getMe API functions
    - `apps/web/src/App.tsx` — /login route, product routes wrapped in ProtectedRoute
    - `apps/web/src/layouts/AppLayout.tsx` — Logout button in header
    - `apps/web/src/lib/api/client.ts` — withCredentials: true
  - **package.json updates**:
    - Root: engines.node >=22, packageManager pnpm@10.25.0
    - apps/api: cookie-parser in dependencies, prisma moved from devDependencies to dependencies
  - **Проверки прошли**:
    - `pnpm install --frozen-lockfile`
    - `pnpm build` (shared + api + worker + web)
- **Что сломано**:
  - Критичных известных поломок не выявлено
- **Фактический deploy status**:
  - GitHub repo создан: `batalovmv/mini-zapier`
  - Vercel frontend: `https://mini-zapier-web-silk.vercel.app`
  - VPS checkout: `/opt/mini-zapier`
  - production env создан на VPS: `/opt/mini-zapier/deploy/.env`
  - Stack на VPS поднят: `postgres`, `redis`, `api`, `worker`
  - Public backend path: `http://155.212.172.136:3000/api/*`
  - Smoke прошёл:
    - `http://155.212.172.136:3000/api/health` -> `200`
    - `https://mini-zapier-web-silk.vercel.app/api/health` -> `200`
    - `GET /api/workflows` через Vercel без cookie -> `401`
    - `POST /api/auth/login` через Vercel -> `200` + `Set-Cookie`
    - `GET /api/auth/me` через Vercel с cookie -> `200`
    - `GET /api/workflows` через Vercel с cookie -> `200`
- **Root scripts**:
  - `pnpm install --frozen-lockfile` работает
  - `pnpm build` работает
  - `pnpm dev:api` работает, если порт `3000` свободен; для локального smoke по-прежнему удобно использовать `PORT=3001`
  - `pnpm dev:worker` работает
  - `pnpm dev:web` работает, если порт `5173` свободен
  - `pnpm --filter @mini-zapier/web run e2e` запускает Playwright smoke

## Следующий шаг
**Browser smoke product flow**: deploy уже живой. Осталось вручную прогнать UI-сценарий в браузере:
1. `login`
2. `create workflow`
3. `trigger webhook`
4. `check execution history`
5. `open step logs`

## Блокеры
- На машине во время проверки порт `3000` был занят внешним процессом (`D:\TZ\Finance_tracker\src\server.ts`), а порт `5173` — внешним Vite-процессом (`D:\TZ\Finance_tracker\client`). Для smoke-проверок использовались `3001`, `5174`, `5175`, `5176`, `5177`, `5178`.
- `apps/web/package.json` использует `"@mini-zapier/shared": "file:../../packages/shared"` как обход зависающего `pnpm install` и несовместимости `npm` с `workspace:*`.

## Важные заметки
- **Порты инфраструктуры**: PostgreSQL=**5434**, Redis=**6380**
- Workflow node ids в create/update payload теперь трактуются только как client-local references для связи nodes ↔ edges; persisted ids генерируются сервером и приходят обратно в API response
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
- После `pnpm install --prefer-offline` `pnpm-lock.yaml` снова является источником истины для workspace; отдельный npm-installed state для `apps/web` больше не нужен
- После следующего изменения `apps/api/prisma/schema.prisma` запускай `pnpm --filter @mini-zapier/api run prisma:migrate -- --name <migration_name>`
- **Auth**: signed cookie HMAC-SHA256, env vars: `AUTH_USERNAME`, `AUTH_PASSWORD`, `AUTH_SESSION_SECRET`; cookie name `mz_session`, Max-Age 7 дней
- **Public endpoints** (не требуют auth): `POST /api/auth/login`, `GET /api/health`, `POST /api/webhooks/:workflowId`, `POST /api/inbound-email/:workflowId`, `GET /api/auth/me` (auth-aware: 200/401)
- **Swagger** отключен при `NODE_ENV=production`; доступен только в dev
- **CORS**: origin из `CORS_ORIGIN` env (comma-separated), fallback `http://localhost:5173`; `credentials: true`
- **Docker**: `deploy/docker-compose.prod.yml` использует `build.context: ..`, поэтому на VPS нужен весь репозиторий, а не только папка `deploy`; текущая схема публикует `api` наружу на `:3000` прямо с VPS
- **Vercel**: `vercel.json` rewrite `/api/*` направлен на `http://155.212.172.136:3000/api/:path*`; frontend URL сейчас `https://mini-zapier-web-silk.vercel.app`

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
| post-v1-fix | done | см. `git log` (`fix: server-generated node IDs + lockfile sync`) | workflow nodes now get server-generated ids with edge remap; lockfile synced via pnpm; `frozen-lockfile`, root build and Playwright smoke pass again |
| docs | done | — | spec-v1, backlog, decisions, test-checklist, CLAUDE.md — согласованы (см. git log) |
| TASK-018 | done | см. `git log` (`TASK-018: deployment config + minimal admin login`) | deploy config (Docker + public VPS API + Vercel), auth module (signed cookie HMAC), health endpoint, frontend login/logout/protected routes |







