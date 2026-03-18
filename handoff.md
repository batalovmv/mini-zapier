# Handoff

> Обновляется после каждой завершённой задачи. Новая сессия начинается с чтения этого файла.

## Текущее состояние
- **Последнее изменение**: TASK-Q4 — `scale the editor connection picker`
- **Статус проекта**: backlog v1 закрыт + post-v1 fix закрыт + TASK-018–056 закрыты + TASK-A закрыт + TASK-B закрыт + TASK-C закрыт + TASK-D закрыт + TASK-E закрыт + TASK-F закрыт + TASK-G закрыт + TASK-H закрыт + TASK-I закрыт + TASK-J закрыт + TASK-K закрыт + TASK-L закрыт + TASK-M закрыт + TASK-N1 закрыт + TASK-N2 закрыт + TASK-N3 закрыт + TASK-N4 закрыт + TASK-N5 закрыт + TASK-N6 закрыт + TASK-N7 закрыт + TASK-N8 закрыт + TASK-O0 закрыт + TASK-O1 закрыт + TASK-O2 закрыт + TASK-O3 закрыт + TASK-O4 закрыт + TASK-O5 закрыт + TASK-O6 закрыт + TASK-P1 закрыт + TASK-P2 закрыт + TASK-P3 закрыт + TASK-P4 закрыт + TASK-P5 закрыт + TASK-P6 закрыт + TASK-P7 закрыт + TASK-Q0 закрыт + TASK-Q1 закрыт + TASK-Q2 закрыт + TASK-Q3 закрыт + TASK-Q4 закрыт; editor inspector больше не зависит от полного `GET /connections` и plain `<select>` для выбора connection, следующий рабочий срез — `TASK-Q5`
- **TASK-Q0 planning**: connections catalog redesign/scale track разложен на последовательные задачи `TASK-Q1`–`TASK-Q5`; первый implementation slice добавляет scalable summary API для больших библиотек подключений, не ломая существующие `GET /connections` и `GET /connections/:id`
- **TASK-Q1 local build**: добавлен owner-scoped `GET /api/connections/catalog` с backend pagination/filter/sort/query (`page`, `limit`, `query`, `type`, `usage`, `sort`), summary-only payload без `credentials`, shared enums/contracts для catalog response, Swagger query/response DTO и page-level `usageCount` aggregation; существующие `GET /api/connections` и `GET /api/connections/:id` сохранены без breaking changes. Локально подтверждены `pnpm --filter @mini-zapier/shared build` и `pnpm --filter @mini-zapier/api build` ✅
- **TASK-Q2 local build**: `/connections` больше не рендерит hero + per-type sections из полного `GET /connections`; initial load идёт через `GET /api/connections/catalog`, search/type/usage/sort/page работают server-side с fixed `limit=20`, create/edit/delete flows сохранены, а full `getConnection(id)` вызывается только перед открытием edit dialog. Initial empty library, filtered no-results, page loading и page error разведены отдельно; локально подтверждён `pnpm --filter @mini-zapier/web build` ✅
- **TASK-Q3 local build**: `/connections` больше не показывает nested summary cards внутри строки; `name` поднят в главный anchor, `type / usage / fields / updated` сведены в quiet metadata strip, `Delete` переведён в quieter secondary-danger action, а loading/error/empty/no-results состояния ужаты под ту же operational hierarchy; локально подтверждён `pnpm --filter @mini-zapier/web build` ✅
- **TASK-Q4 local verification**: inspector connection section теперь использует компактный searchable picker на summary endpoint `GET /api/connections/catalog` вместо full `listConnections()` + plain `<select>`; initial load lazy и type-scoped, search по имени идёт на backend, внутри picker есть `load more`, refresh, empty/search-empty/error states и clear action, а inline create по-прежнему создаёт connection из inspector, автоматически выбирает его и обновляет picker. Семантика `requiresConnection`, `updateNodeMeta(...connectionId...)`, `headerStatusLine` и step-test wiring сохранены. Локально подтверждены `pnpm --filter @mini-zapier/web build` и `pnpm --filter @mini-zapier/web exec playwright test --list` ✅
- **Prod verification (Vercel `mini-zapier-web-silk.vercel.app`, 2026-03-16)**:
  - Dashboard: stats cards, workflow list, CRUD buttons — ✅
  - Connections page (`/connections`): create/edit dialog для всех 4 типов (Webhook, SMTP, Telegram, PostgreSQL) — ✅
  - **TASK-N7 local verification**: `/workflows/new` теперь сразу открывает blank editor внутри `EditorLayout`; standalone template picker, template prefill и связанные locale/store helpers удалены, `pnpm --filter @mini-zapier/web build` и `pnpm --filter @mini-zapier/web exec playwright test --list` ✅
  - **TASK-N8 local verification**: live smoke больше не зависит от внешнего `postman-echo` по умолчанию; webhook → HTTP Request → Data Transform теперь использует стабильный public `POST /api/auth/register` с контрактом `{"ok": true}`, а `MINI_ZAPIER_E2E_ECHO_URL` сохранён как optional override; `pnpm --filter @mini-zapier/web build` и `pnpm --filter @mini-zapier/web exec playwright test --list` ✅
  - **TASK-O0 planning**: проведён архитектурный UX-аудит главной страницы; dashboard redesign разложен на отдельные задачи `TASK-O1`–`TASK-O5`, а следующий рабочий срез начинается с data contract и устранения N+1 загрузки
  - **TASK-O1 local build**: добавлен `GET /api/stats/dashboard` с компактным контрактом `{stats, workflows, recentExecutions}`; каждый workflow summary теперь сразу содержит `lastExecution`, а dashboard store/page больше не делают per-workflow `GET /workflows/:id/executions?limit=1`; `pnpm --filter @mini-zapier/api build` и `pnpm --filter @mini-zapier/web build` ✅
  - **TASK-O2 local build**: большой hero на dashboard заменён компактным operational header; под ним появился attention strip по существующим `workflows[]/lastExecution` состояниям (`failed`, `paused`, `active without runs`, `drafts`), stats стали компактнее и вторичнее, а duplicate CTA из empty state убран без redesign списка; `pnpm --filter @mini-zapier/web build` ✅
  - **TASK-O3 local build**: декоративные workflow cards заменены на более плотный operational list: статус сценария теперь показывается один раз, `name`/summary/`last run`/`attention reason` подняты выше, `version/timezone/nodeCount` стали тихими meta chips, а action hierarchy перестроена в `Открыть/Редактировать` → `Запустить вручную` → quiet `История` / `Активировать-Пауза` / `Удалить`; `pnpm --filter @mini-zapier/web build` ✅
  - **TASK-O4 local build**: dashboard list теперь получает client-side search/filter/sort поверх уже загруженного summary payload, а рядом с ним появился compact recent activity block на базе `recentExecutions`; empty dashboard, filtered no-results и пустая activity секция получили отдельные состояния, `pnpm --filter @mini-zapier/web build` ✅
  - **TASK-O5 local verification**: dashboard copy сокращён и синхронизирован между RU/EN, header/attention/stats/list/recent activity получили стабильные `data-testid`, mobile/desktop layout tightened without logic changes, а smoke больше не зависит от текстовой ссылки `← Back`; `pnpm --filter @mini-zapier/web build` и `pnpm --filter @mini-zapier/web exec playwright test --list` ✅
  - **TASK-P1 local verification**: editor shell больше не растягивается в три одинаково тяжёлые desktop-панели; page composition ограничена по ширине, `NodeSidebar` и `FlowCanvas` стали компактнее и тише, empty canvas упрощён, а `FieldPicker` вынесен в viewport-aware portal overlay вместо локального `absolute` popover; `pnpm --filter @mini-zapier/web build` и `pnpm --filter @mini-zapier/web exec playwright test --list` ✅
  - **TASK-P2 local verification**: проведён manual QA route по пустому workflow, `trigger -> action`, `HTTP Request`, `DB Query`, `Data Transform`, `Email` и `Telegram` на desktop ширинах около `1280`, `1440` и `>=1600`; подтверждён только один residual defect: chip inspector у `TemplatedField` рендерился относительно неправильного ancestor и уезжал к верху inspector rail вместо позиции рядом с выбранным chip. Корневой контейнер `TemplatedField` переведён в `relative`, после чего overlay снова якорится рядом с chip; `pnpm --filter @mini-zapier/web build` и `pnpm --filter @mini-zapier/web exec playwright test --list` ✅
- **TASK-P3 local verification**: верх editor-а пересобран из высокой hero-like card в компактный command bar: `Back` стал quieter text-action, workflow name поднят в доминирующий anchor, `status` / `dirty` / `version` сжаты в secondary meta chips, а `Save` остался primary при secondary `Activate/Pause` и `Run`; вертикальный gap между header и workspace уменьшен без изменения handlers, store logic или editor behavior. Локально подтверждены `pnpm --filter @mini-zapier/web build` и `pnpm --filter @mini-zapier/web exec playwright test --list` ✅
- **TASK-P4 planning**: narrow action inspector rail получил отдельный follow-up track; structural flatten/chrome cleanup и overflow/test stabilization разведены по отдельным задачам `TASK-P5` и `TASK-P6`, чтобы убрать nested-card hierarchy без смешивания redesign и residual QA
- **TASK-P5 local verification**: правый action inspector перестроен в более плоский и плотный tool-panel; `ConfigPanel`, `Step Test`, `HTTP Request`, `Email`, `Telegram`, `DB Query` и `Data Transform` убрали лишние nested surfaces, repeated rows переведены в compact row groups, rail-specific CSS/copy ужаты только для action path без изменения trigger forms, backend/store/API logic или semantics конфигов; локально подтверждены `pnpm --filter @mini-zapier/web build` и `pnpm --filter @mini-zapier/web exec playwright test --list` ✅
- **TASK-P6 local verification**: single-line `TemplatedInput` больше не выпускает длинные placeholder/value строки за видимые границы control: value остаётся внутри horizontal scroll area, placeholder зажат внутри overlay bounds; `TemplatedField` получил `min-w-0`, а residual header rows в `HTTP Request`, `DB Query` и `Data Transform` переведены в wrap-friendly pattern для узкой inspector rail. Smoke editor path больше не зависит от fragile copy для URL/body-add/template шагов и использует стабильные hooks `http-request-url-input`, `http-add-body-field-button`, `data-transform-template-input`; локально подтверждены `pnpm --filter @mini-zapier/web build`, `pnpm --filter @mini-zapier/web exec playwright test --list` и route-mocked preview QA на ширинах `1280` / `1440` / `1600` без rail-boundary overflow для `HTTP Request`, `Email`, `Telegram`, `PostgreSQL Query`, `Data Transform` ✅
- **TASK-P7 local verification**: `NodeSidebar` больше не рендерит title/description/order chip и collapsible `1. Trigger -> 2. Action` help-card; левая rail стартует с короткой `Toolbox/Палитра` label и сразу переходит к trigger/action sections, а неиспользуемые palette guidance locale keys удалены из EN/RU. Локально подтверждены `pnpm --filter @mini-zapier/web build` и `pnpm --filter @mini-zapier/web exec playwright test --list` ✅
- **TASK-O6 local verification**: workflow rows больше не дублируют `PAUSED`/`DRAFT` через `status` + `attention reason`; row-level attention сохранён только для `Failed last run` и `Active without runs`, правая колонка `recent activity` получила compact empty + featured single-item state для `0-1` событий, а dashboard surfaces/chips/padding/shadows ужаты без изменения filters/sort/actions; `pnpm --filter @mini-zapier/web build` и `pnpm --filter @mini-zapier/web exec playwright test --list` ✅
  - Editor canvas: все 3 trigger types (Webhook, Cron, Email Trigger) + все 5 action types (HTTP Request, Email, Telegram, PostgreSQL Query, Data Transform) — узлы drag-and-drop, config panels — ✅
  - **TASK-056 preview UI**: Email config → кнопка «▸ Предпросмотр» → empty state корректный; Telegram config → аналогично ✅
  - **TASK-A local build**: editor dirty-state + route/beforeunload guard собраны локально, `pnpm --filter @mini-zapier/web build` ✅
  - **TASK-B local build**: rejected editor connections теперь показывают явную причину через toast, `pnpm --filter @mini-zapier/web build` ✅
  - **TASK-C local build**: Step Test / Message Preview / Field Picker stale-state fixes собраны локально, `pnpm --filter @mini-zapier/web build` ✅
  - **TASK-D local build**: editor create dialog и Connections dialog теперь используют один validation/pending contract, `pnpm --filter @mini-zapier/web build` ✅
  - **TASK-E local build**: auth больше не дублирует blocking errors toast-ом, destructive dialogs меняют copy и блокируют cancel/close в pending state, `pnpm --filter @mini-zapier/web build` ✅
  - **TASK-F local build**: `ModalShell` теперь даёт focus trap, initial/return focus и aria wiring; pending dialogs не закрываются через `Escape`/backdrop, `pnpm --filter @mini-zapier/web build` ✅
  - **TASK-G local build**: editor нормализует missing backend routes в понятные unsupported-state сообщения, `DB Query` больше не врёт про пустую schema при 404 introspection, overflow в error/toggle зонах убран, `pnpm --filter @mini-zapier/web build` ✅
  - **VPS verification (`api.memelab.ru/mini-zapier`, 2026-03-17)**: isolated redeploy `/opt/mini-zapier` уже вернул backend routes из TASK-052/TASK-054; direct unauth hits на `/api/connections/:id/introspect/tables` и `/api/workflows/:id/steps/test` теперь дают `401`, а не `404`
  - **TASK-H local build**: DB introspection больше не ограничен `public`; visual builder получает таблицы из доступных non-system schemas, умеет работать с `schema.table`, а generated SQL корректно quote-ит schema-qualified refs; `pnpm --filter @mini-zapier/api build` и `pnpm --filter @mini-zapier/web build` ✅
  - **TASK-I local build**: inspector теперь ведёт пользователя по шагам `подключение → настройка → проверка`, manual JSON / code / extra headers переведены в локальные advanced surfaces, `DB Query` по умолчанию открывается в visual mode, `pnpm --filter @mini-zapier/web build` ✅
  - **TASK-J local verification**: Playwright smoke теперь при отсутствии `MINI_ZAPIER_E2E_EMAIL` самопровиженит валидного e2e user через публичный `POST /api/auth/register`, принудительно фиксирует `en` locale через `localStorage`, а post-login/back navigation ждут устойчивый dashboard marker `data-testid="create-workflow-link"` вместо хрупкого hero-copy; `pnpm --filter @mini-zapier/web build` и `pnpm --filter @mini-zapier/web exec playwright test --list` ✅
  - **TASK-J live CI verification (2026-03-17)**: GitHub Actions run `23201159348` на коммите `96f4450` прошёл полностью: `Build` ✅ + `E2E Smoke` ✅
  - **TASK-K local build**: inspector rail больше не ужимает progress cards по viewport breakpoints, `TemplatedField` убрал лишнюю верхнюю action-row в repeated forms, а `DB Query` теперь говорит языком `Конструктор` / `Написать SQL` и снова получает queryable PostgreSQL relations через `pg_catalog`; `pnpm --filter @mini-zapier/api build` и `pnpm --filter @mini-zapier/web build` ✅
  - **TASK-L local build**: inspector стал компактнее и спокойнее для узкой rail-ширины: громкий верх заменён на короткий step summary, секции `Подключение` / `Настройка` / `Проверка` / `Удаление` перестроены в более последовательный flow, а `DB Query` / `HTTP Request` / `Data Transform` / manual JSON и field insertion получили более короткий UX-copy; `pnpm --filter @mini-zapier/web build` ✅
  - **TASK-M local build**: `HTTP Request` advanced headers block получил стабильные `data-testid`, а live smoke больше не зависит от текстов `Optional headers` / `Show`; `pnpm --filter @mini-zapier/web build` и `pnpm --filter @mini-zapier/web exec playwright test --list` ✅
  - **TASK-N1 local build**: inspector shell стал более контекстным и спокойным: верхний progress-summary и `AC/TR` убраны, connection section сведён к select + `Создать новое` + `Обновить список`, `Step Test` стал secondary и свёрнутым по умолчанию, а delete action переехал в quiet footer; `pnpm --filter @mini-zapier/web build` ✅
  - **TASK-N2 local build**: `DB Query` теперь использует primary visual flow `Что сделать` → `Таблица` → operation-specific controls без верхнего `Builder/SQL` toggle; raw SQL, params и `RawJsonFallback` перенесены в локальную advanced section, legacy raw steps сохраняют `query`/`params`, а SQL preview остаётся только у visual path; `pnpm --filter @mini-zapier/web build` ✅
  - **TASK-N3 local verification**: оставшиеся action-формы выровнены под inspector hierarchy: `HTTP Request` начинается с `method → url → body`, headers и step JSON живут в local advanced section, `Email`/`Telegram` держат preview как secondary confidence block, helper по `chatId` стал тише, `Data Transform` центрируется вокруг `mode + active config`; `pnpm --filter @mini-zapier/web build` и `pnpm --filter @mini-zapier/web exec playwright test --list` ✅
  - **TASK-N4 local build**: trigger-формы теперь используют тот же inspector rhythm, но без action-like пустот: `Webhook` и `Email Trigger` поднимают URL в dominant block, security/provider guidance уходит в quieter secondary help surfaces, а `Cron` ведёт через visual presets/time/day controls, держит `Next run` отдельно и переносит raw cron в local advanced path без потери existing custom expressions; `pnpm --filter @mini-zapier/web build` ✅
  - **TASK-N5 local verification**: inspector header теперь честно резолвит следующий шаг через `connection → save → last test → selected connection → main fields`, `Step Test` блокируется при обязательном, но не выбранном connection, автоматически раскрывается после нового result/unsupported/failure и получил стабильные hooks `config-panel-status-line` / `step-test-toggle`; устаревшие shell locale keys старой progress/wizard модели удалены только там, где больше не используются; `pnpm --filter @mini-zapier/web build` и `pnpm --filter @mini-zapier/web exec playwright test --list` ✅
  - **TASK-N6 local verification**: live CI на пуше `TASK-N5` упал не из-за deploy/build, а потому что smoke всё ещё искал `http-headers-toggle` до раскрытия local advanced section в `HTTP Request`; добавлен стабильный `data-testid="http-advanced-toggle"`, а smoke теперь сначала открывает advanced block и только потом работает с headers controls; `pnpm --filter @mini-zapier/web build` и `pnpm --filter @mini-zapier/web exec playwright test --list` ✅
  - **TASK-J root cause**: live GitHub Actions smoke падал не на deploy/build, а из-за двойного рассинхрона после email-login migration: CI по-прежнему прокидывал только legacy `MINI_ZAPIER_E2E_USERNAME=admin`, а smoke ожидал существующий prod user и brittle dashboard text после входа
  - Console errors: 0 за всю сессию тестирования ✅
  - **Примечание**: после VPS redeploy выяснилось, что оставшаяся проблема visual DB Query была уже не в missing routes, а в том, что backend introspection искал таблицы только в `public`. Из-за пустого metadata list visual mode не мог дать выбрать таблицу и, как следствие, не мог сгенерировать SQL для кнопки `Тестировать запрос`
