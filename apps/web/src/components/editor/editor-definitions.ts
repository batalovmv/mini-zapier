import type { WorkflowDto } from '@mini-zapier/shared';
import type { Edge, Node, XYPosition } from 'reactflow';

type WorkflowNodeDto = WorkflowDto['nodes'][number];

export type EditorNodeKind = WorkflowNodeDto['nodeKind'];
export type EditorNodeType = WorkflowNodeDto['nodeType'];
export type EditorDefinitionId =
  | 'trigger:WEBHOOK'
  | 'trigger:CRON'
  | 'trigger:EMAIL'
  | 'action:HTTP_REQUEST'
  | 'action:EMAIL'
  | 'action:TELEGRAM'
  | 'action:DB_QUERY'
  | 'action:DATA_TRANSFORM';
export type SupportedConnectionType =
  | 'SMTP'
  | 'TELEGRAM'
  | 'POSTGRESQL'
  | 'WEBHOOK';

export interface WorkflowEditorNodeData {
  label: string;
  nodeKind: EditorNodeKind;
  nodeType: EditorNodeType;
  config: Record<string, unknown>;
  connectionId: string | null;
  retryCount: number;
  retryBackoff: number;
  timeoutMs: number | null;
}

export type WorkflowEditorNode = Node<
  WorkflowEditorNodeData,
  'triggerNode' | 'actionNode'
>;
export type WorkflowEditorEdge = Edge;

export interface EditorPaletteItem {
  id: EditorDefinitionId;
  section: 'Triggers' | 'Actions';
  nodeKind: EditorNodeKind;
  nodeType: EditorNodeType;
  defaultLabel: string;
  accent: string;
  icon: string;
  connectionType: SupportedConnectionType | null;
}

const paletteItems: EditorPaletteItem[] = [
  {
    id: 'trigger:WEBHOOK',
    section: 'Triggers',
    nodeKind: 'trigger',
    nodeType: 'WEBHOOK',
    defaultLabel: 'Webhook',
    accent: 'emerald',
    icon: 'WH',
    connectionType: 'WEBHOOK',
  },
  {
    id: 'trigger:CRON',
    section: 'Triggers',
    nodeKind: 'trigger',
    nodeType: 'CRON',
    defaultLabel: 'Cron',
    accent: 'emerald',
    icon: 'CR',
    connectionType: null,
  },
  {
    id: 'trigger:EMAIL',
    section: 'Triggers',
    nodeKind: 'trigger',
    nodeType: 'EMAIL',
    defaultLabel: 'Email Trigger',
    accent: 'emerald',
    icon: 'EM',
    connectionType: 'WEBHOOK',
  },
  {
    id: 'action:HTTP_REQUEST',
    section: 'Actions',
    nodeKind: 'action',
    nodeType: 'HTTP_REQUEST',
    defaultLabel: 'HTTP Request',
    accent: 'sky',
    icon: 'HT',
    connectionType: null,
  },
  {
    id: 'action:EMAIL',
    section: 'Actions',
    nodeKind: 'action',
    nodeType: 'EMAIL',
    defaultLabel: 'Email',
    accent: 'sky',
    icon: 'ML',
    connectionType: 'SMTP',
  },
  {
    id: 'action:TELEGRAM',
    section: 'Actions',
    nodeKind: 'action',
    nodeType: 'TELEGRAM',
    defaultLabel: 'Telegram',
    accent: 'sky',
    icon: 'TG',
    connectionType: 'TELEGRAM',
  },
  {
    id: 'action:DB_QUERY',
    section: 'Actions',
    nodeKind: 'action',
    nodeType: 'DB_QUERY',
    defaultLabel: 'PostgreSQL Query',
    accent: 'sky',
    icon: 'DB',
    connectionType: 'POSTGRESQL',
  },
  {
    id: 'action:DATA_TRANSFORM',
    section: 'Actions',
    nodeKind: 'action',
    nodeType: 'DATA_TRANSFORM',
    defaultLabel: 'Data Transform',
    accent: 'sky',
    icon: 'DT',
    connectionType: null,
  },
];

export const EDITOR_PALETTE_ITEMS = [...paletteItems];

const paletteItemById = new Map(
  EDITOR_PALETTE_ITEMS.map((item) => [item.id, item]),
);

