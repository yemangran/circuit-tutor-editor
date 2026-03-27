import type {
  Annotation,
  BranchCurrentAnnotation,
  CircuitDocument,
  ControlRelation,
  ParameterValue,
  SolveTarget,
} from "./types/circuit";
import { resolveNodes, type ResolveNodesDiagnostics } from "./resolveNodes";
import type { ResolvedCircuitNode } from "./unionFind";
import type { NodeResolutionConflict } from "./unionFind";

type ExportedPolarity = {
  positive: string;
  negative: string;
};

type ExportedDirection = {
  from: string;
  to: string;
};

export type ExportedComponent = {
  id: string;
  kind: string;
  label: string;
  nodes: string[];
  parameters: Record<string, ParameterValue>;
  polarity?: ExportedPolarity;
  direction?: ExportedDirection;
  state?: string;
};

export type ExportedNode = {
  label: string;
  kind: "ground" | "user_named" | "auto_generated";
  pinCount: number;
  isExplicitJunction: boolean;
};

export type ExportedJunction = {
  id: string;
  kind: "junction";
  label: string;
  node: string;
  junctionType: "wire_splice";
  connectedComponents: Array<{
    componentId: string;
    componentKind: string;
    componentLabel: string;
    pinId: string;
  }>;
};

export type ExportedAnnotation = {
  type: Exclude<Annotation["type"], "branch_current">;
  label: string;
  fromNode?: string;
  toNode?: string;
  positiveNode?: string;
  negativeNode?: string;
};

export type ExportedBranchCurrent = {
  id: string;
  label: string;
  fromNode: string;
  toNode: string;
  value?: ParameterValue;
  targetWireIds: string[];
};

export type ExportedControlRelation = {
  target: string;
  mode: ControlRelation["mode"];
  control: Record<string, unknown>;
  gain: ParameterValue;
};

export const EXPORT_SCHEMA_VERSION = "2";

export type ExportCircuitPayload = {
  schemaVersion: typeof EXPORT_SCHEMA_VERSION;
  rules: string[];
  components: ExportedComponent[];
  junctions: ExportedJunction[];
  nodes: ExportedNode[];
  annotations: ExportedAnnotation[];
  branchCurrents: ExportedBranchCurrent[];
  controlRelations: ExportedControlRelation[];
  solveTargets: SolveTarget[];
  meta: {
    title: string;
    description?: string;
    groundNode?: "GND";
  };
};

export type ExportCircuitResult = {
  payload: ExportCircuitPayload;
  diagnostics: ResolveNodesDiagnostics;
  conflicts: NodeResolutionConflict[];
};

const EXPORT_RULES = [
  `This payload follows export schema version ${EXPORT_SCHEMA_VERSION}; interpret fields according to this version only.`,
  "Treat node labels as the source of truth for electrical connectivity: the same node label means the connected pins are electrically identical.",
  "Reconstruct topology primarily from components[].nodes plus nodes[]; do not infer connectivity from component positions, drawing geometry, or visual layout.",
  "components[].nodes is ordered by the component pin order defined in the editor, so preserve array order when mapping a component's terminals.",
  "nodes[] provides normalized analysis-friendly node identities; label values are globally unique within the payload and may differ from user-entered names after normalization.",
  "meta.groundNode='GND' identifies the reference node when present; any component terminal mapped to GND is electrically grounded.",
  "junctions[] lists explicit junction objects drawn by the user; each junction is a node-level wire splice summary, and junction.node is the electrical node represented by that junction.",
  "junctions[].connectedComponents lists external component-pin connections touching the same electrical node; entries are pin-level, so the same component may appear multiple times if multiple pins connect there.",
  "annotations[] add semantic hints only and never create new connectivity; use fromNode/toNode or positiveNode/negativeNode exactly as exported.",
  "branchCurrents[].fromNode -> toNode defines the assumed positive current direction for that branch-current annotation; this is a sign convention, not an additional wire.",
  "controlRelations[] describes dependent-source control semantics and should be interpreted together with the target component referenced by controlRelations[].target.",
  "solveTargets[] describes the quantities the user wants solved; it does not modify circuit connectivity or component behavior.",
];

