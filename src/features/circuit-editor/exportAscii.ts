import type {
  ExportCircuitPayload,
  ExportedBranchCurrent,
  ExportedComponent,
  ExportedNode,
} from './exportCircuit'
import type { ParameterValue } from './types/circuit'

type RawEdge = {
  id: string
  from: string
  to: string
  component: ExportedComponent
}

type VisibleReason =
  | 'ground'
  | 'named_node'
  | 'explicit_junction'
  | 'structural_branch'
  | 'fallback_anchor'
  | 'promoted_cycle_breaker'
  | 'disconnected_edge_anchor'

type VisibleNode = ExportedNode & {
  id: string
  degree: number
  reasons: VisibleReason[]
}

type BranchPath = {
  id: string
  from: string
  to: string
  components: ExportedComponent[]
  viaHiddenNodes: string[]
}

type LayoutNode = {
  id: string
  x: number
  y: number
  token: string
  label?: string
}

type RoutedBranch = {
  branchId: string
  from: string
  to: string
  route: Array<{ x: number; y: number }>
  renderText: string
}

type AsciiExportResult = {
  diagram: string
  debug: string
  summary: string
}

type NormalizedAsciiGraph = {
  rawEdges: RawEdge[]
  visibleNodes: Map<string, VisibleNode>
  branches: BranchPath[]
  warnings: string[]
  promotedNodes: Array<{ label: string; reason: VisibleReason }>
}

class CharGrid {
  private cells = new Map<string, string>()
  private width = 0
  private height = 0

  write(x: number, y: number, text: string) {
    for (let index = 0; index < text.length; index += 1) {
      this.set(x + index, y, text[index] ?? ' ')
    }
  }

  drawHorizontalLine(x1: number, x2: number, y: number) {
    const from = Math.min(x1, x2)
    const to = Math.max(x1, x2)

    for (let x = from; x <= to; x += 1) {
      this.set(x, y, '─')
    }
  }

  drawVerticalLine(x: number, y1: number, y2: number) {
    const from = Math.min(y1, y2)
    const to = Math.max(y1, y2)

    for (let y = from; y <= to; y += 1) {
      this.set(x, y, '│')
    }
  }

  drawJunction(x: number, y: number) {
    this.set(x, y, '+')
  }

  toString() {
    const rows: string[] = []

    for (let y = 0; y <= this.height; y += 1) {
      let row = ''
      for (let x = 0; x <= this.width; x += 1) {
        row += this.cells.get(`${x}:${y}`) ?? ' '
      }
      rows.push(row.replace(/\s+$/u, ''))
    }

    return rows.join('\n').replace(/\n+$/u, '')
  }

  private set(x: number, y: number, value: string) {
    this.width = Math.max(this.width, x)
    this.height = Math.max(this.height, y)
    const key = `${x}:${y}`
    const existing = this.cells.get(key)
    this.cells.set(key, mergeChars(existing, value))
  }
}

function mergeChars(existing: string | undefined, next: string) {
  if (!existing || existing === ' ') {
    return next
  }

  if (existing === next) {
    return existing
  }

  const lineChars = new Set(['─', '│', '+'])
  const existingIsLine = lineChars.has(existing)
  const nextIsLine = lineChars.has(next)

  if (!nextIsLine) {
    return next
  }

  if (!existingIsLine && nextIsLine) {
    return existing
  }

  if (existingIsLine && nextIsLine) {
    return '+'
  }

  if (existing === '+' || next === '+') {
    return '+'
  }

  return next
}

function sortStrings(values: Iterable<string>) {
  return [...values].sort((left, right) => left.localeCompare(right))
}

function formatParameter(value?: ParameterValue) {
  if (!value) {
    return '?'
  }

  if (value.isUnknown) {
    return '?'
  }

  if (value.expression) {
    return value.unit ? `${value.expression}${value.unit}` : value.expression
  }

  if (value.magnitude == null) {
    return value.unit ?? '?'
  }

  return value.unit ? `${value.magnitude}${value.unit}` : `${value.magnitude}`
}

