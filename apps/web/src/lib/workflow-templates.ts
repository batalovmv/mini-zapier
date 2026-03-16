import {
  createEditorNode,
  getNodeDefinition,
  type EditorNodeKind,
  type EditorNodeType,
  type WorkflowEditorEdge,
  type WorkflowEditorNode,
} from '../components/editor/editor-definitions';

export type WorkflowTemplateId = 'webhook-telegram' | 'cron-email';
export type WorkflowTemplateNameKey =
  | 'webhookTelegramTitle'
  | 'cronEmailTitle';
export type WorkflowTemplateDescriptionKey =
  | 'webhookTelegramDescription'
  | 'cronEmailDescription';
export type WorkflowTemplateSuggestedNameKey =
  | 'webhookTelegramSuggestedName'
  | 'cronEmailSuggestedName';

interface WorkflowTemplateNodeDefinition {
  nodeKind: EditorNodeKind;
  nodeType: EditorNodeType;
  position: { x: number; y: number };
}

export interface WorkflowTemplateDefinition {
  id: WorkflowTemplateId;
  nameKey: WorkflowTemplateNameKey;
  descriptionKey: WorkflowTemplateDescriptionKey;
  suggestedNameKey: WorkflowTemplateSuggestedNameKey;
  icon: string;
  accent: 'emerald' | 'amber';
}

export interface WorkflowTemplate extends WorkflowTemplateDefinition {
  nodes: WorkflowEditorNode[];
  edges: WorkflowEditorEdge[];
}

interface WorkflowTemplateBlueprint extends WorkflowTemplateDefinition {
  nodes: WorkflowTemplateNodeDefinition[];
}

const WORKFLOW_TEMPLATE_BLUEPRINTS: WorkflowTemplateBlueprint[] = [
  {
    id: 'webhook-telegram',
    nameKey: 'webhookTelegramTitle',
    descriptionKey: 'webhookTelegramDescription',
    suggestedNameKey: 'webhookTelegramSuggestedName',
    icon: 'TG',
    accent: 'emerald',
    nodes: [
      {
        nodeKind: 'trigger',
        nodeType: 'WEBHOOK',
        position: { x: 250, y: 80 },
      },
      {
        nodeKind: 'action',
        nodeType: 'TELEGRAM',
        position: { x: 250, y: 280 },
      },
    ],
  },
  {
    id: 'cron-email',
    nameKey: 'cronEmailTitle',
    descriptionKey: 'cronEmailDescription',
    suggestedNameKey: 'cronEmailSuggestedName',
    icon: 'EM',
    accent: 'amber',
    nodes: [
      {
        nodeKind: 'trigger',
        nodeType: 'CRON',
        position: { x: 250, y: 80 },
      },
      {
        nodeKind: 'action',
        nodeType: 'EMAIL',
        position: { x: 250, y: 280 },
      },
    ],
  },
];

export const WORKFLOW_TEMPLATE_DEFINITIONS: WorkflowTemplateDefinition[] =
  WORKFLOW_TEMPLATE_BLUEPRINTS.map(
    ({
      id,
      nameKey,
      descriptionKey,
      suggestedNameKey,
      icon,
      accent,
    }) => ({
      id,
      nameKey,
      descriptionKey,
      suggestedNameKey,
      icon,
      accent,
    }),
  );

export function getTemplateById(
  id: WorkflowTemplateId | string,
): WorkflowTemplate | null {
  const blueprint = WORKFLOW_TEMPLATE_BLUEPRINTS.find(
    (template) => template.id === id,
  );

  if (!blueprint) {
    return null;
  }

  const nodes = blueprint.nodes.map((nodeDefinition) => {
    const paletteItem = getNodeDefinition(
      nodeDefinition.nodeKind,
      nodeDefinition.nodeType,
    );

    if (!paletteItem) {
      throw new Error(
        `Missing node definition for ${nodeDefinition.nodeKind}:${nodeDefinition.nodeType}.`,
      );
    }

    return createEditorNode(paletteItem, nodeDefinition.position);
  });

  const edges = nodes.slice(1).map((node, index) => ({
    id: crypto.randomUUID(),
    source: nodes[index]!.id,
    target: node.id,
    sourceHandle: null,
    targetHandle: null,
    type: 'smoothstep',
  }));

  return {
    id: blueprint.id,
    nameKey: blueprint.nameKey,
    descriptionKey: blueprint.descriptionKey,
    suggestedNameKey: blueprint.suggestedNameKey,
    icon: blueprint.icon,
    accent: blueprint.accent,
    nodes,
    edges,
  };
}
