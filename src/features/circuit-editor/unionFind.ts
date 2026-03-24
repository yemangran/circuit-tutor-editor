import type {
  CircuitComponent,
  CircuitWire,
  NamedNode,
} from './types/circuit'

export function makePinKey(componentId: string, pinId: string): string {
  return `${componentId}:${pinId}`
}

export class UnionFind {
  private parents = new Map<string, string>()
  private ranks = new Map<string, number>()

  add(value: string): void {
    if (this.parents.has(value)) {
      return
    }

    this.parents.set(value, value)
    this.ranks.set(value, 0)
  }

  find(value: string): string {
    if (!this.parents.has(value)) {
      this.add(value)
    }

    const parent = this.parents.get(value)!

    if (parent === value) {
      return value
    }

    const root = this.find(parent)
    this.parents.set(value, root)
    return root
  }

  union(left: string, right: string): string {
    const leftRoot = this.find(left)
    const rightRoot = this.find(right)

    if (leftRoot === rightRoot) {
      return leftRoot
    }

    const leftRank = this.ranks.get(leftRoot) ?? 0
    const rightRank = this.ranks.get(rightRoot) ?? 0

    if (leftRank < rightRank) {
      this.parents.set(leftRoot, rightRoot)
      return rightRoot
    }

    if (leftRank > rightRank) {
      this.parents.set(rightRoot, leftRoot)
      return leftRoot
    }

    this.parents.set(rightRoot, leftRoot)
    this.ranks.set(leftRoot, leftRank + 1)
    return leftRoot
  }

  groups(): Map<string, string[]> {
    const result = new Map<string, string[]>()

    for (const value of this.parents.keys()) {
      const root = this.find(value)
      const group = result.get(root)

      if (group) {
        group.push(value)
      } else {
        result.set(root, [value])
      }
    }

    return result
  }
}

export type ResolvedCircuitNode = {
  label: string
  kind: 'ground' | 'user_named' | 'auto_generated'
  pins: string[]
}

export type NodeResolutionConflict = {
  type: 'named_node_conflict'
  nodeLabel: string
  competingLabels: string[]
  pins: string[]
}

export type ResolveCircuitNodesArgs = {
  components: CircuitComponent[]
  wires: CircuitWire[]
  namedNodes: NamedNode[]
}

export type ResolveCircuitNodesResult = {
  pinToNode: Record<string, string>
  nodes: ResolvedCircuitNode[]
  conflicts: NodeResolutionConflict[]
}

type NamedNodeCandidate = {
  pinKey: string
  label: string
}

type ResolvedGroup = {
  label: string
  kind: ResolvedCircuitNode['kind']
  pins: string[]
}

function getSwitchConductivePairs(component: CircuitComponent): Array<[string, string]> {
  const state = component.metadata?.state

  if (component.kind === 'switch_spst' && state === 'closed') {
    return [[makePinKey(component.id, 'a'), makePinKey(component.id, 'b')]]
  }

  if (component.kind === 'switch_spdt' && state === 'A') {
    return [[makePinKey(component.id, 'common'), makePinKey(component.id, 'throwA')]]
  }

  if (component.kind === 'switch_spdt' && state === 'B') {
    return [[makePinKey(component.id, 'common'), makePinKey(component.id, 'throwB')]]
  }

  return []
}

function sortPins(pins: string[]): string[] {
  const sorted = [...pins]
  sorted.sort((left, right) => left.localeCompare(right))
  return sorted
}

function getNamedNodeCandidates(namedNodes: NamedNode[]): NamedNodeCandidate[] {
  return namedNodes
    .map((namedNode) => ({
      pinKey: namedNode.id,
      label: namedNode.label.trim(),
    }))
    .filter((namedNode) => namedNode.label.length > 0)
}

function compareResolvedGroups(left: ResolvedGroup, right: ResolvedGroup): number {
  if (left.kind === 'ground' && right.kind !== 'ground') {
    return -1
  }

  if (left.kind !== 'ground' && right.kind === 'ground') {
    return 1
  }

  if (left.kind === 'user_named' && right.kind === 'auto_generated') {
    return -1
  }

  if (left.kind === 'auto_generated' && right.kind === 'user_named') {
    return 1
  }

  if (left.kind === 'user_named' && right.kind === 'user_named') {
    const byLabel = left.label.localeCompare(right.label)
    if (byLabel !== 0) {
      return byLabel
    }
  }

  return left.pins[0].localeCompare(right.pins[0])
}

export function resolveCircuitNodes({
  components,
  wires,
  namedNodes,
}: ResolveCircuitNodesArgs): ResolveCircuitNodesResult {
  const unionFind = new UnionFind()
  const groundPins = new Set<string>()

  for (const component of components) {
    for (const pinId of component.pins) {
      const pinKey = makePinKey(component.id, pinId)
      unionFind.add(pinKey)

      if (component.kind === 'ground' && pinId === 'gnd') {
        groundPins.add(pinKey)
      }
    }
  }

  for (const wire of wires) {
    unionFind.union(
      makePinKey(wire.from.componentId, wire.from.pinId),
      makePinKey(wire.to.componentId, wire.to.pinId),
    )
  }

  for (const component of components) {
    for (const [leftPin, rightPin] of getSwitchConductivePairs(component)) {
      unionFind.union(leftPin, rightPin)
    }
  }

  const groups = unionFind.groups()
  const groundRoots = new Set<string>()

  for (const groundPin of groundPins) {
    groundRoots.add(unionFind.find(groundPin))
  }

  const namedCandidatesByRoot = new Map<string, NamedNodeCandidate[]>()

  for (const candidate of getNamedNodeCandidates(namedNodes)) {
    const root = unionFind.find(candidate.pinKey)
    const existing = namedCandidatesByRoot.get(root)

    if (existing) {
      existing.push(candidate)
    } else {
      namedCandidatesByRoot.set(root, [candidate])
    }
  }

  const resolvedGroups: ResolvedGroup[] = []
  const conflicts: NodeResolutionConflict[] = []

  for (const [root, pins] of groups.entries()) {
    const sortedPins = sortPins(pins)
    const candidates = namedCandidatesByRoot.get(root) ?? []
    const uniqueLabels: string[] = []

    for (const candidate of candidates) {
      if (!uniqueLabels.includes(candidate.label)) {
        uniqueLabels.push(candidate.label)
      }
    }

    let kind: ResolvedCircuitNode['kind'] = 'auto_generated'
    let label = ''

    if (groundRoots.has(root)) {
      kind = 'ground'
      label = 'GND'
    } else if (uniqueLabels.length > 0) {
      kind = 'user_named'
      label = uniqueLabels[0]
    }

    if (uniqueLabels.length > 1) {
      conflicts.push({
        type: 'named_node_conflict',
        nodeLabel: label || uniqueLabels[0],
        competingLabels: [...uniqueLabels],
        pins: sortedPins,
      })
    }

    resolvedGroups.push({
      label,
      kind,
      pins: sortedPins,
    })
  }

  resolvedGroups.sort(compareResolvedGroups)

  let autoNodeIndex = 1
  for (const group of resolvedGroups) {
    if (group.kind === 'auto_generated') {
      group.label = `N${autoNodeIndex}`
      autoNodeIndex += 1
    }
  }

  const pinToNode: Record<string, string> = {}
  const nodes: ResolvedCircuitNode[] = resolvedGroups.map((group) => {
    for (const pinKey of group.pins) {
      pinToNode[pinKey] = group.label
    }

    return {
      label: group.label,
      kind: group.kind,
      pins: group.pins,
    }
  })

  return {
    pinToNode,
    nodes,
    conflicts,
  }
}