function renderComponentBlock(component: ExportedComponent) {
  switch (component.kind) {
    case 'resistor':
      return `[${component.label}:${formatParameter(component.parameters.resistance)}]`
    case 'conductance':
      return `[${component.label}:${formatParameter(component.parameters.conductance)}]`
    case 'capacitor':
      return `[${component.label}:${formatParameter(component.parameters.capacitance)}]`
    case 'inductor':
      return `[${component.label}:${formatParameter(component.parameters.inductance)}]`
    case 'voltage_source':
      return `[${component.label}:${formatParameter(component.parameters.voltage)}]`
    case 'current_source':
      return `[${component.label}:${formatParameter(component.parameters.current)}↑]`
    case 'controlled_voltage_source':
    case 'controlled_current_source':
      return `[${component.label}:k=${formatParameter(component.parameters.gain)}]`
    case 'generic_load':
      return `[${component.label}:${formatParameter(component.parameters.power)}]`
    case 'switch_spst':
    case 'switch_spdt':
      return `[${component.label}:${component.state ?? 'open'}]`
    default:
      return `[${component.label}]`
  }
}

function buildRawEdges(payload: ExportCircuitPayload): RawEdge[] {
  const edges: RawEdge[] = []

  for (const component of payload.components) {
    if (component.kind === 'ground' || component.nodes.length < 2) {
      continue
    }

    if (component.kind === 'switch_spdt' && component.nodes.length >= 3) {
      const activeTarget = component.state === 'B' ? component.nodes[2] : component.nodes[1]
      edges.push({
        id: component.id,
        from: component.nodes[0] ?? '?',
        to: activeTarget ?? '?',
        component,
      })
      continue
    }

    edges.push({
      id: component.id,
      from: component.nodes[0] ?? '?',
      to: component.nodes[component.nodes.length - 1] ?? '?',
      component,
    })
  }

  return edges
}

function computeDegrees(edges: RawEdge[]) {
  const degree = new Map<string, number>()

  for (const edge of edges) {
    degree.set(edge.from, (degree.get(edge.from) ?? 0) + 1)
    degree.set(edge.to, (degree.get(edge.to) ?? 0) + 1)
  }

  return degree
}

function getVisibilityReasons(node: ExportedNode, degree: number): VisibleReason[] {
  const reasons: VisibleReason[] = []

  if (node.kind === 'ground') {
    reasons.push('ground')
  }

  if (node.kind === 'user_named') {
    reasons.push('named_node')
  }

  if (node.isExplicitJunction) {
    reasons.push('explicit_junction')
  }

  if (node.kind === 'auto_generated' && degree !== 2) {
    reasons.push('structural_branch')
  }

  return reasons
}

function buildAdjacency(edges: RawEdge[]) {
  const adjacency = new Map<string, RawEdge[]>()

  for (const edge of edges) {
    const fromList = adjacency.get(edge.from) ?? []
    fromList.push(edge)
    adjacency.set(edge.from, fromList)

    const toList = adjacency.get(edge.to) ?? []
    toList.push(edge)
    adjacency.set(edge.to, toList)
  }

  return adjacency
}

