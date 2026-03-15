import type { LocaleMessages } from './messages.en';
import type { WorkflowValidationCode } from '../stores/workflow-editor.store';

import {
  formatCount,
  pluralizeRu,
  type ConnectionTypeLabelMap,
  type ExecutionStatus,
  type StepStatus,
  type WorkflowStatus,
} from './shared';

export const ru = {
  common: {
    emptyValue: '—',
    languageLabel: 'Язык',
    localeOptions: {
      en: 'EN',
      ru: 'RU',
    },
    workflowStatusLabels: {
      ACTIVE: 'Активен',
      DRAFT: 'Черновик',
      PAUSED: 'На паузе',
    } as Record<WorkflowStatus, string>,
    workflowStatusDescriptions: {
      ACTIVE: 'Готов принимать триггеры',
      DRAFT: 'Пока не активирован',
      PAUSED: 'Временно остановлен',
    } as Record<WorkflowStatus, string>,
    executionStatusLabels: {
      PENDING: 'В очереди',
      RUNNING: 'Выполняется',
      SUCCESS: 'Успешно',
      FAILED: 'Ошибка',
    } as Record<ExecutionStatus, string>,
    executionStatusDescriptions: {
      PENDING: 'Ожидает обработки',
      RUNNING: 'Сейчас выполняется',
      SUCCESS: 'Выполнено успешно',
      FAILED: 'Требует внимания',
    } as Record<ExecutionStatus, string>,
    stepStatusLabels: {
      PENDING: 'В очереди',
      RUNNING: 'Выполняется',
      SUCCESS: 'Успешно',
      FAILED: 'Ошибка',
      SKIPPED: 'Пропущен',
    } as Record<StepStatus, string>,
    nodeKindLabels: {
      trigger: 'Триггер',
      action: 'Действие',
    },
    connectionTypeLabels: {
      SMTP: 'SMTP',
      TELEGRAM: 'Telegram',
      POSTGRESQL: 'PostgreSQL',
      WEBHOOK: 'Webhook',
    } as ConnectionTypeLabelMap,
    durationUnits: {
      ms: 'мс',
      sec: 'с',
      min: 'м',
      hour: 'ч',
    },
    activate: 'Активировать',
    pause: 'Приостановить',
    run: 'Запустить',
    save: 'Сохранить',
    delete: 'Удалить',
    edit: 'Редактировать',
    history: 'История',
    back: 'Назад',
    refreshing: 'Обновление…',
    loading: 'Загрузка...',
  },
  header: {
    brandTitle: 'Mini-Zapier',
    brandSubtitle: 'Центр управления сценариями',
    navigation: {
      dashboard: 'Панель',
      connections: 'Подключения',
      createWorkflow: 'Создать сценарий',
    },
    logout: 'Выйти',
  },
  dashboardPage: {
    eyebrow: 'Операции со сценариями',
    title:
      'Управляйте сценариями, следите за состоянием запусков и запускайте их вручную.',
    description:
      'Следите за состоянием сценариев, запускайте их вручную и управляйте автоматизациями.',
    createWorkflow: 'Создать сценарий',
    deleteDialogTitle: 'Удалить сценарий?',
    deleteDialogConfirm: 'Удалить сценарий',
    deleteDialogDescription: (name: string) =>
      `Удалить сценарий "${name}"? Это действие нельзя отменить.`,
    executionStartedToast: (name: string) =>
      `Запуск сценария "${name}" создан.`,
    statusUpdatedToast: (name: string, status: string) =>
      `Сценарий "${name}" теперь: ${status}.`,
    deletedToast: (name: string) => `Сценарий "${name}" удалён.`,
  },
  statsOverview: {
    eyebrow: 'Обзор статистики',
    title: 'Состояние платформы с первого взгляда',
    loading: 'Загрузка...',
    refreshing: 'Обновляем данные по сценариям и запускам...',
    pausedWorkflows: (count: number | null) =>
      `Сценарии на паузе: ${
        count === null ? '—' : formatCount('ru-RU', count)
      }`,
    cards: {
      totalWorkflows: {
        label: 'Всего сценариев',
        description: 'Все сценарии, которые сейчас сохранены в системе.',
      },
      activeWorkflows: {
        label: 'Активные сценарии',
        description:
          'Сценарии, готовые принимать webhook, cron или email триггеры.',
      },
      totalExecutions: {
        label: 'Всего запусков',
        description: 'Ручные и автоматические запуски, записанные сервером.',
      },
      successRate: {
        label: 'Успешность',
        description:
          'Рассчитывается по завершённым успешным и неуспешным запускам.',
      },
    },
  },
  workflowList: {
    eyebrow: 'Список сценариев',
    title: 'Быстро оценивайте состояние и действуйте',
    refreshing: 'Обновляем карточки сценариев и последние запуски...',
    loadedCount: (count: number) =>
      `${formatCount('ru-RU', count)} ${pluralizeRu(
        count,
        'сценарий загружен',
        'сценария загружено',
        'сценариев загружено',
      )}`,
    loadingTitle: 'Загрузка сценариев...',
    loadingDescription: 'Загружаем сценарии из API.',
    emptyTitle: 'Сценариев пока нет',
    emptyDescription:
      'Создайте первый сценарий, чтобы принимать триггеры и запускать действия.',
    createWorkflow: 'Создать сценарий',
  },
  workflowCard: {
    eyebrow: 'Сценарий',
    workflowStatusEyebrow: 'Статус сценария',
    lastExecutionEyebrow: 'Последний запуск',
    loadingLatestExecution: 'Загружаем последний запуск...',
    syncing: 'Синхронизация',
    noDescription: 'Описание сценария не задано.',
    versionLabel: 'Версия',
    timezoneLabel: 'Часовой пояс',
    nodesLabel: 'Узлы',
    updatedLabel: 'Обновлён',
    workflowVersion: (version: number) => `Версия сценария ${version}`,
    noExecutions: 'Запусков пока нет.',
    running: 'Запуск...',
    updating: 'Обновление...',
    deleting: 'Удаление...',
  },
  executionHistoryPage: {
    eyebrow: 'История запусков',
    title: 'История запусков',
    backToDashboard: 'К панели',
    openEditor: 'Открыть редактор',
    savedOnlyError:
      'История запусков доступна только для уже сохранённых сценариев.',
  },
  executionTable: {
    eyebrow: 'Запуски',
    title: 'История запусков сценария',
    refreshing: 'Обновляем незавершённые запуски...',
    noMatches: 'По этому фильтру запусков нет',
    noneRecorded: 'Запусков пока нет',
    showingRange: (start: number, end: number, total: number) =>
      `Показано ${formatCount('ru-RU', start)}-${formatCount('ru-RU', end)} из ${formatCount('ru-RU', total)}`,
    filters: {
      all: 'Все',
      success: 'Успешные',
      failed: 'С ошибкой',
      inProgress: 'В процессе',
    },
    loadingTitle: 'Загрузка запусков...',
    loadingDescription: 'История запусков загружается из API.',
    columns: {
      id: 'ID',
      status: 'Статус',
      trigger: 'Триггер',
      started: 'Старт',
      duration: 'Длительность',
      actions: 'Действия',
    },
    viewing: 'Открыт',
    view: 'Открыть',
    pageOf: (page: number, totalPages: number) =>
      `Страница ${formatCount('ru-RU', page)} из ${formatCount('ru-RU', totalPages)}`,
    previous: 'Назад',
    next: 'Далее',
    queued: 'В очереди',
    running: 'Выполняется',
    manualEmptyPayload: 'Ручной запуск / пустой payload',
    payloadFallback: 'Payload',
    nullValue: 'null',
    emptyString: '""',
    arrayLabel: (count: number) => `Массив(${formatCount('ru-RU', count)})`,
    objectFallback: '{...}',
    noExecutionsTitle: 'Запусков пока нет',
    noExecutionsDescription:
      'Запустите сценарий вручную или вызовите триггер, чтобы заполнить историю.',
    noSuccessTitle: 'Успешных запусков нет',
    noSuccessDescription: 'У этого сценария пока нет успешных запусков.',
    noFailedTitle: 'Ошибок пока нет',
    noFailedDescription: 'Неуспешные запуски появятся здесь, как только произойдут.',
    nothingInProgressTitle: 'Сейчас ничего не выполняется',
    nothingInProgressDescription:
      'Запуски в очереди и в процессе будут показаны здесь, пока работа не завершена.',
  },
  stepLogViewer: {
    eyebrow: 'Логи шагов',
    executionTitle: (id: string) => `Запуск ${id}`,
    emptyTitle: 'Выберите запуск',
    refreshing: 'Обновляем детали запуска...',
    loadedCount: (count: number) =>
      `${formatCount('ru-RU', count)} ${pluralizeRu(
        count,
        'шаг загружен',
        'шага загружено',
        'шагов загружено',
      )}`,
    chooseRow: 'Выберите строку слева, чтобы открыть таймлайн',
    loadingTitle: 'Загрузка логов шагов...',
    loadingDescription: 'Загружаем детали выбранного запуска.',
    noExecutionTitle: 'Запуск не выбран',
    noExecutionDescription:
      'Используйте таблицу слева, чтобы открыть логи шагов конкретного запуска.',
    workflowVersion: (version: number) => `Сценарий v${version}`,
    truncated: 'Обрезано',
    duration: (value: string) => `Длительность ${value}`,
    durationEmpty: 'Длительность —',
    retryAttempt: (attempt: number) => `Попытка повтора ${attempt}`,
    started: (value: string) => `Старт ${value}`,
    completed: (value: string) => `Завершён ${value}`,
    inputData: 'Входные данные',
    outputData: 'Выходные данные',
    noStepLogsTitle: 'Логов шагов пока нет',
    noStepLogsDescription:
      'Логи шагов появятся здесь, когда worker запишет входные и выходные данные действия.',
  },
  loginPage: {
    brandTitle: 'Mini-Zapier',
    subtitle: 'Войдите, чтобы продолжить',
    email: 'Email',
    password: 'Пароль',
    signIn: 'Войти',
    signingIn: 'Вход...',
    registerPrompt: 'Нужен аккаунт?',
    registerAction: 'Зарегистрироваться',
  },
  registerPage: {
    brandTitle: 'Mini-Zapier',
    subtitle: 'Создайте аккаунт, чтобы работать в общем workspace',
    email: 'Email',
    password: 'Пароль',
    passwordHint: 'Используйте не меньше 8 символов.',
    createAccount: 'Создать аккаунт',
    creatingAccount: 'Создание аккаунта...',
    loginPrompt: 'Уже есть аккаунт?',
    loginAction: 'Войти',
  },
  notFoundPage: {
    eyebrow: '404',
    title: 'Маршрут не найден',
    description: 'Страница, которую вы ищете, не существует.',
    action: 'Вернуться к панели',
  },
  workflowEditorPage: {
    workflowName: 'Название сценария',
    untitledWorkflow: 'Новый сценарий',
    unsaved: 'Не сохранён',
    saving: 'Сохранение...',
    saveFirst: 'Сначала сохраните сценарий',
    updating: 'Обновление...',
    running: 'Запуск...',
    loadingTitle: 'Загрузка редактора...',
    loadingDescription: 'Сохранённый граф сценария загружается в редактор.',
    workflowCreatedToast: 'Сценарий создан.',
    workflowSavedToast: (version: number) =>
      `Сценарий сохранён. Версия ${version}.`,
    statusUpdatedToast: (status: string) => `Статус сценария: ${status}.`,
    executionStartedToast: 'Запуск создан.',
  },
  configPanel: {
    inspectorSteps: [
      {
        step: '1',
        title: 'Добавьте или выберите узел',
        description: 'Содержимое инспектора зависит от выбранного узла на canvas.',
      },
      {
        step: '2',
        title: 'Настройте его параметры',
        description: 'Формы для выбранного триггера или действия открываются здесь.',
      },
      {
        step: '3',
        title: 'При необходимости привяжите подключение',
        description:
          'Для узлов с секретами здесь же доступны controls подключения.',
      },
    ],
    noFormAvailable: 'Для этого типа узла нет формы настройки.',
    emptyEyebrow: 'Панель конфигурации',
    emptyTitle: 'Инспектор ждёт выбранный узел',
    emptyDescription:
      'Выберите триггер или действие на canvas, чтобы настроить его здесь.',
    workspaceGuidanceEyebrow: 'Подсказки по workspace',
    whatShowsUpTitle: 'Что показывается здесь',
    whatShowsUpDescription:
      'Селекторы подключений для узлов с credentials, настройки выбранного узла и удаление шага.',
    panelEyebrow: 'Панель конфигурации',
    defaultSelectedDescription: 'Настройте выбранный узел.',
    nodeTypeEyebrow: 'Тип узла',
    connectionEyebrow: 'Подключение',
    connectionRequired: (connectionType: string) =>
      `Требуется подключение ${connectionType}`,
    noConnectionRequired: 'Подключение не требуется',
    connectionSectionDescription: (connectionType: string) =>
      `Привяжите подключение ${connectionType}, которое использует этот узел.`,
    connectionNotSelected: 'Не выбрано',
    noConnectionsInline: 'Нет доступных',
    availableConnectionsCount: (count: number) =>
      `Доступно: ${formatCount('ru-RU', count)}`,
    selectedConnectionSummary: (name: string) => `Выбрано: ${name}`,
    availableConnections: 'Доступные подключения',
    selectConnection: (connectionType: string) =>
      `Выберите подключение ${connectionType}`,
    requiredType: (connectionType: string) =>
      `Требуемый тип: ${connectionType}.`,
    createConnection: 'Создать подключение',
    refreshConnections: 'Обновить подключения',
    noConnectionsTitle: (connectionType: string) =>
      `Нет подключений ${connectionType}`,
    noConnectionsDescription: (connectionType: string) =>
      `Подключение ${connectionType} пока не создано. Создайте его здесь, чтобы не выходить из интерфейса.`,
    noConnectionNeeded: 'Этому узлу подключение не требуется.',
    nodeSettingsEyebrow: 'Настройки узла',
    nodeSettingsDescription:
      'Настройте, как этот шаг ведёт себя внутри цепочки сценария.',
    loadingConnectionsTitle: 'Загрузка подключений...',
    loadingConnectionsDescription: 'Список подключений загружается.',
    deleteNode: 'Удалить узел',
    deleteNodeDialogTitle: 'Удалить выбранный узел?',
    deleteNodeDialogDescription: (label: string) =>
      `Убрать "${label}" с canvas и удалить связанные рёбра?`,
    deleteNodeDialogConfirm: 'Удалить узел',
    connectionCreatedToast: (name: string) => `Подключение "${name}" создано.`,
    nodeDeletedToast: (label: string) => `Узел "${label}" удалён.`,
  },
  connectionsPage: {
    eyebrow: 'Библиотека подключений',
    title: 'Храните переиспользуемые секреты и доступы в одном месте.',
    description:
      'Управляйте Telegram, SMTP, PostgreSQL и webhook-подключениями отдельно от сценариев, а затем выбирайте их в редакторе.',
    createConnection: 'Создать подключение',
    refresh: 'Обновить список',
    refreshing: 'Обновление...',
    totalConnections: (count: number) =>
      `Подключений сохранено: ${formatCount('ru-RU', count)}`,
    reuseHint:
      'Подключения, созданные здесь, появляются в инспекторе узлов и переиспользуются в нескольких сценариях.',
    loadingTitle: 'Загрузка подключений...',
    loadingDescription: 'Получаем сохранённые подключения из API.',
    emptyTitle: 'Подключений пока нет',
    emptyDescription:
      'Создайте первое переиспользуемое подключение, чтобы потом выбирать его в узлах сценария вместо повторного ввода секретов.',
    sectionEyebrow: 'Тип подключения',
    typeDescriptions: {
      WEBHOOK:
        'Секреты для webhook-триггеров и подписи входящих email лежат здесь и переиспользуются в trigger-узлах.',
      SMTP:
        'SMTP-хосты, порты и почтовые credentials для действий отправки email.',
      TELEGRAM:
        'Токены Telegram-ботов, которые можно переиспользовать в уведомлениях.',
      POSTGRESQL:
        'Строки подключения к PostgreSQL для параметризованных SQL-действий.',
    },
    noConnectionsForTypeTitle: (typeLabel: string) =>
      `Подключений ${typeLabel} пока нет`,
    noConnectionsForTypeDescription: (typeLabel: string) =>
      `Создайте подключение ${typeLabel} один раз и потом переиспользуйте его в сценариях вместо повторного ввода одних и тех же секретов.`,
    storedKeysLabel: 'Сохранённые поля',
    storedKeysCount: (count: number) =>
      `Полей сохранено: ${formatCount('ru-RU', count)}`,
    updatedLabel: 'Обновлён',
    editConnection: 'Редактировать',
    deleteConnection: 'Удалить',
    dialogEyebrow: 'Библиотека подключений',
    createDialogTitle: (typeLabel: string) => `Создать подключение ${typeLabel}`,
    createDialogDescription: (typeLabel: string) =>
      `Сохраните переиспользуемое подключение ${typeLabel}, которое потом можно выбрать в узлах сценария.`,
    editDialogTitle: (name: string) => `Редактировать ${name}`,
    editDialogDescription: (typeLabel: string) =>
      `Переименуйте подключение ${typeLabel} или полностью замените набор credentials. Сохранённые секреты повторно не показываются.`,
    selectType: 'Тип подключения',
    suggestedKeys: 'Рекомендуемые поля',
    webhookHint:
      'Используйте `secret` для webhook-триггеров или `signingSecret` для inbound-email провайдеров. При необходимости можно задать и свой набор ключей.',
    keepCredentialsHint:
      'Оставьте значения пустыми, чтобы сохранить текущие секреты. Если меняете любой ключ или значение, заново введите весь набор credentials.',
    replaceCredentialsError:
      'При создании или полной замене credentials нужно заполнить значение для каждого поля.',
    valuePlaceholderEdit: 'Введите новое значение',
    updateConnection: 'Сохранить изменения',
    connectionCreatedToast: (name: string) => `Подключение "${name}" создано.`,
    connectionUpdatedToast: (name: string) => `Подключение "${name}" обновлено.`,
    connectionDeletedToast: (name: string) => `Подключение "${name}" удалено.`,
    deleteDialogTitle: 'Удалить подключение?',
    deleteDialogDescription: (name: string) =>
      `Удалить подключение "${name}"? API заблокирует удаление, если оно всё ещё используется узлом сценария.`,
    deleteDialogConfirm: 'Удалить подключение',
  },
  connectionCreateDialog: {
    cancel: 'Отмена',
    creating: 'Создание...',
    createConnection: 'Создать подключение',
    description: (connectionType: string) =>
      `Объект credentials будет отправлен как есть в текущий Connection API для типа ${connectionType}.`,
    eyebrow: 'Подключение',
    title: (connectionType: string) => `Создать подключение ${connectionType}`,
    connectionName: 'Название подключения',
    connectionPlaceholder: (connectionType: string) =>
      `${connectionType} подключение`,
    credentials: 'Credentials',
    addField: 'Добавить поле',
    fieldPlaceholder: 'Поле',
    valuePlaceholder: 'Значение',
    fieldKeyAriaLabel: (index: number) => `Ключ поля подключения ${index}`,
    fieldValueAriaLabel: (index: number) =>
      `Значение поля подключения ${index}`,
    remove: 'Удалить',
    connectionNameRequired: 'Название подключения обязательно.',
    credentialsRequired: 'Добавьте хотя бы одно поле credentials.',
  },
  fieldPicker: {
    insertField: '+ Вставить поле',
    insertFieldReference: 'Вставить ссылку на поле',
    loading: 'Загрузка…',
    saveWorkflowToUpdate: 'Сохраните сценарий, чтобы обновить доступные поля.',
    incompatibleExecutions:
      'После сохранения снова запустите сценарий, чтобы обновить доступные поля.',
    noFieldsFromRun:
      'Запустите сценарий ещё раз с примером данных, чтобы собрать доступные поля.',
    runAtLeastOnce: 'Запустите сценарий хотя бы один раз, чтобы увидеть поля.',
    versionMismatch: (sourceVersion: number, currentVersion: number | null) =>
      `Поля из v${sourceVersion}, текущая v${currentVersion ?? '—'}`,
    noFieldsForPosition: 'Для этой позиции доступных полей нет.',
    typeObject: 'obj',
    typeArray: 'arr',
    typeString: 'str',
    typeNumber: 'num',
    typeBoolean: 'bool',
    typeNull: 'null',
  },
  flowCanvas: {
    steps: [
      {
        step: '1',
        title: 'Сначала выберите один триггер',
        description:
          'Webhook, Cron или Email становится стартовой точкой сценария.',
      },
      {
        step: '2',
        title: 'Перетащите его на canvas',
        description:
          'Canvas — это рабочая поверхность, где собирается линейная цепочка.',
      },
      {
        step: '3',
        title: 'Затем добавьте действия',
        description:
          'Поставьте действия после триггера и настройте выбранный узел в правой панели.',
      },
    ],
    duplicateTrigger: 'В одном сценарии может быть только один триггер.',
    eyebrow: 'Canvas сценария',
    emptyTitle: 'Начните с одного триггера',
    workspaceTitle: 'Рабочая область canvas',
    stepCounter: (triggerCount: number, actionCount: number) =>
      `${formatCount('ru-RU', triggerCount)} ${pluralizeRu(
        triggerCount,
        'триггер',
        'триггера',
        'триггеров',
      )} / ${formatCount('ru-RU', actionCount)} ${pluralizeRu(
        actionCount,
        'действие',
        'действия',
        'действий',
      )}`,
    stepCounterEmpty: 'Шаг 1: триггер',
    emptyDescription:
      'Перетащите триггер из библиотеки слева, чтобы заякорить сценарий. После этого добавьте действия, которые продолжают цепочку.',
    workspaceDescription:
      'Держите flow линейным: сначала триггер, затем действия. Выберите узел, чтобы настроить его в инспекторе справа.',
    inspectorEyebrow: 'Инспектор',
    editing: (label: string) => `Редактирование: ${label}`,
    noNodeSelected: 'Узел не выбран',
    inspectorSelectedDescription:
      'Параметры выбранного шага можно настроить в правой панели.',
    inspectorEmptyDescription:
      'Выберите узел на canvas, чтобы открыть его настройки и подключения.',
    dropSpecific: (label: string) => `Отпустите, чтобы разместить ${label}.`,
    dropGeneric: 'Отпустите, чтобы разместить узел на canvas.',
    emptyEditorEyebrow: 'Пустой редактор',
    emptyEditorTitle: 'Собирайте сценарий слева направо',
    emptyEditorDescription:
      'Первый шаг всегда триггер. Перетащите его из библиотеки слева, затем продолжите цепочку действиями и настройте выбранный узел в инспекторе.',
    dropZoneEyebrow: 'Зона размещения',
    dropZoneTitleActive: 'Отпустите, чтобы разместить узел',
    dropZoneTitleIdle: 'Это и есть рабочая поверхность',
    dropZoneDescriptionActive:
      'Отпустите узел в любом месте. После размещения его можно переместить.',
    dropZoneDescriptionIdle:
      'Перетаскивайте узлы из левой панели сюда. Подключения и выбор узлов работают как раньше.',
    triggerCardTitle: 'Триггер запускает сценарий',
    triggerCardDescription: 'Выберите ровно один стартовый узел.',
    actionCardTitle: 'Действия продолжают цепочку',
    actionCardDescription: 'Добавляйте следующие шаги после триггера.',
    needsTrigger:
      'Этому canvas всё ещё нужен триггер. Добавьте его из библиотеки слева, чтобы у сценария был валидный старт.',
    needsFirstAction:
      'Триггер уже на месте. Теперь добавьте действие из левой панели и соедините его, чтобы продолжить сценарий.',
  },
  nodeSidebar: {
    steps: [
      {
        step: '1',
        title: 'Добавьте один триггер',
        description:
          'Выберите, как начинается сценарий: webhook, cron или inbound email.',
      },
      {
        step: '2',
        title: 'После него выстройте действия',
        description:
          'Добавьте следующие шаги, которые выполняются по порядку после триггера.',
      },
    ],
    eyebrow: 'Библиотека узлов',
    title: 'Начните с триггера',
    description:
      'Левая панель — это ваш toolbox. Сначала добавьте триггер, затем действия для остальной части сценария.',
    sectionMeta: {
      Triggers: {
        title: 'Стартовые узлы',
        description: 'Выберите ровно один узел, который запускает сценарий.',
        badge: 'Шаг 1',
      },
      Actions: {
        title: 'Следующие шаги',
        description: 'Добавляйте действия, которые продолжают цепочку после триггера.',
        badge: 'Шаг 2',
      },
    },
    flowOrderLabel: 'Порядок сборки',
    showFlowHint: 'Показать',
    hideFlowHint: 'Скрыть',
    dragHint: 'Тянуть',
    startsWorkflow: 'Запускает сценарий',
    runsAfterTrigger: 'Выполняется после триггера',
  },
  configForms: {
    cron: {
      label: 'Cron-выражение',
      placeholder: '*/5 * * * *',
      help: 'Сохраняется как есть и валидируется API при сохранении.',
      scheduleLabel: 'Расписание',
      presetEveryMinute: 'Каждую минуту',
      presetEveryHour: 'Каждый час',
      presetEveryDay: 'Каждый день',
      presetEveryWeek: 'Каждую неделю',
      presetCustom: 'Своё',
      timeLabel: 'Время',
      daysLabel: 'Дни недели',
      dayMon: 'Пн',
      dayTue: 'Вт',
      dayWed: 'Ср',
      dayThu: 'Чт',
      dayFri: 'Пт',
      daySat: 'Сб',
      daySun: 'Вс',
      editAsCode: 'Редактировать как код',
      editVisually: 'Редактировать визуально',
      nextRun: 'Следующий запуск',
      nextRunUnknown: 'Не удалось вычислить следующий запуск',
      timezoneNote: (tz: string) => `Часовой пояс: ${tz}`,
    },
    dataTransform: {
      mode: 'Режим',
      modeAriaLabel: 'Режим Data Transform',
      templateMode: 'Шаблон',
      mappingMode: 'Маппинг',
      template: 'Шаблон',
      templateAriaLabel: 'Шаблон Data Transform',
      templatePlaceholder: '{"name":"{{input.name}}"}',
      mapping: 'Маппинг',
      addField: 'Добавить поле',
      keyPlaceholder: 'ключ',
      valuePlaceholder: 'значение',
      mappingKeyAriaLabel: (index: number) => `Ключ маппинга ${index}`,
      mappingValueAriaLabel: (index: number) =>
        `Значение маппинга ${index}`,
      removeMappingRowAriaLabel: (index: number) =>
        `Удалить строку маппинга ${index}`,
      remove: 'Удалить',
    },
    dbQuery: {
      query: 'SQL-запрос',
      queryPlaceholder: 'select * from orders where id = $1',
      params: 'Параметры',
      paramsPlaceholder: '["{{input.id}}"]',
      help:
        'Укажите JSON-массив. Template strings будут разрешены worker-ом.',
      jsonArrayError: 'Params должны быть JSON-массивом.',
      validJsonError: 'Params должны быть валидным JSON.',
    },
    emailAction: {
      to: 'Кому',
      toPlaceholder: 'ops@example.com',
      subject: 'Тема',
      subjectPlaceholder: 'Новый заказ {{input.id}}',
      body: 'Текст',
      bodyPlaceholder: 'Здравствуйте, {{input.customerName}}',
    },
    emailTrigger: {
      info:
        'Настройте провайдера входящей почты так, чтобы он отправлял raw email data POST-запросом на endpoint ниже. Выбранное подключение WEBHOOK даёт signing secret для `/api/inbound-email/:workflowId`.',
      urlLabel: 'URL входящей почты',
      saveWorkflowPlaceholder:
        'Сохраните сценарий, чтобы сгенерировать /api/inbound-email/:workflowId',
    },
    httpRequest: {
      url: 'URL',
      urlAriaLabel: 'URL HTTP Request',
      urlPlaceholder: 'https://example.com/orders/{{input.id}}',
      method: 'Метод',
      methodAriaLabel: 'Метод HTTP Request',
      headers: 'Заголовки',
      addHeader: 'Добавить заголовок',
      headerNamePlaceholder: 'имя заголовка',
      headerValuePlaceholder: 'значение заголовка',
      headerKeyAriaLabel: (index: number) => `Имя заголовка ${index}`,
      headerValueAriaLabel: (index: number) => `Значение заголовка ${index}`,
      removeHeaderRowAriaLabel: (index: number) =>
        `Удалить заголовок ${index}`,
      body: 'Body',
      bodyAriaLabel: 'Тело HTTP Request',
      bodyPlaceholder: '{"orderId":"{{input.id}}"}',
      remove: 'Удалить',
    },
    telegram: {
      chatId: 'Chat ID',
      chatIdPlaceholder: '-1001234567890',
      message: 'Сообщение',
      messagePlaceholder: 'Заказ {{input.id}} готов.',
    },
    templatedInput: {
      editAsCode: 'Редактировать как код',
      visualMode: 'Визуальный режим',
      fieldPath: 'Путь поля',
      replaceField: 'Заменить',
      deleteField: 'Удалить',
    },
    webhook: {
      urlLabel: 'Webhook URL',
      saveWorkflowPlaceholder:
        'Сохраните сценарий, чтобы сгенерировать webhook URL',
      copyUrl: 'Копировать URL',
      copyCurl: 'Копировать curl',
      copied: 'Скопировано!',
      copyFailed: 'Не удалось скопировать, проверьте разрешения браузера.',
      info:
        'Входящие запросы используют этот endpoint. Если привязано подключение WEBHOOK, отправитель также должен передавать заголовок `X-Webhook-Secret`.',
      dedupe:
        'Чтобы включить дедупликацию, добавьте заголовок `Idempotency-Key` или `X-Event-ID`. Повторные события будут проигнорированы.',
    },
  },
  editorDefinitions: {
    'trigger:WEBHOOK': {
      label: 'Webhook',
      description: 'Принимает JSON через публичный webhook endpoint.',
    },
    'trigger:CRON': {
      label: 'Cron',
      description: 'Запускает сценарий по расписанию.',
    },
    'trigger:EMAIL': {
      label: 'Email Trigger',
      description: 'Принимает payload входящих писем от provider webhook.',
    },
    'action:HTTP_REQUEST': {
      label: 'HTTP Request',
      description: 'Вызывает HTTP endpoint с шаблонизированными входными данными.',
    },
    'action:EMAIL': {
      label: 'Email',
      description: 'Отправляет email через SMTP-подключение.',
    },
    'action:TELEGRAM': {
      label: 'Telegram',
      description: 'Отправляет сообщение в Telegram с шаблонизированным контентом.',
    },
    'action:DB_QUERY': {
      label: 'PostgreSQL Query',
      description: 'Выполняет параметризованный PostgreSQL-запрос.',
    },
    'action:DATA_TRANSFORM': {
      label: 'Data Transform',
      description: 'Интерполирует шаблоны или собирает mapped payload.',
    },
  },
  editorNodes: {
    triggerBadge: 'Триггер',
    actionBadge: 'Действие',
    fallbackTriggerDescription: 'Узел триггера сценария.',
    fallbackActionDescription: 'Узел действия сценария.',
  },
  confirmationDialog: {
    eyebrow: 'Подтверждение',
    cancel: 'Отмена',
    working: 'Выполняется...',
    destructiveNote: 'Это действие необратимо и требует явного подтверждения.',
  },
  loadingState: {
    title: 'Загрузка...',
    description: 'Подождите, пока загрузятся актуальные данные.',
  },
  errorBoundary: {
    eyebrow: 'Ошибка интерфейса',
    title: 'Интерфейс столкнулся с неожиданной ошибкой рендера.',
    reload: 'Перезагрузить приложение',
    fallbackMessage: 'Неожиданная ошибка фронтенда.',
  },
  errors: {
    unexpectedFrontendError: 'Неожиданная ошибка фронтенда.',
    apiRequestFailed: 'API-запрос завершился ошибкой.',
  },
  workflowValidation: {
    MISSING_NODE_REFERENCE:
      'В сценарии есть рёбра, которые ссылаются на отсутствующие узлы.',
    SELF_REFERENCING_EDGE:
      'Сценарий не должен содержать рёбра, ссылающиеся на тот же узел.',
    DUPLICATE_EDGES: 'Сценарий не должен содержать дублирующиеся рёбра.',
    NO_TRIGGER: 'В сценарии должен быть триггер.',
    MULTIPLE_TRIGGERS: 'В сценарии должен быть ровно один триггер.',
    INVALID_TRIGGER_OUTGOING:
      'У триггера должно быть ровно одно исходящее ребро.',
    NO_EDGES:
      'Узлы не соединены. Перетащите связь от одного handle к другому, чтобы создать рёбра.',
    INVALID_ACTION_DEGREE:
      'У каждого действия может быть не более одного входящего и одного исходящего ребра.',
    NO_ACTIONS:
      'Сценарий должен содержать хотя бы одно действие, подключённое к триггеру.',
    INVALID_TERMINAL_ACTIONS:
      'В сценарии должен быть ровно один терминальный action-узел.',
    CYCLE: 'Сценарий не должен содержать циклы.',
    DISCONNECTED_NODES:
      'Соедините все узлы в одну цепочку, которая начинается от триггера.',
  } as Record<WorkflowValidationCode, string>,
} satisfies LocaleMessages;