- **Что сделано в TASK-N5**:
  - `apps/web/src/components/editor/ConfigPanel.tsx` — header status line теперь использует `stepTestResults` и правдивый приоритет состояния: сначала missing connection blocker, затем unsaved action blocker, затем последний test result, затем выбранное connection и только потом нейтральное `Main fields are below`; для QA добавлен стабильный `data-testid="config-panel-status-line"`
  - `apps/web/src/components/editor/StepTestSection.tsx` — добавлен явный `requiresConnection`; если action требует connection и `connectionId=null`, тестовая кнопка disabled, summary/title честно указывают на blocker, а секция автоматически раскрывается при новом результате, unsupported-state и failure; для QA добавлен `data-testid="step-test-toggle"`
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — shell/status/step-test copy сокращён и синхронизирован между EN/RU; удалены только реально мёртвые ключи старой progress/wizard inspector-модели, которые больше не используются после `TASK-N1`–`TASK-N4`
  - **Проверки TASK-N5**:
    - `pnpm --filter @mini-zapier/web build` ✓
    - `pnpm --filter @mini-zapier/web exec playwright test --list` ✓
  - **Ограничения TASK-N5**:
    - live browser QA и deploy в этой сессии не запускались по scope задачи; покрытие подтверждено локальной сборкой, parsing smoke suite и code-path review
- **Что сделано в TASK-N6**:
  - `apps/web/src/components/editor/config-forms/HttpRequestConfig.tsx` — local advanced section для `HTTP Request` получил стабильный hook `data-testid="http-advanced-toggle"`, чтобы smoke и QA могли раскрывать advanced block без привязки к copy
  - `apps/web/e2e/ui-smoke.spec.ts` — сценарий webhook → HTTP Request → Data Transform теперь сначала открывает local advanced section `HTTP Request`, а уже потом использует `http-headers-toggle` и `http-add-header-button`
  - **Проверки TASK-N6**:
    - `pnpm --filter @mini-zapier/web build` ✓
    - `pnpm --filter @mini-zapier/web exec playwright test --list` ✓
  - **Ограничения TASK-N6**:
    - green live CI для hotfix-коммита ещё не подтверждён в этом handoff; локально закрыты только build + smoke parsing
- **Что сделано в TASK-N7**:
  - `apps/web/src/App.tsx` — маршрут `/workflows/new` перенесён в `EditorLayout`, поэтому все существующие CTA создания сценария теперь сразу открывают editor без промежуточной страницы
  - `apps/web/src/pages/WorkflowEditorPage.tsx`, `apps/web/src/stores/workflow-editor.store.ts` — удалены `location.state.templateId`, `getTemplateById()` и `loadTemplate()`; unsaved create-flow теперь всегда стартует с blank draft через `resetEditor()`
  - `apps/web/src/pages/TemplatePickerPage.tsx`, `apps/web/src/lib/workflow-templates.ts`, `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — удалены standalone template picker, starter-template helper и мёртвый locale copy
  - `apps/web/e2e/ui-smoke.spec.ts` — smoke-сценарии переведены на новый create-route `/workflows/new`, чтобы тестовый вход совпадал с продуктовым entry point
  - **Проверки TASK-N7**:
    - `pnpm --filter @mini-zapier/web build` ✓
    - `pnpm --filter @mini-zapier/web exec playwright test --list` ✓
  - **Ограничения TASK-N7**:
    - live browser QA/deploy для нового create-flow в этой сессии не запускались; подтверждена только локальная сборка и parsing smoke suite
- **Что сделано в TASK-N8**:
  - `apps/web/e2e/ui-smoke.spec.ts` — default path webhook → HTTP Request → Data Transform больше не использует внешний `https://postman-echo.com/post`; по умолчанию `HTTP Request` теперь бьёт в `POST ${baseURL}/api/auth/register`, передаёт стабильный JSON body (`email`, `password`) и проверяет downstream transform по контракту `Processed true / 201`
  - `apps/web/e2e/ui-smoke.spec.ts` — optional `MINI_ZAPIER_E2E_ECHO_URL` override сохранён: при явном override smoke по-прежнему использует старый JSON-echo path и старые assert-ы по `name/eventId`
  - **Проверки TASK-N8**:
    - `pnpm --filter @mini-zapier/web build` ✓
    - `pnpm --filter @mini-zapier/web exec playwright test --list` ✓
  - **Ограничения TASK-N8**:
    - локальный live Playwright run против Vercel по-прежнему не запускался: на этой машине нет `MINI_ZAPIER_E2E_PASSWORD`, поэтому окончательное подтверждение фикса требует push и GitHub Actions `E2E Smoke`
- **Что сделано в TASK-P3**:
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — верхняя панель editor-а собрана заново как компактный command bar: quieter back-link вынесен в top line, name field остался главным якорем, secondary meta (`status`, `dirty`, `version`) переехали в отдельный тихий слой, action cluster сжат и выровнен под иерархию `Save` primary -> `Activate/Pause` / `Run` secondary без изменения handlers, disabled states и `data-testid`
  - `apps/web/src/index.css` — добавлены точечные `editor-command-*` styles с меньшими padding/shadow/radius, более тихим chrome и responsive stacking для desktop/mobile widths; общий gap между command bar и workspace также уменьшен, чтобы canvas получил больше пространства сверху
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — длинные dirty/version labels сокращены до коротких command-bar chips (`Unsaved` / `Saved` / `New`, `Не сохранён` / `Сохранён` / `Новый`), чтобы meta layer не спорил с именем сценария и primary action
  - **Проверки TASK-P3**:
    - `pnpm --filter @mini-zapier/web build` ✓
    - `pnpm --filter @mini-zapier/web exec playwright test --list` ✓
  - **Ограничения TASK-P3**:
    - manual browser QA маршрута `new workflow / saved workflow / unsaved state / save / activate-pause / run` на `1280` / `1440` / `>=1600` в этой сессии не запускался; визуальная проверка остаётся ручным follow-up за пределами локальной сборки и suite parsing
- **Что сделано в TASK-P2**:
  - `apps/web/src/components/editor/templated-input/TemplatedField.tsx` — корневой контейнер поля теперь `relative`, поэтому `ChipInspector` с `position: absolute` позиционируется относительно самого `TemplatedField`, а не верхнего контейнера inspector-а; подтверждённый defect с уезжающим overlay в `Email`/`Telegram` и других templated-field сценариях закрыт без изменения editor store, API или layout scope
  - **Проверки TASK-P2**:
    - manual browser QA по editor route `empty -> trigger/action -> HTTP advanced/headers -> DB visual/raw SQL -> Data Transform field picker -> Email/Telegram templated fields + preview` на `1280` / `1440` / `>=1600`
    - `pnpm --filter @mini-zapier/web build` ✓
    - `pnpm --filter @mini-zapier/web exec playwright test --list` ✓
  - **Ограничения TASK-P2**:
    - других подтверждённых residual defects в рамках заданного QA-маршрута не найдено; redesign follow-up и расширение scope в этой сессии не делались
- **Что сделано в TASK-P1**:
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — editor shell теперь центрируется и ограничен по ширине на desktop; сетка собрана как `supporting rail -> workspace -> inspector`, а не как три одинаково растянутые панели на всю страницу
  - `apps/web/src/components/editor/NodeSidebar.tsx`, `apps/web/src/components/editor/FlowCanvas.tsx` — left toolbox и canvas header уплотнены, вторичный explanatory chrome ослаблен, а empty-state canvas заменён на более компактный workspace-first блок без AC/TR card stack
  - `apps/web/src/components/editor/FieldPicker.tsx` — picker больше не рендерится локальным `absolute right-0 top-8`; он вынесен в `createPortal()` с viewport-aware позиционированием, внешним click/Escape close и стабильным `data-testid="field-picker-popover"`, поэтому больше не визуально выезжает под canvas
  - `apps/web/src/index.css` — `editor-rail` и `editor-canvas-*` получили более тихий chrome: меньше тени, мягче градиенты, слабее конкуренция между колонками
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — toolbox/canvas copy сокращён и синхронизирован под более короткий workspace tone без лишнего explanatory веса
  - **Проверки TASK-P1**:
    - `pnpm --filter @mini-zapier/web build` ✓
    - `pnpm --filter @mini-zapier/web exec playwright test --list` ✓
  - **Ограничения TASK-P1**:
    - live browser QA/editor screenshot pass в этой сессии не запускались; визуальная проверка по-прежнему нужна руками на desktop widths, особенно для `FieldPicker` в `Data Transform` и `DB Query`
- **Что сделано в TASK-O5**:
  - `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/components/dashboard/WorkflowList.tsx`, `apps/web/src/components/dashboard/WorkflowCard.tsx`, `apps/web/src/components/dashboard/StatsOverview.tsx`, `apps/web/src/index.css` — dashboard surfaces получили stable `data-testid`, более короткие summary chips и более устойчивый mobile layout для header CTA, controls, workflow action rows и recent activity без изменения продуктовой логики
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — RU/EN copy выровнен под короткий operational tone для header, attention, stats, list, row-level states и recent activity; длинные вторичные формулировки сокращены
  - `apps/web/e2e/ui-smoke.spec.ts` — `waitForDashboard()` теперь ждёт `data-testid="dashboard-page"`, а возврат к dashboard и переход в history больше не завязаны на хрупкий текстовый selector `← Back`
  - **Проверки TASK-O5**:
    - `pnpm --filter @mini-zapier/web build` ✓
    - `pnpm --filter @mini-zapier/web exec playwright test --list` ✓
  - **Ограничения TASK-O5**:
    - live browser QA и реальный Playwright run против deployed app в этой сессии не запускались по scope и отсутствию e2e env; локально подтверждены build + suite parsing
- **Что сделано в TASK-O4**:
  - `apps/web/src/pages/DashboardPage.tsx` — client-side derivation для dashboard summary расширена search/filter/sort логикой поверх уже загруженных `workflows[]`; рядом со списком добавлен compact recent activity block из `recentExecutions` с короткими строками и переходом в историю конкретного сценария
  - `apps/web/src/components/dashboard/WorkflowList.tsx`, `apps/web/src/index.css` — operational list из `TASK-O3` сохранён, но получил новый controls row (`search`, `status`, `attention`, `sort`), summary/reset layer и отдельные empty/results states без возврата к старому decorative pattern
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — EN/RU copy дополнен под controls, filtered results и recent activity, включая короткие operational labels для runs/failures и пустых состояний
  - **Проверки TASK-O4**:
    - `pnpm --filter @mini-zapier/web build` ✓
  - **Ограничения TASK-O4**:
    - отдельная global executions page, folders/tags, backend API и продуктовая логика run/status/delete/history не менялись; recent activity остаётся компактным dashboard block поверх существующего summary contract
- **Что сделано в TASK-O3**:
  - `apps/web/src/components/dashboard/WorkflowList.tsx`, `apps/web/src/components/dashboard/WorkflowCard.tsx`, `apps/web/src/index.css` — workflow list переведён из decorative card pattern в более плотные operational rows: у каждого сценария остался один явный workflow status, `name`/summary/`last run`/`attention reason` подняты в основную зону сканирования, а `version/timezone/nodeCount/updated` ушли в quiet meta layer
  - `apps/web/src/components/dashboard/WorkflowCard.tsx` — `attention reason` теперь выводится только из существующих summary данных без нового API и по приоритету `FAILED lastExecution` → `PAUSED` → `DRAFT` → `ACTIVE без lastExecution`; action hierarchy перестроена в primary `Open/Edit`, secondary `Run manually`, quieter `History`/status toggle и quiet destructive `Delete` без изменения маршрутов и продуктовой логики
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — EN/RU copy обновлён под новый operational list: добавлены короткие CTA `Open` / `Запустить вручную`, attention reason labels и более тихая терминология списка
  - **Проверки TASK-O3**:
    - `pnpm --filter @mini-zapier/web build` ✓
  - **Ограничения TASK-O3**:
    - поиск, фильтры, сортировка и recent activity по-прежнему не добавлялись; они остаются scope `TASK-O4`