function collapseToBranches(
  rawEdges: RawEdge[],
  visibleNodes: Map<string, VisibleNode>,
): { branches: BranchPath[]; visitedEdgeIds: Set<string> } {
  const adjacency = buildAdjacency(rawEdges)
  const visitedEdgeIds = new Set<string>()
  const branches: BranchPath[] = []

  for (const nodeId of sortStrings(visibleNodes.keys())) {
    for (const edge of adjacency.get(nodeId) ?? []) {
      if (visitedEdgeIds.has(edge.id)) {
        continue
      }

      const components: ExportedComponent[] = []
      const viaHiddenNodes: string[] = []
      let currentNode = nodeId
      let currentEdge: RawEdge | undefined = edge
      let nextNode = edge.from === nodeId ? edge.to : edge.from

      while (currentEdge) {
        visitedEdgeIds.add(currentEdge.id)
        components.push(currentEdge.component)

        if (visibleNodes.has(nextNode)) {
          branches.push({
            id: `${nodeId}->${nextNode}:${components.map((item) => item.id).join('+')}`,
            from: nodeId,
            to: nextNode,
            components: [...components],
            viaHiddenNodes: [...viaHiddenNodes],
          })
          break
        }

        viaHiddenNodes.push(nextNode)
        const followingEdge = (adjacency.get(nextNode) ?? []).find(
          (candidate) => candidate.id !== currentEdge?.id && !visitedEdgeIds.has(candidate.id),
        )

        if (!followingEdge) {
          branches.push({
            id: `${nodeId}->${nextNode}:${components.map((item) => item.id).join('+')}`,
            from: nodeId,
            to: nextNode,
            components: [...components],
            viaHiddenNodes: [...viaHiddenNodes],
          })
          break
        }

        currentNode = nextNode
        currentEdge = followingEdge
        nextNode = followingEdge.from === currentNode ? followingEdge.to : followingEdge.from
      }
    }
  }

  branches.sort((left, right) => left.id.localeCompare(right.id))
  return { branches, visitedEdgeIds }
}

function normalizeAsciiGraph(payload: ExportCircuitPayload): NormalizedAsciiGraph {
  const rawEdges = buildRawEdges(payload)
  const degreeByNode = computeDegrees(rawEdges)
  const nodeIndex = new Map(payload.nodes.map((node) => [node.label, node]))
  const warnings: string[] = []
  const promotedNodes: Array<{ label: string; reason: VisibleReason }> = []
  const visibleNodes = new Map<string, VisibleNode>()

  for (const node of payload.nodes) {
    const visibleNode: VisibleNode = {
      ...node,
      id: node.label,
      degree: degreeByNode.get(node.label) ?? 0,
      reasons: getVisibilityReasons(node, degreeByNode.get(node.label) ?? 0),
    }

    if (visibleNode.reasons.length > 0) {
      visibleNodes.set(node.label, visibleNode)
    }
  }

  if (visibleNodes.size === 0 && payload.nodes.length > 0) {
    const fallback = [...payload.nodes].sort((left, right) => left.label.localeCompare(right.label))[0]

    if (fallback) {
      visibleNodes.set(fallback.label, {
        ...fallback,
        id: fallback.label,
        degree: degreeByNode.get(fallback.label) ?? 0,
        reasons: ['fallback_anchor'],
      })
      promotedNodes.push({ label: fallback.label, reason: 'fallback_anchor' })
    }
  }

  let branches: BranchPath[] = []
  let visitedEdgeIds = new Set<string>()

  for (let iteration = 0; iteration < payload.nodes.length + 2; iteration += 1) {
    const collapsed = collapseToBranches(rawEdges, visibleNodes)
    branches = collapsed.branches
    visitedEdgeIds = collapsed.visitedEdgeIds

    const selfLoop = branches.find(
      (branch) => branch.from === branch.to && branch.viaHiddenNodes.length > 0,
    )

    if (!selfLoop) {
      break
    }

    const promotedLabel = selfLoop.viaHiddenNodes[0]
    const promotedNode = nodeIndex.get(promotedLabel)

    if (!promotedNode || visibleNodes.has(promotedLabel)) {
      break
    }

    visibleNodes.set(promotedLabel, {
      ...promotedNode,
      id: promotedLabel,
      degree: degreeByNode.get(promotedLabel) ?? 0,
      reasons: ['promoted_cycle_breaker'],
    })
    promotedNodes.push({ label: promotedLabel, reason: 'promoted_cycle_breaker' })
  }

  const unvisitedEdges = rawEdges.filter((edge) => !visitedEdgeIds.has(edge.id))
  if (unvisitedEdges.length > 0) {
    warnings.push(
      `Found ${unvisitedEdges.length} edge(s) not attached to any visible anchor. Promoting their endpoints.`,
    )

    for (const edge of unvisitedEdges) {
      const candidateLabel = [edge.from, edge.to].find((label) => !visibleNodes.has(label))
      const candidateNode = candidateLabel ? nodeIndex.get(candidateLabel) : undefined

      if (!candidateLabel || !candidateNode) {
        continue
      }

      visibleNodes.set(candidateLabel, {
        ...candidateNode,
        id: candidateLabel,
        degree: degreeByNode.get(candidateLabel) ?? 0,
        reasons: ['disconnected_edge_anchor'],
      })
      promotedNodes.push({ label: candidateLabel, reason: 'disconnected_edge_anchor' })
    }

    const collapsed = collapseToBranches(rawEdges, visibleNodes)
    branches = collapsed.branches
  }

  return {
    rawEdges,
    visibleNodes,
    branches,
    warnings,
    promotedNodes,
  }
}

