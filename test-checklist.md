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
- [ ] POST /api/webhooks/:workflowId — создаёт TriggerEvent + WorkflowExecution + BullMQ job
- [ ] Повторный POST с тем же Idempotency-Key → 200 no-op, без нового execution
- [ ] POST без Idempotency-Key → создаёт execution (без dedupe)
- [ ] Worker берёт job → status RUNNING → выполняет HTTP action → step logs → status SUCCESS
- [ ] GET /api/executions/:id — возвращает execution + step logs

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
- [ ] Рестарт api → cron reconciliation, jobs восстановлены

### Email Inbound
- [ ] POST /api/inbound-email/:workflowId → execution с email data

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
- [ ] curl webhook → execution appears in history
- [ ] Step logs показывают input/output