function normalizePolarityLikeLabel(label: string) {
  const match = /^([+-])(?:#(\d+))?$/u.exec(label.trim());

  if (!match) {
    return label;
  }

  const polarity = match[1] === "+" ? "POS" : "NEG";
  const suffix = match[2] ? match[2] : "";
  return `${polarity}${suffix}`;
}

function buildExportNodeLabelMap(nodes: ResolvedCircuitNode[]) {
  const usedLabels = new Map<string, number>();
  const nodeLabelMap: Record<string, string> = {};

  for (const node of nodes) {
    const normalizedBaseLabel =
      node.kind === "ground" ? "GND" : normalizePolarityLikeLabel(node.label);
    const nextIndex = (usedLabels.get(normalizedBaseLabel) ?? 0) + 1;
    usedLabels.set(normalizedBaseLabel, nextIndex);

    nodeLabelMap[node.label] =
      nextIndex === 1
        ? normalizedBaseLabel
        : `${normalizedBaseLabel}_${nextIndex}`;
  }

  return nodeLabelMap;
}

function mapNodeLabel(
  nodeLabel: string | undefined,
  nodeLabelMap: Record<string, string>,
) {
  if (!nodeLabel) {
    return nodeLabel;
  }

  return nodeLabelMap[nodeLabel] ?? nodeLabel;
}

function mapAnnotations(
  annotations: Annotation[],
  pinToNode: Record<string, string>,
  nodeLabelMap: Record<string, string>,
): ExportedAnnotation[] {
  return annotations
    .filter((annotation) => annotation.type !== "branch_current")
    .map((annotation) => {
      if (annotation.type === "current_arrow") {
        return {
          type: annotation.type,
          label: annotation.label,
          fromNode: annotation.fromPinRef
            ? mapNodeLabel(
                pinToNode[
                  `${annotation.fromPinRef.componentId}:${annotation.fromPinRef.pinId}`
                ],
                nodeLabelMap,
              )
            : undefined,
          toNode: annotation.toPinRef
            ? mapNodeLabel(
                pinToNode[
                  `${annotation.toPinRef.componentId}:${annotation.toPinRef.pinId}`
                ],
                nodeLabelMap,
              )
            : undefined,
        };
      }

        return {
          type: annotation.type,
          label: annotation.label,
          positiveNode: annotation.positivePinRef
          ? mapNodeLabel(
              pinToNode[
                `${annotation.positivePinRef.componentId}:${annotation.positivePinRef.pinId}`
              ],
              nodeLabelMap,
            )
          : undefined,
        negativeNode: annotation.negativePinRef
          ? mapNodeLabel(
              pinToNode[
                `${annotation.negativePinRef.componentId}:${annotation.negativePinRef.pinId}`
              ],
              nodeLabelMap,
            )
          : undefined,
      };
    });
}

function mapBranchCurrents(
  annotations: Annotation[],
  pinToNode: Record<string, string>,
  nodeLabelMap: Record<string, string>,
): ExportedBranchCurrent[] {
  return annotations
    .filter(
      (annotation): annotation is BranchCurrentAnnotation =>
        annotation.type === "branch_current",
    )
    .map((annotation) => {
      const fromNode = mapNodeLabel(
        pinToNode[
          `${annotation.fromPinRef.componentId}:${annotation.fromPinRef.pinId}`
        ],
        nodeLabelMap,
      );
      const toNode = mapNodeLabel(
        pinToNode[
          `${annotation.toPinRef.componentId}:${annotation.toPinRef.pinId}`
        ],
        nodeLabelMap,
      );

      return {
        id: annotation.id,
        label: annotation.label,
        fromNode,
        toNode,
        ...(annotation.value ? { value: annotation.value } : {}),
        targetWireIds: annotation.targetWireIds,
      };
    })
    .filter(
      (
        annotation,
      ): annotation is ExportedBranchCurrent =>
        Boolean(annotation.fromNode) &&
        Boolean(annotation.toNode) &&
        annotation.fromNode !== annotation.toNode,
    )
}

function mapControlRelations(
  controlRelations: ControlRelation[],
): ExportedControlRelation[] {
  return controlRelations.map((controlRelation) => ({
    target: controlRelation.targetComponentId,
    mode: controlRelation.mode,
    control: controlRelation.control,
    gain: controlRelation.gain,
  }));
}

export function exportCircuit(doc: CircuitDocument): ExportCircuitResult {
  const resolved = resolveNodes({
    components: doc.components,
    wires: doc.wires,
    namedNodes: doc.namedNodes,
  });
  const componentById = new Map(
    doc.components.map((component) => [component.id, component]),
  );
  const nodeByLabel = new Map(
    resolved.nodes.map((node) => [node.label, node] as const),
  );
  const exportNodeLabelMap = buildExportNodeLabelMap(resolved.nodes);

  const components: ExportedComponent[] = resolved.components
    .filter(
      (resolvedComponent) => resolvedComponent.component.kind !== "junction",
    )
    .map((resolvedComponent) => ({
      id: resolvedComponent.component.id,
      kind: resolvedComponent.component.kind,
      label: resolvedComponent.component.label,
      nodes: resolvedComponent.nodes.map((nodeLabel) =>
        mapNodeLabel(nodeLabel, exportNodeLabelMap) ?? nodeLabel,
      ),
      parameters: resolvedComponent.component.parameters,
      ...(resolvedComponent.polarity
        ? {
            polarity: {
              positive:
                mapNodeLabel(
                  resolvedComponent.polarity.positive,
                  exportNodeLabelMap,
                ) ?? resolvedComponent.polarity.positive,
              negative:
                mapNodeLabel(
                  resolvedComponent.polarity.negative,
                  exportNodeLabelMap,
                ) ?? resolvedComponent.polarity.negative,
            },
          }
        : {}),
      ...(resolvedComponent.direction
        ? {
            direction: {
              from:
                mapNodeLabel(
                  resolvedComponent.direction.from,
                  exportNodeLabelMap,
                ) ?? resolvedComponent.direction.from,
              to:
                mapNodeLabel(
                  resolvedComponent.direction.to,
                  exportNodeLabelMap,
                ) ?? resolvedComponent.direction.to,
            },
          }
        : {}),
      ...(resolvedComponent.state ? { state: resolvedComponent.state } : {}),
    }));

  const junctions: ExportedJunction[] = resolved.components
    .filter(
      (resolvedComponent) => resolvedComponent.component.kind === "junction",
    )
    .map((resolvedComponent) => {
      const firstPinKey = `${resolvedComponent.component.id}:${resolvedComponent.component.pins[0]}`;
      const nodeLabel = mapNodeLabel(
        resolved.pinToNode[firstPinKey],
        exportNodeLabelMap,
      ) ?? resolved.pinToNode[firstPinKey];
      const nodePins = nodeByLabel.get(resolved.pinToNode[firstPinKey])?.pins ?? [];
      const connectedComponents = nodePins
        .filter((candidatePinKey) => {
          const [componentId] = candidatePinKey.split(":");
          return componentId !== resolvedComponent.component.id;
        })
        .map((candidatePinKey) => {
          const [componentId, externalPinId] = candidatePinKey.split(":");
          const component = componentById.get(componentId);

          return {
            componentId,
            componentKind: component?.kind ?? "unknown",
            componentLabel: component?.label ?? componentId,
            pinId: externalPinId ?? "",
          };
        });

      return {
        id: resolvedComponent.component.id,
        kind: "junction" as const,
        label: resolvedComponent.component.label,
        node: nodeLabel,
        junctionType: "wire_splice" as const,
        connectedComponents,
      };
    });

  const payload: ExportCircuitPayload = {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    rules: EXPORT_RULES,
    components,
    junctions,
    nodes: resolved.nodes.map((node) => ({
      label: mapNodeLabel(node.label, exportNodeLabelMap) ?? node.label,
      kind: node.kind,
      pinCount: node.pins.length,
      isExplicitJunction: node.pins.some((pinKey) => {
        const [componentId] = pinKey.split(":");
        return componentById.get(componentId)?.kind === "junction";
      }),
    })),
    annotations: mapAnnotations(
      doc.annotations,
      resolved.pinToNode,
      exportNodeLabelMap,
    ),
    branchCurrents: mapBranchCurrents(
      doc.annotations,
      resolved.pinToNode,
      exportNodeLabelMap,
    ),
    controlRelations: mapControlRelations(doc.controlRelations),
    solveTargets: doc.solveTargets,
    meta: {
      title: doc.meta.title,
      ...(doc.meta.description ? { description: doc.meta.description } : {}),
      ...(resolved.diagnostics.hasGround ? { groundNode: "GND" } : {}),
    },
  };

  return {
    payload,
    diagnostics: resolved.diagnostics,
    conflicts: resolved.conflicts,
  };
}

export function formatExportPayloadForLLM(
  payload: ExportCircuitPayload,
): string {
  return JSON.stringify(payload, null, 2);
}