function findBranchCurrents(
  branch: BranchPath,
  branchCurrents: ExportedBranchCurrent[],
) {
  return branchCurrents.filter(
    (annotation) =>
      (annotation.fromNode === branch.from && annotation.toNode === branch.to) ||
      (annotation.fromNode === branch.to && annotation.toNode === branch.from),
  )
}

function renderBranchCurrent(annotation: ExportedBranchCurrent, branch: BranchPath) {
  const isForward =
    annotation.fromNode === branch.from && annotation.toNode === branch.to
  const arrow = isForward ? '→' : '←'
  const value = annotation.value ? `:${formatParameter(annotation.value)}` : ''
  return `[${annotation.label}${value}${arrow}]`
}

function renderBranchText(branch: BranchPath, branchCurrents: ExportedBranchCurrent[]) {
  const components = branch.components.map(renderComponentBlock).join('──')
  const currentText = findBranchCurrents(branch, branchCurrents)
    .map((annotation) => renderBranchCurrent(annotation, branch))
    .join(' ')

  return currentText ? `${components}──${currentText}` : components
}

function getNodePriority(node: VisibleNode) {
  if (node.kind === 'ground') {
    return 0
  }

  if (node.kind === 'user_named') {
    return 1
  }

  if (node.isExplicitJunction) {
    return 2
  }

  return 3
}

function selectRoot(visibleNodes: Map<string, VisibleNode>) {
  return [...visibleNodes.values()].sort((left, right) => {
    const priorityDelta = getNodePriority(left) - getNodePriority(right)
    if (priorityDelta !== 0) {
      return priorityDelta
    }
    return left.label.localeCompare(right.label)
  })[0]
}

function getNodeToken(node: VisibleNode) {
  if (node.kind === 'ground') {
    return {
      token: 'GND',
      label: undefined,
    }
  }

  if (node.kind === 'user_named') {
    return {
      token: '+',
      label: node.label,
    }
  }

  if (node.isExplicitJunction) {
    return {
      token: '+',
      label: node.kind === 'auto_generated' ? undefined : node.label,
    }
  }

  return {
    token: '+',
    label: node.kind === 'auto_generated' ? undefined : node.label,
  }
}

function buildBranchAdjacency(branches: BranchPath[]) {
  const adjacency = new Map<string, BranchPath[]>()

  for (const branch of branches) {
    const fromList = adjacency.get(branch.from) ?? []
    fromList.push(branch)
    adjacency.set(branch.from, fromList)

    const reverseBranch: BranchPath = {
      ...branch,
      id: `${branch.id}:rev`,
      from: branch.to,
      to: branch.from,
      components: [...branch.components].reverse(),
      viaHiddenNodes: [...branch.viaHiddenNodes].reverse(),
    }
    const toList = adjacency.get(branch.to) ?? []
    toList.push(reverseBranch)
    adjacency.set(branch.to, toList)
  }

  for (const [nodeId, nodeBranches] of adjacency.entries()) {
    adjacency.set(
      nodeId,
      [...nodeBranches].sort((left, right) =>
        left.to === right.to
          ? right.components.length - left.components.length ||
            left.components.map((item) => item.label).join('+').localeCompare(
              right.components.map((item) => item.label).join('+'),
            )
          : left.to.localeCompare(right.to),
      ),
    )
  }

  return adjacency
}