- **Что сделано в TASK-O2**:
  - `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/index.css` — верх dashboard перестроен из hero в компактный operational header с одним CTA `Создать сценарий`; ниже добавлен attention strip, собранный из существующих workflow summary данных без новых API и без изменения продуктовой логики
  - `apps/web/src/components/dashboard/StatsOverview.tsx`, `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — stats-витрина ужата в более quiet secondary layer, EN/RU copy переведён на короткий operational tone для header/attention/stats
  - `apps/web/src/components/dashboard/WorkflowList.tsx` — из empty state убран duplicate CTA `Создать сценарий`, при этом структура списка, его действия и отдельный redesign workflow list оставлены для `TASK-O3`
  - **Проверки TASK-O2**:
    - `pnpm --filter @mini-zapier/web build` ✓
  - **Ограничения TASK-O2**:
    - workflow list, search/filter/sort и recent activity по-прежнему не менялись; они остаются scope следующих срезов `TASK-O3` и `TASK-O4`
- **Что сделано в TASK-O1**:
  - `apps/api/src/stats/stats.controller.ts` — добавлен dedicated endpoint `GET /api/stats/dashboard`, который отдаёт компактный payload для operational dashboard: summary stats, workflow summaries с `nodeCount` и встроенным `lastExecution`, а также `recentExecutions`; существующий `GET /api/stats` сохранён без breaking changes
  - `apps/web/src/lib/api/types.ts`, `apps/web/src/lib/api/stats.ts`, `apps/web/src/stores/dashboard.store.ts` — введён новый dashboard summary contract и единый `fetchDashboardSummary()`; store теперь наполняется одним ответом API вместо раздельных загрузок `stats + workflows + N запросов executions`
  - `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/components/dashboard/StatsOverview.tsx`, `apps/web/src/components/dashboard/WorkflowList.tsx`, `apps/web/src/components/dashboard/WorkflowCard.tsx` — dashboard переведён на workflow summaries из нового endpoint без визуального redesign; карточки продолжают показывать stats/workflows/last execution, но больше не зависят от client-side N+1 fetch
  - **Проверки TASK-O1**:
    - `pnpm --filter @mini-zapier/api build` ✓
    - `pnpm --filter @mini-zapier/web build` ✓
  - **Ограничения TASK-O1**:
    - UI dashboard намеренно не менялся по scope; `recentExecutions` уже приходят в контракте, но отдельный recent-activity block остаётся задачей `TASK-O4`
- **Что сделано в TASK-O0**:
  - `backlog.md` — добавлен новый planning-срез `## Срез O: Dashboard как операционная консоль`; заведены последовательные `TASK-O1`–`TASK-O5` с чёткими scope/acceptance/checks для data contract, top-level IA, workflow list, controls/recent activity и финальной polish/stabilization
  - `handoff.md` — текущий статус проекта и следующий шаг синхронизированы с новым redesign track; `TASK-O1` зафиксирован как первый рабочий срез
  - **Проверки TASK-O0**:
    - docs-only task; build/test не запускались
  - **Ограничения TASK-O0**:
    - это только planning/decomposition slice; код dashboard пока не менялся, реализация начинается с `TASK-O1`
- **Что сделано в TASK-N4**:
  - `apps/web/src/components/editor/config-forms/WebhookConfig.tsx` — URL и copy-actions собраны в dominant primary block, при этом сохранены `webhook-url-input`, `Copy URL`, `Copy curl` и честный placeholder для несохранённого workflow; security и dedupe перенесены в quieter secondary help block
  - `apps/web/src/components/editor/config-forms/EmailTriggerConfig.tsx` — inbound URL стал главным surface для настройки триггера, а provider/signature guidance вынесен в отдельный secondary help block без добавления preview/test behavior
  - `apps/web/src/components/editor/config-forms/CronConfig.tsx` — первый экран теперь ведёт через visual-first path (`schedule preset + time/day controls`), `Next run` вынесен в отдельный secondary confidence block, а raw cron expression живёт в local advanced section; existing custom cron expressions остаются доступными и не теряют данные при редактировании
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — trigger-copy выровнен под новый inspector-pattern: main setup говорит о предметном решении, а security/provider/raw guidance уходит во вторичный слой
  - **Проверки TASK-N4**:
    - `pnpm --filter @mini-zapier/web build` ✓
  - **Ограничения TASK-N4**:
    - manual browser QA на live/Vercel для `Webhook`, `Cron` и `Email Trigger` в этой сессии не запускался; покрытие подтверждено локальной сборкой и code-path review
- **Что сделано в TASK-N3**:
  - `apps/web/src/components/editor/config-forms/HttpRequestConfig.tsx` — основной блок перестроен в порядке `method → url → body`; headers и `RawJsonFallback` вынесены в local advanced section, при этом сохранены body fields/json compatibility logic и `data-testid` `http-headers-toggle` / `http-add-header-button`
  - `apps/web/src/components/editor/config-forms/EmailActionConfig.tsx`, `apps/web/src/components/editor/config-forms/TelegramConfig.tsx` — основной путь теперь ведёт через поля сообщения, `MessagePreview` живёт в более слабом secondary confidence block, а step JSON переехал в local advanced section; helper по `chatId` перенесён под поле и стал quieter helper surface
  - `apps/web/src/components/editor/config-forms/DataTransformConfig.tsx` — главный блок теперь строится вокруг выбора способа собрать output и активной конфигурации (`template` или `mapping`), а `RawJsonFallback` уходит в advanced без изменения backend semantics
  - `apps/web/src/components/editor/config-forms/RawJsonFallback.tsx` — добавлен opt-in embedded variant для вложенных advanced sections, поэтому новые action-формы можно успокоить без изменения уже выровненного `DB Query`
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — copy action-форм сокращён и выровнен под одну inspector-систему: предметный main path наверху, calmer preview/helper blocks ниже, manual JSON только в advanced
  - **Проверки TASK-N3**:
    - `pnpm --filter @mini-zapier/web build` ✓
    - `pnpm --filter @mini-zapier/web exec playwright test --list` ✓
  - **Ограничения TASK-N3**:
    - manual browser QA на live/Vercel для `HTTP Request`, `Email`, `Telegram` и `Data Transform` в этой сессии не запускался; покрытие подтверждено сборкой, parsing smoke suite и code-path review
- **Что сделано в TASK-N2**:
  - `apps/web/src/components/editor/config-forms/DbQueryConfig.tsx` — убран верхний `Builder/SQL` toggle, а основной visual path перестроен в порядке `Что сделать` → `Таблица` → operation-specific controls (`Read`: fields/filters/sort/limit, `Add`: values, `Change`: values/filters, `Delete`: filters)
  - `apps/web/src/components/editor/config-forms/DbQueryConfig.tsx` — raw SQL path переведён в локальную advanced section: там теперь живут editor для `query`, editor для `params` и `RawJsonFallback`; для новых пустых шагов visual mode остаётся default, а legacy raw steps без `_builderState` продолжают открываться как manual SQL без потери данных
  - `apps/web/src/components/editor/config-forms/DbQueryConfig.tsx` — при `metadata unavailable` визуальный путь не заводит в тупик: raw/manual SQL становится главным fallback, локальная `Check SQL / Проверить SQL` проверка остаётся внутри формы, а SQL preview показывается только для visual path и не дублирует уже введённый raw SQL
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — обновлён copy для local advanced/raw SQL flow и переименована кнопка `Test query / Проверить запрос` в `Check SQL / Проверить SQL`
  - **Проверки TASK-N2**:
    - `pnpm --filter @mini-zapier/web build` ✓
  - **Ограничения TASK-N2**:
    - manual browser QA для live `DB Query` inspector с реальной PostgreSQL connection в этой сессии не запускался; покрытие подтверждено сборкой и code-path review
- **Что сделано в TASK-N1**:
  - `apps/web/src/components/editor/ConfigPanel.tsx` — inspector header теперь состоит только из названия узла, chip `Триггер/Действие` и короткой contextual status line; верхний progress-summary `1/2/3` и декоративные `AC/TR` удалены
  - `apps/web/src/components/editor/ConfigPanel.tsx` — empty state сведён к одному guidance block, connection section упрощён до select + `Создать новое` + low-emphasis `Обновить список`, секция `Настройка` переименована в `Основное`, а delete action вынесен в quiet footer
  - `apps/web/src/components/editor/StepTestSection.tsx` — тест шага стал secondary surface, сворачивается по умолчанию, использует заголовок `Тест шага с входными данными` и предметные labels `Показать тест` / `Скрыть тест`
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — copy inspector-а и step test выровнен под новый shell без fake-ready wording вроде `Ready` / `Готово`
  - **Проверки TASK-N1**:
    - `pnpm --filter @mini-zapier/web build` ✓
  - **Ограничения TASK-N1**:
    - manual browser QA на реальной ширине правой rail и с живыми workflow nodes в этой сессии не запускался; покрытие подтверждено сборкой и code-path review
- **Что сделано в TASK-M**:
  - `apps/web/src/components/editor/config-forms/HttpRequestConfig.tsx` — в advanced headers block добавлены стабильные `data-testid` для toggle и `Add header`, чтобы smoke не привязывался к пользовательскому copy
  - `apps/web/e2e/ui-smoke.spec.ts` — сценарий webhook → HTTP Request → Data Transform переведён с текстовых селекторов `Optional headers` / `Show` на новые test ids, поэтому UX-copy changes больше не должны ломать live smoke
  - **Проверки TASK-M**:
    - `pnpm --filter @mini-zapier/web build` ✓
    - `pnpm --filter @mini-zapier/web exec playwright test --list` ✓
  - **Ограничения TASK-M**:
    - полноценный live Playwright run на этой машине по-прежнему не запускался: локально нет `MINI_ZAPIER_E2E_PASSWORD`, поэтому окончательное подтверждение фикса требует push и GitHub Actions `E2E Smoke`
- **Что сделано в TASK-L**:
  - `apps/web/src/components/editor/ConfigPanel.tsx` — inspector header перестроен в более компактный layout без отдельного блока `Что делать сейчас`; вместо крупных цветных карточек теперь используется короткий clickable step summary с переходом к секциям
  - `apps/web/src/components/editor/ConfigPanel.tsx`, `apps/web/src/components/editor/StepTestSection.tsx` — секции `Подключение`, `Настройка`, `Проверка`, `Удаление` получили более спокойную hierarchy, меньше визуальной конкуренции и более плотный ритм для узкой правой панели
  - `apps/web/src/components/editor/config-forms/DbQueryConfig.tsx`, `apps/web/src/components/editor/config-forms/HttpRequestConfig.tsx`, `apps/web/src/components/editor/config-forms/DataTransformConfig.tsx` — основные action forms упорядочены вокруг ключевого выбора пользователя (`режим`, `таблица`, `операция`, `body mode`, `result mode`), а labels сокращены до более ясных и компактных форм
  - `apps/web/src/components/editor/templated-input/TemplatedField.tsx`, `apps/web/src/components/editor/config-forms/RawJsonFallback.tsx` — manual/advanced controls больше не шумят в заголовке поля; field insertion и JSON fallback стали спокойнее и легче читаются в repeated forms
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — copy inspector и action forms переписан под более зрелую UX-иерархию: меньше внутреннего жаргона, короче названия, понятнее manual/advanced pathways
  - **Проверки TASK-L**:
    - `pnpm --filter @mini-zapier/web build` ✓
  - **Ограничения TASK-L**:
    - manual browser smoke на production rail-ширине для `PostgreSQL`, `HTTP Request`, `Telegram`, `Email`, `Data Transform` в этой сессии не запускался; покрытие подтверждено сборкой и code-path review
    - deploy/redeploy для live UX-проверки этого redesign всё ещё требуется отдельно после commit/push
- **Что сделано в TASK-K**:
  - `apps/web/src/components/editor/ConfigPanel.tsx` — progress cards в верхней части inspector больше не завязаны на `sm:grid-cols-2`, поэтому rail перестал сжимать карточки состояния в широком viewport с узкой правой панелью
  - `apps/web/src/components/editor/templated-input/TemplatedField.tsx`, `apps/web/src/components/editor/config-forms/RawJsonFallback.tsx` — field picker/manual edit и advanced JSON перестроены в более плотный footer/wrap layout без лишних пустот в repeated rows (`HTTP Request`, `Data Transform`, `Telegram`, `Email`, `DB Query`)
  - `apps/web/src/components/editor/config-forms/DbQueryConfig.tsx`, `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — visual DB builder получил более ясные режимы `Конструктор` / `Написать SQL`, понятные operation/source labels и helper-copy для новых пользователей
  - `apps/api/src/connection/introspection.service.ts` — PostgreSQL introspection теперь читает queryable relations из `pg_catalog` (`table`, `partitioned table`, `view`, `materialized view`, `foreign table`) и тем же путём получает колонки, поэтому visual builder больше не пустеет там, где ручной SQL уже работает
  - **Проверки TASK-K**:
    - `pnpm --filter @mini-zapier/api build` ✓
    - `pnpm --filter @mini-zapier/web build` ✓
  - **Ограничения TASK-K**:
    - manual browser smoke на реальной production rail-ширине и с конкретной пользовательской PostgreSQL connection в этой сессии не запускался; покрытие подтверждено сборкой и code-path review
    - deploy/redeploy для проверки live behavior всё ещё требуется отдельно после merge/push и, при backend-изменении, после VPS rollout
- **Что сделано в TASK-J**:
  - `apps/web/e2e/ui-smoke.spec.ts` — live smoke теперь сам определяет валидный email (`resolveE2eEmail()`), при необходимости один раз самопровиженит e2e user через `POST /api/auth/register`, фиксирует `mini-zapier:locale=en`, ждёт dashboard по стабильному `data-testid="create-workflow-link"`, выровнен с локализованными labels step logs/execution status и проверяет `Data transform` через реальный JSON viewer contract
  - `apps/web/e2e/ui-smoke.spec.ts` — сценарий webhook→HTTP request→Data transform снова воспроизводит рабочий продовый path: в HTTP Request smoke явно раскрывает `Optional headers`, добавляет `Content-Type: application/json`, а значит `postman-echo` возвращает parsed `json`, который downstream `Data transform` действительно читает
  - `.github/workflows/ci.yml` — live E2E job теперь передаёт `MINI_ZAPIER_E2E_EMAIL` alongside legacy `MINI_ZAPIER_E2E_USERNAME`, так что CI может использовать явный email без ломки существующих repository vars
  - **Проверки TASK-J**:
    - `pnpm --filter @mini-zapier/web build` ✓
    - `pnpm --filter @mini-zapier/web exec playwright test --list` ✓
    - GitHub Actions `CI` run `23201159348` (`Build` + `E2E Smoke`) ✓
  - **Ограничения TASK-J**:
    - локальный live Playwright run против Vercel не запускался: на этой машине нет `MINI_ZAPIER_E2E_PASSWORD`, поэтому покрытие до push ограничено build + parsing smoke suite
    - smoke по-прежнему завязан на внешний echo endpoint `https://postman-echo.com/post`; при деградации стороннего сервиса first failure candidate будет уже не auth/UI drift, а доступность этого endpoint
- **Что сделано в TASK-I**:
  - `apps/web/src/components/editor/ConfigPanel.tsx` — правый inspector перестроен в более понятный guided-flow с блоком «что делать сейчас», шагами `1/2/3` и более спокойной danger-zone вместо конкурирующего destructive CTA
  - `apps/web/src/components/editor/StepTestSection.tsx` — секция проверки стала сворачиваемой по умолчанию и показывает короткий summary-state до раскрытия
  - `apps/web/src/components/editor/config-forms/RawJsonFallback.tsx`, `apps/web/src/components/editor/templated-input/TemplatedField.tsx` — manual JSON / manual edit теперь поданы как локальные advanced-paths, а не как равноправный основной режим
  - `apps/web/src/components/editor/config-forms/DataTransformConfig.tsx`, `apps/web/src/components/editor/config-forms/HttpRequestConfig.tsx`, `apps/web/src/components/editor/config-forms/DbQueryConfig.tsx` — no-code формы получили более понятные mode labels; `HTTP Request` прячет extra headers, `Data Transform` объясняет разницу режимов, `DB Query` открывается в visual mode для нового пустого шага
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — inspector и ключевые editor forms получили более пользовательский copy без части внутреннего технического жаргона
  - **Проверки TASK-I**:
    - `pnpm --filter @mini-zapier/web build` ✓
  - **Ограничения TASK-I**:
    - manual browser smoke на мобильной ширине и с реальными пользовательскими сценариями в этой сессии не запускался; покрытие подтверждено сборкой и code-path review
    - глобального app-wide режима `новичок/профи` всё ещё нет; advanced остаётся локальным progressive disclosure внутри конкретных форм
