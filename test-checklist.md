# Test Checklist

> Обязательные smoke/integration проверки. Выполняются после каждого среза.

## Срез 1: Webhook → Queue → Worker → HTTP → Logs

### Infrastructure
- [ ] `docker compose up -d` стартует PostgreSQL + Redis
- [ ] `pnpm dev:api` стартует на порту 3000
- [ ] `pnpm dev:worker` стартует и подключается к Redis queue
- [ ] Prisma миграция проходит без ошибок

### Connection CRUD
- [ ] POST /api/connections — credentials зашифрованы в БД
- [ ] GET /api/connections — credentials замаскированы (****)
- [ ] DELETE /api/connections — блокируется если connection используется workflow

### Workflow CRUD
- [ ] POST /api/workflows — создаёт workflow с nodes + edges
- [ ] PUT /api/workflows/:id — full graph replace, version++
- [ ] Валидация отклоняет: 0 triggers, 2 triggers, disconnected nodes, cycle
- [ ] PATCH /api/workflows/:id/status — меняет статус, НЕ меняет version

### Webhook → Execution
- [ ] POST /api/webhooks/:workflowId с валидным X-Webhook-Secret — создаёт TriggerEvent + WorkflowExecution + BullMQ job
- [ ] Повторный POST с валидным X-Webhook-Secret и тем же Idempotency-Key → 200 no-op, без нового execution
- [ ] Повторный POST с валидным X-Webhook-Secret и тем же X-Event-ID → 200 no-op, без нового execution
- [ ] POST с валидным X-Webhook-Secret без Idempotency-Key → создаёт execution (без dedupe)
- [ ] Worker берёт job → status RUNNING → выполняет HTTP action → step logs → status SUCCESS
- [ ] GET /api/executions/:id — возвращает execution + step logs

### Webhook Security (негативные)
- [ ] POST /api/webhooks/:workflowId БЕЗ X-Webhook-Secret → 401 Unauthorized (если у trigger node есть Connection с secret)
- [ ] POST /api/webhooks/:workflowId с НЕВАЛИДНЫМ секретом → 401 Unauthorized
- [ ] POST /api/webhooks/:workflowId к НЕАКТИВНОМУ workflow → 422

### Step Logs
- [ ] Step log содержит nodeLabel, nodeType (денормализованные)
- [ ] inputData/outputData записаны
- [ ] credentials НЕ попадают в step logs

### Retry + Auto-pause
- [ ] Action с невалидным URL + retryCount=2 → 3 попытки в логах, step FAILED
- [ ] 5 подряд FAILED executions → workflow.status = PAUSED

### definitionSnapshot
- [ ] execution.definitionSnapshot содержит nodes + edges + connectionId refs
- [ ] execution.definitionSnapshot НЕ содержит расшифрованные credentials

## Срез 2: Cron + Email + Actions

### Cron
- [ ] ACTIVE workflow с cron trigger создаёт BullMQ repeatable job
- [ ] PAUSED → repeatable job удаляется
- [ ] PUT /workflows/:id для ACTIVE cron workflow с новым cronExpression → old job удалён, new job создан
- [ ] Рестарт api → cron reconciliation, jobs восстановлены

### Email Inbound
- [ ] POST /api/inbound-email/:workflowId с валидной подписью → execution с email data

### Email Inbound Security (негативные)
- [ ] POST /api/inbound-email/:workflowId БЕЗ подписи → 401 Unauthorized
- [ ] POST /api/inbound-email/:workflowId с НЕВАЛИДНОЙ подписью → 401 Unauthorized
- [ ] POST /api/inbound-email/:workflowId к НЕАКТИВНОМУ workflow → 422

### Actions
- [ ] EmailSendAction — отправляет email через SMTP (credentials из Connection)
- [ ] TelegramAction — отправляет сообщение через Bot API
- [ ] DbQueryAction — выполняет параметризованный SQL
- [ ] DataTransformAction — template interpolation `{{input.field}}` работает

### Swagger
- [ ] GET /api/docs — Swagger UI доступен
- [ ] Все endpoints документированы

## Срез 3-6: Frontend

### Dashboard
- [ ] Загружается список workflows
- [ ] Stats cards показывают данные
- [ ] Create / Edit / Delete / Run / Pause работают

### Workflow Editor
- [ ] Drag-and-drop ноды с sidebar на canvas
- [ ] Соединение нод (edges)
- [ ] Выбор ноды → config panel
- [ ] Save → PUT /api/workflows/:id
- [ ] Load → GET /api/workflows/:id → отображается на canvas

### Execution History
- [ ] Таблица executions с статусами
- [ ] Клик на execution → step logs
- [ ] Polling обновляет RUNNING executions

### E2E
- [ ] Создать workflow через UI (Webhook → HTTP → Transform)
- [ ] Сохранить, активировать
- [ ] curl webhook с X-Webhook-Secret → execution appears in history
- [ ] Step logs показывают input/output
## Срез 7: User auth + workspace isolation

### Registration + Session Auth
- [ ] `POST /api/auth/register` создаёт пользователя в БД и ставит `mz_session`
- [ ] повторная регистрация с тем же email возвращает 409
- [ ] `POST /api/auth/login` с валидными данными из БД возвращает 200 + cookie
- [ ] `POST /api/auth/login` с невалидным паролем возвращает 401
- [ ] `GET /api/auth/me` с cookie возвращает текущего пользователя
- [ ] protected routes без cookie возвращают 401 / redirect на `/login`

### Owner Isolation
- [ ] список workflows возвращает только записи текущего пользователя
- [ ] список connections возвращает только записи текущего пользователя
- [ ] stats считают только workflows/executions текущего пользователя
- [ ] manual execute/history/detail по чужому workflow/execution возвращают 404
- [ ] workflow save/update отклоняет `connectionId`, принадлежащий другому пользователю

### Build
- [ ] `pnpm --filter @mini-zapier/api build` проходит
- [ ] `pnpm --filter @mini-zapier/worker build` проходит
- [ ] `pnpm --filter @mini-zapier/web build` проходит