const paletteItemByNodeType = new Map(
  EDITOR_PALETTE_ITEMS.map((item) => [createDefinitionKey(item.nodeKind, item.nodeType), item]),
);

function cloneConfig(config: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(config)) as Record<string, unknown>;
}

export function createDefinitionKey(
  nodeKind: EditorNodeKind,
  nodeType: EditorNodeType,
): EditorDefinitionId {
  return `${nodeKind}:${nodeType}` as EditorDefinitionId;
}

export function getPaletteItemById(id: EditorDefinitionId): EditorPaletteItem | undefined {
  return paletteItemById.get(id);
}

export function getNodeDefinition(
  nodeKind: EditorNodeKind,
  nodeType: EditorNodeType,
): EditorPaletteItem | undefined {
  return paletteItemByNodeType.get(createDefinitionKey(nodeKind, nodeType));
}

export function createDefaultNodeConfig(
  nodeKind: EditorNodeKind,
  nodeType: EditorNodeType,
): Record<string, unknown> {
  const definitionKey = createDefinitionKey(nodeKind, nodeType);

  switch (definitionKey) {
    case 'trigger:WEBHOOK':
      return {};
    case 'trigger:CRON':
      return {
        cronExpression: '',
      };
    case 'trigger:EMAIL':
      return {};
    case 'action:HTTP_REQUEST':
      return {
        url: '',
        method: 'POST',
        headers: {},
        body: '',
      };
    case 'action:EMAIL':
      return {
        to: '',
        subject: '',
        body: '',
      };
    case 'action:TELEGRAM':
      return {
        chatId: '',
        message: '',
      };
    case 'action:DB_QUERY':
      return {
        query: '',
        params: [],
        _builderState: {
          operation: 'select',
          table: '',
          columns: [],
          filters: [],
          orderBy: { column: '', direction: 'ASC' },
          limit: 100,
          setValues: [],
        },
      };
    case 'action:DATA_TRANSFORM':
      return {
        mode: 'template',
        template: '',
        mapping: {},
      };
    default:
      return {};
  }
}

export function createEditorNode(
  paletteItem: EditorPaletteItem,
  position: XYPosition,
): WorkflowEditorNode {
  const id = crypto.randomUUID();

  return {
    id,
    type: paletteItem.nodeKind === 'trigger' ? 'triggerNode' : 'actionNode',
    position,
    data: {
      label: paletteItem.defaultLabel,
      nodeKind: paletteItem.nodeKind,
      nodeType: paletteItem.nodeType,
      config: createDefaultNodeConfig(paletteItem.nodeKind, paletteItem.nodeType),
      connectionId: null,
      retryCount: 0,
      retryBackoff: 0,
      timeoutMs: null,
    },
  };
}

export function toEditorNode(node: WorkflowNodeDto): WorkflowEditorNode {
  return {
    id: node.id,
    type: node.nodeKind === 'trigger' ? 'triggerNode' : 'actionNode',
    position: {
      x: node.positionX,
      y: node.positionY,
    },
    data: {
      label: node.label,
      nodeKind: node.nodeKind,
      nodeType: node.nodeType,
      config: cloneConfig(node.config ?? {}),
      connectionId: node.connectionId ?? null,
      retryCount: node.retryCount ?? 0,
      retryBackoff: node.retryBackoff ?? 0,
      timeoutMs: node.timeoutMs ?? null,
    },
  };
}

export function toWorkflowNode(node: WorkflowEditorNode): WorkflowNodeDto {
  return {
    id: node.id,
    positionX: node.position.x,
    positionY: node.position.y,
    nodeKind: node.data.nodeKind,
    nodeType: node.data.nodeType,
    label: node.data.label,
    config: cloneConfig(node.data.config),
    connectionId: node.data.connectionId ?? undefined,
    retryCount: node.data.retryCount,
    retryBackoff: node.data.retryBackoff,
    timeoutMs: node.data.timeoutMs ?? undefined,
  };
}

export function createNodeSections(): Array<{
  title: 'Triggers' | 'Actions';
  items: EditorPaletteItem[];
}> {
  return (['Triggers', 'Actions'] as const).map((title) => ({
    title,
    items: EDITOR_PALETTE_ITEMS.filter((item) => item.section === title),
  }));
}