function buildLayout(
  normalized: NormalizedAsciiGraph,
  payload: ExportCircuitPayload,
): { nodes: Map<string, LayoutNode>; routedBranches: RoutedBranch[] } {
  const adjacency = buildBranchAdjacency(normalized.branches)
  const visibleNodes = normalized.visibleNodes
  const root = selectRoot(visibleNodes)

  if (!root) {
    return {
      nodes: new Map<string, LayoutNode>(),
      routedBranches: [],
    }
  }

  const depth = new Map<string, number>()
  const parent = new Map<string, string | null>()
  const parentBranchId = new Map<string, string>()
  const treeChildren = new Map<string, string[]>()
  const queue: string[] = [root.id]
  depth.set(root.id, 0)
  parent.set(root.id, null)

  while (queue.length > 0) {
    const nodeId = queue.shift()!

    for (const branch of adjacency.get(nodeId) ?? []) {
      const normalizedBranchId = branch.id.replace(/:rev$/u, '')

      if (depth.has(branch.to)) {
        continue
      }

      depth.set(branch.to, (depth.get(nodeId) ?? 0) + 1)
      parent.set(branch.to, nodeId)
      parentBranchId.set(branch.to, normalizedBranchId)

      const children = treeChildren.get(nodeId) ?? []
      children.push(branch.to)
      children.sort((left, right) => left.localeCompare(right))
      treeChildren.set(nodeId, children)
      queue.push(branch.to)
    }
  }

  for (const nodeId of sortStrings(visibleNodes.keys())) {
    if (depth.has(nodeId)) {
      continue
    }

    depth.set(nodeId, 0)
    parent.set(nodeId, null)
  }

  const deepestNodeId = [...depth.entries()]
    .sort((left, right) => {
      const depthDelta = (right[1] ?? 0) - (left[1] ?? 0)
      if (depthDelta !== 0) {
        return depthDelta
      }
      return left[0].localeCompare(right[0])
    })[0]?.[0]

  const backboneNodes = new Set<string>()
  const backboneBranchIds = new Set<string>()
  let currentBackboneNodeId: string | undefined = deepestNodeId

  while (currentBackboneNodeId) {
    backboneNodes.add(currentBackboneNodeId)
    const currentBranchId = parentBranchId.get(currentBackboneNodeId)
    if (currentBranchId) {
      backboneBranchIds.add(currentBranchId)
    }
    currentBackboneNodeId = parent.get(currentBackboneNodeId) ?? undefined
  }

  let nextLeafRow = 4
  const row = new Map<string, number>()

  function assignRows(nodeId: string): number {
    const children = (treeChildren.get(nodeId) ?? []).filter((childId) => !backboneNodes.has(childId))

    if (children.length === 0) {
      const assigned = backboneNodes.has(nodeId) ? 0 : nextLeafRow
      row.set(nodeId, assigned)
      if (!backboneNodes.has(nodeId)) {
        nextLeafRow += 4
      }
      return assigned
    }

    const childRows = children.map((childId) => assignRows(childId))
    const assigned = backboneNodes.has(nodeId)
      ? 0
      : Math.round((childRows[0] + childRows[childRows.length - 1]) / 2)
    row.set(nodeId, assigned)
    return assigned
  }

  assignRows(root.id)

  for (const backboneNodeId of backboneNodes) {
    row.set(backboneNodeId, 0)
    const branchChildren = (treeChildren.get(backboneNodeId) ?? []).filter(
      (childId) => !backboneNodes.has(childId),
    )

    for (const childId of branchChildren) {
      assignRows(childId)
    }
  }

  for (const nodeId of sortStrings(visibleNodes.keys())) {
    if (!row.has(nodeId)) {
      row.set(nodeId, nextLeafRow)
      nextLeafRow += 4
    }
  }

  const maxDepth = Math.max(...depth.values())
  const gapByDepth = new Array(Math.max(maxDepth, 0) + 1).fill(18)

  for (const branch of normalized.branches) {
    const branchText = renderBranchText(branch, payload.branchCurrents)
    const branchDepth = Math.min(depth.get(branch.from) ?? 0, depth.get(branch.to) ?? 0)
    gapByDepth[branchDepth] = Math.max(gapByDepth[branchDepth] ?? 18, branchText.length + 8)
  }

  const xByDepth = new Map<number, number>()
  xByDepth.set(0, 0)

  for (let currentDepth = 1; currentDepth <= maxDepth; currentDepth += 1) {
    xByDepth.set(
      currentDepth,
      (xByDepth.get(currentDepth - 1) ?? 0) + (gapByDepth[currentDepth - 1] ?? 18),
    )
  }

  const layoutNodes = new Map<string, LayoutNode>()

  for (const visibleNode of visibleNodes.values()) {
    const nodeToken = getNodeToken(visibleNode)
    layoutNodes.set(visibleNode.id, {
      id: visibleNode.id,
      x: xByDepth.get(depth.get(visibleNode.id) ?? 0) ?? 0,
      y: row.get(visibleNode.id) ?? 0,
      token: nodeToken.token,
      label: nodeToken.label,
    })
  }

  const routedBranches: RoutedBranch[] = []
  const pairGroups = new Map<string, BranchPath[]>()

  for (const branch of normalized.branches) {
    const pairKey = [branch.from, branch.to].sort((left, right) => left.localeCompare(right)).join('<->')
    const group = pairGroups.get(pairKey) ?? []
    group.push(branch)
    group.sort((left, right) => {
      const componentDelta = right.components.length - left.components.length
      if (componentDelta !== 0) {
        return componentDelta
      }
      return left.id.localeCompare(right.id)
    })
    pairGroups.set(pairKey, group)
  }

  let extraLaneOffset = 1

  for (const branch of normalized.branches) {
    const fromNode = layoutNodes.get(branch.from)
    const toNode = layoutNodes.get(branch.to)

    if (!fromNode || !toNode) {
      continue
    }

    let start = fromNode
    let end = toNode
    let components = branch.components

    if (
      fromNode.x > toNode.x ||
      (fromNode.x === toNode.x && fromNode.y > toNode.y)
    ) {
      start = toNode
      end = fromNode
      components = [...branch.components].reverse()
    }

    const renderText =
      components.map(renderComponentBlock).join('──') +
      (() => {
        const currentText = findBranchCurrents(branch, payload.branchCurrents)
          .map((annotation) => renderBranchCurrent(annotation, branch))
          .join(' ')

        return currentText ? `──${currentText}` : ''
      })()

    const pairKey = [branch.from, branch.to].sort((left, right) => left.localeCompare(right)).join('<->')
    const pairGroup = pairGroups.get(pairKey) ?? [branch]
    const pairIndex = pairGroup.findIndex((candidate) => candidate.id === branch.id)
    const normalizedBranchId = branch.id.replace(/:rev$/u, '')
    const isBackboneBranch = backboneBranchIds.has(normalizedBranchId)
    const isPrimaryPairBranch = pairIndex <= 0
    const sameColumn = start.x === end.x

    let route: Array<{ x: number; y: number }>

    if (sameColumn) {
      const laneX = Math.max(start.x, end.x) + renderText.length + 6 + pairIndex * 4
      route = [
        { x: start.x, y: start.y },
        { x: laneX, y: start.y },
        { x: laneX, y: end.y },
        { x: end.x, y: end.y },
      ]
    } else if (isBackboneBranch && isPrimaryPairBranch) {
      route = [
        { x: start.x, y: start.y },
        { x: end.x, y: start.y },
        { x: end.x, y: end.y },
      ]
    } else if (
      parent.get(branch.from) === branch.to ||
      parent.get(branch.to) === branch.from
    ) {
      const childNodeId =
        (depth.get(branch.from) ?? 0) > (depth.get(branch.to) ?? 0)
          ? branch.from
          : branch.to
      const isPrimaryTreeEdge = parentBranchId.get(childNodeId) === normalizedBranchId
      const laneY = isPrimaryTreeEdge
        ? row.get(childNodeId) ?? Math.max(start.y, end.y) + 4
        : start.y === end.y
          ? start.y + 4 * pairIndex
          : Math.max(start.y, end.y) + 4 * (extraLaneOffset + pairIndex)

      route = [
        { x: start.x, y: start.y },
        { x: start.x, y: laneY },
        { x: end.x, y: laneY },
        { x: end.x, y: end.y },
      ]

      if (!isPrimaryTreeEdge) {
        extraLaneOffset += 1
      }
    } else {
      const laneY = Math.max(start.y, end.y) + 4 * (extraLaneOffset + pairIndex)

      route = [
        { x: start.x, y: start.y },
        { x: start.x, y: laneY },
        { x: end.x, y: laneY },
        { x: end.x, y: end.y },
      ]

      extraLaneOffset += 1
    }

    routedBranches.push({
      branchId: branch.id,
      from: branch.from,
      to: branch.to,
      route,
      renderText,
    })
  }

  return {
    nodes: layoutNodes,
    routedBranches,
  }
}

