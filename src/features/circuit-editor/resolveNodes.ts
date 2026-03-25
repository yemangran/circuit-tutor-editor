import type {
  CircuitComponent,
  CircuitDocument,
} from './types/circuit'
import {
  type NodeResolutionConflict,
  type ResolvedCircuitNode,
  makePinKey,
  resolveCircuitNodes,
} from './unionFind'

type ResolveNodesInput = Pick<CircuitDocument, 'components' | 'wires' | 'namedNodes'>

type UnconnectedPin = {
  componentId: string
  pinId: string
  nodeLabel: string
}

type ComponentPolarity = {
  positive: string
  negative: string
}

type ComponentDirection = {
  from: string
  to: string
}

export type ResolvedComponentNodes = {
  component: CircuitComponent
  nodes: string[]
  polarity?: ComponentPolarity
  direction?: ComponentDirection
  state?: string
}

export type ResolveNodesDiagnostics = {
  hasGround: boolean
  unconnectedPins: UnconnectedPin[]
  namedNodeConflicts: NodeResolutionConflict[]
}

export type ResolveNodesResult = {
  components: ResolvedComponentNodes[]
  nodes: ResolvedCircuitNode[]
  pinToNode: Record<string, string>
  diagnostics: ResolveNodesDiagnostics
  conflicts: NodeResolutionConflict[]
}

function getComponentNodes(
  component: CircuitComponent,
  pinToNode: Record<string, string>,
): string[] {
  return component.pins.map((pinId) => pinToNode[makePinKey(component.id, pinId)])
}

function getComponentExtras(
  component: CircuitComponent,
  pinToNode: Record<string, string>,
): Omit<ResolvedComponentNodes, 'component' | 'nodes'> {
  if (
    component.kind === 'voltage_source' ||
    component.kind === 'controlled_voltage_source'
  ) {
    return {
      polarity: {
        positive: pinToNode[makePinKey(component.id, 'positive')],
        negative: pinToNode[makePinKey(component.id, 'negative')],
      },
    }
  }

  if (
    component.kind === 'current_source' ||
    component.kind === 'controlled_current_source'
  ) {
    return {
      direction: {
        from: pinToNode[makePinKey(component.id, 'from')],
        to: pinToNode[makePinKey(component.id, 'to')],
      },
    }
  }

  if (component.kind === 'switch_spst' || component.kind === 'switch_spdt') {
    return {
      state: component.metadata?.state,
    }
  }

  return {}
}

export function resolveNodes({
  components,
  wires,
  namedNodes,
}: ResolveNodesInput): ResolveNodesResult {
  const resolved = resolveCircuitNodes({
    components,
    wires,
    namedNodes,
  })

  const nodeSizeByLabel: Record<string, number> = {}

  for (const node of resolved.nodes) {
    nodeSizeByLabel[node.label] = node.pins.length
  }

  const resolvedComponents: ResolvedComponentNodes[] = components.map((component) => ({
    component,
    nodes: getComponentNodes(component, resolved.pinToNode),
    ...getComponentExtras(component, resolved.pinToNode),
  }))

  const unconnectedPins: UnconnectedPin[] = []

  for (const component of components) {
    if (component.kind === 'junction') {
      continue
    }

    for (const pinId of component.pins) {
      const nodeLabel = resolved.pinToNode[makePinKey(component.id, pinId)]

      if (nodeSizeByLabel[nodeLabel] === 1) {
        unconnectedPins.push({
          componentId: component.id,
          pinId,
          nodeLabel,
        })
      }
    }
  }

  const diagnostics: ResolveNodesDiagnostics = {
    hasGround: resolved.nodes.some((node) => node.kind === 'ground'),
    unconnectedPins,
    namedNodeConflicts: resolved.conflicts,
  }

  return {
    components: resolvedComponents,
    nodes: resolved.nodes,
    pinToNode: resolved.pinToNode,
    diagnostics,
    conflicts: resolved.conflicts,
  }
}
