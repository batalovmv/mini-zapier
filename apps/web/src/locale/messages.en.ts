import type { WorkflowValidationCode } from '../stores/workflow-editor.store';

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
    unsaved: 'Unsaved',
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
    inspectorSteps: [
      {
        step: '1',
        title: 'Drop or select a node',
        description: 'The canvas controls what appears in this inspector.',
      },
      {
        step: '2',
        title: 'Configure its settings',
        description: 'Forms for the selected trigger or action open here.',
      },
      {
        step: '3',
        title: 'Attach a connection when needed',
        description:
          'Nodes that use secrets get their connection controls here too.',
      },
    ],
    noFormAvailable: 'No editor form is available for this node type.',
    emptyEyebrow: 'Config Panel',
    emptyTitle: 'Inspector waits for a node',
    emptyDescription:
      'Select a trigger or action on the canvas to configure it here.',
    workspaceGuidanceEyebrow: 'Workspace guidance',
    whatShowsUpTitle: 'What shows up here',
    whatShowsUpDescription:
      'Connection selectors for nodes that need credentials, node-specific settings, and the remove control for the selected step.',
    panelEyebrow: 'Config Panel',
    defaultSelectedDescription: 'Configure the selected node.',
    nodeTypeEyebrow: 'Node type',
    connectionEyebrow: 'Connection',
    connectionRequired: (connectionType: string) =>
      `${connectionType} connection required`,
    noConnectionRequired: 'No connection required',
    connectionSectionDescription: (connectionType: string) =>
      `Attach the ${connectionType} connection used by this node.`,
    connectionNotSelected: 'Not selected',
    noConnectionsInline: 'None available',
    availableConnectionsCount: (count: number) =>
      `Available: ${formatCount('en-US', count)}`,
    selectedConnectionSummary: (name: string) => `Selected: ${name}`,
    availableConnections: 'Available connections',
    selectConnection: (connectionType: string) =>
      `Select ${connectionType} connection`,
    requiredType: (connectionType: string) => `Required type: ${connectionType}.`,
    createConnection: 'Create connection',
    refreshConnections: 'Refresh connections',
    noConnectionsTitle: (connectionType: string) =>
      `No ${connectionType} connections`,
    noConnectionsDescription: (connectionType: string) =>
      `No ${connectionType} connection is available yet. Create one here to keep the workflow flow inside the UI.`,
    noConnectionNeeded: 'This node does not require a connection.',
    nodeSettingsEyebrow: 'Node settings',
    nodeSettingsDescription:
      'Configure how this step behaves inside the workflow chain.',
    loadingConnectionsTitle: 'Loading connections...',
    loadingConnectionsDescription: 'The connection list is loading.',
    deleteNode: 'Delete Node',
    deleteNodeDialogTitle: 'Delete selected node?',
    deleteNodeDialogDescription: (label: string) =>
      `Remove "${label}" from the workflow canvas and delete connected edges.`,
    deleteNodeDialogConfirm: 'Delete node',
    connectionCreatedToast: (name: string) => `Connection "${name}" created.`,
    nodeDeletedToast: (label: string) => `Node "${label}" deleted.`,
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
    connectionCreatedToast: (name: string) => `Connection "${name}" created.`,
    connectionUpdatedToast: (name: string) => `Connection "${name}" updated.`,
    connectionDeletedToast: (name: string) => `Connection "${name}" deleted.`,
    deleteDialogTitle: 'Delete connection?',
    deleteDialogDescription: (name: string) =>
      `Delete connection "${name}"? The API will block removal if it is still used by a workflow node.`,
    deleteDialogConfirm: 'Delete connection',
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
    insertField: '+ Insert field',
    insertFieldReference: 'Insert field reference',
    loading: 'Loading…',
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
      editAsCode: 'Edit as code',
      editVisually: 'Edit visually',
      nextRun: 'Next run',
      nextRunUnknown: 'Could not compute next run',
      timezoneNote: (tz: string) => `Timezone: ${tz}`,
    },
    dataTransform: {
      mode: 'Mode',
      modeAriaLabel: 'Data Transform mode',
      templateMode: 'Template',
      mappingMode: 'Mapping',
      template: 'Template',
      templateAriaLabel: 'Data Transform template',
      templatePlaceholder: '{"name":"{{input.name}}"}',
      mapping: 'Mapping',
      addField: 'Add field',
      keyPlaceholder: 'key',
      valuePlaceholder: 'value',
      mappingKeyAriaLabel: (index: number) => `Mapping key ${index}`,
      mappingValueAriaLabel: (index: number) => `Mapping value ${index}`,
      removeMappingRowAriaLabel: (index: number) =>
        `Remove mapping row ${index}`,
      remove: 'Remove',
    },
    dbQuery: {
      query: 'SQL query',
      queryPlaceholder: 'select * from orders where id = $1',
      params: 'Params',
      paramsPlaceholder: '["{{input.id}}"]',
      help: 'Provide a JSON array. Template strings are resolved by the worker.',
      jsonArrayError: 'Params must be a JSON array.',
      validJsonError: 'Params must be valid JSON.',
    },
    emailAction: {
      to: 'To',
      toPlaceholder: 'ops@example.com',
      subject: 'Subject',
      subjectPlaceholder: 'New order {{input.id}}',
      body: 'Body',
      bodyPlaceholder: 'Hello, {{input.customerName}}',
    },
    emailTrigger: {
      info:
        'Configure your inbound email provider to POST raw email data to the endpoint below. The selected WEBHOOK connection supplies the signing secret used by `/api/inbound-email/:workflowId`.',
      urlLabel: 'Inbound email URL',
      saveWorkflowPlaceholder:
        'Save workflow to generate /api/inbound-email/:workflowId',
    },
    httpRequest: {
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
      body: 'Body',
      bodyAriaLabel: 'HTTP Request body',
      bodyPlaceholder: '{"orderId":"{{input.id}}"}',
      remove: 'Remove',
    },
    telegram: {
      chatId: 'Chat ID',
      chatIdPlaceholder: '-1001234567890',
      message: 'Message',
      messagePlaceholder: 'Order {{input.id}} is ready.',
    },
    templatedInput: {
      editAsCode: 'Edit as code',
      visualMode: 'Visual mode',
      fieldPath: 'Field path',
      replaceField: 'Replace',
      deleteField: 'Delete',
    },
    webhook: {
      urlLabel: 'Webhook URL',
      saveWorkflowPlaceholder: 'Save workflow to generate webhook URL',
      copyUrl: 'Copy URL',
      copyCurl: 'Copy curl',
      copied: 'Copied!',
      copyFailed: 'Failed to copy, check browser permissions.',
      info:
        'Incoming requests use this endpoint. If a WEBHOOK connection is attached, callers must also send the configured `X-Webhook-Secret` header.',
      dedupe:
        'To enable deduplication, include an `Idempotency-Key` or `X-Event-ID` header. Duplicate events will be ignored.',
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
      label: 'Email Trigger',
      description: 'Accept inbound email payloads from a provider webhook.',
    },
    'action:HTTP_REQUEST': {
      label: 'HTTP Request',
      description: 'Call an HTTP endpoint with templated input data.',
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
      label: 'PostgreSQL Query',
      description: 'Execute a parameterized PostgreSQL query.',
    },
    'action:DATA_TRANSFORM': {
      label: 'Data Transform',
      description: 'Interpolate templates or build a mapped payload.',
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

