import type {
  EditorConnectionRejectionCode,
  WorkflowValidationCode,
} from '../stores/workflow-editor.store';

import {
  formatCount,
  pluralizeEn,
  type ConnectionTypeLabelMap,
  type ExecutionStatus,
  type StepStatus,
  type WorkflowStatus,
} from './shared';

export const en = {
  common: {
    emptyValue: '—',
    languageLabel: 'Language',
    localeOptions: {
      en: 'EN',
      ru: 'RU',
    },
    workflowStatusLabels: {
      ACTIVE: 'Active',
      DRAFT: 'Draft',
      PAUSED: 'Paused',
    } as Record<WorkflowStatus, string>,
    workflowStatusDescriptions: {
      ACTIVE: 'Ready to receive triggers',
      DRAFT: 'Not active yet',
      PAUSED: 'Temporarily paused',
    } as Record<WorkflowStatus, string>,
    executionStatusLabels: {
      PENDING: 'Queued',
      RUNNING: 'Running',
      SUCCESS: 'Success',
      FAILED: 'Failed',
    } as Record<ExecutionStatus, string>,
    executionStatusDescriptions: {
      PENDING: 'Queued for processing',
      RUNNING: 'Currently running',
      SUCCESS: 'Finished successfully',
      FAILED: 'Needs attention',
    } as Record<ExecutionStatus, string>,
    stepStatusLabels: {
      PENDING: 'Queued',
      RUNNING: 'Running',
      SUCCESS: 'Success',
      FAILED: 'Failed',
      SKIPPED: 'Skipped',
    } as Record<StepStatus, string>,
    nodeKindLabels: {
      trigger: 'Trigger',
      action: 'Action',
    },
    connectionTypeLabels: {
      SMTP: 'SMTP',
      TELEGRAM: 'Telegram',
      POSTGRESQL: 'PostgreSQL',
      WEBHOOK: 'Webhook',
    } as ConnectionTypeLabelMap,
    durationUnits: {
      ms: 'ms',
      sec: 'sec',
      min: 'm',
      hour: 'h',
    },
    activate: 'Activate',
    pause: 'Pause',
    run: 'Run',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    history: 'History',
    back: 'Back',
    refreshing: 'Refreshing…',
    loading: 'Loading...',
  },
  header: {
    brandTitle: 'Mini-Zapier',
    brandSubtitle: 'Workflow control center',
    navigation: {
      dashboard: 'Dashboard',
      connections: 'Connections',
      createWorkflow: 'Create Workflow',
    },
    logout: 'Logout',
  },
  dashboardPage: {
    eyebrow: 'Workflow operations',
    title: 'Operate workflows, monitor execution health and launch manual runs.',
    description:
      'Monitor workflow health, launch manual runs and manage your automations.',
    createWorkflow: 'Create Workflow',
    deleteDialogTitle: 'Delete workflow?',
    deleteDialogConfirm: 'Delete workflow',
    deleteDialogDescription: (name: string) =>
      `Delete workflow "${name}"? This action cannot be undone.`,
    deleteDialogPendingTitle: 'Deleting workflow...',
    deleteDialogPendingLabel: 'Deleting workflow...',
    deleteDialogPendingDescription: (name: string) =>
      `Deleting workflow "${name}". This dialog closes after the API confirms the removal.`,
    executionStartedToast: (name: string) =>
      `Workflow "${name}" execution started.`,
    statusUpdatedToast: (name: string, status: string) =>
      `Workflow "${name}" is now ${status}.`,
    deletedToast: (name: string) => `Workflow "${name}" deleted.`,
  },
  statsOverview: {
    eyebrow: 'Stats overview',
    title: 'Platform health at a glance',
    loading: 'Loading...',
    refreshing: 'Refreshing latest workflow and execution data...',
    pausedWorkflows: (count: number | null) =>
      `Paused workflows: ${count === null ? '—' : formatCount('en-US', count)}`,
    cards: {
      totalWorkflows: {
        label: 'Total Workflows',
        description: 'All workflow definitions currently stored in the system.',
      },
      activeWorkflows: {
        label: 'Active Workflows',
        description: 'Workflows ready to receive webhook, cron or email triggers.',
      },
      totalExecutions: {
        label: 'Total Executions',
        description: 'Manual and trigger-driven runs recorded by the backend.',
      },
      successRate: {
        label: 'Success Rate',
        description:
          'Calculated from successful versus failed completed executions.',
      },
    },
  },
  workflowList: {
    eyebrow: 'Workflow list',
    title: 'Scan workflow health and act quickly',
    refreshing: 'Refreshing workflow cards and latest executions...',
    loadedCount: (count: number) =>
      `${formatCount('en-US', count)} ${pluralizeEn(count, 'workflow')} loaded`,
    loadingTitle: 'Loading workflows...',
    loadingDescription: 'Loading workflows from the API.',
    emptyTitle: 'No workflows',
    emptyDescription:
      'Create the first workflow definition to start receiving triggers and running actions.',
    createWorkflow: 'Create Workflow',
  },
  workflowCard: {
    eyebrow: 'Workflow',
    workflowStatusEyebrow: 'Workflow status',
    lastExecutionEyebrow: 'Last execution',
    loadingLatestExecution: 'Loading latest execution...',
    syncing: 'Syncing',
    noDescription: 'No workflow description provided.',
    versionLabel: 'Version',
    timezoneLabel: 'Timezone',
    nodesLabel: 'Nodes',
    updatedLabel: 'Updated',
    workflowVersion: (version: number) => `Workflow version ${version}`,
    noExecutions: 'No executions recorded yet.',
    running: 'Running...',
    updating: 'Updating...',
    deleting: 'Deleting...',
  },
  executionHistoryPage: {
    eyebrow: 'Execution history',
    title: 'Execution History',
    backToDashboard: 'Back to dashboard',
    openEditor: 'Open editor',
    savedOnlyError: 'Execution history is available only for saved workflows.',
  },
  executionTable: {
    eyebrow: 'Executions',
    title: 'Workflow run history',
    refreshing: 'Refreshing in-progress executions...',
    noMatches: 'No executions match this filter',
    noneRecorded: 'No executions recorded yet',
    showingRange: (start: number, end: number, total: number) =>
      `Showing ${formatCount('en-US', start)}-${formatCount('en-US', end)} of ${formatCount('en-US', total)}`,
    filters: {
      all: 'All',
      success: 'Success',
      failed: 'Failed',
      inProgress: 'In progress',
    },
    loadingTitle: 'Loading executions...',
    loadingDescription: 'Execution history is loading from the API.',
    columns: {
      id: 'ID',
      status: 'Status',
      trigger: 'Trigger',
      started: 'Started',
      duration: 'Duration',
      actions: 'Actions',
    },
    viewing: 'Viewing',
    view: 'View',
    pageOf: (page: number, totalPages: number) =>
      `Page ${formatCount('en-US', page)} of ${formatCount('en-US', totalPages)}`,
    previous: 'Previous',
    next: 'Next',
    queued: 'Queued',
    running: 'Running',
    manualEmptyPayload: 'Manual / empty payload',
    payloadFallback: 'Payload',
    nullValue: 'null',
    emptyString: '""',
    arrayLabel: (count: number) => `Array(${formatCount('en-US', count)})`,
    objectFallback: '{...}',
    noExecutionsTitle: 'No executions',
    noExecutionsDescription:
      'Trigger or run this workflow once to populate the history table.',
    noSuccessTitle: 'No successful executions',
    noSuccessDescription: 'This workflow has no successful runs yet.',
    noFailedTitle: 'No failed executions',
    noFailedDescription: 'Failed runs will appear here as soon as they happen.',
    nothingInProgressTitle: 'Nothing in progress',
    nothingInProgressDescription:
      'Queued and running executions will appear here while work is still in progress.',
  },
  stepLogViewer: {
    eyebrow: 'Step logs',
    executionTitle: (id: string) => `Execution ${id}`,
    emptyTitle: 'Select an execution',
    refreshing: 'Refreshing execution detail...',
    loadedCount: (count: number) =>
      `${formatCount('en-US', count)} ${pluralizeEn(count, 'step')} loaded`,
    chooseRow: 'Choose a row to inspect the timeline',
    loadingTitle: 'Loading step logs...',
    loadingDescription: 'The selected execution detail is loading.',
    noExecutionTitle: 'No execution selected',
    noExecutionDescription:
      'Use the table on the left to open step logs for a specific run.',
    workflowVersion: (version: number) => `Workflow v${version}`,
    truncated: 'Truncated',
    duration: (value: string) => `Duration ${value}`,
    durationEmpty: 'Duration —',
    retryAttempt: (attempt: number) => `Retry attempt ${attempt}`,
    started: (value: string) => `Started ${value}`,
    completed: (value: string) => `Completed ${value}`,
    inputData: 'Input data',
    outputData: 'Output data',
    noStepLogsTitle: 'No step logs yet',
    noStepLogsDescription:
      'Step logs will appear here once the worker records action input and output for this execution.',
  },
  loginPage: {
    brandTitle: 'Mini-Zapier',
    subtitle: 'Sign in to continue',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign in',
    signingIn: 'Signing in...',
    registerPrompt: 'Need an account?',
    registerAction: 'Register',
  },
  registerPage: {
    brandTitle: 'Mini-Zapier',
    subtitle: 'Create an account to use the shared workspace',
    email: 'Email',
    password: 'Password',
    passwordHint: 'Use at least 8 characters.',
    createAccount: 'Create account',
    creatingAccount: 'Creating account...',
    loginPrompt: 'Already have an account?',
    loginAction: 'Sign in',
  },
  notFoundPage: {
    eyebrow: '404',
    title: 'Route not found',
    description: "The page you're looking for doesn't exist.",
    action: 'Return to dashboard',
  },
  workflowEditorPage: {
    workflowName: 'Workflow name',
    untitledWorkflow: 'Untitled workflow',
    notSavedYet: 'Not saved yet',
    unsavedChanges: 'Unsaved changes',
    noUnsavedChanges: 'No unsaved changes',
    unsavedChangesConfirm:
      'Discard unsaved changes and leave the editor?',
    saving: 'Saving...',
    saveFirst: 'Save the workflow first',
    updating: 'Updating...',
    running: 'Running...',
    loadingTitle: 'Loading workflow editor...',
    loadingDescription: 'The saved workflow graph is loading into the editor.',
    workflowCreatedToast: 'Workflow created successfully.',
    workflowSavedToast: (version: number) => `Workflow saved. Version ${version}.`,
    statusUpdatedToast: (status: string) => `Workflow is now ${status}.`,
    executionStartedToast: 'Execution started.',
  },
  configPanel: {
    noFormAvailable: 'No editor form is available for this node type.',
    emptyEyebrow: 'Step setup',
    emptyTitle: 'Select a step on the canvas',
    emptyDescription:
      'Select a step on the canvas to open its connection, main fields and test tools here.',
    connectionEyebrow: 'Connection',
    headerConnectionRequired: (connectionType: string) =>
      `Choose a ${connectionType} connection first.`,
    headerSaveToTest: 'Save the workflow before testing.',
    headerLastTestSuccess: 'Last test succeeded.',
    headerLastTestFailed: 'Last test failed.',
    headerConnectionSelected: (name: string) => `Connection: ${name}.`,
    headerConnectionSelectedFallback: 'Connection selected.',
    headerMainFields: 'Main fields are below.',
    selectConnection: (connectionType: string) =>
      `Choose a ${connectionType} connection`,
    createConnection: 'Create new',
    refreshConnections: 'Refresh list',
    noConnectionsDescription: (connectionType: string) =>
      `No ${connectionType} connections yet. Create one to use it here.`,
    nodeSettingsEyebrow: 'Main',
    loadingConnectionsDescription: 'Loading your saved connections.',
    deleteNode: 'Delete step',
    deleteNodeDialogTitle: 'Delete selected step?',
    deleteNodeDialogDescription: (label: string) =>
      `Remove "${label}" from the workflow canvas and delete connected edges.`,
    deleteNodeDialogConfirm: 'Delete step',
    connectionCreatedToast: (name: string) => `Connection "${name}" created.`,
    nodeDeletedToast: (label: string) => `Step "${label}" deleted.`,
  },
  stepTest: {
    sectionEyebrow: 'Test step with input data',
    sectionDescription: 'Run this step against sample JSON.',
    testButton: 'Run test',
    testRunning: 'Running...',
    testButtonSaveFirst: 'Save the workflow to enable this test.',
    testButtonChooseConnectionFirst: 'Choose a connection first.',
    connectionRequiredSummary: 'Choose a connection to enable testing.',
    testButtonUnsupported: 'Testing is not available in this service version yet.',
    inputDataLabel: 'Input data (JSON)',
    inputDataPlaceholder: '{}',
    inputDataFromPrevious: 'Auto-filled from the previous step result.',
    invalidJson: 'Invalid JSON.',
    successStatus: 'Success',
    failedStatus: 'Failed',
    lastResultSuccess: 'Last test succeeded.',
    lastResultFailed: 'Last test failed.',
    duration: (ms: number) => `${ms}ms`,
    outputDataLabel: 'Output',
    fieldsUpdated: 'Available fields updated for downstream steps.',
    expandInput: 'Show input',
    collapseInput: 'Hide input',
    expandOutput: 'Show output',
    collapseOutput: 'Hide output',
    openSection: 'Show test',
    closeSection: 'Hide test',
    unsupported:
      'Testing is not available in this service version yet. Update the backend or run the workflow normally.',
  },
  connectionsPage: {
    eyebrow: 'Connections library',
    title: 'Store reusable secrets and service credentials in one place.',
    description:
      'Manage Telegram, SMTP, PostgreSQL and webhook connections separately from workflows, then reuse them anywhere in the editor.',
    createConnection: 'Create connection',
    refresh: 'Refresh list',
    refreshing: 'Refreshing...',
    totalConnections: (count: number) =>
      `Connections saved: ${formatCount('en-US', count)}`,
    reuseHint:
      'Connections created here appear in node inspectors and can be reused across multiple workflows.',
    loadingTitle: 'Loading connections...',
    loadingDescription: 'Fetching the saved connections from the API.',
    emptyTitle: 'No connections saved yet',
    emptyDescription:
      'Create the first reusable connection so workflow nodes can select it later instead of entering secrets repeatedly.',
    sectionEyebrow: 'Connection type',
    typeDescriptions: {
      WEBHOOK:
        'Secrets for webhook triggers and inbound email signing live here and can be reused across trigger nodes.',
      SMTP:
        'SMTP hosts, ports and mailbox credentials used by outbound email actions.',
      TELEGRAM:
        'Telegram bot tokens that message actions can reuse across notifications.',
      POSTGRESQL:
        'Database connection strings for parameterized PostgreSQL query actions.',
    },
    noConnectionsForTypeTitle: (typeLabel: string) =>
      `No ${typeLabel} connections yet`,
    noConnectionsForTypeDescription: (typeLabel: string) =>
      `Create a ${typeLabel} connection once and reuse it across workflows instead of entering the same secrets in every node.`,
    storedKeysLabel: 'Stored fields',
    storedKeysCount: (count: number) =>
      `Stored fields: ${formatCount('en-US', count)}`,
    updatedLabel: 'Updated',
    editConnection: 'Edit',
    deleteConnection: 'Delete',
    dialogEyebrow: 'Connection library',
    createDialogTitle: (typeLabel: string) => `Create ${typeLabel} connection`,
    createDialogDescription: (typeLabel: string) =>
      `Save a reusable ${typeLabel} connection that workflow nodes can select later.`,
    editDialogTitle: (name: string) => `Edit ${name}`,
    editDialogDescription: (typeLabel: string) =>
      `Rename this ${typeLabel} connection or replace its credentials set. Stored secret values are never shown again.`,
    selectType: 'Connection type',
    suggestedKeys: 'Suggested keys',
    webhookHint:
      'Use `secret` for webhook triggers or `signingSecret` for inbound email providers. You can also define a custom key set if your integration expects it.',
    keepCredentialsHint:
      'Leave credential values blank to keep the stored secrets. If you change any key or value, re-enter the full credentials set.',
    replaceCredentialsError:
      'Enter a value for every credential field when creating or replacing credentials.',
    valuePlaceholderEdit: 'Enter new value',
    updateConnection: 'Update connection',
    updatingConnection: 'Updating...',
    connectionCreatedToast: (name: string) => `Connection "${name}" created.`,
    connectionUpdatedToast: (name: string) => `Connection "${name}" updated.`,
    connectionDeletedToast: (name: string) => `Connection "${name}" deleted.`,
    deleteDialogTitle: 'Delete connection?',
    deleteDialogDescription: (name: string) =>
      `Delete connection "${name}"? The API will block removal if it is still used by a workflow node.`,
    deleteDialogConfirm: 'Delete connection',
    deleteDialogPendingTitle: 'Deleting connection...',
    deleteDialogPendingLabel: 'Deleting connection...',
    deleteDialogPendingDescription: (name: string) =>
      `Deleting connection "${name}". If a workflow still uses it, the API will return an error and keep it intact.`,
  },
  connectionCreateDialog: {
    cancel: 'Cancel',
    creating: 'Creating...',
    createConnection: 'Create connection',
    description: (connectionType: string) =>
      `The credentials object is sent as-is to the existing Connection API for type ${connectionType}.`,
    eyebrow: 'Connection',
    title: (connectionType: string) => `Create ${connectionType} connection`,
    connectionName: 'Connection name',
    connectionPlaceholder: (connectionType: string) =>
      `${connectionType} connection`,
    credentials: 'Credentials',
    addField: 'Add field',
    fieldPlaceholder: 'Field',
    valuePlaceholder: 'Value',
    fieldKeyAriaLabel: (index: number) => `Connection field key ${index}`,
    fieldValueAriaLabel: (index: number) => `Connection field value ${index}`,
    remove: 'Remove',
    connectionNameRequired: 'Connection name is required.',
    credentialsRequired: 'Add at least one credentials field.',
  },
  fieldPicker: {
    insertField: '+ Insert data',
    insertFieldReference: 'Insert data from a step',
    loading: 'Loading…',
    loadError: (message: string) => `Could not load available fields: ${message}`,
    retry: 'Retry',
    saveWorkflowToUpdate: 'Save workflow to update available fields.',
    incompatibleExecutions:
      'Run the workflow again after saving to refresh available fields.',
    noFieldsFromRun:
      'Run the workflow again with sample data to capture available fields.',
    runAtLeastOnce: 'Run the workflow at least once to see available fields.',
    versionMismatch: (sourceVersion: number, currentVersion: number | null) =>
      `Fields from v${sourceVersion}, current v${currentVersion ?? '—'}`,
    noFieldsForPosition: 'No fields available for this position.',
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
        title: 'Pick one trigger first',
        description:
          'Webhook, Cron, or Email becomes the starting point for the workflow.',
      },
      {
        step: '2',
        title: 'Drop it on the canvas',
        description:
          'The canvas is the working surface where the linear flow gets assembled.',
      },
      {
        step: '3',
        title: 'Then add actions',
        description:
          'Chain actions after the trigger and configure each selected node in the right panel.',
      },
    ],
    duplicateTrigger: 'Only one trigger is allowed per workflow.',
    connectionRejected: {
      INVALID_SOURCE:
        'Connection rejected: the source step is invalid or no longer exists.',
      INVALID_TARGET:
        'Connection rejected: the target step is invalid or no longer exists.',
      INVALID_DIRECTION:
        'Connection rejected: connections must end on an action step, not on a trigger.',
      DUPLICATE_EDGE:
        'Connection rejected: these two steps are already connected.',
      SECOND_OUTGOING:
        'Connection rejected: this step already has an outgoing connection.',
      SECOND_INCOMING:
        'Connection rejected: this step already has an incoming connection.',
      CYCLE_RISK:
        'Connection rejected: this link would create a cycle in the workflow.',
    } as Record<EditorConnectionRejectionCode, string>,
    eyebrow: 'Workflow Canvas',
    emptyTitle: 'Start with one trigger',
    workspaceTitle: 'Canvas workspace',
    stepCounter: (triggerCount: number, actionCount: number) =>
      `${formatCount('en-US', triggerCount)} ${pluralizeEn(triggerCount, 'trigger')} / ${formatCount('en-US', actionCount)} ${pluralizeEn(actionCount, 'action')}`,
    stepCounterEmpty: 'Step 1: trigger',
    emptyDescription:
      'Drop a trigger from the left library to anchor the workflow. After that, add actions that continue the chain.',
    workspaceDescription:
      'Keep the flow linear: trigger first, then actions. Select any node to configure it in the inspector on the right.',
    inspectorEyebrow: 'Inspector',
    editing: (label: string) => `Editing: ${label}`,
    noNodeSelected: 'No node selected',
    inspectorSelectedDescription:
      'The selected step can be configured in the right panel.',
    inspectorEmptyDescription:
      'Select a node on the canvas to open its settings and connection controls.',
    dropSpecific: (label: string) => `Release to place ${label} here.`,
    dropGeneric: 'Release to place the node on the canvas.',
    emptyEditorEyebrow: 'Empty editor',
    emptyEditorTitle: 'Build the workflow from left to right',
    emptyEditorDescription:
      'The first step is always a trigger. Drop one from the left library to start the workflow, then continue the chain with actions and configure each selected node in the inspector.',
    dropZoneEyebrow: 'Canvas drop zone',
    dropZoneTitleActive: 'Release to place the node',
    dropZoneTitleIdle: 'This surface is the workspace',
    dropZoneDescriptionActive:
      'Drop the node anywhere here. You can move it after placement.',
    dropZoneDescriptionIdle:
      'Drag from the left rail into this area. Connections and selection still work the same as before.',
    triggerCardTitle: 'Trigger starts the workflow',
    triggerCardDescription: 'Choose exactly one starting node.',
    actionCardTitle: 'Actions continue the chain',
    actionCardDescription: 'Add follow-up steps after the trigger.',
    needsTrigger:
      'This canvas still needs a trigger. Add one from the left library so the workflow has a valid starting step.',
    needsFirstAction:
      'Trigger is in place. Next, drop an action from the left rail and connect it to continue the workflow.',
  },
  nodeSidebar: {
    steps: [
      {
        step: '1',
        title: 'Add one trigger',
        description:
          'Choose how the workflow starts: webhook, cron, or inbound email.',
      },
      {
        step: '2',
        title: 'Chain actions after it',
        description: 'Drop follow-up steps that run in order after the trigger.',
      },
    ],
    eyebrow: 'Node Library',
    title: 'Start with a trigger',
    description:
      'The left rail is your toolbox. Drop one trigger first, then add actions to build the rest of the workflow.',
    sectionMeta: {
      Triggers: {
        title: 'Starting nodes',
        description: 'Pick exactly one node that kicks off the workflow.',
        badge: 'Step 1',
      },
      Actions: {
        title: 'Follow-up steps',
        description: 'Add actions that continue the chain after the trigger.',
        badge: 'Step 2',
      },
    },
    flowOrderLabel: 'Flow order',
    showFlowHint: 'Show hint',
    hideFlowHint: 'Hide hint',
    dragHint: 'Drag',
    startsWorkflow: 'Starts the workflow',
    runsAfterTrigger: 'Runs after the trigger',
  },
  configForms: {
    cron: {
      mainEyebrow: 'Schedule',
      mainDescription: 'Choose when this workflow should run.',
      label: 'Cron expression',
      placeholder: '*/5 * * * *',
      help: 'Stored as-is and validated by the API on save.',
      scheduleLabel: 'Schedule',
      presetEveryMinute: 'Every minute',
      presetEveryHour: 'Every hour',
      presetEveryDay: 'Every day',
      presetEveryWeek: 'Every week',
      presetCustom: 'Custom',
      timeLabel: 'Time',
      daysLabel: 'Days of week',
      dayMon: 'Mon',
      dayTue: 'Tue',
      dayWed: 'Wed',
      dayThu: 'Thu',
      dayFri: 'Fri',
      daySat: 'Sat',
      daySun: 'Sun',
      customHint: 'This workflow is using a custom cron expression. Keep editing it in advanced.',
      editAsCode: 'Edit as code',
      editVisually: 'Edit visually',
      nextRunEyebrow: 'Next run',
      nextRunDescription: 'Previewed from the current cron and workflow timezone.',
      nextRun: 'Next run',
      nextRunUnknown: 'Could not compute next run',
      timezoneNote: (tz: string) => `Timezone: ${tz}`,
      advancedEyebrow: 'Advanced',
      advancedDescription: 'Need the raw cron expression? Edit it here.',
      advancedDescriptionCustom:
        'This schedule is currently driven by a raw cron expression. Keep editing it here.',
      showAdvanced: 'Open advanced',
      hideAdvanced: 'Hide advanced',
    },
    dataTransform: {
      mainEyebrow: 'Output',
      mainDescription: 'Choose how this step should build the output.',
      mode: 'How to shape output',
      modeAriaLabel: 'Data Transform mode',
      templateMode: 'One template',
      mappingMode: 'Field by field',
      template: 'Result template',
      templateAriaLabel: 'Data Transform template',
      templatePlaceholder: '{"name":"{{input.name}}"}',
      mapping: 'Result fields',
      addField: 'Add field',
      keyPlaceholder: 'field name',
      valuePlaceholder: 'value',
      mappingKeyAriaLabel: (index: number) => `Mapping key ${index}`,
      mappingValueAriaLabel: (index: number) => `Mapping value ${index}`,
      removeMappingRowAriaLabel: (index: number) =>
        `Remove mapping row ${index}`,
      remove: 'Remove',
      templateModeHint:
        'Build the whole output from one template.',
      mappingModeHint:
        'Build an object one field at a time.',
      advancedEyebrow: 'Advanced',
      advancedDescription:
        'Manual JSON stays here when the visual setup is not enough.',
      showAdvanced: 'Open advanced',
      hideAdvanced: 'Hide advanced',
      showJson: 'Open step JSON',
      hideJson: 'Hide step JSON',
    },
    dbQuery: {
      modeLabel: 'Mode',
      query: 'SQL query',
      queryPlaceholder: 'select * from orders where id = $1',
      params: 'Query params',
      paramsPlaceholder: '["{{input.id}}"]',
      help:
        'Provide a JSON array of params. Templates like {{input...}} are resolved when the step runs.',
      jsonArrayError: 'Params must be a JSON array.',
      validJsonError: 'Params must be valid JSON.',
      modeVisual: 'Builder',
      modeVisualHint:
        'Pick a table and fields, and we will generate the SQL.',
      modeRawSql: 'SQL',
      modeRawSqlHint:
        'Use this for complex queries or when you prefer to work directly with SQL.',
      operationLabel: 'Action',
      selectTable: 'Table',
      selectTablePlaceholder: 'Choose a table',
      loadingTables: 'Loading tables\u2026',
      noTables: 'Could not load available tables or views.',
      sourceCount: (count: number) => `Available: ${count}`,
      columns: 'Fields',
      allColumns: 'All columns',
      loadingColumns: 'Loading columns\u2026',
      filters: 'Filters',
      addFilter: 'Add filter',
      removeFilterAriaLabel: 'Remove filter',
      operatorEquals: '=',
      operatorNotEquals: '\u2260',
      operatorGreaterThan: '>',
      operatorLessThan: '<',
      operatorLike: 'LIKE',
      operatorIsNull: 'IS NULL',
      operatorIsNotNull: 'IS NOT NULL',
      filterValuePlaceholder: 'Filter value',
      orderBy: 'Sort',
      orderAsc: 'ASC',
      orderDesc: 'DESC',
      limit: 'Limit',
      sqlPreview: 'SQL preview',
      testButton: 'Check SQL',
      testRunning: 'Running\u2026',
      testResult: 'Result',
      testRowCount: (count: number) => `${count} row(s) returned`,
      testError: 'Check failed',
      selectConnectionHint:
        'Choose a PostgreSQL connection to open the builder.',
      showJson: 'Open JSON',
      hideJson: 'Hide step JSON',
      advancedEyebrow: 'Advanced',
      advancedDescription:
        'Need manual control? Raw SQL, params and the full step JSON live here.',
      advancedDescriptionRaw:
        'This step currently runs from raw SQL. Keep editing it here.',
      showAdvanced: 'Open advanced',
      hideAdvanced: 'Hide advanced',
      introspectionError: 'Could not load tables and columns.',
      metadataUnavailable:
        'Visual PostgreSQL setup is not available in this service version yet. You can write the SQL yourself instead.',
      testUnavailable:
        'SQL checks from the editor are not available in this service version yet. Run the workflow normally instead.',
      switchToRawSql: 'Use raw SQL',
      rawEditingHint:
        'Editing the fields below switches this step from the visual builder to manual SQL.',
      rawPathEyebrow: 'Manual SQL',
      rawPathTitle: 'This step is using raw SQL.',
      rawPathDescription:
        'Keep editing the SQL and params below. The visual builder stays optional.',
      opSelect: 'Read',
      opInsert: 'Add',
      opUpdate: 'Change',
      opDelete: 'Delete',
      setValues: 'Values',
      addSetValue: 'Add field',
      removeSetValueAriaLabel: 'Remove value',
      setValueColumn: 'Field',
      setValuePlaceholder: 'Value',
      testMutationResult: (count: number) =>
        `${count} row(s) would be affected, then rolled back`,
      deleteNoFilterWarning: 'DELETE without a filter will affect all rows.',
      updateNoFilterWarning: 'UPDATE without a filter will affect all rows.',
    },
    emailAction: {
      mainEyebrow: 'Message',
      mainDescription: 'Set the recipient, subject and message body.',
      to: 'To',
      toPlaceholder: 'ops@example.com',
      subject: 'Subject',
      subjectPlaceholder: 'New order {{input.id}}',
      body: 'Body',
      bodyPlaceholder: 'Hello, {{input.customerName}}',
      previewEyebrow: 'Preview',
      previewDescription:
        'Use the latest test or run data to confirm the message.',
      advancedEyebrow: 'Advanced',
      advancedDescription:
        'Manual JSON stays here if you need to edit the whole step.',
      showAdvanced: 'Open advanced',
      hideAdvanced: 'Hide advanced',
      showJson: 'Open step JSON',
      hideJson: 'Hide step JSON',
    },
    emailTrigger: {
      mainEyebrow: 'Inbound URL',
      mainDescription:
        'Give this address to your mail provider so new email reaches this workflow.',
      urlLabel: 'Inbound email URL',
      saveWorkflowPlaceholder:
        'Save the workflow to get the inbound email address',
      helpEyebrow: 'Provider guidance',
      providerInfo:
        'Configure your mail provider to POST incoming email data to this address.',
      signatureInfo:
        'The WEBHOOK connection stores the signing secret used to verify the provider signature.',
    },
    httpRequest: {
      mainEyebrow: 'Request',
      mainDescription: 'Choose the method, target URL and request body.',
      url: 'URL',
      urlAriaLabel: 'HTTP Request URL',
      urlPlaceholder: 'https://example.com/orders/{{input.id}}',
      method: 'Method',
      methodAriaLabel: 'HTTP Request method',
      headers: 'Headers',
      addHeader: 'Add header',
      headerNamePlaceholder: 'header name',
      headerValuePlaceholder: 'header value',
      headerKeyAriaLabel: (index: number) => `Header key ${index}`,
      headerValueAriaLabel: (index: number) => `Header value ${index}`,
      removeHeaderRowAriaLabel: (index: number) =>
        `Remove header row ${index}`,
      body: 'Request data',
      bodyAriaLabel: 'HTTP Request body',
      bodyPlaceholder: '{"orderId":"{{input.id}}"}',
      bodyKeyPlaceholder: 'field name',
      bodyValuePlaceholder: 'value',
      bodyKeyAriaLabel: (index: number) => `Body field key ${index}`,
      bodyValueAriaLabel: (index: number) => `Body field value ${index}`,
      removeBodyRowAriaLabel: (index: number) =>
        `Remove body field ${index}`,
      addBodyField: 'Add field',
      editBodyAsJson: 'JSON',
      editBodyAsFields: 'Fields',
      bodyFieldsHint: 'Add the request body field by field.',
      bodyJsonHint: 'Write the request body as raw JSON.',
      bodyOptionalHint:
        'Leave this empty unless the API expects a body with this method.',
      contentTypeHint:
        'If Content-Type is not set, application/json will be added automatically',
      advancedEyebrow: 'Advanced',
      advancedDescription:
        'Custom headers and manual step JSON live here.',
      showAdvanced: 'Open advanced',
      hideAdvanced: 'Hide advanced',
      showJson: 'Open step JSON',
      hideJson: 'Hide step JSON',
      showAdvancedHeaders: 'Open',
      hideAdvancedHeaders: 'Hide',
      headersCount: (count: number) => `${count} header(s) configured`,
      headersHint:
        'Most integrations do not need these. Open only when a service requires custom headers.',
      remove: 'Remove',
    },
    telegram: {
      mainEyebrow: 'Message',
      mainDescription: 'Set the chat and the message to send.',
      chatId: 'Chat ID',
      chatIdPlaceholder: '-1001234567890',
      chatIdHelper: 'How to get your Chat ID',
      chatIdHelperHint:
        'Need the chat ID first? Get it from @userinfobot.',
      showChatIdHelp: 'Show steps',
      hideChatIdHelp: 'Hide steps',
      chatIdHelperSteps:
        '1. Open Telegram and find @userinfobot\n2. Send /start to the bot\n3. It will reply with your Chat ID\n4. Paste it above',
      message: 'Message',
      messagePlaceholder: 'Order {{input.id}} is ready.',
      previewEyebrow: 'Preview',
      previewDescription:
        'Use the latest test or run data to confirm the message.',
      advancedEyebrow: 'Advanced',
      advancedDescription:
        'Manual JSON stays here if you need the full step config.',
      showAdvanced: 'Open advanced',
      hideAdvanced: 'Hide advanced',
      showJson: 'Open step JSON',
      hideJson: 'Hide step JSON',
    },
    rawJson: {
      mustBeObject: 'Must be a JSON object',
      invalidJson: 'Invalid JSON',
      expertEyebrow: 'Step JSON',
      expertDescription:
        'Edit the whole step config directly.',
    },
    templatedInput: {
      editAsCode: 'Enter manually',
      visualMode: 'Visual mode',
      fieldPath: 'Field path',
      replaceField: 'Replace',
      deleteField: 'Delete',
    },
    webhook: {
      mainEyebrow: 'Endpoint',
      mainDescription: 'Use this URL as the public entry point for incoming requests.',
      urlLabel: 'Webhook URL',
      saveWorkflowPlaceholder: 'Save workflow to generate webhook URL',
      copyUrl: 'Copy URL',
      copyCurl: 'Copy curl',
      copied: 'Copied!',
      copyFailed: 'Failed to copy, check browser permissions.',
      helpEyebrow: 'Security & dedupe',
      info:
        'Incoming requests use this endpoint. If a WEBHOOK connection is attached, callers must also send the configured `X-Webhook-Secret` header.',
      dedupe:
        'To enable deduplication, include an `Idempotency-Key` or `X-Event-ID` header. Duplicate events will be ignored.',
    },
    messagePreview: {
      toggle: 'Preview',
      loading: 'Loading preview data…',
      loadError: (message: string) => `Could not load preview data: ${message}`,
      loadErrorFallback: 'Preview data request failed.',
      empty:
        'Run a step test or execute the workflow to see a preview with real data.',
      emptyTriggerAction:
        'Execute the workflow to see a preview (trigger test not available).',
      stale: 'Workflow changed since last execution — preview unavailable.',
      sourceTest: 'Data from test run',
      sourceExecution: 'Data from last execution',
    },
  },
  editorDefinitions: {
    'trigger:WEBHOOK': {
      label: 'Webhook',
      description: 'Receive JSON over the public webhook endpoint.',
    },
    'trigger:CRON': {
      label: 'Cron',
      description: 'Run the workflow on a repeat schedule.',
    },
    'trigger:EMAIL': {
      label: 'Inbound email',
      description: 'Starts the workflow when your mail service sends a new email.',
    },
    'action:HTTP_REQUEST': {
      label: 'HTTP request',
      description: 'Send a request to another service.',
    },
    'action:EMAIL': {
      label: 'Email',
      description: 'Send an email through an SMTP connection.',
    },
    'action:TELEGRAM': {
      label: 'Telegram',
      description: 'Send a Telegram message with templated content.',
    },
    'action:DB_QUERY': {
      label: 'PostgreSQL query',
      description: 'Read or update data in PostgreSQL.',
    },
    'action:DATA_TRANSFORM': {
      label: 'Data transform',
      description: 'Build new data from the previous step output.',
    },
  },
  editorNodes: {
    triggerBadge: 'Trigger',
    actionBadge: 'Action',
    fallbackTriggerDescription: 'Workflow trigger node.',
    fallbackActionDescription: 'Workflow action node.',
  },
  confirmationDialog: {
    eyebrow: 'Confirmation',
    cancel: 'Cancel',
    working: 'Working...',
    pendingNote: 'This request is already in progress. Closing is temporarily disabled.',
    destructiveNote:
      'This action is destructive and requires explicit confirmation.',
  },
  loadingState: {
    title: 'Loading...',
    description: 'Please wait while the latest data is fetched.',
  },
  errorBoundary: {
    eyebrow: 'Error boundary',
    title: 'The UI hit an unexpected rendering error.',
    reload: 'Reload app',
    fallbackMessage: 'Unexpected frontend error.',
  },
  errors: {
    unexpectedFrontendError: 'Unexpected frontend error.',
    apiRequestFailed: 'API request failed.',
    missingApiRoute:
      'The current API deployment does not support this route.',
  },
  workflowValidation: {
    MISSING_NODE_REFERENCE:
      'Workflow contains edges that reference missing nodes.',
    SELF_REFERENCING_EDGE:
      'Workflow must not contain self-referencing edges.',
    DUPLICATE_EDGES: 'Workflow must not contain duplicate edges.',
    NO_TRIGGER: 'Workflow must have a trigger node.',
    MULTIPLE_TRIGGERS: 'Workflow must have exactly one trigger.',
    INVALID_TRIGGER_OUTGOING:
      'Trigger node must have exactly one outgoing edge.',
    NO_EDGES:
      'Nodes are not connected. Drag from one handle to another to create edges.',
    INVALID_ACTION_DEGREE:
      'Each action node must have at most one incoming edge and at most one outgoing edge.',
    NO_ACTIONS:
      'Workflow must contain at least one action node connected to the trigger.',
    INVALID_TERMINAL_ACTIONS:
      'Workflow must contain exactly one terminal action node.',
    CYCLE: 'Workflow must not contain cycles.',
    DISCONNECTED_NODES:
      'Connect all nodes into a single chain starting from the trigger.',
  } as Record<WorkflowValidationCode, string>,
};

export type LocaleMessages = typeof en;
