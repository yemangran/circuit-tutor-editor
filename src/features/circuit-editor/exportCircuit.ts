import type {
  Annotation,
  BranchCurrentAnnotation,
  CircuitDocument,
  ControlRelation,
  ParameterValue,
  SolveTarget,
} from './types/circuit'
import { resolveNodes, type ResolveNodesDiagnostics } from './resolveNodes'
import type { NodeResolutionConflict } from './unionFind'

type ExportedPolarity = {
  positive: string
  negative: string
}

type ExportedDirection = {
  from: string
  to: string
}

export type ExportedComponent = {
  id: string
  kind: string
  label: string
  nodes: string[]
  parameters: Record<string, ParameterValue>
  polarity?: ExportedPolarity
  direction?: ExportedDirection
  state?: string
}

export type ExportedNode = {
  label: string
  kind: 'ground' | 'user_named' | 'auto_generated'
}

export type ExportedAnnotation = {
  type: Exclude<Annotation['type'], 'branch_current'>
  label: string
  fromNode?: string
  toNode?: string
  positiveNode?: string
  negativeNode?: string
}

export type ExportedBranchCurrent = {
  id: string
  label: string
  fromNode: string
  toNode: string
  value?: ParameterValue
  targetWireIds: string[]
}

export type ExportedControlRelation = {
  target: string
  mode: ControlRelation['mode']
  control: Record<string, unknown>
  gain: ParameterValue
}

export type ExportCircuitPayload = {
  rules: string[]
  components: ExportedComponent[]
  nodes: ExportedNode[]
  annotations: ExportedAnnotation[]
  branchCurrents: ExportedBranchCurrent[]
  controlRelations: ExportedControlRelation[]
  solveTargets: SolveTarget[]
  meta: {
    title: string
    description?: string
    groundNode?: 'GND'
  }
}

export type ExportCircuitResult = {
  payload: ExportCircuitPayload
  diagnostics: ResolveNodesDiagnostics
  conflicts: NodeResolutionConflict[]
}

const EXPORT_RULES = [
  'Same node label means those pins are electrically connected.',
  'components[].nodes are ordered by the component pin order defined in the editor.',
  'branchCurrents[].fromNode -> toNode defines the assumed current direction.',
  'GND is the global reference node when present.',
]

function mapAnnotations(
  annotations: Annotation[],
  pinToNode: Record<string, string>,
): ExportedAnnotation[] {
  return annotations
    .filter((annotation) => annotation.type !== 'branch_current')
    .map((annotation) => {
      if (annotation.type === 'current_arrow') {
        return {
          type: annotation.type,
          label: annotation.label,
          fromNode: annotation.fromPinRef
            ? pinToNode[`${annotation.fromPinRef.componentId}:${annotation.fromPinRef.pinId}`]
            : undefined,
          toNode: annotation.toPinRef
            ? pinToNode[`${annotation.toPinRef.componentId}:${annotation.toPinRef.pinId}`]
            : undefined,
        }
      }

      return {
        type: annotation.type,
        label: annotation.label,
        positiveNode: annotation.positivePinRef
          ? pinToNode[
              `${annotation.positivePinRef.componentId}:${annotation.positivePinRef.pinId}`
            ]
          : undefined,
        negativeNode: annotation.negativePinRef
          ? pinToNode[
              `${annotation.negativePinRef.componentId}:${annotation.negativePinRef.pinId}`
            ]
          : undefined,
      }
    })
}

function mapBranchCurrents(
  annotations: Annotation[],
  pinToNode: Record<string, string>,
): ExportedBranchCurrent[] {
  return annotations
    .filter(
      (annotation): annotation is BranchCurrentAnnotation =>
        annotation.type === 'branch_current',
    )
    .map((annotation) => ({
      id: annotation.id,
      label: annotation.label,
      fromNode:
        pinToNode[`${annotation.fromPinRef.componentId}:${annotation.fromPinRef.pinId}`],
      toNode:
        pinToNode[`${annotation.toPinRef.componentId}:${annotation.toPinRef.pinId}`],
      ...(annotation.value ? { value: annotation.value } : {}),
      targetWireIds: annotation.targetWireIds,
    }))
}

function mapControlRelations(
  controlRelations: ControlRelation[],
): ExportedControlRelation[] {
  return controlRelations.map((controlRelation) => ({
    target: controlRelation.targetComponentId,
    mode: controlRelation.mode,
    control: controlRelation.control,
    gain: controlRelation.gain,
  }))
}

export function exportCircuit(doc: CircuitDocument): ExportCircuitResult {
  const resolved = resolveNodes({
    components: doc.components,
    wires: doc.wires,
    namedNodes: doc.namedNodes,
  })

  const components: ExportedComponent[] = resolved.components
    .filter((resolvedComponent) => resolvedComponent.component.kind !== 'junction')
    .map((resolvedComponent) => ({
      id: resolvedComponent.component.id,
      kind: resolvedComponent.component.kind,
      label: resolvedComponent.component.label,
      nodes: resolvedComponent.nodes,
      parameters: resolvedComponent.component.parameters,
      ...(resolvedComponent.polarity ? { polarity: resolvedComponent.polarity } : {}),
      ...(resolvedComponent.direction ? { direction: resolvedComponent.direction } : {}),
      ...(resolvedComponent.state ? { state: resolvedComponent.state } : {}),
    }))

  const payload: ExportCircuitPayload = {
    rules: EXPORT_RULES,
    components,
    nodes: resolved.nodes.map((node) => ({
      label: node.label,
      kind: node.kind,
    })),
    annotations: mapAnnotations(doc.annotations, resolved.pinToNode),
    branchCurrents: mapBranchCurrents(doc.annotations, resolved.pinToNode),
    controlRelations: mapControlRelations(doc.controlRelations),
    solveTargets: doc.solveTargets,
    meta: {
      title: doc.meta.title,
      ...(doc.meta.description ? { description: doc.meta.description } : {}),
      ...(resolved.diagnostics.hasGround ? { groundNode: 'GND' } : {}),
    },
  }

  return {
    payload,
    diagnostics: resolved.diagnostics,
    conflicts: resolved.conflicts,
  }
}

export function formatExportPayloadForLLM(payload: ExportCircuitPayload): string {
  return JSON.stringify(payload, null, 2)
}
