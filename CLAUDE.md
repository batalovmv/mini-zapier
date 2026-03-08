# Mini-Zapier — Инструкции для ИИ

## Обязательно прочитай перед работой
1. `handoff.md` — текущее состояние, следующий шаг
2. `backlog.md` — список задач, найди свой TASK-ID
3. `spec-v1.md` — замороженная спецификация (не меняй scope)
4. `decisions.md` — архитектурные решения (не нарушай)
5. `test-checklist.md` — обязательные проверки после каждого среза

## Правила
- **Один TASK за сессию**. Не делай два таска параллельно
- **Не расширяй scope**. Делай только то, что написано в TASK
- **Не добавляй фичи "по пути"**. Никаких "заодно улучшим"
- **Новая зависимость** — только если она записана в decisions.md
- **После завершения ОБЯЗАТЕЛЬНО**:
  1. backlog.md — статус задачи → `done`
  2. handoff.md — обнови «Текущее состояние», «Следующий шаг», добавь строку в таблицу «История» (Task | done | коммит | заметки)
  3. git commit

## Проект
- **Тип**: pnpm monorepo
- **Пакеты**: apps/api, apps/worker, apps/web, packages/shared, packages/server-utils
- **Порты**: PostgreSQL=**5434**, Redis=**6380** (НЕ стандартные!)
- **`@mini-zapier/shared`** — types/enums/DTOs (safe for frontend)
- **`@mini-zapier/server-utils`** — crypto, redact, truncate (НЕ импортировать в apps/web!)

## Стек
- Backend: NestJS + TypeScript + Prisma + BullMQ
- Frontend: React + Vite + React Flow + Zustand + Tailwind
- DB: PostgreSQL, Queue: Redis + BullMQ
- apps/api и apps/worker — два отдельных процесса

## Ключевые правила кода
- Секреты хранятся ТОЛЬКО в Connection entity, шифруются APP_ENCRYPTION_KEY
- Секреты НЕ попадают в: node config, API responses, definitionSnapshot, step logs
- definitionSnapshot содержит connectionId refs, НЕ credentials
- Workflow.version++ только при PUT (изменение definition), НЕ при PATCH status
- Линейные workflow: 1 trigger → цепочка actions. Без branching/loops
- Dedupe: атомарный INSERT TriggerEvent ON CONFLICT DO NOTHING. Дубль → 200 (не 409)
- Step logs денормализованы: nodeLabel, nodeType хранятся напрямую, нет FK на WorkflowNode
- Truncation > 64KB до записи в БД, флаг truncated в step logs
- Redaction credentials в логах до записи в БД
- Webhook endpoint: проверка секрета из Connection. Без валидного секрета → 401
- Email inbound endpoint: проверка HMAC-подписи провайдера. Без подписи → 401
- PUT для ACTIVE cron workflow → re-register repeatable job (cronExpression/timezone могли измениться)

## Коммиты
Формат: `TASK-XXX: краткое описание`
Пример: `TASK-002: apps/api scaffold + Prisma schema + migrations`
