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
    open: 'Открыть',
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
    eyebrow: 'Оперативная панель',
    title: 'Контролируйте сценарии',
    description: 'Сначала проверьте проблемы, затем работайте со списком.',
    workflowCount: (count: number) =>
      `Сценарии: ${formatCount('ru-RU', count)}`,
    loadingSummary: 'Загружаем панель...',
    summaryUnavailable: 'Сводка недоступна',
    needsAttentionSummary: (count: number) =>
      `Внимание: ${formatCount('ru-RU', count)}`,
    allClearSummary: 'Срочных проблем нет',
    attentionLoading: 'Загружаем внимание...',
    attentionRefreshing: 'Обновляем внимание...',
    attentionEyebrow: 'Внимание',
    attentionTitle: 'Сначала разберите это',
    attentionItems: {
      failed: {
        label: 'Ошибки запусков',
        description: 'Последний запуск завершился ошибкой.',
      },
      paused: {
        label: 'На паузе',
        description: 'Остановлены и не принимают новые запуски.',
      },
      activeWithoutRuns: {
        label: 'Активны без запусков',
        description: 'Уже включены, но ещё не запускались.',
      },
      draft: {
        label: 'Черновики',
        description: 'Сохранены, но не активированы.',
      },
    },
    recentActivity: {
      eyebrow: 'Последняя активность',
      title: 'Последние запуски',
      loading: 'Загружаем последние запуски...',
      loadingTitle: 'Загрузка последних запусков...',
      loadingDescription: 'Получаем последние запуски из сводки панели.',
      refreshing: 'Обновляем последние запуски...',
      summary: (count: number, failures: number) =>
        failures > 0
          ? `${formatCount('ru-RU', failures)} ${pluralizeRu(
              failures,
              'ошибка',
              'ошибки',
              'ошибок',
            )} в ${formatCount('ru-RU', count)} ${pluralizeRu(
              count,
              'последнем запуске',
              'последних запусках',
              'последних запусках',
            )}`
          : `${formatCount('ru-RU', count)} ${pluralizeRu(
              count,
              'последний запуск',
              'последних запуска',
              'последних запусков',
            )}`,
      emptySummary: 'Запусков пока нет',
      emptyTitle: 'Последних запусков пока нет',
      emptyDescription: 'Запуски и ошибки появятся здесь после следующего выполнения.',
      emptyDescriptionNoWorkflows:
        'Создайте и запустите сценарий, чтобы заполнить этот блок.',
      openHistory: 'История',
      statusDescriptions: {
        PENDING: 'Запуск ждёт worker.',
        RUNNING: 'Сценарий выполняется.',
        SUCCESS: 'Запуск завершился успешно.',
        FAILED: 'Откройте историю и посмотрите последнюю ошибку.',
      },
    },
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
    eyebrow: 'Срез',
    title: 'Ключевые метрики',
    loading: 'Загрузка...',
    refreshing: 'Обновляем метрики...',
    pausedWorkflows: (count: number | null) =>
      `На паузе: ${
        count === null ? '—' : formatCount('ru-RU', count)
      }`,
    cards: {
      totalWorkflows: {
        label: 'Всего сценариев',
        description: 'Сохранены в текущем workspace.',
      },
      activeWorkflows: {
        label: 'Активные сценарии',
        description: 'Готовы принимать webhook, cron или email триггеры.',
      },
      totalExecutions: {
        label: 'Всего запусков',
        description: 'Ручные и автоматические запуски.',
      },
      successRate: {
        label: 'Успешность',
        description: 'Доля запусков без ошибки.',
      },
    },
  },
  workflowList: {
    eyebrow: 'Список сценариев',
    title: 'Рабочая очередь',
    refreshing: 'Обновляем сценарии...',
    filteredCount: (shown: number, total: number) =>
      `Показано ${formatCount('ru-RU', shown)} из ${formatCount('ru-RU', total)}`,
    loadedCount: (count: number) =>
      `${formatCount('ru-RU', count)} ${pluralizeRu(
        count,
        'сценарий загружен',
        'сценария загружено',
        'сценариев загружено',
      )}`,
    loadingTitle: 'Загрузка сценариев...',
    loadingDescription: 'Загружаем сценарии.',
    emptyTitle: 'Сценариев пока нет',
    emptyDescription: 'Создайте первый сценарий, чтобы начать принимать триггеры.',
    noResultsTitle: 'По этим фильтрам сценарии не найдены',
    noResultsDescription: 'Сбросьте текущий поиск или фильтры, чтобы снова увидеть весь список.',
    controls: {
      searchLabel: 'Поиск',
      searchPlaceholder: 'Название или описание',
      statusLabel: 'Статус',
      attentionLabel: 'Внимание',
      sortLabel: 'Сортировка',
      clear: 'Сбросить фильтры',
      statusOptions: {
        ALL: 'Все статусы',
        ACTIVE: 'Активные',
        PAUSED: 'На паузе',
        DRAFT: 'Черновики',
      },
      attentionOptions: {
        ALL: 'Все причины внимания',
        failed: 'Ошибка в последнем запуске',
        paused: 'На паузе',
        draft: 'Черновик',
        activeWithoutRuns: 'Активен без запусков',
      },
      sortOptions: {
        attention: 'Требуют внимания',
        updated: 'Обновлены недавно',
        name: 'По названию',
      },
    },
    createWorkflow: 'Создать сценарий',
  },
  workflowCard: {
    eyebrow: 'Сценарий',
    workflowStatusEyebrow: 'Статус сценария',
    lastExecutionEyebrow: 'Последний запуск',
    loadingLatestExecution: 'Загружаем последний запуск...',
    syncing: 'Синхронизация',
    noDescription: 'Описания нет.',
    versionLabel: 'Версия',
    timezoneLabel: 'Часовой пояс',
    nodesLabel: 'Узлы',
    updatedLabel: 'Обновлён',
    nodesMeta: (count: number) =>
      `${formatCount('ru-RU', count)} ${pluralizeRu(
        count,
        'узел',
        'узла',
        'узлов',
      )}`,
    updatedMeta: (value: string) => `Обновлён ${value}`,
    workflowVersion: (version: number) => `Версия сценария ${version}`,
    noExecutions: 'Запусков ещё не было.',
    runManually: 'Запустить',
    attentionReasons: {
      failed: 'Ошибка в последнем запуске',
      activeWithoutRuns: 'Ждёт первый запуск',
    },
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
    notSavedYet: 'Новый',
    unsavedChanges: 'Не сохранён',
    noUnsavedChanges: 'Сохранён',
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
      'Выберите шаг, чтобы справа открыть подключение, поля и тест.',
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
    createConnection: 'Новое',
    refreshConnections: 'Обновить',
    noConnectionsDescription: (connectionType: string) =>
      `Подключений ${connectionType} пока нет. Создайте новое, чтобы выбрать его здесь.`,
    nodeSettingsEyebrow: 'Основное',
    loadingConnectionsDescription: 'Загружаем подключения.',
    deleteNode: 'Удалить шаг',
    deleteNodeDialogTitle: 'Удалить выбранный шаг?',
    deleteNodeDialogDescription: (label: string) =>
      `Убрать "${label}" с canvas и удалить связанные рёбра?`,
    deleteNodeDialogConfirm: 'Удалить шаг',
    connectionCreatedToast: (name: string) => `Подключение "${name}" создано.`,
    nodeDeletedToast: (label: string) => `Шаг "${label}" удалён.`,
  },
  stepTest: {
    sectionEyebrow: 'Тест шага',
    sectionDescription: 'Запустите шаг на примере JSON.',
    testButton: 'Запустить тест',
    testRunning: 'Выполняется...',
    testButtonSaveFirst:
      'Сохраните сценарий, чтобы включить этот тест.',
    testButtonChooseConnectionFirst: 'Сначала выберите подключение.',
    connectionRequiredSummary:
      'Сначала выберите подключение, чтобы открыть тест.',
    testButtonUnsupported: 'Проверка пока недоступна в этой версии сервиса.',
    inputDataLabel: 'Входной JSON',
    inputDataPlaceholder: '{}',
    inputDataFromPrevious: 'Подставили результат предыдущего шага.',
    invalidJson: 'Невалидный JSON.',
    successStatus: 'Успешно',
    failedStatus: 'Ошибка',
    lastResultSuccess: 'Последний тест прошёл.',
    lastResultFailed: 'Последний тест не прошёл.',
    duration: (ms: number) => `${ms}мс`,
    outputDataLabel: 'Результат',
    fieldsUpdated: 'Поля для следующих шагов обновлены.',
    expandInput: 'Показать входные данные',
    collapseInput: 'Скрыть входные данные',
    expandOutput: 'Показать результат',
    collapseOutput: 'Скрыть результат',
    openSection: 'Открыть',
    closeSection: 'Закрыть',
    unsupported:
      'Проверка пока недоступна в этой версии сервиса. Обновите backend или выполните сценарий обычным запуском.',
  },
  connectionsPage: {
    eyebrow: 'Подключения',
    title: 'Каталог подключений',
    description: 'Ищите, фильтруйте и обновляйте сохранённые подключения.',
    createConnection: 'Создать подключение',
    refresh: 'Обновить',
    refreshing: 'Обновление...',
    totalConnections: (count: number) =>
      `Подключения: ${formatCount('ru-RU', count)}`,
    reuseHint:
      'Подключения, созданные здесь, появляются в инспекторе узлов и переиспользуются в нескольких сценариях.',
    loadingTitle: 'Загрузка подключений...',
    loadingDescription: 'Получаем каталог подключений из API.',
    errorTitle: 'Не удалось загрузить подключения',
    retry: 'Повторить',
    emptyTitle: 'Подключений пока нет',
    emptyDescription:
      'Создайте первое подключение, чтобы потом переиспользовать его в шагах сценария.',
    resultsEyebrow: 'Каталог',
    resultsTitle: 'Результаты',
    showingRange: (start: number, end: number, total: number) =>
      `Показано ${formatCount('ru-RU', start)}-${formatCount('ru-RU', end)} из ${formatCount('ru-RU', total)}`,
    pageSummary: (page: number, totalPages: number) =>
      `Страница ${formatCount('ru-RU', page)} из ${formatCount('ru-RU', totalPages)}`,
    previousPage: 'Назад',
    nextPage: 'Далее',
    filtersActive: 'Фильтры активны.',
    noResultsTitle: 'По этим параметрам подключений нет',
    noResultsDescription:
      'Измените поиск или фильтры, чтобы увидеть другие подключения.',
    controls: {
      searchLabel: 'Поиск',
      searchPlaceholder: 'Поиск по названию',
      typeLabel: 'Тип',
      usageLabel: 'Использование',
      sortLabel: 'Сортировка',
      clear: 'Сбросить фильтры',
      typeOptions: {
        ALL: 'Все типы',
      },
      usageOptions: {
        ALL: 'Все подключения',
        USED: 'Используются в сценариях',
        UNUSED: 'Не используются',
      },
      sortOptions: {
        UPDATED_DESC: 'Сначала новые',
        UPDATED_ASC: 'Сначала старые',
        NAME_ASC: 'Название А-Я',
        NAME_DESC: 'Название Я-А',
        USAGE_DESC: 'Сначала часто используемые',
      },
    },
    typeSummaryLabel: 'Тип',
    usageCountLabel: 'Использований',
    credentialFieldCountLabel: 'Поля',
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
    editLoading: 'Загрузка...',
    editLoadError: (name: string) =>
      `Не удалось загрузить "${name}" для редактирования.`,
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
    workspaceTitle: 'Рабочая область',
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
    emptyDescription: 'Перетащите первый триггер из левой панели, чтобы начать сценарий.',
    workspaceDescription:
      'Держите цепочку линейной и настраивайте выбранный шаг справа.',
    inspectorEyebrow: 'Выбор',
    editing: (label: string) => `Редактирование: ${label}`,
    noNodeSelected: 'Узел не выбран',
    inspectorSelectedDescription: 'Параметры остаются в правой панели.',
    inspectorEmptyDescription: 'Выберите узел, чтобы открыть его настройки.',
    dropSpecific: (label: string) => `Отпустите, чтобы разместить ${label}.`,
    dropGeneric: 'Отпустите, чтобы разместить узел на canvas.',
    emptyEditorEyebrow: 'Пустой холст',
    emptyEditorTitle: 'Начните с одного триггера',
    emptyEditorDescription:
      'Перетащите триггер из левой панели, чтобы задать старт сценария, затем продолжите действиями.',
    dropZoneEyebrow: 'Зона размещения',
    dropZoneTitleActive: 'Отпустите, чтобы разместить узел',
    dropZoneTitleIdle: 'Перетащите шаг сюда',
    dropZoneDescriptionActive:
      'Отпустите узел в любом месте. После размещения его можно переместить.',
    dropZoneDescriptionIdle:
      'Добавляйте узлы слева, а настройки открывайте справа.',
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
    eyebrow: 'Палитра',
    sectionMeta: {
      Triggers: {
        title: 'Триггер',
        description: 'Один стартовый шаг.',
        badge: 'Старт',
      },
      Actions: {
        title: 'Действия',
        description: 'Шаги после триггера.',
        badge: 'Дальше',
      },
    },
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
        'Соберите результат одним шаблоном.',
      mappingModeHint:
        'Соберите объект по полям.',
      advancedEyebrow: 'Дополнительно',
      advancedDescription:
        'Правьте JSON шага только если нужно.',
      showAdvanced: 'Открыть',
      hideAdvanced: 'Скрыть',
      showJson: 'JSON шага',
      hideJson: 'Скрыть JSON',
    },
    dbQuery: {
      modeLabel: 'Режим',
      query: 'SQL-запрос',
      queryPlaceholder: 'select * from orders where id = $1',
      params: 'Параметры запроса',
      paramsPlaceholder: '["{{input.id}}"]',
      help:
        'Укажите JSON-массив. {{input...}} подставится при выполнении.',
      jsonArrayError: 'Параметры должны быть JSON-массивом.',
      validJsonError: 'Параметры должны быть валидным JSON.',
      modeVisual: 'Конструктор',
      modeVisualHint:
        'Выберите таблицу и поля, а SQL соберём автоматически.',
      modeRawSql: 'SQL',
      modeRawSqlHint:
        'Используйте raw SQL для сложных запросов.',
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
      showJson: 'JSON',
      hideJson: 'Скрыть JSON',
      advancedEyebrow: 'Дополнительно',
      advancedDescription:
        'Raw SQL, параметры и JSON шага.',
      advancedDescriptionRaw:
        'Этот шаг уже работает через raw SQL.',
      showAdvanced: 'Открыть',
      hideAdvanced: 'Скрыть',
      introspectionError: 'Не удалось загрузить список таблиц и колонок.',
      metadataUnavailable:
        'В этой версии сервиса визуальная работа с PostgreSQL недоступна. Используйте raw SQL.',
      testUnavailable:
        'В этой версии сервиса проверка SQL недоступна. Выполните сценарий обычным запуском.',
      switchToRawSql: 'Перейти на raw SQL',
      rawEditingHint:
        'Правка ниже переключит шаг на raw SQL.',
      rawPathEyebrow: 'Ручной SQL',
      rawPathTitle: 'Шаг работает через raw SQL.',
      rawPathDescription:
        'Ниже можно править SQL и параметры.',
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
        `${count} строк(а), затем откат`,
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
        'Проверьте письмо на данных теста или запуска.',
      advancedEyebrow: 'Дополнительно',
      advancedDescription:
        'Правьте весь JSON шага только если нужно.',
      showAdvanced: 'Открыть',
      hideAdvanced: 'Скрыть',
      showJson: 'JSON шага',
      hideJson: 'Скрыть JSON',
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
      mainDescription: 'Выберите метод, URL и body.',
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
      bodyFieldsHint: 'Соберите body по полям.',
      bodyJsonHint: 'Введите raw JSON.',
      bodyOptionalHint:
        'Оставьте пустым, если метод не отправляет body.',
      contentTypeHint:
        'Если Content-Type не задан, используем application/json',
      advancedEyebrow: 'Дополнительно',
      advancedDescription:
        'Свои заголовки и JSON шага.',
      showAdvanced: 'Открыть',
      hideAdvanced: 'Скрыть',
      showJson: 'JSON шага',
      hideJson: 'Скрыть JSON',
      showAdvancedHeaders: 'Открыть',
      hideAdvancedHeaders: 'Скрыть',
      headersCount: (count: number) => `${count} заголовк(а) настроено`,
      headersHint:
        'Открывайте только если API требует свои заголовки.',
      remove: 'Удалить',
    },
    telegram: {
      mainEyebrow: 'Сообщение',
      mainDescription: 'Укажите чат и сообщение для отправки.',
      chatId: 'Chat ID',
      chatIdPlaceholder: '-1001234567890',
      chatIdHelper: 'Как узнать свой Chat ID',
      chatIdHelperHint:
        'Нужен chat ID? Возьмите его у @userinfobot.',
      showChatIdHelp: 'Показать шаги',
      hideChatIdHelp: 'Скрыть шаги',
      chatIdHelperSteps:
        '1. Откройте Telegram и найдите @userinfobot\n2. Отправьте боту /start\n3. Бот ответит вашим Chat ID\n4. Вставьте его выше',
      message: 'Сообщение',
      messagePlaceholder: 'Заказ {{input.id}} готов.',
      previewEyebrow: 'Предпросмотр',
      previewDescription:
        'Проверьте сообщение на данных теста или запуска.',
      advancedEyebrow: 'Дополнительно',
      advancedDescription:
        'Правьте весь JSON шага только если нужно.',
      showAdvanced: 'Открыть',
      hideAdvanced: 'Скрыть',
      showJson: 'JSON шага',
      hideJson: 'Скрыть JSON',
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
