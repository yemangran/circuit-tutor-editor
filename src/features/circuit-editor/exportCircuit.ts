import type {
  Annotation,
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
  type: Annotation['type']
  label: string
  fromNode?: string
  toNode?: string
  positiveNode?: string
  negativeNode?: string
}

export type ExportedControlRelation = {
  target: string
  mode: ControlRelation['mode']
  control: Record<string, unknown>
  gain: ParameterValue
}

export type ExportCircuitPayload = {
  components: ExportedComponent[]
  nodes: ExportedNode[]
  annotations: ExportedAnnotation[]
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

function mapAnnotations(
  annotations: Annotation[],
  pinToNode: Record<string, string>,
): ExportedAnnotation[] {
  return annotations.map((annotation) => {
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

  const components: ExportedComponent[] = resolved.components.map((resolvedComponent) => ({
    id: resolvedComponent.component.id,
    kind: resolvedComponent.component.kind,
    label: resolvedComponent.component.label,
    nodes: resolvedComponent.nodes,
    parameters: resolvedComponent.component.parameters,
    ...(resolvedComponent.polarity
      ? { polarity: resolvedComponent.polarity }
      : {}),
    ...(resolvedComponent.direction
      ? { direction: resolvedComponent.direction }
      : {}),
    ...(resolvedComponent.state ? { state: resolvedComponent.state } : {}),
  }))

  const payload: ExportCircuitPayload = {
    components,
    nodes: resolved.nodes.map((node) => ({
      label: node.label,
      kind: node.kind,
    })),
    annotations: mapAnnotations(doc.annotations, resolved.pinToNode),
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