- **Что сделано в TASK-H**:
  - `apps/api/src/connection/introspection.service.ts` — metadata introspection теперь читает `BASE TABLE` из доступных non-system schemas, отдаёт `schema.table` для non-public tables и корректно принимает schema-qualified table refs при загрузке колонок
  - `apps/web/src/components/editor/config-forms/DbQueryConfig.tsx` — visual DB Query builder теперь генерирует `SELECT` / `INSERT` / `UPDATE` / `DELETE` с корректным quoting для `schema.table`, поэтому non-public tables остаются тестируемыми и в visual mode
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — empty-state copy больше не утверждает, что поиск идёт только в `public`
  - **Проверки TASK-H**:
    - `pnpm --filter @mini-zapier/api build` ✓
    - `pnpm --filter @mini-zapier/web build` ✓
  - **Ограничения TASK-H**:
    - manual browser smoke с реальной PostgreSQL connection в этой сессии ещё не запускался; покрытие подтверждено сборкой и code-path review
    - если после redeploy visual mode всё ещё пустой, следующий кандидат уже не frontend/API route, а реальные права пользователя БД или фактическое отсутствие таблиц в доступных schemas
- **Что сделано в TASK-G**:
  - `apps/web/src/lib/api/client.ts` — добавлен detector missing backend routes (`Cannot GET/POST ...`) и нормализация сырого payload/error message в дружелюбный frontend copy вместо route dump
  - `apps/web/src/components/editor/config-forms/DbQueryConfig.tsx` — visual DB Query builder теперь различает `empty schema` и `introspection endpoint unsupported`; при missing route показывает явный fallback на `Raw SQL`, не рвёт layout длинными сообщениями и wrap-ит toggle/form rows на узкой панели
  - `apps/web/src/components/editor/config-forms/DbQueryConfig.tsx` — SQL test surface теперь тоже различает real query failure и missing backend route, выводит unsupported-state отдельным callout и блокирует повторные бесполезные клики
  - `apps/web/src/components/editor/StepTestSection.tsx` — step test больше не пишет сырой `Cannot POST /api/workflows/:id/steps/test`; unsupported backend route показывается как отдельный warning-state, после чего кнопка блокируется до reload
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — добавлены EN/RU строки для missing-route fallback и DB Query/Step Test unsupported-states
  - **Проверки TASK-G**:
    - `pnpm --filter @mini-zapier/web build` ✓
  - **Ограничения TASK-G**:
    - backend route gap был закрыт отдельным VPS redeploy после TASK-G; историческое ограничение снято, но без TASK-H visual DB всё ещё мог оставаться пустым для non-public schemas
    - manual browser smoke на Vercel/VPS в этой сессии не запускался; покрытие подтверждено сборкой и code-path review