function drawLabeledHorizontalSegment(
  grid: CharGrid,
  x1: number,
  x2: number,
  y: number,
  text: string,
) {
  const left = Math.min(x1, x2)
  const right = Math.max(x1, x2)
  const span = right - left + 1

  if (!text || span < text.length + 2) {
    grid.drawHorizontalLine(left, right, y)
    return
  }

  const textStart = left + Math.max(1, Math.floor((span - text.length) / 2))
  const textEnd = textStart + text.length - 1

  if (textStart > left) {
    grid.drawHorizontalLine(left, textStart - 1, y)
  }

  grid.write(textStart, y, text)

  if (textEnd < right) {
    grid.drawHorizontalLine(textEnd + 1, right, y)
  }
}

function renderAsciiDiagram(payload: ExportCircuitPayload): AsciiExportResult {
  const normalized = normalizeAsciiGraph(payload)
  const layout = buildLayout(normalized, payload)
  const grid = new CharGrid()

  for (const routedBranch of layout.routedBranches) {
    const horizontalSegments = routedBranch.route
      .map((point, index) => ({
        index,
        start: point,
        end: routedBranch.route[index + 1],
      }))
      .filter(
        (segment): segment is { index: number; start: { x: number; y: number }; end: { x: number; y: number } } =>
          Boolean(segment.end) && segment.start.y === segment.end.y,
      )
    const textSegmentIndex = horizontalSegments.sort(
      (left, right) =>
        Math.abs(right.end.x - right.start.x) - Math.abs(left.end.x - left.start.x),
    )[0]?.index

    for (let index = 0; index < routedBranch.route.length - 1; index += 1) {
      const start = routedBranch.route[index]
      const end = routedBranch.route[index + 1]
      const isHorizontal = start.y === end.y

      if (isHorizontal) {
        const shouldPlaceText = index === textSegmentIndex

        if (shouldPlaceText) {
          drawLabeledHorizontalSegment(grid, start.x, end.x, start.y, routedBranch.renderText)
        } else {
          grid.drawHorizontalLine(start.x, end.x, start.y)
        }
      } else {
        grid.drawVerticalLine(start.x, start.y, end.y)
      }
    }
  }

  for (const node of layout.nodes.values()) {
    if (node.token === '+') {
      grid.drawJunction(node.x, node.y)
    } else {
      grid.write(node.x, node.y, node.token)
    }

    if (node.label) {
      const labelY = node.y === 0 ? node.y + 1 : node.y - 1
      grid.write(node.x + node.token.length + 2, labelY, node.label)
    }
  }

  const diagramBody = grid.toString()
  const diagram = [`Circuit: ${payload.meta.title || 'Untitled'}`, '', diagramBody]
    .filter((line, index) => !(index === 2 && line.length === 0))
    .join('\n')

  return {
    diagram,
    debug: formatDebugReport(payload, normalized, layout),
    summary: renderAsciiSummary(payload, normalized),
  }
}

