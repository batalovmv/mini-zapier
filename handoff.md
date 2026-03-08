# Handoff

> Обновляется после каждой завершённой задачи. Новая сессия начинается с чтения этого файла.

## Текущее состояние
- **Последняя задача**: TASK-001 (done)
- **Статус проекта**: scaffold + документация готовы, приступаем к API
- **Что сделано**:
  - Monorepo: pnpm workspaces (apps/api, apps/worker, apps/web, packages/shared)
  - Docker Compose: PostgreSQL на порту **5434**, Redis на порту **6380**
  - Shared types: все enums + DTOs (WorkflowStatus, TriggerType, ActionType, ExecutionStatus, ConnectionType)
  - Git initialized, ветка `main`
  - Документация: spec-v1.md, decisions.md, backlog.md (17 задач), test-checklist.md, CLAUDE.md
- **Что сломано**: —
- **Частично сделано**: apps/api, apps/worker, apps/web — только placeholder package.json, NestJS ещё не установлен
- **Root scripts** (`pnpm dev:api`, `dev:worker`, `dev:web` и т.д.) — заработают только после TASK-002 (api), TASK-007 (worker), TASK-013 (web)

## Следующий шаг
**TASK-002**: apps/api scaffold + Prisma schema + migrations

## Блокеры
Нет

## Важные заметки
- **Порты**: PostgreSQL=**5434**, Redis=**6380** (стандартные 5432/6379 заняты другими проектами!)
- packages/shared/dist/ — уже собран, можно импортировать `@mini-zapier/shared`
- Docker контейнеры могут быть остановлены — перед работой проверь `docker compose up -d`

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
| docs | done | — | spec-v1, backlog, decisions, test-checklist, CLAUDE.md — согласованы (см. git log) |