- **Что сделано в TASK-F**:
  - `apps/web/src/components/ui/ModalShell.tsx` — добавлены focus trap по `Tab`/`Shift+Tab`, initial focus при открытии, restore focus на исходный trigger при закрытии, guard через `focusin`, а также безопасный backdrop close только при полном клике по overlay
  - `apps/web/src/components/ui/ModalShell.tsx` — dialog теперь получает `aria-labelledby` и `aria-describedby` через stable ids, а `Escape` обрабатывается внутри модалки и не протекает наружу; для non-dismissable состояния close-paths блокируются без новой библиотеки
  - `apps/web/src/components/ui/ConfirmationDialog.tsx` — initial focus перенесён на cancel button, pending state теперь явно делает dialog non-dismissable и тем же contract пользуется через `ModalShell`
  - `apps/web/src/components/connections/ConnectionFormDialog.tsx` — initial focus перенесён на поле имени connection; modal create/edit path тоже использует non-dismissable поведение во время submit
  - **Проверки TASK-F**:
    - `pnpm --filter @mini-zapier/web build` ✓
  - **Ограничения TASK-F**:
    - manual browser smoke для keyboard-only сценариев (`Tab`, `Shift+Tab`, `Escape`, backdrop click`) в этой сессии не запускался; покрытие подтверждено сборкой и code-path review
    - если исходный trigger исчезает из DOM до закрытия диалога (например, после удаления строки), restore focus пропускается безопасно без fallback navigation
- **Что сделано в TASK-E**:
  - `apps/web/src/components/ui/ConfirmationDialog.tsx` — destructive confirm dialogs теперь в pending state меняют title/description/note на in-progress copy, блокируют cancel и все close-paths, а confirm-кнопка может показывать action-specific label вместо общего `Working...`
  - `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/pages/ConnectionsPage.tsx` — delete dialogs для workflow/connection передают action-specific pending copy; dashboard additionally закрывает modal сразу после подтверждённого API delete, не дожидаясь фонового refresh, и больше не показывает ложный error-toast, если после успешного action падает только refresh
  - `apps/web/src/components/connections/ConnectionFormDialog.tsx` — edit submit больше не показывает misleading `Creating...`; pending copy соответствует update action
  - `apps/web/src/components/editor/ConfigPanel.tsx` — editor create-connection flow теперь использует успешный `createConnection` response как source of truth для локального списка и выбора connection, поэтому не даёт ложный failure и не оставляет stale dialog open, если повторный `listConnections` недоступен
  - `apps/web/src/pages/LoginPage.tsx`, `apps/web/src/pages/RegisterPage.tsx` — auth failures оставлены как inline blocking feedback без дублирующего `toast.error(...)`
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — добавлены EN/RU строки для pending destructive states и update-specific connection submit copy
  - **Проверки TASK-E**:
    - `pnpm --filter @mini-zapier/web build` ✓
  - **Ограничения TASK-E**:
    - manual browser smoke для login/register и delete flows в этой сессии не запускался; покрытие подтверждено сборкой и code-path review
    - глобальный toaster contract и editor CRUD feedback вне найденных semantic mismatches не менялись
- **Что сделано в TASK-D**:
  - `apps/web/src/components/connections/ConnectionFormDialog.tsx` — create/edit dialog получил `fixedType` для editor flow и стал единственной точкой client-side validation: name и credential keys/values trim-ятся одинаково, пустые credential values больше не проходят через editor path, create/edit используют одинаковый error copy
  - `apps/web/src/components/connections/ConnectionFormDialog.tsx` — pending state теперь блокирует cancel/overlay close, type select, inputs и add/remove controls, так что оба dialog не дают менять или закрывать форму во время submit
  - `apps/web/src/components/editor/ConnectionCreateDialog.tsx` — editor create dialog упрощён до wrapper над `ConnectionFormDialog`, сохранил существующие `data-testid` для e2e и унаследовал те же правила create validation, что и страница Connections
  - **Проверки TASK-D**:
    - `pnpm --filter @mini-zapier/web build` ✓
  - **Ограничения TASK-D**:
    - manual browser smoke для editor/create и Connections/create/edit в этой сессии не запускался; покрытие подтверждено сборкой и code-path review
    - API error surface не менялся: server-side ошибки по-прежнему показываются через existing toast behavior, scope backend API/introspection не расширялся
- **Что сделано в TASK-C**:
  - `apps/web/src/components/editor/StepTestSection.tsx`, `apps/web/src/components/editor/ConfigPanel.tsx` — убран side-effect во время render, input для step test снова синхронизируется с актуальным output предыдущего шага, а при смене action-node секция remount-ится и не тащит stale local state
  - `apps/web/src/hooks/usePreviewData.ts` — preview data теперь сбрасывается по context change, пере-fetchится при reopen и в фоне polling'ом каждые 5с пока preview открыт, так что save/test/run больше не держат старый execution snapshot; network/API errors теперь отдаются как явный `load-error`, а не как `no-data`
  - `apps/web/src/components/editor/MessagePreview.tsx` — добавлен явный error surface для preview load failures вместо пустого текста
  - `apps/web/src/components/editor/FieldPicker.tsx` — hook загрузки available fields теперь хранит error state, сбрасывает stale data при смене workflow и показывает retry/error UI вместо ложного empty state при API/network failure
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — добавлены EN/RU строки для preview/field-picker error states
  - **Проверки TASK-C**:
    - `pnpm --filter @mini-zapier/web build` ✓
  - **Ограничения TASK-C**:
    - manual browser smoke для save/test/run сценариев и реального network-failure path в этой сессии не запускался; покрытие подтверждено сборкой и code-path review
    - preview polling ограничен открытой preview-panel и не добавляет новый execution orchestration flow
- **Что сделано в TASK-B**:
  - `apps/web/src/stores/workflow-editor.store.ts` — boolean/no-op проверка соединений заменена на typed result с явными кодами отказа: `INVALID_SOURCE`, `INVALID_TARGET`, `INVALID_DIRECTION`, `DUPLICATE_EDGE`, `SECOND_OUTGOING`, `SECOND_INCOMING`, `CYCLE_RISK`; ограничения linear workflow не менялись
  - `apps/web/src/components/editor/FlowCanvas.tsx` — `onConnect` теперь проходит через локальный `handleConnect()`, и при reject пользователь получает `toast.error(...)` с понятной причиной вместо silent failure; тестовый helper `window.__MINI_ZAPIER_TEST__.connectNodes()` использует тот же путь
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — добавлены EN/RU тексты для всех причин отклонения соединения
  - **Проверки TASK-B**:
    - `pnpm --filter @mini-zapier/web build` ✓
  - **Ограничения TASK-B**:
    - manual browser smoke для каждого reject-сценария в этой сессии не запускался; покрытие подтверждено сборкой и code-path review
    - для отклонённых соединений выбран `toast` как основной feedback surface; inline message на canvas не добавлялся, чтобы не расширять scope
- **Что сделано в TASK-A**:
  - `apps/web/src/stores/workflow-editor.store.ts` — добавлен stable draft snapshot (`savedWorkflowSnapshot`) и derived dirty-state через сравнение текущего editor payload с последним сохранённым состоянием; для нового workflow baseline = пустой draft, поэтому template/new edits считаются unsaved до save
  - `apps/web/src/hooks/useUnsavedChangesGuard.ts` — новый hook на базе `useBlocker` + `useBeforeUnload`: блокирует route changes, header navigation, browser back/forward и refresh/close при unsaved changes; есть bypass для внутреннего redirect после успешного первого save и для осознанного logout redirect
  - `apps/web/src/components/AppHeader.tsx` — self-check fix: logout в header сначала спрашивает discard только внутри dirty editor и только потом вызывает `/auth/logout`, чтобы не оставлять пользователя на странице с уже сброшенной сессией
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — toolbar теперь показывает явный dirty-state (`Unsaved changes` / `No unsaved changes`) отдельно от версии (`vN` / `Not saved yet`), guard подключён на страницу editor, template load передаёт baseline для new draft
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — добавлены строки для dirty-state badge и discard confirm
  - **Проверки TASK-A**:
    - `pnpm --filter @mini-zapier/web build` ✓
    - `pnpm --filter @mini-zapier/web build` ✓ (после self-check fix)
  - **Ограничения TASK-A**:
    - manual browser smoke для click-through сценариев (header nav, back button, refresh/close tab) в этой сессии не запускался; покрытие подтверждено сборкой и ревью code-path
    - discard confirm и refresh guard используют нативные browser dialogs (`window.confirm` / `beforeunload`), без кастомного modal UI
- **Что сделано в TASK-056**:
  - **Frontend**: `apps/web/src/lib/template-resolve.ts` — `resolveTemplateSegments()` utility: parses `{{input.path}}` templates via `parseTemplate()` and resolves against real data, returns typed segments (resolved/unresolved) for UI styling
  - `apps/web/src/hooks/usePreviewData.ts` — `usePreviewData(enabled)` hook: reads editor store (nodes/edges/stepTestResults/workflowVersion/savedStructuralFingerprint), returns input data from step test results (priority) or last SUCCESS execution (fallback with version + structural fingerprint double guard)
  - `apps/web/src/components/editor/MessagePreview.tsx` — preview component: renders resolved template fields with source badge, empty states for no-data/trigger-action/version-mismatch/structural-change
  - `apps/web/src/components/editor/config-forms/EmailActionConfig.tsx` — added collapsible "Preview" section with `to`, `subject`, `body` fields
  - `apps/web/src/components/editor/config-forms/TelegramConfig.tsx` — added collapsible "Preview" section with `message` field
  - `apps/web/src/locale/messages.en.ts`, `messages.ru.ts` — added `configForms.messagePreview` locale strings (toggle, empty states, source badges)
  - **Проверки TASK-056**:
    - `pnpm --filter @mini-zapier/web build` ✓
    - Manual Chrome verification: Cron→Email workflow, открыт Email config → кнопка «▸ Предпросмотр» отображается, при раскрытии показывает empty state «Выполните workflow, чтобы увидеть предпросмотр» (emptyTriggerAction reason для pos 0)
    - Manual Chrome verification: Webhook→Telegram template, открыт Telegram config → кнопка «▸ Предпросмотр» отображается корректно
  - **Ограничения TASK-056**:
    - Trigger test не существует (StepTestRequest.nodeType = ActionType only), поэтому для первого action после trigger preview доступен только из execution data
    - Execution fallback остаётся доступным после unsaved config-changes upstream узлов (осознанный компромисс, аналогично FieldPicker)
- **Что сделано в TASK-055**:
  - **Frontend**: `apps/web/src/lib/workflow-templates.ts` — добавлены встроенные starter templates `webhook-telegram` и `cron-email` с fresh node/edge generation через `createEditorNode()` и `smoothstep` edges
  - `apps/web/src/pages/TemplatePickerPage.tsx` — новая страница `/workflows/new` с карточками starter templates и `Blank Workflow`
  - `apps/web/src/App.tsx` — маршрут `/workflows/new` добавлен внутрь `AppLayout`
  - `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/components/dashboard/WorkflowList.tsx`, `apps/web/src/components/AppHeader.tsx` — все entry points создания workflow переведены на template picker
  - `apps/web/src/stores/workflow-editor.store.ts` — добавлен `loadTemplate()` для unsaved draft с preset name/nodes/edges
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — editor читает `location.state.templateId` и предзагружает выбранный template только для `/workflows/new/edit`
  - `apps/web/src/locale/messages.en.ts`, `messages.ru.ts` — добавлены строки для template picker и suggested names
  - **Проверки TASK-055**:
    - `pnpm --filter @mini-zapier/web build` ✓
  - **Проверки TASK-055 (manual Chrome)**:
    - Template picker page `/workflows/new`: 3 карточки отображаются (Webhook→Telegram, Cron→Email, Blank Workflow) ✓
    - Webhook→Telegram: создаётся workflow с правильными узлами (Webhook trigger + Telegram action) ✓
    - Webhook→Telegram: save → URL сменился на `/workflows/{id}/edit`, v1 badge, reopen из dashboard — узлы и связи сохранены ✓
    - Blank Workflow: открывается пустой editor с onboarding instructions ✓
- **Что сделано в TASK-054**:
  - **Shared**: `packages/shared/src/types/step-test.ts` — `StepTestRequest`, `StepTestResponse`, `StepTestStatus` types
  - **API**: `apps/api/src/queue/queue.service.ts` — `stepTestQueue` + `stepTestQueueEvents` с `waitUntilReady()`, `addStepTestJob()` с `waitUntilFinished` (35s timeout), structured FAILED on timeout
  - `apps/api/src/execution/dto/step-test.dto.ts` — DTO с `@Allow()` для inputData (принимает любой JSON)
  - `apps/api/src/execution/execution.service.ts` — `testStep()` method: ownership check workflow + connection, делегирует в queue
  - `apps/api/src/execution/execution.controller.ts` — `POST /api/workflows/:id/steps/test` endpoint
  - **Worker**: `apps/worker/src/engine/step-test-engine.ts` — single-step executor: DB_QUERY special-case с BEGIN+ROLLBACK, statement_timeout, row cap, RETURNING rejection, manual interpolation; все остальные типы через `actionService.execute()` с 30s AbortController timeout
  - `apps/worker/src/processor/step-test.processor.ts` — BullMQ processor на `step-test` queue
  - **Frontend**: `apps/web/src/lib/api/executions.ts` — `testStep()` API client
  - `apps/web/src/stores/workflow-editor.store.ts` — `stepTestResults` state + `setStepTestResult`/`clearStepTestResults` actions + invalidation на config/meta/edge/node changes + downstream cascade
  - `apps/web/src/lib/editor-chain.ts` — `computeChainOrder()`, `flattenTreePaths()` helpers
  - `apps/web/src/components/editor/FieldPicker.tsx` — `applyTestResultOverlay()` synthesizes full AvailableFieldsResponse from test results, bypass unsaved-changes warning when overlay has data
  - `apps/web/src/components/editor/StepTestSection.tsx` — test UI: collapsible JSON input (auto-populated from previous step), JSON validation, test button, success/error results with duration
  - `apps/web/src/components/editor/ConfigPanel.tsx` — renders StepTestSection for action nodes
  - `apps/web/src/locale/messages.en.ts`, `messages.ru.ts` — ~20 новых ключей для stepTest section
  - **Проверки TASK-054**:
    - `pnpm --filter @mini-zapier/shared build` ✓
    - `pnpm --filter @mini-zapier/api build` ✓
    - `pnpm --filter @mini-zapier/worker build` ✓
    - Manual Chrome: ТЕСТ ШАГА section отображается на action nodes (DB Query, Data Transform) с JSON input и кнопкой «ТЕСТИРОВАТЬ ШАГ» ✓
    - `pnpm --filter @mini-zapier/web build` ✓
- **Что сделано в TASK-053**:
  - **Backend**: `apps/api/src/connection/introspection.service.ts` — `validateMutationQuery()` (INSERT/UPDATE/DELETE only), `testMutation()` метод: обычная транзакция + statement_timeout, execute, rowCount, всегда ROLLBACK
  - `apps/api/src/connection/connection.controller.ts` — новый endpoint `POST /api/connections/:id/introspect/mutation` с Swagger-декораторами
  - **Frontend**: `apps/web/src/lib/api/introspection.ts` — `testDbMutation()` API-клиент
  - `apps/web/src/components/editor/config-forms/DbQueryConfig.tsx` — полная переработка:
    - `BuilderState` расширен: `operation` (select/insert/update/delete), `setValues` (SetValueRow[])
    - SQL generation разделён на 4 функции: generateSelectSql/InsertSql/UpdateSql/DeleteSql
    - `normalizeBuilderState()` для backward compat legacy nodes без operation
    - Visual mode test использует `generateSql(builder)`, не `config.query`
    - Raw mode маршрутизирует тест по `classifyQuery()`: SELECT/WITH → read endpoint, INSERT/UPDATE/DELETE → mutation endpoint
    - Sync с RawJsonFallback: при удалении `_builderState` форма переключается в raw mode
    - При невалидном builder — `query: ''`, `params: []` (нет stale SQL)
    - Warnings для UPDATE/DELETE без effective WHERE
    - Очистка test results при смене operation/table/query
  - `apps/web/src/components/editor/editor-definitions.ts` — новые DB_QUERY ноды создаются с `_builderState`, открываются в visual mode
  - `apps/web/src/locale/messages.en.ts`, `messages.ru.ts` — ~15 новых ключей для operation labels, set values, mutation result, warnings
  - **Известное ограничение**: CTE-mutations (`WITH ... INSERT/UPDATE/DELETE`) не поддерживаются в preview — keyword-based routing
  - **Проверки TASK-053**:
    - `pnpm --filter @mini-zapier/api build` ✓
    - `pnpm --filter @mini-zapier/web build` ✓
    - Manual Chrome: DB Query node config показывает «Визуальный» / «Raw SQL» toggle ✓
  - `apps/web/src/components/editor/ConfigPanel.tsx` — передача connectionId в DbQueryConfig
  - `apps/web/src/locale/messages.en.ts`, `messages.ru.ts` — ~30 новых ключей для visual builder
  - **Проверки TASK-052**:
    - `pnpm --filter @mini-zapier/api build` ✓
    - `pnpm --filter @mini-zapier/web build` ✓
    - Manual Chrome: визуальный конструктор требует подключение PostgreSQL (ожидаемо), «Показать raw JSON» доступен ✓
- **Что сделано в TASK-051**:
  - `apps/web/src/components/editor/config-forms/DataTransformConfig.tsx` — заменены plain `<input>` на `<TemplatedField>` для mapping values (chip-based field picker вместо ручного ввода `{{input.*}}`), убраны неиспользуемые `useRef`/`insertAtCursorRecord`/`FieldPicker`, добавлен `<RawJsonFallback>` escape hatch
  - `apps/web/src/locale/messages.en.ts`, `messages.ru.ts` — добавлены showJson/hideJson для dataTransform
  - **Проверки TASK-051**:
    - `pnpm --filter @mini-zapier/web build` ✓
    - Manual Chrome: Data Transform config — режим «Маппинг» с таблицей ключ/значение и кнопкой «Добавить поле», переключение Шаблон↔Маппинг ✓
- **Что сделано в TASK-050**:
  - `apps/web/src/components/editor/config-forms/HttpRequestConfig.tsx` — visual body builder (key-value mode для JSON body с TemplatedField values), переключение fields↔JSON mode без потери данных, Content-Type auto-hint для POST/PUT/PATCH, RawJsonFallback escape hatch
  - `apps/web/src/locale/messages.en.ts`, `messages.ru.ts` — 10+ новых строк: bodyKeyPlaceholder, bodyValuePlaceholder, bodyKeyAriaLabel, bodyValueAriaLabel, removeBodyRowAriaLabel, addBodyField, editBodyAsJson, editBodyAsFields, contentTypeHint, showJson/hideJson
  - **Проверки TASK-050**:
    - `pnpm --filter @mini-zapier/web build` ✓
- **Что сделано в TASK-049**:
  - `apps/web/src/components/editor/config-forms/EmailActionConfig.tsx` — добавлен raw JSON fallback (show/hide toggle)
  - `apps/web/src/components/editor/config-forms/TelegramConfig.tsx` — добавлен chatId helper (инструкция @userinfobot), raw JSON fallback
  - `apps/web/src/components/editor/config-forms/RawJsonFallback.tsx` — новый reusable component: JSON preview/edit с валидацией, используется в Email и Telegram
  - `apps/web/src/locale/messages.en.ts`, `messages.ru.ts` — новые EN/RU строки: showJson/hideJson для обеих форм, chatIdHelper/chatIdHelperSteps для Telegram
  - **Проверки TASK-049**:
    - `pnpm --filter @mini-zapier/web build` ✓
- **Что сделано в TASK-048**:
  - `apps/web/src/components/editor/config-forms/CronConfig.tsx` — полная переработка: visual preset selector (every minute/hour/day/week/custom), time picker (HH:MM) для daily/weekly, day-of-week toggle для weekly, "Next run" preview с учётом workflow timezone через `cron-parser`, toggle visual↔code mode
  - `apps/web/src/locale/messages.en.ts`, `messages.ru.ts` — 20+ новых EN/RU строк для `configForms.cron` (presets, time, days, next run, toggle labels)
  - `apps/web/package.json` — добавлена зависимость `cron-parser` для вычисления следующего запуска
  - **Проверки TASK-048**:
    - `pnpm --filter @mini-zapier/web build` ✓
- **Что сделано в TASK-047**:
  - `apps/web/src/components/editor/templated-input/parse.ts` — `parseTemplate()`, `serializeFromDom()`, `normalizeDom()` с regex, идентичным worker runtime
  - `apps/web/src/components/editor/templated-input/TemplatedInput.tsx` — contentEditable компонент с atomic chip rendering, caret preservation, paste normalization
  - `apps/web/src/components/editor/templated-input/ChipInspector.tsx` — popover на клик по chip: путь, Replace, Delete
  - `apps/web/src/components/editor/templated-input/TemplatedField.tsx` — composite wrapper: visual/code mode toggle, FieldPicker integration, dual API (configKey mode + controlled value mode)
  - `apps/web/src/components/editor/FieldPicker.tsx` — добавлены optional `open`/`onOpenChange` controlled props с refetch on open transition
  - `apps/web/src/components/editor/config-forms/EmailActionConfig.tsx` — 3× TemplatedField (to, subject, body)
  - `apps/web/src/components/editor/config-forms/TelegramConfig.tsx` — TemplatedField (message), chatId остаётся plain input
  - `apps/web/src/components/editor/config-forms/HttpRequestConfig.tsx` — TemplatedField (url, body), per-row controlled TemplatedField (header values)
  - `apps/web/src/components/editor/config-forms/DataTransformConfig.tsx` — TemplatedField (template mode only), mapping mode unchanged
  - `apps/web/src/locale/messages.en.ts`, `messages.ru.ts` — EN/RU строки для `configForms.templatedInput`
  - **Проверки TASK-047**:
    - `pnpm --filter @mini-zapier/web build` ✓
- **Что сделано в TASK-046**:
  - `packages/shared/src/types/execution.ts` — добавлен `FieldTreeNode` interface
  - `packages/server-utils/src/field-tree.util.ts` — `buildFieldTree()` (recursive JSON → tree, maxDepth=5, arrays index 0 only)
  - `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20260315170000_schema_snapshot/migration.sql` — `WorkflowExecution.triggerDataSchema Json?`, `ExecutionStepLog.outputDataSchema Json?`
  - `apps/worker/src/log/log.service.ts` — `markStepSuccess` теперь строит schema из redacted outputData (до truncation) и сохраняет в `outputDataSchema`
  - `apps/worker/src/engine/execution-engine.ts` — на старте execution строит `triggerDataSchema` из redacted triggerData
  - `apps/api/src/execution/execution.service.ts` — `getAvailableFields()` читает stored schema (fallback: buildFieldTree(redactCredentials(raw))), `fields[]` выводится из tree через `flattenTreePaths`
  - `apps/api/src/execution/dto/available-fields-response.dto.ts` — `FieldTreeNodeDto` + `tree` в `PositionFieldsDto`
  - `apps/api/src/execution/available-fields.util.ts` — `flattenTreePaths()` (all paths, branches + leaves)
  - `apps/web/src/components/editor/FieldPicker.tsx` — tree dropdown с expand/collapse, leaf-click insert, branch secondary ⚡ insert, кнопка `+ Insert field` вместо ⚡
  - `apps/web/src/components/editor/config-forms/EmailActionConfig.tsx` — FieldPicker на поле `to`, type=text
  - `apps/web/src/lib/api/types.ts`, locale files — `FieldTreeNode`, `tree`, новые строки
  - **Проверки TASK-046**:
    - `pnpm --filter @mini-zapier/shared build` ✓
    - `pnpm --filter @mini-zapier/server-utils build` ✓
    - `pnpm --filter @mini-zapier/api build` ✓
    - `pnpm --filter @mini-zapier/worker build` ✓
    - `pnpm --filter @mini-zapier/web build` ✓
- **Что сделано в TASK-045 follow-up**:
  - `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20260315153000_user_workspace_isolation/migration.sql` — добавлены owner relations `Workflow.userId` / `Connection.userId` к `User` с follow-up migration под изоляцию workspace по владельцу
  - `apps/api/src/auth/current-user.decorator.ts`, `apps/api/src/workflow/*`, `apps/api/src/connection/*`, `apps/api/src/execution/*`, `apps/api/src/stats/*` — API переведён на `currentUser.id`; workflows/connections/executions/stats теперь видны только владельцу, manual execute и history/detail режутся по owner
  - `spec-v1.md`, `decisions.md`, `backlog.md`, `test-checklist.md`, `handoff.md` — документация синхронизирована под user-owned workspace вместо shared workspace
  - **Проверки TASK-045 follow-up**:
    - `pnpm --filter @mini-zapier/api build`
    - `pnpm --filter @mini-zapier/worker build`
    - `pnpm --filter @mini-zapier/web build`
  - **Ограничения проверки TASK-045 follow-up**:
    - локальный `prisma migrate dev` и integration smoke на реальной БД не запускались, потому что PostgreSQL/Docker на машине не подняты; migration SQL добавлен вручную, legacy rows с `userId = null` требуют отдельного backfill
- **Что сделано в TASK-045**:
  - `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20260315123000_add_user_auth/migration.sql` — добавлена модель `User` и migration SQL под email/password auth
  - `apps/api/src/auth/auth.service.ts`, `auth.controller.ts`, `auth.guard.ts`, `apps/api/src/auth/dto/*` — env-based admin login заменён на регистрацию/логин через БД, signed cookie по `userId`, `scrypt` hashing и `GET /api/auth/me` с user payload
  - `apps/web/src/pages/LoginPage.tsx`, `apps/web/src/pages/RegisterPage.tsx`, `apps/web/src/lib/api/auth.ts`, `apps/web/src/App.tsx` — добавлены `/register`, email-based login, client registration API и auto-login после регистрации
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts`, `apps/web/e2e/ui-smoke.spec.ts` — обновлены locale strings и smoke login selector под `Email`
  - `spec-v1.md`, `decisions.md`, `backlog.md`, `test-checklist.md`, `deploy/.env.production.example` — scope/docs/env examples синхронизированы под initial email/password auth slice
  - **Проверки TASK-045**:
    - `pnpm --filter @mini-zapier/api build`
    - `pnpm --filter @mini-zapier/worker build`
    - `pnpm --filter @mini-zapier/web build`
  - **Ограничения проверки TASK-045**:
    - локальный `prisma migrate dev` и auth integration smoke не запускались, потому что на машине не подняты PostgreSQL/Docker daemon; migration SQL добавлен вручную
- **Что сделано в TASK-043**:
  - `apps/web/src/pages/ConnectionsPage.tsx` — добавлен отдельный раздел `/connections` с grouped catalog по типам подключений, create/edit/delete actions и reuse-oriented UI copy
  - `apps/web/src/components/connections/ConnectionFormDialog.tsx` — добавлен отдельный диалог создания/редактирования подключений; rename-only edit не требует повторного ввода секретов, а полная замена credentials требует ввести весь набор заново
  - `apps/web/src/App.tsx`, `apps/web/src/components/AppHeader.tsx` — новый раздел встроен в protected routing и основную navigation panel
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — добавлены EN/RU строки для connections page и dialog states без backend changes
  - **Проверки TASK-043**:
    - `pnpm --filter @mini-zapier/web build`
- **Что сделано в TASK-042**:
  - `apps/web/src/components/editor/ConfigPanel.tsx` — голые numeric badges в connection summary заменены на понятные текстовые состояния: `Выбрано: <name>`, `Не выбрано`, `Нет доступных`, `Доступно: N`
  - `apps/web/src/components/editor/ConfigPanel.tsx` — из header и connection section убрано дублирование безымянного count; теперь inspector показывает именно состояние подключения, а не просто число
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — добавлены locale-aware строки для новой семантики connection status
  - **Проверки TASK-042**:
    - `pnpm --filter @mini-zapier/web build`
- **Что сделано в TASK-041**:
  - `apps/web/src/components/editor/ConfigPanel.tsx` — empty state inspector переведён в top-aligned layout без искусственного vertical centering, поэтому guidance block больше не висит посередине колонки
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — верхний toolbar editor собран в более ровную action bar: status/version/CTA теперь живут в едином control group и выровнены по высоте
  - **Проверки TASK-041**:
    - `pnpm --filter @mini-zapier/web build`
- **Что сделано в TASK-040**:
  - `apps/web/src/components/editor/ConfigPanel.tsx` — inspector пересобран в более строгий tool-panel: убрано дублирование connection summary, destructive action встроен в settings section, empty state центрирован и стал менее пустым визуально
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — правая desktop rail-колонка выровнена по ширине с левой для более ровной композиции editor shell
  - **Проверки TASK-040**:
    - `pnpm --filter @mini-zapier/web build`
- **Что сделано в TASK-039**:
  - `apps/web/src/components/editor/NodeSidebar.tsx` — collapsed `Порядок сборки` ужат в compact one-line cue с меньшим контейнером; expanded state оставляет полный flow-order affordance без постоянного vertical overhead
  - `apps/web/src/components/editor/ConfigPanel.tsx` — правый inspector пересобран в более строгий rail: compact header, единый summary block, quieter empty state и calmer connection/settings sections без лишней вложенности
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — правый desktop rail слегка расширен, сохраняя приоритет левого toolbox
  - **Проверки TASK-039**:
    - `pnpm --filter @mini-zapier/web build`
- **Что сделано в TASK-038**:
  - `apps/web/src/components/editor/NodeSidebar.tsx` — flow-order hint сделан collapsible; после появления узлов он автоматически схлопывается, но остаётся доступным вручную
  - `apps/web/src/components/editor/ConfigPanel.tsx` — правый inspector переработан в более современный rail-style и теперь ближе к левой библиотеке по header hierarchy, density и section composition
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — desktop grid слегка расширен под правый inspector, не ломая приоритет node library
  - `apps/web/src/locale/messages.en.ts`, `apps/web/src/locale/messages.ru.ts` — добавлены строки для collapsible guidance/drag hint
  - **Проверки TASK-038**:
    - `pnpm --filter @mini-zapier/web build`
- **Что сделано в TASK-037**:
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — desktop editor grid updated so the left node library rail is now wider than the right inspector
  - `apps/web/src/components/editor/NodeSidebar.tsx` — библиотека узлов переведена в cleaner tool-rail: compact header, short flow-order cue, flatter section hierarchy и более плотные draggable rows вместо stacked nested cards
  - Визуальный акцент left rail упрощён: меньше тяжёлых tinted containers, больше scanability и clear tool-list feel
  - **Проверки TASK-037**:
    - `pnpm --filter @mini-zapier/web build`
- **Что сделано в TASK-036**:
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — desktop grid rails widened to better fit RU copy without crushing the canvas
  - `apps/web/src/components/editor/NodeSidebar.tsx` — левая библиотека пересобрана в cleaner list-driven layout: flatter onboarding steps, stronger section headers, simpler draggable items without nested badge noise
  - `apps/web/src/components/editor/ConfigPanel.tsx` — empty inspector state перепакован в более собранный placeholder с hero-card и compact step list
  - **Проверки TASK-036**:
    - `pnpm --filter @mini-zapier/web build`
- **Что сделано в TASK-035**:
  - `apps/web/src/layouts/EditorLayout.tsx`, `apps/web/src/pages/WorkflowEditorPage.tsx` — editor route переведён в desktop `h-screen` shell с `overflow-hidden`; workspace grid теперь использует `minmax(0,1fr)`, поэтому canvas и rails перестали раздувать страницу по высоте
  - `apps/web/src/components/editor/FlowCanvas.tsx` — canvas shell получил корректный `min-h-0`, header слегка уплотнён, чтобы освободить больше vertical space под рабочую область
  - `apps/web/src/components/editor/NodeSidebar.tsx`, `apps/web/src/components/editor/ConfigPanel.tsx` — левая palette и правый inspector уплотнены по padding/typography/card density без изменения editor mechanics
  - **Проверки TASK-035**:
    - `pnpm --filter @mini-zapier/web build`
- **Что сделано в TASK-034**:
  - `apps/web/src/locale/*` — добавлены словари `en`/`ru`, shared locale helpers, `LocaleProvider` и `useLocale` без новой зависимости
  - `apps/web/src/components/AppHeader.tsx` — добавлен переключатель `EN / RU` в header с persistence через `localStorage`
  - `apps/web/src/pages/*`, `apps/web/src/components/dashboard/*`, `apps/web/src/components/execution/*`, `apps/web/src/components/editor/*`, `apps/web/src/components/ui/*` — user-facing copy вынесен в централизованные словари
  - `apps/web/src/lib/api/client.ts`, `apps/web/src/stores/workflow-editor.store.ts` — frontend fallback/error copy и workflow validation переведены на locale-aware messages без изменения routing/API/editor mechanics
  - `LocaleProvider` теперь управляет `document.documentElement.lang`, форматированием дат/времени/длительностей и сохранением выбора языка между перезагрузками
  - **Проверки TASK-034**:
    - `pnpm --filter @mini-zapier/web build`
    - headless smoke на локальном `vite preview` + mock API: `login`, `dashboard`, `workflow editor`, `execution history`, `404`, `empty states`, `header switcher`, persistence после reload
- **Follow-up после TASK-034**:
  - `apps/web/src/components/editor/nodes/ActionNode.tsx`, `TriggerNode.tsx`, `apps/web/src/components/execution/StepLogViewer.tsx` — стандартные названия шагов (`HTTP Request`, и т.п.) сохранены как canonical labels, сырые enum-коды (`HTTP_REQUEST`, `DATA_TRANSFORM`) убраны из UI
  - `apps/web/src/components/editor/config-forms/DataTransformConfig.tsx`, `HttpRequestConfig.tsx`, `apps/web/src/components/editor/ConnectionCreateDialog.tsx` — оставшиеся hardcoded `aria-label` и template placeholder вынесены в locale dictionaries
  - `apps/web/src/locale/messages.ru.ts` — выправлены отдельные русские UI-строки (`Приостановить`, `Редактировать`, `сервером`) без перевода стандартных technical names
  - **Проверки follow-up**:
    - `pnpm --filter @mini-zapier/web build`
- **Follow-up после TASK-033**:
  - `apps/web/src/components/AppHeader.tsx` — header переведён на responsive mobile layout: brand остаётся сверху, nav + logout занимают отдельную строку без horizontal overflow
  - **Проверки follow-up**:
    - `pnpm --filter @mini-zapier/web build`
    - mobile smoke dashboard/editor на `390px` через локальный `vite preview` + Playwright mock API (`scrollWidth === innerWidth`)
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
    - `pnpm --filter @mini-zapier/web run e2e` против `https://mini-zapier-web-silk.vercel.app` (auth + live browser smoke)
- **Что сделано в TASK-019**:
  - `apps/web/src/stores/workflow-editor.store.ts` — `validateWorkflowGraph()` доведён до backend-инвариантов: missing node refs, self-referencing edges, duplicate edges, ровно 1 trigger, ровно 1 outgoing у trigger, max 1 in/out у action, ровно 1 terminal action, cycle/disconnected chain check
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — `handleSave()` сначала запускает client-side validation и показывает ошибки в existing page error banner без запроса в API
  - `apps/web/src/components/editor/FlowCanvas.tsx` — попытка добавить второй trigger блокируется на UI и показывает `Only one trigger is allowed per workflow.`
  - `apps/web/e2e/ui-smoke.spec.ts` — добавлены regression tests на duplicate trigger, save с lone trigger и save с disconnected chains
  - **Проверки TASK-019**:
    - `pnpm --filter @mini-zapier/web run build`
    - `pnpm --filter @mini-zapier/web run e2e` — не прошёл запуск на этой машине, потому что отсутствует env `MINI_ZAPIER_E2E_PASSWORD`
    - live verification на `https://mini-zapier-web-silk.vercel.app` — `PASS` по сценариям: duplicate trigger block, lone trigger pre-save validation, disconnected nodes pre-save validation, happy path save
- **Что сломано**:
  - Критичных известных поломок не выявлено
- **Фактический deploy status**:
  - GitHub repo создан: `batalovmv/mini-zapier`
  - Vercel frontend: `https://mini-zapier-web-silk.vercel.app`
  - VPS checkout: `/opt/mini-zapier`
  - production env создан на VPS: `/opt/mini-zapier/deploy/.env`
  - Stack на VPS поднят: `postgres`, `redis`, `api`, `worker`
  - Public backend path: `https://api.memelab.ru/mini-zapier/api/*`
  - Smoke прошёл:
    - `http://155.212.172.136:3000/api/health` -> timeout from external network
    - `https://api.memelab.ru/mini-zapier/api/health` -> `200` `{"status":"ok"}`
    - `https://mini-zapier-web-silk.vercel.app/api/health` -> `200` `{"status":"ok"}`
    - `GET /api/workflows` через Vercel без cookie -> `401`
    - `POST /api/auth/login` через Vercel -> `200` + `Set-Cookie`
    - `GET /api/auth/me` через Vercel с cookie -> `200`
    - `GET /api/workflows` через Vercel с cookie -> `200`
  - Opus live verification после `TASK-019` прошла: duplicate trigger block, pre-save validation и happy path на deploy подтверждены
- **Что сделано в TASK-020**:
  - Удалены тестовые workflows ("Opus Live Check", "Opus Smoke Test") с production dashboard
  - `deploy/docker-compose.prod.yml` — порт API привязан к loopback: `127.0.0.1:3000:3000` (вместо `0.0.0.0:3000:3000`)
  - `deploy/nginx.mini-zapier-api.conf.example` переименован в `deploy/nginx.mini-zapier-api.conf` — production-ready nginx location block
  - `vercel.json` — rewrite destination изменён с `http://155.212.172.136:3000/api/:path*` на `https://api.memelab.ru/mini-zapier/api/:path*`
  - `deploy/deploy.sh` — без изменений (health check по `127.0.0.1:3000` остаётся корректным)
  - VPS rollout завершён: nginx config применён, stack перезапущен, loopback binding активен, внешний доступ к `:3000` закрыт
  - Итог проверок:
    - raw `:3000` извне недоступен
    - login через Vercel работает, cookie выставляется
    - dashboard в браузере загружается, production dashboard чистый (`0 workflows`)
- **Что сделано в TASK-023**:
  - Удалён dev/scaffold copy из 9 файлов: `"Frontend scaffold"`, `"React Flow editor"`, `"TASK-014/015/016"` references, raw UUID в selected-state
  - `WorkflowEditorPage.tsx` — compact toolbar: single row (← Back | name input | status pill + version | Save/Activate/Run)
  - `WorkflowEditorPage.tsx` — toast cleanup: `"Workflow created successfully."` вместо raw ID, `"Execution started."` вместо raw executionId
  - `DashboardPage.tsx` — toast cleanup: `"execution started"` вместо raw executionId
  - `FlowCanvas.tsx` — `"Editing: HTTP Request"` вместо raw UUID selectedNodeId
  - `LoginPage.tsx` — inline error с очисткой при изменении полей
  - Disabled Activate/Run кнопки получили `title="Save the workflow first"`
  - `NotFoundPage.tsx` — user-facing 404 copy
  - `NodeSidebar.tsx`, `ConfigPanel.tsx` — user-facing описания вместо TASK refs
- **Что сделано в TASK-022**:
  - `apps/api/src/common/validate-env.ts` — fail-fast валидация env (`DATABASE_URL`, `APP_ENCRYPTION_KEY`, `AUTH_PASSWORD`, `AUTH_SESSION_SECRET`) до `NestFactory.create()`
  - `apps/worker/src/common/validate-env.ts` — fail-fast валидация env (`DATABASE_URL`, `APP_ENCRYPTION_KEY`) до `NestFactory.createApplicationContext()`
  - `apps/api/src/main.ts` — вызов `validateApiEnv()` перед bootstrap
  - `apps/worker/src/main.ts` — вызов `validateWorkerEnv()` перед bootstrap
  - `apps/api/src/health/health.controller.ts` — `GET /api/readiness` с проверкой PostgreSQL (Prisma `SELECT 1`) и Redis (ioredis one-shot client, 3s timeout)
  - `apps/api/package.json` — добавлен `ioredis@^5.9.0` как прямая зависимость
  - Задеплоено и проверено на VPS:
    - `GET /api/health` → `200 {"status":"ok"}`
    - `GET /api/readiness` → `200 {"status":"ready","checks":{"postgres":"ok","redis":"ok"}}`
    - Worker стартует с env validation
- **Что сделано в TASK-021**:
  - `@nestjs/throttler@^6.5.0` добавлен в `apps/api/package.json`
  - follow-up: specifier в `apps/api/package.json` и `pnpm-lock.yaml` синхронизирован и зафиксирован как `^6.5.0`
  - `apps/api/src/main.ts` — `trust proxy: 1` для корректного извлечения client IP за nginx
  - `apps/api/src/app.module.ts` — `ThrottlerModule.forRoot()` с двумя named throttlers: `login` (5/60s), `trigger` (30/60s)
  - `apps/api/src/auth/auth.controller.ts` — `@UseGuards(ThrottlerGuard)` + `@Throttle({ login: ... })` на `POST /api/auth/login`
  - `apps/api/src/trigger/trigger.controller.ts` — `@UseGuards(ThrottlerGuard)` + `@Throttle({ trigger: ... })` на webhook и inbound-email
  - `decisions.md` — DEC-013 зафиксирован
  - Задеплоено и проверено: 6-й login request → 429, health/valid login через Vercel работает
- **Root scripts**:
  - `pnpm install --frozen-lockfile` работает
  - `pnpm build` работает
  - `pnpm dev:api` работает, если порт `3000` свободен; для локального smoke по-прежнему удобно использовать `PORT=3001`
  - `pnpm dev:worker` работает
  - `pnpm dev:web` работает, если порт `5173` свободен
  - `pnpm --filter @mini-zapier/web run e2e` запускает Playwright smoke

- **Что сделано в TASK-024**:
  - `.github/workflows/ci.yml` — GitHub Actions CI pipeline
  - **`build` job** (обязательный gate): checkout → pnpm setup → Node 22 + pnpm cache → `pnpm install --frozen-lockfile` → `pnpm build`
  - **`e2e` job** (optional, после build): запускается только на `push` в main И если задана `vars.MINI_ZAPIER_E2E_BASE_URL`; устанавливает Playwright Chromium, прогоняет smoke против deploy URL
  - E2E env: `MINI_ZAPIER_E2E_BASE_URL` и `MINI_ZAPIER_E2E_USERNAME` из repository variables, `MINI_ZAPIER_E2E_PASSWORD` из secrets, `MINI_ZAPIER_E2E_ECHO_URL` из variables
  - Concurrency group `ci-${{ github.ref }}` с `cancel-in-progress: true`

- **Что сделано в TASK-025**:
  - **Backend**: `apps/api/src/execution/available-fields.util.ts` — `resolveChainPositions()`, `extractFieldPaths()`, `computeChainSignature()`, `parseSnapshotForChain()`
  - **Backend**: `apps/api/src/execution/dto/available-fields-response.dto.ts` — DTO + Swagger
  - **Backend**: `execution.service.ts` — `getAvailableFields(workflowId)`: finds compatible SUCCESS execution via chain signature matching, skips empty manual runs, returns field paths per chain position
  - **Backend**: `execution.controller.ts` — `GET /api/workflows/:id/available-fields` endpoint
  - **Frontend**: `apps/web/src/lib/editor-chain.ts` — `computeChainPosition()`, `computeStructuralFingerprint()`
  - **Frontend**: `apps/web/src/stores/workflow-editor.store.ts` — added `savedStructuralFingerprint` field, set in `loadWorkflow()`, cleared in `resetEditor()`
  - **Frontend**: `apps/web/src/lib/api/executions.ts` — `getAvailableFields()` API client
  - **Frontend**: `apps/web/src/lib/api/types.ts` — `AvailableFieldsResponse`, `AvailableFieldsPosition` types
  - **Frontend**: `apps/web/src/components/editor/FieldPicker.tsx` — shared module-level cache with dedup, `useAvailableFields()` hook, `FieldPicker` component with ⚡ dropdown, `insertAtCursor()` and `insertAtCursorRecord()` utilities
  - **Frontend**: Config forms integration — DataTransformConfig (template + mapping values), HttpRequestConfig (url + body + header values), EmailActionConfig (subject + body), TelegramConfig (message)
  - **Excluded**: DbQueryConfig (JSON.parse validation conflicts with raw template insertion)
  - **Key design decisions**:
    - Position-based keying (not nodeId) since server regenerates IDs on every PUT
    - Chain signature (trigger type + ordered action types) for structural compatibility between current workflow and execution snapshot
    - Shared module-level cache with inflight dedup (multiple picker instances = 1 API call)
    - Force refetch on dropdown open (covers Run-from-editor scenario)
    - `savedStructuralFingerprint` in Zustand store (set on load, not on local edits) — when mismatch, picker hides fields and shows "Save workflow to update"
    - `insertAtCursor` uses existing `onChange((prev) => ...)` pattern, no new local state
    - Blank-key guard: picker hidden for mapping/header rows with empty key
    - `available-fields` response now returns `emptyState` (`NO_EXECUTIONS` | `INCOMPATIBLE_EXECUTIONS` | `NO_FIELDS`) so UI shows the correct assistive hint for empty dropdowns
    - Documentation synced with delivered scope: picker is button-driven (`⚡`), `DbQueryConfig` remains excluded from this slice

- **Что сделано в TASK-027**:
  - `apps/web/src/components/editor/config-forms/WebhookConfig.tsx` — полная переработка:
    - **Copy URL** кнопка — копирует полный webhook URL в clipboard
    - **Copy curl** кнопка — копирует однострочную curl-команду с `<your-secret>` placeholder
    - Обе кнопки `disabled` когда `workflowId === null` (workflow ещё не сохранён)
    - URL input: monospace шрифт + `title` tooltip с полным URL
    - `toast.success('Copied!')` при успехе, `toast.error(...)` при отказе clipboard API
    - Hint про `Idempotency-Key` / `X-Event-ID` показан отдельным текстом в UI (не в curl)
    - `X-Webhook-Secret` hint оформлен с `<code>` тегом
  - **Проверки**: `pnpm --filter @mini-zapier/web run build` — OK
- **Что сделано в TASK-028**:
  - **Backend**:
    - `apps/api/src/execution/dto/list-executions-query.dto.ts` — `status` query filter (`SUCCESS` | `FAILED` | `IN_PROGRESS`) для `GET /api/workflows/:id/executions`
    - `apps/api/src/execution/execution.service.ts` — filtered history list + aggregate counts `{all, success, failed, inProgress}` по всему workflow
    - `apps/api/src/execution/execution.controller.ts` — Swagger summary/description обновлены под filter + counts
  - **Frontend**:
    - `apps/web/src/lib/api/types.ts` — history params/response расширены `status` и `counts`
    - `apps/web/src/pages/ExecutionHistoryPage.tsx` — state for active tab, page reset on filter change, polling по `counts.inProgress`
    - `apps/web/src/components/execution/ExecutionTable.tsx` — tabs `All | Success | Failed | In progress`, counters, filter-aware empty states
  - **Проверки TASK-028**:
    - `pnpm --filter @mini-zapier/api build`
    - `pnpm --filter @mini-zapier/web build`

- **Что сделано в TASK-026**:
  - `apps/web/src/components/editor/config-forms/DataTransformConfig.tsx` — mapping rows switched to a two-line layout inside compact cards, so key and value each get full row width; remove control stays compact `×`; placeholders remain `key` / `value`
  - `apps/web/src/components/editor/config-forms/HttpRequestConfig.tsx` — header rows switched to a two-line layout inside compact cards, so header name and value each get full row width; remove control stays compact `×`; placeholders remain `header name` / `header value`
  - `FieldPicker` stays on the second line next to the value input; the existing `h-6 w-6` spacer is preserved for empty keys, so row rhythm stays stable
  - **Проверки TASK-026**:
    - `pnpm --filter @mini-zapier/web run build`
    - browser visual smoke в этой сессии не запускался

- **Что сделано в TASK-029**:
  - `apps/web/src/components/AppHeader.tsx` — вынесен общий sticky header с nav/logout, который переиспользуется обоими layout'ами
  - `apps/web/src/layouts/EditorLayout.tsx` — добавлен отдельный wide layout для editor route без `max-w-[1680px]` на основном контенте
  - `apps/web/src/layouts/AppLayout.tsx` — inline header удалён, обычные страницы продолжают использовать общий centered container
  - `apps/web/src/App.tsx` — editor route вынесен в отдельную ветку под `ProtectedRoute`, dashboard/history остались под `AppLayout`
  - `apps/web/src/pages/WorkflowEditorPage.tsx` — страница переведена на `flex` + `min-h-0` layout; toolbar фиксируется по контенту, рабочая grid-область забирает оставшуюся высоту
  - `apps/web/src/components/editor/FlowCanvas.tsx` — fixed heights `780px/820px` убраны; canvas теперь тянется через `h-full` / `flex-1`
  - `NodeSidebar` и `ConfigPanel` продолжают работать внутри `h-full` flex-контейнеров с независимым vertical scroll в desktop layout
  - **Проверки TASK-029**:
    - `pnpm --filter @mini-zapier/web build`
    - browser visual smoke в этой сессии не запускался

- **Что сделано в TASK-030**:
  - `apps/web/src/pages/DashboardPage.tsx` — hero блок уплотнён: меньше вертикальный размер, компактнее CTA и tighter spacing между dashboard sections
  - `apps/web/src/components/dashboard/StatsOverview.tsx` — усилены заголовок секции, metric card contrast и scanability за счёт tighter panel spacing, pills и более явных value tones
  - `apps/web/src/components/dashboard/WorkflowList.tsx` — усилен section header, tightened panel spacing и снижены зазоры между workflow cards
  - **Проверки TASK-030**:
    - `pnpm --filter @mini-zapier/web build`
    - desktop visual smoke dashboard через локальный `vite preview` + Playwright mock API
- **Что сделано в TASK-031**:
  - `apps/web/src/components/editor/FlowCanvas.tsx` — canvas empty state переработан в более явный onboarding: шаги `trigger -> actions`, drop-zone framing, stronger drag-over hint и промежуточные подсказки после первого шага
  - `apps/web/src/components/editor/NodeSidebar.tsx` — левая библиотека стала более похожа на tool rail: build-order guidance, усиленные section cards для triggers/actions, stronger draggable item hierarchy
  - `apps/web/src/components/editor/ConfigPanel.tsx` — правый inspector получил более явный empty state, workspace guidance и более структурированную иерархию выбранной ноды
  - `apps/web/src/index.css` — добавлены editor-specific surface styles для rail/canvas background hierarchy без изменения editor mechanics
  - **Проверки TASK-031**:
    - `pnpm --filter @mini-zapier/web build`
    - desktop visual smoke empty editor через локальный `vite preview` + Playwright screenshot с mock `GET /api/auth/me` и `GET /api/connections`

- **Что сделано в TASK-032**:
  - `apps/web/src/components/dashboard/WorkflowCard.tsx` — workflow cards переведены в более плотный grid-layout с отдельным operational block для `workflow status` и `last execution`; вторичная мета-информация ужата, action-row визуально приглушён без изменения поведения
  - `apps/web/src/components/dashboard/WorkflowList.tsx` — секция workflow list получила tighter spacing и более scan-friendly section header
  - `apps/web/src/index.css` — добавлены dashboard-specific card surfaces с status accent rail/background для более быстрой навигации по списку
  - **Проверки TASK-032**:
    - `pnpm --filter @mini-zapier/web build`
    - desktop visual smoke dashboard workflow list через локальный `vite preview` + Playwright screenshot с mock `GET /api/auth/me`, `GET /api/stats`, `GET /api/workflows`, `GET /api/workflows/:id/executions`
- **Что сделано в TASK-033**:
  - `apps/web/src/index.css` — усилены глобальные surface tokens, contrast borders, shadows и accent hierarchy для primary/secondary panels
  - `apps/web/src/components/AppHeader.tsx`, `apps/web/src/layouts/AppLayout.tsx` — header и page shell получили более выразительный brand/accent framing без смены структуры маршрутов
  - `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/components/dashboard/StatsOverview.tsx`, `apps/web/src/components/dashboard/WorkflowList.tsx`, `apps/web/src/components/dashboard/WorkflowCard.tsx` — dashboard секции, CTA и workflow cards разведены по визуальному весу и считываются быстрее
  - `apps/web/src/pages/WorkflowEditorPage.tsx`, `apps/web/src/components/editor/FlowCanvas.tsx`, `apps/web/src/components/editor/NodeSidebar.tsx`, `apps/web/src/components/editor/ConfigPanel.tsx` — canvas стал главной surface editor, rails и inspector ушли во вторичный вес, spacing и panel contrast выровнены
  - **Проверки TASK-033**:
    - `pnpm --filter @mini-zapier/web build`
    - desktop visual smoke dashboard/editor через локальный `vite preview` + Playwright screenshots с mock `GET /api/auth/me`, `GET /api/stats`, `GET /api/workflows`, `GET /api/workflows/:id/executions`, `GET /api/connections`
## Следующий шаг
Следующий рабочий срез: `TASK-Q3 — tighten connections list hierarchy and row density`.

Перед исполнением:
- держать scope внутри visual hierarchy/density polish текущего server-driven shell, не меняя catalog contract
- сохранить lazy detail fetch на edit и не ломать уже переведённые create/edit/delete flows
- не расширять scope до editor picker (`TASK-Q4`), smoke/copy stabilization (`TASK-Q5`), workflow names list, health checks, tags, bulk actions или sharing/RBAC/OAuth reconnect

В `TASK-Q3`:
- уплотнить rows/list hierarchy для более быстрого сканирования
- сделать delete action тише и улучшить читаемость meta summary
- не возвращать страницу к full `GET /connections`

## Блокеры
- На текущей машине не заданы env `MINI_ZAPIER_E2E_EMAIL` / `MINI_ZAPIER_E2E_PASSWORD`, поэтому локальный Playwright smoke против live Vercel не запускался; для TASK-J локальная проверка ограничена `build` + `playwright test --list`.
- Docker daemon / локальный PostgreSQL на `5434` сейчас не подняты, поэтому `pnpm --filter @mini-zapier/api run prisma:migrate -- --name add_user_auth` локально не прогонялся; migration SQL добавлен вручную.

- На машине во время проверки порт `3000` был занят внешним процессом (`D:\TZ\Finance_tracker\src\server.ts`), а порт `5173` — внешним Vite-процессом (`D:\TZ\Finance_tracker\client`). Для smoke-проверок использовались `3001`, `5174`, `5175`, `5176`, `5177`, `5178`.
- `apps/web/package.json` использует `"@mini-zapier/shared": "file:../../packages/shared"` как обход зависающего `pnpm install` и несовместимости `npm` с `workspace:*`.

## Важные заметки
- **Порты инфраструктуры**: PostgreSQL=**5434**, Redis=**6380**
- Workflow node ids в create/update payload теперь трактуются только как client-local references для связи nodes ↔ edges; persisted ids генерируются сервером и приходят обратно в API response
- Для `apps/web` Vite proxy по умолчанию шлёт `/api/*` на `http://localhost:3000`; для локального smoke можно переопределить target через `VITE_API_PROXY_TARGET`
- `apps/web/playwright.config.ts` по умолчанию ждёт `MINI_ZAPIER_E2E_BASE_URL=http://127.0.0.1:5179`; если прогоняешь e2e на другом порту, передай env явно
- `apps/web/e2e/ui-smoke.spec.ts` теперь логинится по `MINI_ZAPIER_E2E_EMAIL`; если email env не задан, smoke генерирует per-run email из legacy `MINI_ZAPIER_E2E_USERNAME`, создаёт пользователя через публичный register endpoint, жёстко фиксирует `mini-zapier:locale=en` и ждёт dashboard через `data-testid="create-workflow-link"`
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
- Legacy rows из до-owner-isolation эпохи останутся с `userId = null` до отдельного backfill; такие workflows/connections не видны в пользовательском workspace, пока не будут привязаны к конкретному `User`
- **Auth**: `POST /api/auth/register` создаёт пользователя в таблице `User`, пароль хэшируется встроенным `scrypt`; `Workflow` и `Connection` фильтруются по `userId`; env vars: `AUTH_SESSION_SECRET`; cookie name `mz_session`, Max-Age 7 дней
- **Public endpoints** (не требуют auth): `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/health`, `GET /api/readiness`, `POST /api/webhooks/:workflowId`, `POST /api/inbound-email/:workflowId`, `GET /api/auth/me` (auth-aware: 200/401)
- **Owner isolation**: auth routes возвращают только workflows/connections/executions/stats текущего пользователя; публичные webhook/email/cron triggers по-прежнему работают по `workflowId` без auth session
- **Swagger** отключен при `NODE_ENV=production`; доступен только в dev
- **CORS**: origin из `CORS_ORIGIN` env (comma-separated), fallback `http://localhost:5173`; `credentials: true`
- **Docker**: `deploy/docker-compose.prod.yml` использует `build.context: ..`, поэтому на VPS нужен весь репозиторий, а не только папка `deploy`; порт API привязан к `127.0.0.1:3000` (loopback only) и не доступен извне
- **Vercel**: `vercel.json` rewrite `/api/*` направлен на `https://api.memelab.ru/mini-zapier/api/:path*`; frontend URL сейчас `https://mini-zapier-web-silk.vercel.app`
- **Nginx**: `deploy/nginx.mini-zapier-api.conf` — location block для `api.memelab.ru` HTTPS server, проксирует `/mini-zapier/` → `127.0.0.1:3000/`

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
| TASK-019 | done | см. `git log` (`TASK-019: workflow editor validation hardening`) | duplicate trigger block, pre-save graph validation, invalid-save regression tests |
| TASK-020 | done | см. `git log` (`TASK-020: production cleanup + origin hardening`) | deleted test workflows, loopback port binding, nginx config, vercel HTTPS rewrite |
| TASK-021 | done | см. `git log` (`TASK-021: proxy-aware rate limiting`) | @nestjs/throttler, trust proxy, login 5/60s, trigger 30/60s, deployed+verified |
| TASK-021 follow-up | done | см. `git log` (`TASK-021: sync throttler version spec`) | package.json + pnpm-lock specifier synced to `@nestjs/throttler@^6.5.0` |
| TASK-022 | done | 1c19f92 | liveness/readiness endpoints, env fail-fast for api+worker, ioredis readiness check, deployed+verified |
| TASK-023 | done | 2a624c1 | remove dev copy, compact toolbar, toast cleanup, inline login error, node label in canvas |
| TASK-024 | done | 9c01091, 2ce1a17 | GitHub Actions CI: build gate + optional e2e smoke |
| TASK-025 | done | см. `git log` | Field picker: available-fields API + FieldPicker component + config form integration |
| TASK-025 follow-up | done | см. `git log` (`TASK-025: fix field picker empty states`) | API/UI empty-state reason + backlog/handoff scope sync |
| TASK-026 | done | см. `git log` | two-line mapping/header rows, compact remove controls, clearer empty placeholders |
| TASK-027 | done | см. `git log` | Copy URL/curl buttons, clipboard toasts, Idempotency-Key hint, monospace URL |
| TASK-028 | done | см. `git log` (`TASK-028: execution history status filters + counters`) | History tabs/counters + API status filter/counts |
| TASK-029 | done | см. `git log` (`TASK-029: workflow editor full-width workspace layout`) | shared header + wide editor layout + viewport-aware canvas sizing |
| TASK-030 | done | см. `git log` (`TASK-030: dashboard visual hierarchy pass`) | compact hero, denser stats/workflow hierarchy, desktop smoke screenshot |
| TASK-031 | done | см. `git log` (`TASK-031: editor empty-state and workspace guidance`) | guided empty canvas, stronger workspace rails, desktop smoke screenshot |
| TASK-032 | done | см. `git log` (`TASK-032: workflow cards density and status emphasis`) | denser dashboard cards, stronger status/last execution emphasis, desktop smoke screenshot |
| TASK-033 | done | см. `git log` (`TASK-033: global visual polish and hierarchy pass`) | stronger global surface contrast, accent hierarchy, dashboard/editor desktop smoke screenshots |
| TASK-033 follow-up | done | см. `git log` (`TASK-033: fix mobile header overflow`) | responsive AppHeader fix for narrow screens, 390px smoke recheck |
| TASK-034 | done | см. `git log` (`TASK-034: web language switcher EN/RU`) | locale infrastructure, EN/RU switcher, centralized copy, locale-aware date/time formatting, build + preview smoke with mock API |
| TASK-034 follow-up | done | см. `git log` (`TASK-034: localization copy cleanup`) | canonical node labels kept untranslated, raw enum labels removed from UI, leftover aria-labels localized, RU copy polished |
| TASK-035 | done | см. `git log` (`TASK-035: editor viewport containment + rail density`) | desktop editor shell constrained to viewport, rails compacted, internal scroll preserved |
| TASK-036 | done | см. `git log` (`TASK-036: editor rail visual cleanup`) | wider desktop rails, cleaner node library, simplified empty inspector state |
| TASK-037 | done | см. `git log` (`TASK-037: node library rail redesign`) | left rail widened and rebuilt into a cleaner, more professional toolbox list |
| TASK-038 | done | см. `git log` (`TASK-038: editor rail parity + collapsible guidance`) | left hint collapsible, right inspector redesigned to match the updated rail language |
| TASK-039 | done | см. `git log` (`TASK-039: inspector cleanup + compact flow-order hint`) | compact flow-order cue in left rail, cleaner and denser right inspector hierarchy |
| TASK-040 | done | см. `git log` (`TASK-040: inspector structure refinement`) | right inspector flattened into a cleaner tool-panel with less empty-state waste and no duplicated connection summary |
| TASK-041 | done | см. `git log` (`TASK-041: inspector empty-state rhythm + editor toolbar alignment`) | inspector empty state starts directly under the header, and the top editor controls now read as one aligned action bar |
| TASK-042 | done | см. `git log` (`TASK-042: inspector connection semantics clarity`) | inspector now shows explicit connection states and availability instead of ambiguous numeric count badges |
| TASK-043 | done | см. `git log` (`TASK-043: connections management page`) | dedicated `/connections` section, reusable connection catalog, standalone create/edit/delete dialog |
| TASK-044 | done | `7f2ada5` (`TASK-044: fix DB_QUERY serialization`) | JSON.parse(JSON.stringify()) sanitizes Date/BigInt/Buffer in pg result.rows; deployed & verified on VPS |
| TASK-045 | done | см. `git log` (`TASK-045: shared workspace user registration`) | User model + DB-backed register/login + /register page; initial auth slice without owner isolation |
| TASK-045 follow-up | done | см. `git log` (`TASK-045: enforce user workspace isolation`) | Workflow/Connection userId + owner-filtered API/stats/manual execute; legacy rows need backfill |
| TASK-046 | done | см. `git log` (`TASK-046: schema-backed field tree`) | FieldTreeNode + buildFieldTree + persistent schema snapshots + tree FieldPicker + email to picker |
| TASK-047 | done | см. `git log` (`TASK-047: reusable templated text control with chips`) | TemplatedField + TemplatedInput + ChipInspector, contentEditable chips, controlled FieldPicker, Email/Telegram/HTTP/DT integration |
| TASK-048 | done | см. `git log` (`TASK-048: cron visual schedule builder`) | Visual preset selector, time/day pickers, next-run preview с cron-parser, visual↔code toggle |
| TASK-052 | done | см. `git log` (`TASK-052: DB Query metadata introspection + read builder`) | Backend introspection (tables/columns/test query), visual SELECT builder, backward compat via _builderState |
| TASK-051 | done | см. `git log` (`TASK-051: Data Transform visual mapping builder`) | TemplatedField для mapping values, RawJsonFallback escape hatch |
| TASK-050 | done | см. `git log` (`TASK-050: HTTP Request visual builder`) | Visual body KV builder, fields↔JSON toggle, Content-Type hint, RawJsonFallback |
| TASK-049 | done | см. `git log` (`TASK-049: Email + Telegram no-code action forms`) | Raw JSON fallback для Email/Telegram, chatId helper с инструкцией @userinfobot, RawJsonFallback reusable component |
| TASK-053 | done | см. `git log` (`TASK-053: DB Query write/update/delete builder`) | Mutation visual builder (INSERT/UPDATE/DELETE), safe test via ROLLBACK, raw SQL mutation routing, RawJsonFallback sync |
| TASK-054 | done | см. `git log` (`TASK-054: step test-run infrastructure`) | Per-action test button via BullMQ waitUntilFinished, DB_QUERY safety (BEGIN+ROLLBACK), FieldPicker overlay from test results, Zustand invalidation cascade |
| TASK-055 | done | см. `git log` (`TASK-055: built-in workflow starter templates`) | `/workflows/new` template picker, built-in Webhook→Telegram / Cron→Email starters, editor prefill via `templateId` state; prod save+reopen verified for both templates |
| TASK-056 | done | см. `git log` (`TASK-056: Email/Telegram message preview from last run`) | template-resolve utility, usePreviewData hook (test+execution fallback with double guard), MessagePreview component, Email/Telegram config integration; prod UI verified on Vercel |
| TASK-A | done | см. `git log` (`TASK-A: protect unsaved editor changes`) | Editor draft snapshot + dirty badge, route discard confirm for header/back/navigation, beforeunload guard for refresh/close |
| TASK-B | done | см. `git log` (`TASK-B: explain rejected editor interactions`) | Explicit toast feedback for rejected editor connections with reason codes for invalid source/target, direction, duplicate edge, second in/out, cycle risk |
| TASK-C | done | см. `git log` (`TASK-C: fix stale test preview and field states`) | StepTest input resync + selected-node reset, preview refresh/error states, FieldPicker load errors no longer masked as empty state |
| TASK-D | done | см. `git log` (`TASK-D: align connection dialog validation`) | Shared connection dialog validation/pending behavior; editor create now reuses the library form and rejects empty credential values |
| TASK-E | done | см. `git log` (`TASK-E: refine notifications and destructive flows`) | Auth inline errors no longer duplicate toast, destructive delete dialogs have truthful pending copy/locking, connection update pending label matches action |
| TASK-F | done | см. `git log` (`TASK-F: improve modal accessibility`) | ModalShell focus trap + initial/return focus + aria wiring; Confirmation/Connection dialogs marked non-dismissable during pending |
| TASK-G | done | см. `git log` (`TASK-G: graceful fallback for missing editor API routes`) | Frontend distinguishes missing backend routes from real empty/error states in DB Query + Step Test and no longer overflows inspector on long route errors |
| TASK-H | done | `892bd57` (`TASK-H: support non-public schemas in DB Query builder`) | DB introspection now scans available non-public schemas, visual SQL quotes `schema.table`; isolated VPS redeploy completed and public introspection/step-test routes still answer `401` instead of `404` |
| TASK-I | done | см. `git log` (`TASK-I: clarify editor inspector flow`) | Guided inspector flow, calmer advanced/manual paths, friendlier editor copy for beginners while keeping power-user escape hatches |
| TASK-J | done | `96f4450` (`TASK-J: restore json echo contract in smoke`) | Live smoke now self-provisions a valid e2e user when only legacy username is configured, forces EN locale, waits for stable dashboard markers, restores explicit JSON echo headers for downstream transform assertions, and passed GitHub Actions run `23201159348` |
| TASK-K | done | см. `git log` (`TASK-K: stabilize inspector rail and DB query semantics`) | Inspector rail no longer compresses progress cards or repeated field controls, and DB Query now uses clearer builder wording while introspection lists queryable PostgreSQL relations instead of only base tables |
| TASK-L | done | см. `git log` (`TASK-L: refine inspector menu hierarchy`) | Inspector now uses a compact step summary and calmer section hierarchy, while DB Query / HTTP / Data Transform / manual surfaces use shorter copy and less visual nesting on the narrow rail |
| TASK-M | done | см. `git log` (`TASK-M: repair live smoke after inspector copy update`) | HTTP Request headers block now exposes stable test ids, and the webhook → HTTP → Data Transform smoke no longer depends on fragile UI copy like `Optional headers` / `Show` |
| TASK-N1 | done | см. `git log` (`TASK-N1: refactor editor inspector shell`) | Inspector shell now uses a contextual header, simplified connection/main/test hierarchy, quiet footer delete action, and a single guidance empty state block |
| TASK-N2 | done | см. `git log` (`TASK-N2: redesign DB query inspector flow`) | DB Query now starts with a visual-first inspector flow (`Action` → `Table` → operation-specific controls), while raw SQL, params and JSON fallback live in a local advanced section and legacy raw steps keep their existing data |
| TASK-N3 | done | см. `git log` (`TASK-N3: align remaining action forms with inspector shell`) | Remaining action forms now share the inspector hierarchy: HTTP starts with `method → url → body`, Email/Telegram keep preview secondary, Telegram helper is quieter, and Data Transform centers on output shaping while manual JSON stays in advanced |
| TASK-N4 | done | см. `git log` (`TASK-N4: align trigger forms with inspector shell`) | Trigger inspectors now share the same shell rhythm: Webhook/Email keep the URL primary, Cron leads with visual scheduling, and security/raw guidance moves into secondary help/advanced surfaces |
| TASK-N5 | done | см. `git log` (`TASK-N5: finalize inspector status and copy polish`) | Inspector header/status and Step Test gating now resolve honestly across saved state, connection blockers and last test results, while EN/RU shell copy drops the remaining unused progress-model keys |
| TASK-N6 | done | см. `git log` (`TASK-N6: repair live smoke after HTTP advanced nesting`) | HTTP Request advanced section now exposes a stable `http-advanced-toggle`, and the live smoke opens it before looking for nested headers controls |
| TASK-N7 | done | см. `git log` (`TASK-N7: remove standalone workflow start page`) | `/workflows/new` now opens the blank editor directly; standalone template picker, template prefill wiring and related locale/store code removed; smoke switched to the new route |
| TASK-N8 | done | см. `git log` (`TASK-N8: stabilize live smoke by removing third-party echo dependency`) | Default live smoke no longer depends on `postman-echo`; webhook -> HTTP Request -> Data Transform now uses internal `/api/auth/register` with stable JSON output, while `MINI_ZAPIER_E2E_ECHO_URL` remains an optional override |
| TASK-O0 | done | см. `git log` (`TASK-O0: plan dashboard redesign slices`) | Dashboard UX audit decomposed into sequential backlog slices `TASK-O1`–`TASK-O5`; next implementation starts with data contract and N+1 removal |
| TASK-O1 | done | см. `git log` (`TASK-O1: dashboard summary data contract`) | Added `GET /api/stats/dashboard`, embedded `lastExecution` into workflow summaries, and switched dashboard frontend to a single summary payload without per-workflow execution fetches |
| TASK-O2 | done | см. `git log` (`TASK-O2: redesign dashboard top-level IA`) | Replaced the dashboard hero with a compact operational header, added an attention strip from existing summary data, made stats secondary, and removed the duplicate create CTA from the empty state |
| TASK-O3 | done | см. `git log` (`TASK-O3: redesign dashboard workflow list`) | Replaced decorative workflow cards with denser operational rows, removed duplicate status emphasis, derived attention reasons from existing summary data, and reordered dashboard actions for faster scanning |
| TASK-O4 | done | см. `git log` (`TASK-O4: add dashboard controls and recent activity`) | Added client-side dashboard search/filter/sort, preserved the `TASK-O3` operational list pattern, and surfaced compact recent runs/failures from `recentExecutions` with better empty/results states |
| TASK-O5 | done | см. `git log` (`TASK-O5: polish dashboard redesign`) | Final dashboard polish: synced operational RU/EN copy, tightened mobile/desktop layout, added stable dashboard test ids, and removed brittle smoke navigation selectors |
| TASK-O6 | done | см. `git log` (`TASK-O6: final dashboard density and column-balance polish`) | Dashboard rows no longer duplicate paused/draft attention, recent activity is balanced for 0-1 items, dashboard surfaces are denser, and web build + Playwright test list passed |
| TASK-P1 | done | см. `git log` (`TASK-P1: rebalance editor workspace layout`) | Rebalanced the workflow editor into a quieter workspace-first composition, compacted left rail/canvas chrome, simplified empty canvas, and moved FieldPicker into a viewport-aware portal overlay |
| TASK-P2 | done | см. `git log` (`TASK-P2: fix editor page residual layout defects`) | Manual editor QA after workspace rebalance confirmed one residual templated-chip overlay defect; fixed `ChipInspector` anchoring in `TemplatedField` without expanding redesign scope |
| TASK-P3 | done | см. `git log` (`TASK-P3: compact workflow editor command bar`) | Rebuilt the editor header into a compact command bar with a quieter back action, dominant workflow name, secondary meta chips, and tighter top spacing while keeping button behavior unchanged |
| TASK-P4 | done | см. `git log` (`TASK-P4: plan action inspector density follow-up`) | Defined the next editor inspector track: `TASK-P5` handles structural flatten and width reclaim, while `TASK-P6` closes overflow/responsive/smoke stabilization |
| TASK-P5 | done | см. `git log` (`TASK-P5: flatten action inspector hierarchy`) | Flattened the action inspector into a denser tool-panel: lighter shell, compact secondary Preview/Advanced/Step Test sections, row-group repeated controls, tighter rail CSS/copy, and passing web build + Playwright test list |
| TASK-P6 | done | см. `git log` (`TASK-P6: inspector overflow, responsive QA and smoke stabilization`) | Fixed templated input overflow/placeholder clipping, made residual action-form header rows wrap safely on the narrow inspector rail, switched smoke to stable inspector hooks, and confirmed mock-preview QA for `1280/1440/1600` plus web build + Playwright test list |
| TASK-P7 | done | см. `git log` (`TASK-P7: remove redundant editor palette guidance`) | Removed the redundant left palette hero/order guidance, tightened the rail start in `NodeSidebar`, deleted unused EN/RU palette copy, and kept web build + Playwright test list green |
| TASK-Q0 | done | см. `git log` (`TASK-Q0: plan connections catalog redesign slices`) | Defined the sequential connections catalog redesign track `TASK-Q1`–`TASK-Q5`, kept scope within catalog scaling/redesign only, and pointed the next implementation slice to the summary API contract |
| TASK-Q1 | done | см. `git log` (`TASK-Q1: add scalable connections catalog summary API`) | Added owner-scoped `GET /api/connections/catalog` with summary-only pagination/filter/sort/query, shared catalog contracts + Swagger DTOs, page-level usage aggregation, and a Windows-safe Prisma sync step so `pnpm --filter @mini-zapier/api build` stays green |
| TASK-Q2 | done | см. `git log` (`TASK-Q2: rebuild connections page into operational catalog shell`) | Rebuilt `/connections` into a server-driven catalog shell with summary search/filter/sort/pagination, preserved create/edit/delete flows, and lazy-loaded full connection detail only when opening edit; `pnpm --filter @mini-zapier/web build` passed |
| TASK-Q3 | done | см. `git log` (`TASK-Q3: tighten connections list hierarchy and row density`) | Tightened `/connections` into denser operational rows with dominant names, compact metadata, quieter delete action, and more compact loading/empty/error/no-results states; `pnpm --filter @mini-zapier/web build` passed |
| TASK-Q4 | done | см. `git log` (`TASK-Q4: scale editor connection picker`) | Replaced the editor inspector connection `<select>` with a lazy type-scoped searchable picker on the catalog summary endpoint, kept inline create/refresh/current selection semantics, and confirmed web build + Playwright test list |
