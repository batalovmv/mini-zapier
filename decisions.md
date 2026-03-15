# Архитектурные решения

> Новые зависимости и архитектурные изменения — только через обновление этого файла.

## DEC-001: Два процесса (api + worker)
**Решение**: apps/api и apps/worker запускаются отдельно. Worker — standalone NestJS без HTTP.
**Причина**: изоляция выполнения workflow от API. Падение worker не роняет API.
**Альтернатива**: один процесс с BullMQ worker внутри — проще, но нет изоляции.

## DEC-002: Connection entity для секретов
**Решение**: все секреты (SMTP, Telegram bot tokens, DB credentials, webhook secrets) хранятся в Connection, шифруются APP_ENCRYPTION_KEY.
**Причина**: секреты не должны лежать в node config, не должны попадать в API responses, definitionSnapshot и логи.
**Правило**: удаление Connection блокируется если используется любым workflow.

## DEC-003: definitionSnapshot без credentials
**Решение**: execution хранит снимок workflow (nodes + edges + connectionId refs), но НЕ расшифрованные credentials. Worker расшифровывает в runtime.
**Причина**: credentials в snapshot = утечка при просмотре execution history.

## DEC-004: Линейные workflow
**Решение**: только линейные цепочки (trigger → action1 → action2 → ...). Без branching, loops, parallel.
**Причина**: scope v1, 2 дня. Graph execution engine значительно сложнее.
**Валидация**: 1 trigger, ровно 1 outgoing у trigger, max 1 in + 1 out у action, 1 terminal, нет disconnected.

## DEC-005: Атомарный dedupe через TriggerEvent
**Решение**: INSERT TriggerEvent ON CONFLICT DO NOTHING + create execution в одной DB-транзакции. Дубль → 200 OK (не 409).
**Причина**: 409 заставит провайдеров ретраить. Атомарный insert предотвращает race condition.
**Webhook**: dedupe только при наличии Idempotency-Key / X-Event-ID. Без header — не дедуплицируем.

## DEC-006: Compensating cleanup вместо outbox
**Решение**: queue.add() вне DB-транзакции. При падении enqueue — удаляем TriggerEvent + WorkflowExecution.
**Причина**: outbox pattern требует отдельного poller/relay — слишком сложно для v1.
**Риск**: теоретически возможна потеря события если процесс убит между транзакцией и enqueue. Приемлемо для v1.

## DEC-007: Data Transform без JS
**Решение**: только template interpolation `{{input.field}}` + field mapping. Без arbitrary JS, без JSONPath.
**Причина**: пользовательский JS требует sandbox (isolated-vm), нативные зависимости, риски безопасности. Не влезает в 2 дня.

## DEC-008: Email trigger через inbound webhook
**Решение**: POST /api/inbound-email/:workflowId (от провайдера типа SendGrid/Mailgun), не IMAP polling.
**Причина**: IMAP polling сложнее, менее надёжен, требует постоянного соединения.

## DEC-009: Full graph replace при сохранении
**Решение**: PUT /workflows/:id заменяет все nodes + edges в транзакции. Не incremental diff.
**Причина**: проще, атомарно. Workflow graphs маленькие (< 50 нод).

## DEC-010: Polling вместо WebSocket
**Решение**: UI polling каждые 5с для обновления статуса execution.
**Причина**: WebSocket добавляет сложность (reconnect, state sync). Для v1 polling достаточно.

## DEC-011: Version increment
**Решение**: Workflow.version++ только при PUT /workflows/:id. PATCH status НЕ меняет версию.
**Причина**: версия отражает изменение definition, не operational state.

## DEC-012: Cron startup reconciliation
**Решение**: при старте apps/api пересинхронизировать все ACTIVE cron-workflows с BullMQ repeatable jobs.
**Причина**: после рестарта или сброса Redis cron расписания теряются.

## DEC-013: App-level rate limiting via @nestjs/throttler
**Решение**: `@nestjs/throttler` для rate limiting на уровне приложения. Per-route декораторы, storage в памяти.
**Причина**: минимальная зависимость, нативная интеграция с NestJS guards, достаточно для single-instance deploy.
**Scope**: register/login (5 req/60s), webhook (30 req/60s), inbound-email (30 req/60s). Остальные endpoints без throttle.
**Proxy awareness**: `app.set('trust proxy', 1)` для корректного извлечения client IP из `X-Forwarded-For` за nginx.
**Альтернатива**: nginx rate limiting — мощнее, но требует host-level конфигурации и не даёт per-route гранулярности в app коде.

## DEC-014: User-owned workspace auth
**Решение**: базовая регистрация и логин пользователей через email/password в таблице User. Workflow и Connection привязаны к owner `userId`; сессия хранится в signed httpOnly cookie `mz_session` (HMAC-SHA256).
**Причина**: пользователи должны работать каждый в своём workspace и не видеть чужие workflows/connections/executions без внедрения полного collaboration/RBAC слоя.
**Границы**: каждый зарегистрированный пользователь видит только свой набор workflows/connections/executions. Roles, invitations, password reset, sharing и collaborative workspaces не входят в этот срез.
**Пароли**: хэшируются встроенным Node.js scrypt, без новой внешней зависимости.


