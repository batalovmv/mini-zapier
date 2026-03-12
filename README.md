# Mini-Zapier

Платформа автоматизации workflow — внутренний инструмент для создания линейных цепочек "триггер → действия" через визуальный drag-and-drop редактор.

## Стек

| Слой | Технологии |
|------|-----------|
| Frontend | React, Vite, React Flow, Zustand, Tailwind CSS |
| API | NestJS, Prisma, Swagger, BullMQ |
| Worker | NestJS standalone, BullMQ consumer |
| DB / Queue | PostgreSQL, Redis |
| Shared | pnpm monorepo, TypeScript |
| Deploy | Vercel (frontend), Docker + nginx (backend на VPS) |

## Структура монорепо

```
apps/
  api/          — REST API, CRUD, триггеры, cron-регистрация
  worker/       — execution engine, action strategies, step logs
  web/          — SPA: дашборд, визуальный редактор, история
packages/
  shared/       — types, enums, DTOs (safe for frontend)
  server-utils/ — crypto, redact, truncate (server-only)
```

## Возможности

### Триггеры (3 типа)
- **Webhook** — входящий HTTP-запрос с проверкой секрета
- **Cron** — расписание (BullMQ repeatable jobs, timezone support)
- **Email Inbound** — приём email от провайдера с HMAC-верификацией

### Действия (5 типов)
- **HTTP Request** — произвольный HTTP-вызов с template interpolation
- **Email (SMTP)** — отправка email через SMTP
- **Telegram** — отправка сообщения через Telegram Bot API
- **PostgreSQL Query** — параметризованный SQL-запрос
- **Data Transform** — маппинг полей и шаблонизация данных

### Платформа
- Визуальный drag-and-drop редактор на React Flow
- Линейная валидация графа (1 trigger → цепочка actions)
- Шифрование секретов (AES-256-GCM), маскировка в API-ответах
- Retry с exponential backoff + timeout (AbortController)
- Auto-pause после 5 подряд неудачных выполнений
- Дедупликация через idempotency key
- Версионирование workflow + definition snapshot
- Truncation (64 KB) и redaction credentials в логах
- Дашборд со статистикой и управлением
- История выполнений с timeline step logs и JSON viewer
- Admin auth (signed cookie), rate limiting
- CI pipeline (GitHub Actions): build + optional E2E smoke

## Быстрый старт (dev)

```bash
# Зависимости
pnpm install

# PostgreSQL + Redis (нестандартные порты: 5434, 6380)
docker compose up -d

# Миграции
pnpm --filter @mini-zapier/api prisma migrate dev

# Запуск (3 терминала)
pnpm dev:api      # http://localhost:3000
pnpm dev:worker
pnpm dev:web      # http://localhost:5173
```

### Переменные окружения

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/mini_zapier
REDIS_HOST=localhost
REDIS_PORT=6380
APP_ENCRYPTION_KEY=<32-byte-hex>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<password>
COOKIE_SECRET=<random-string>
CORS_ORIGIN=http://localhost:5173
```

## API документация

В dev-режиме доступна Swagger UI: `http://localhost:3000/api/docs`

## Лицензия

Private / Internal use only.
