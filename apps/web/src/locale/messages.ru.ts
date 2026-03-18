import type { LocaleMessages } from './messages.en';
import type {
  EditorConnectionRejectionCode,
  WorkflowValidationCode,
} from '../stores/workflow-editor.store';

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
    deleteDialogPendingTitle: 'Удаление сценария...',
    deleteDialogPendingLabel: 'Удаление сценария...',
    deleteDialogPendingDescription: (name: string) =>
      `Удаляем сценарий "${name}". Диалог закроется, когда API подтвердит удаление.`,
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
    notSavedYet: 'Ещё не сохранён',
    unsavedChanges: 'Есть несохранённые изменения',
    noUnsavedChanges: 'Все изменения сохранены',
    unsavedChangesConfirm:
      'Отменить несохранённые изменения и покинуть редактор?',
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
    noFormAvailable: 'Для этого типа узла нет формы настройки.',
    emptyEyebrow: 'Настройка шага',
    emptyTitle: 'Выберите шаг на схеме',
    emptyDescription:
      'Выберите шаг на canvas, чтобы справа открыть его подключение, основные поля и проверку.',
    connectionEyebrow: 'Подключение',
    headerConnectionRequired: (connectionType: string) =>
      `Сначала выберите подключение ${connectionType}.`,
    headerSaveToTest: 'Сохраните сценарий перед тестом.',
    headerLastTestSuccess: 'Последний тест прошёл.',
    headerLastTestFailed: 'Последний тест не прошёл.',
    headerConnectionSelected: (name: string) => `Подключение: ${name}.`,
    headerConnectionSelectedFallback: 'Подключение выбрано.',
    headerMainFields: 'Основные поля ниже.',
    selectConnection: (connectionType: string) =>
      `Выберите подключение ${connectionType}`,
    createConnection: 'Создать новое',
    refreshConnections: 'Обновить список',
    noConnectionsDescription: (connectionType: string) =>
      `Подключений ${connectionType} пока нет. Создайте новое, чтобы выбрать его здесь.`,
    nodeSettingsEyebrow: 'Основное',
    loadingConnectionsDescription: 'Загружаем сохранённые подключения.',
    deleteNode: 'Удалить шаг',
    deleteNodeDialogTitle: 'Удалить выбранный шаг?',
    deleteNodeDialogDescription: (label: string) =>
      `Убрать "${label}" с canvas и удалить связанные рёбра?`,
    deleteNodeDialogConfirm: 'Удалить шаг',
    connectionCreatedToast: (name: string) => `Подключение "${name}" создано.`,
    nodeDeletedToast: (label: string) => `Шаг "${label}" удалён.`,
  },
  stepTest: {
    sectionEyebrow: 'Тест шага с входными данными',
    sectionDescription: 'Запустите шаг на примере JSON.',
    testButton: 'Запустить тест',
    testRunning: 'Выполняется...',
    testButtonSaveFirst:
      'Сохраните сценарий, чтобы включить этот тест.',
    testButtonChooseConnectionFirst: 'Сначала выберите подключение.',
    connectionRequiredSummary:
      'Сначала выберите подключение, чтобы открыть тест.',
    testButtonUnsupported: 'Проверка пока недоступна в этой версии сервиса.',
    inputDataLabel: 'Входные данные (JSON)',
    inputDataPlaceholder: '{}',
    inputDataFromPrevious: 'Мы подставили результат предыдущего шага.',
    invalidJson: 'Невалидный JSON.',
    successStatus: 'Успешно',
    failedStatus: 'Ошибка',
    lastResultSuccess: 'Последний тест прошёл.',
    lastResultFailed: 'Последний тест не прошёл.',
    duration: (ms: number) => `${ms}мс`,
    outputDataLabel: 'Результат',
    fieldsUpdated: 'Доступные поля обновлены для следующих шагов.',
    expandInput: 'Показать входные данные',
    collapseInput: 'Скрыть входные данные',
    expandOutput: 'Показать результат',
    collapseOutput: 'Скрыть результат',
    openSection: 'Показать тест',
    closeSection: 'Скрыть тест',
    unsupported:
      'Проверка пока недоступна в этой версии сервиса. Обновите backend или выполните сценарий обычным запуском.',
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
    updatingConnection: 'Обновление...',
    connectionCreatedToast: (name: string) => `Подключение "${name}" создано.`,
    connectionUpdatedToast: (name: string) => `Подключение "${name}" обновлено.`,
    connectionDeletedToast: (name: string) => `Подключение "${name}" удалено.`,
    deleteDialogTitle: 'Удалить подключение?',
    deleteDialogDescription: (name: string) =>
      `Удалить подключение "${name}"? API заблокирует удаление, если оно всё ещё используется узлом сценария.`,
    deleteDialogConfirm: 'Удалить подключение',
    deleteDialogPendingTitle: 'Удаление подключения...',
    deleteDialogPendingLabel: 'Удаление подключения...',
    deleteDialogPendingDescription: (name: string) =>
      `Удаляем подключение "${name}". Если оно ещё используется в сценарии, API вернёт ошибку и ничего не удалит.`,
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
    insertField: '+ Подставить данные',
    insertFieldReference: 'Подставить данные из шага',
    loading: 'Загрузка…',
    loadError: (message: string) => `Не удалось загрузить доступные поля: ${message}`,
    retry: 'Повторить',
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
    connectionRejected: {
      INVALID_SOURCE:
        'Связь отклонена: исходный шаг невалиден или больше не существует.',
      INVALID_TARGET:
        'Связь отклонена: целевой шаг невалиден или больше не существует.',
      INVALID_DIRECTION:
        'Связь отклонена: связь должна заканчиваться на action-узле, а не на триггере.',
      DUPLICATE_EDGE:
        'Связь отклонена: эти два шага уже соединены.',
      SECOND_OUTGOING:
        'Связь отклонена: у этого шага уже есть исходящее ребро.',
      SECOND_INCOMING:
        'Связь отклонена: у этого шага уже есть входящее ребро.',
      CYCLE_RISK:
        'Связь отклонена: эта связь создаст цикл в сценарии.',
    } as Record<EditorConnectionRejectionCode, string>,
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
      mainEyebrow: 'Расписание',
      mainDescription: 'Выберите, когда этот сценарий должен запускаться.',
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
      customHint:
        'Сейчас этот сценарий работает по своему cron-выражению. Продолжайте редактировать его в разделе дополнительно.',
      editAsCode: 'Редактировать как код',
      editVisually: 'Редактировать визуально',
      nextRunEyebrow: 'Следующий запуск',
      nextRunDescription:
        'Предпросмотр строится по текущему cron и часовому поясу сценария.',
      nextRun: 'Следующий запуск',
      nextRunUnknown: 'Не удалось вычислить следующий запуск',
      timezoneNote: (tz: string) => `Часовой пояс: ${tz}`,
      advancedEyebrow: 'Дополнительно',
      advancedDescription:
        'Нужно raw cron-выражение? Правьте его здесь.',
      advancedDescriptionCustom:
        'Это расписание сейчас управляется raw cron-выражением. Продолжайте редактировать его здесь.',
      showAdvanced: 'Открыть дополнительно',
      hideAdvanced: 'Скрыть дополнительно',
    },
    dataTransform: {
      mainEyebrow: 'Результат',
      mainDescription: 'Выберите, как этот шаг должен собрать результат.',
      mode: 'Как собрать результат',
      modeAriaLabel: 'Режим Data Transform',
      templateMode: 'Один шаблон',
      mappingMode: 'По полям',
      template: 'Шаблон результата',
      templateAriaLabel: 'Шаблон Data Transform',
      templatePlaceholder: '{"name":"{{input.name}}"}',
      mapping: 'Поля результата',
      addField: 'Добавить поле',
      keyPlaceholder: 'название поля',
      valuePlaceholder: 'значение',
      mappingKeyAriaLabel: (index: number) => `Ключ маппинга ${index}`,
      mappingValueAriaLabel: (index: number) =>
        `Значение маппинга ${index}`,
      removeMappingRowAriaLabel: (index: number) =>
        `Удалить строку маппинга ${index}`,
      remove: 'Удалить',
      templateModeHint:
        'Соберите весь результат одним шаблоном.',
      mappingModeHint:
        'Соберите объект по одному полю за раз.',
      advancedEyebrow: 'Дополнительно',
      advancedDescription:
        'Ручной JSON остаётся здесь, когда визуальной настройки недостаточно.',
      showAdvanced: 'Открыть дополнительно',
      hideAdvanced: 'Скрыть дополнительно',
      showJson: 'Открыть JSON шага',
      hideJson: 'Скрыть JSON шага',
    },
    dbQuery: {
      modeLabel: 'Режим',
      query: 'SQL-запрос',
      queryPlaceholder: 'select * from orders where id = $1',
      params: 'Параметры запроса',
      paramsPlaceholder: '["{{input.id}}"]',
      help:
        'Укажите JSON-массив параметров. Шаблоны вида {{input...}} подставятся при выполнении.',
      jsonArrayError: 'Параметры должны быть JSON-массивом.',
      validJsonError: 'Параметры должны быть валидным JSON.',
      modeVisual: 'Конструктор',
      modeVisualHint:
        'Выберите таблицу и нужные поля, а SQL соберём автоматически.',
      modeRawSql: 'SQL',
      modeRawSqlHint:
        'Используйте для сложных запросов или когда удобнее работать напрямую с SQL.',
      operationLabel: 'Что сделать',
      selectTable: 'Таблица',
      selectTablePlaceholder: 'Выберите таблицу',
      loadingTables: 'Загрузка таблиц\u2026',
      noTables: 'Не удалось загрузить доступные таблицы или представления.',
      sourceCount: (count: number) =>
        `Доступно: ${count}`,
      columns: 'Поля',
      allColumns: 'Все колонки',
      loadingColumns: 'Загрузка колонок\u2026',
      filters: 'Фильтры',
      addFilter: 'Добавить фильтр',
      removeFilterAriaLabel: 'Удалить фильтр',
      operatorEquals: '=',
      operatorNotEquals: '\u2260',
      operatorGreaterThan: '>',
      operatorLessThan: '<',
      operatorLike: 'LIKE',
      operatorIsNull: 'IS NULL',
      operatorIsNotNull: 'IS NOT NULL',
      filterValuePlaceholder: 'Значение фильтра',
      orderBy: 'Сортировка',
      orderAsc: 'ASC',
      orderDesc: 'DESC',
      limit: 'Лимит',
      sqlPreview: 'Предпросмотр SQL',
      testButton: 'Проверить SQL',
      testRunning: 'Выполняется\u2026',
      testResult: 'Результат',
      testRowCount: (count: number) => `${count} строк(а) возвращено`,
      testError: 'Проверка не прошла',
      selectConnectionHint:
        'Выберите PostgreSQL-подключение, чтобы открыть конструктор.',
      showJson: 'Открыть JSON',
      hideJson: 'Скрыть JSON шага',
      advancedEyebrow: 'Дополнительно',
      advancedDescription:
        'Нужен ручной контроль? Raw SQL, параметры и полный JSON шага находятся здесь.',
      advancedDescriptionRaw:
        'Этот шаг сейчас выполняется из raw SQL. Продолжайте редактировать его здесь.',
      showAdvanced: 'Открыть дополнительно',
      hideAdvanced: 'Скрыть дополнительно',
      introspectionError: 'Не удалось загрузить список таблиц и колонок.',
      metadataUnavailable:
        'В этой версии сервиса визуальная работа с PostgreSQL пока недоступна. Можно написать SQL самостоятельно.',
      testUnavailable:
        'В этой версии сервиса проверка SQL из редактора пока недоступна. Можно выполнить сценарий обычным запуском.',
      switchToRawSql: 'Перейти на raw SQL',
      rawEditingHint:
        'Если начнёте править поля ниже, этот шаг перейдёт с визуального конструктора на ручной SQL.',
      rawPathEyebrow: 'Ручной SQL',
      rawPathTitle: 'Этот шаг сейчас работает через raw SQL.',
      rawPathDescription:
        'Ниже можно продолжать редактировать SQL и параметры. Визуальная сборка остаётся необязательной.',
      opSelect: 'Прочитать',
      opInsert: 'Добавить',
      opUpdate: 'Изменить',
      opDelete: 'Удалить',
      setValues: 'Значения',
      addSetValue: 'Добавить поле',
      removeSetValueAriaLabel: 'Удалить значение',
      setValueColumn: 'Поле',
      setValuePlaceholder: 'Значение',
      testMutationResult: (count: number) =>
        `${count} строк(а) будет затронуто, затем откатим изменения`,
      deleteNoFilterWarning: 'DELETE без фильтра затронет все строки.',
      updateNoFilterWarning: 'UPDATE без фильтра затронет все строки.',
    },
    emailAction: {
      mainEyebrow: 'Сообщение',
      mainDescription: 'Укажите получателя, тему и текст письма.',
      to: 'Кому',
      toPlaceholder: 'ops@example.com',
      subject: 'Тема',
      subjectPlaceholder: 'Новый заказ {{input.id}}',
      body: 'Текст',
      bodyPlaceholder: 'Здравствуйте, {{input.customerName}}',
      previewEyebrow: 'Предпросмотр',
      previewDescription:
        'Проверьте письмо на данных из последнего теста или запуска.',
      advancedEyebrow: 'Дополнительно',
      advancedDescription:
        'Ручной JSON остаётся здесь, если нужно править весь шаг целиком.',
      showAdvanced: 'Открыть дополнительно',
      hideAdvanced: 'Скрыть дополнительно',
      showJson: 'Открыть JSON шага',
      hideJson: 'Скрыть JSON шага',
    },
    emailTrigger: {
      mainEyebrow: 'Адрес приёма',
      mainDescription:
        'Передайте этот адрес почтовому провайдеру, чтобы новые письма попадали в сценарий.',
      urlLabel: 'URL входящей почты',
      saveWorkflowPlaceholder:
        'Сохраните сценарий, чтобы получить адрес для входящих писем',
      helpEyebrow: 'Подсказка по провайдеру',
      providerInfo:
        'Настройте почтовый сервис так, чтобы он отправлял входящее письмо POST-запросом на этот адрес.',
      signatureInfo:
        'Подключение WEBHOOK хранит signing secret, по которому проверяется подпись провайдера.',
    },
    httpRequest: {
      mainEyebrow: 'Запрос',
      mainDescription: 'Выберите метод, адрес и данные запроса.',
      url: 'URL',
      urlAriaLabel: 'URL HTTP Request',
      urlPlaceholder: 'https://example.com/orders/{{input.id}}',
      method: 'Метод',
      methodAriaLabel: 'Метод HTTP Request',
      headers: 'Заголовки',
      addHeader: 'Добавить заголовок',
      headerNamePlaceholder: 'название заголовка',
      headerValuePlaceholder: 'значение заголовка',
      headerKeyAriaLabel: (index: number) => `Имя заголовка ${index}`,
      headerValueAriaLabel: (index: number) => `Значение заголовка ${index}`,
      removeHeaderRowAriaLabel: (index: number) =>
        `Удалить заголовок ${index}`,
      body: 'Данные запроса',
      bodyAriaLabel: 'Тело HTTP Request',
      bodyPlaceholder: '{"orderId":"{{input.id}}"}',
      bodyKeyPlaceholder: 'название поля',
      bodyValuePlaceholder: 'значение',
      bodyKeyAriaLabel: (index: number) => `Ключ поля body ${index}`,
      bodyValueAriaLabel: (index: number) => `Значение поля body ${index}`,
      removeBodyRowAriaLabel: (index: number) =>
        `Удалить поле body ${index}`,
      addBodyField: 'Добавить поле',
      editBodyAsJson: 'JSON',
      editBodyAsFields: 'Поля',
      bodyFieldsHint: 'Соберите данные запроса по полям.',
      bodyJsonHint: 'Введите данные запроса как raw JSON.',
      bodyOptionalHint:
        'Оставьте пустым, если этот метод не должен отправлять body.',
      contentTypeHint:
        'Если Content-Type не задан, добавим application/json автоматически',
      advancedEyebrow: 'Дополнительно',
      advancedDescription:
        'Свои заголовки и ручной JSON шага находятся здесь.',
      showAdvanced: 'Открыть дополнительно',
      hideAdvanced: 'Скрыть дополнительно',
      showJson: 'Открыть JSON шага',
      hideJson: 'Скрыть JSON шага',
      showAdvancedHeaders: 'Открыть',
      hideAdvancedHeaders: 'Скрыть',
      headersCount: (count: number) => `${count} заголовк(а) настроено`,
      headersHint:
        'Обычно не нужны. Открывайте только если сервис требует свои заголовки.',
      remove: 'Удалить',
    },
    telegram: {
      mainEyebrow: 'Сообщение',
      mainDescription: 'Укажите чат и сообщение для отправки.',
      chatId: 'Chat ID',
      chatIdPlaceholder: '-1001234567890',
      chatIdHelper: 'Как узнать свой Chat ID',
      chatIdHelperHint:
        'Сначала нужен chat ID? Его можно получить через @userinfobot.',
      showChatIdHelp: 'Показать шаги',
      hideChatIdHelp: 'Скрыть шаги',
      chatIdHelperSteps:
        '1. Откройте Telegram и найдите @userinfobot\n2. Отправьте боту /start\n3. Бот ответит вашим Chat ID\n4. Вставьте его выше',
      message: 'Сообщение',
      messagePlaceholder: 'Заказ {{input.id}} готов.',
      previewEyebrow: 'Предпросмотр',
      previewDescription:
        'Проверьте сообщение на данных из последнего теста или запуска.',
      advancedEyebrow: 'Дополнительно',
      advancedDescription:
        'Ручной JSON остаётся здесь, если нужен полный config шага.',
      showAdvanced: 'Открыть дополнительно',
      hideAdvanced: 'Скрыть дополнительно',
      showJson: 'Открыть JSON шага',
      hideJson: 'Скрыть JSON шага',
    },
    rawJson: {
      mustBeObject: 'Должен быть JSON-объектом',
      invalidJson: 'Невалидный JSON',
      expertEyebrow: 'JSON шага',
      expertDescription:
        'Правьте весь config шага напрямую.',
    },
    templatedInput: {
      editAsCode: 'Ввести вручную',
      visualMode: 'Визуальный режим',
      fieldPath: 'Путь поля',
      replaceField: 'Заменить',
      deleteField: 'Удалить',
    },
    webhook: {
      mainEyebrow: 'Endpoint',
      mainDescription:
        'Используйте этот URL как публичную точку входа для входящих запросов.',
      urlLabel: 'Webhook URL',
      saveWorkflowPlaceholder:
        'Сохраните сценарий, чтобы сгенерировать webhook URL',
      copyUrl: 'Копировать URL',
      copyCurl: 'Копировать curl',
      copied: 'Скопировано!',
      copyFailed: 'Не удалось скопировать, проверьте разрешения браузера.',
      helpEyebrow: 'Безопасность и дедупликация',
      info:
        'Входящие запросы используют этот endpoint. Если привязано подключение WEBHOOK, отправитель также должен передавать заголовок `X-Webhook-Secret`.',
      dedupe:
        'Чтобы включить дедупликацию, добавьте заголовок `Idempotency-Key` или `X-Event-ID`. Повторные события будут проигнорированы.',
    },
    messagePreview: {
      toggle: 'Предпросмотр',
      loading: 'Загрузка данных для предпросмотра…',
      loadError: (message: string) => `Не удалось загрузить данные для предпросмотра: ${message}`,
      loadErrorFallback: 'Запрос данных для предпросмотра завершился ошибкой.',
      empty:
        'Запустите тест шага или выполните workflow, чтобы увидеть предпросмотр с реальными данными.',
      emptyTriggerAction:
        'Выполните workflow, чтобы увидеть предпросмотр (тест триггера недоступен).',
      stale: 'Workflow изменён с последнего выполнения — предпросмотр недоступен.',
      sourceTest: 'Данные из тестового запуска',
      sourceExecution: 'Данные из последнего выполнения',
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
      label: 'Входящее письмо',
      description:
        'Запускает сценарий, когда почтовый сервис присылает новое письмо.',
    },
    'action:HTTP_REQUEST': {
      label: 'HTTP-запрос',
      description: 'Отправляет запрос в другой сервис.',
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
      label: 'Запрос к PostgreSQL',
      description: 'Читает или изменяет данные в PostgreSQL.',
    },
    'action:DATA_TRANSFORM': {
      label: 'Преобразование данных',
      description:
        'Собирает новые данные из результата предыдущего шага.',
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
    pendingNote: 'Запрос уже выполняется. Закрытие временно недоступно.',
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
    missingApiRoute:
      'Текущий API deployment не поддерживает этот маршрут.',
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