function renderAsciiSummary(
  payload: ExportCircuitPayload,
  normalized = normalizeAsciiGraph(payload),
): string {
  const lines = [`Circuit: ${payload.meta.title || 'Untitled'}`, '']

  for (const branch of normalized.branches) {
    lines.push(
      `${branch.from} -- ${branch.components.map((component) => component.label).join(' -> ')} -- ${branch.to}`,
    )
  }

  return lines.join('\n')
}

function formatDebugReport(
  payload: ExportCircuitPayload,
  normalized: NormalizedAsciiGraph,
  layout: { nodes: Map<string, LayoutNode>; routedBranches: RoutedBranch[] },
) {
  const sections: string[] = []

  sections.push('# ASCII Export Debug')
  sections.push(`title: ${payload.meta.title || 'Untitled'}`)
  sections.push(`rawEdges: ${normalized.rawEdges.length}`)
  sections.push(`visibleNodes: ${normalized.visibleNodes.size}`)
  sections.push(`branches: ${normalized.branches.length}`)
  sections.push('')

  sections.push('## Node Visibility')
  for (const node of [...payload.nodes].sort((left, right) => left.label.localeCompare(right.label))) {
    const visibleNode = normalized.visibleNodes.get(node.label)
    const degree = visibleNode?.degree ?? 0
    const reasons = visibleNode?.reasons.join(', ') ?? 'hidden'
    sections.push(
      `- ${node.label}: kind=${node.kind}, pinCount=${node.pinCount}, explicitJunction=${node.isExplicitJunction}, degree=${degree}, visibility=${reasons}`,
    )
  }
  sections.push('')

  sections.push('## Raw Edges')
  for (const edge of normalized.rawEdges) {
    sections.push(
      `- ${edge.component.label}(${edge.component.kind}): ${edge.from} -> ${edge.to}`,
    )
  }
  sections.push('')

  sections.push('## Collapsed Branches')
  for (const branch of normalized.branches) {
    sections.push(
      `- ${branch.id}: ${branch.from} -> ${branch.to}; components=${branch.components.map((component) => component.label).join(' -> ')}; hiddenNodes=${branch.viaHiddenNodes.join(' -> ') || '(none)'}`,
    )
  }
  sections.push('')

  sections.push('## Layout Nodes')
  for (const node of [...layout.nodes.values()].sort((left, right) => left.id.localeCompare(right.id))) {
    sections.push(
      `- ${node.id}: x=${node.x}, y=${node.y}, token=${node.token}, label=${node.label ?? '(none)'}`,
    )
  }
  sections.push('')

  sections.push('## Routed Branches')
  for (const routedBranch of layout.routedBranches) {
    sections.push(
      `- ${routedBranch.branchId}: ${routedBranch.route.map((point) => `(${point.x},${point.y})`).join(' -> ')}; text=${routedBranch.renderText}`,
    )
  }

  if (normalized.promotedNodes.length > 0) {
    sections.push('')
    sections.push('## Promoted Nodes')
    for (const promotedNode of normalized.promotedNodes) {
      sections.push(`- ${promotedNode.label}: ${promotedNode.reason}`)
    }
  }

  if (normalized.warnings.length > 0) {
    sections.push('')
    sections.push('## Warnings')
    for (const warning of normalized.warnings) {
      sections.push(`- ${warning}`)
    }
  }

  return sections.join('\n')
}

export function exportAsciiSummary(payload: ExportCircuitPayload): string {
  return renderAsciiDiagram(payload).summary
}

export function exportAsciiDebugReport(payload: ExportCircuitPayload): string {
  return renderAsciiDiagram(payload).debug
}

export function exportAsciiDiagram(payload: ExportCircuitPayload): string {
  return renderAsciiDiagram(payload).diagram
}
