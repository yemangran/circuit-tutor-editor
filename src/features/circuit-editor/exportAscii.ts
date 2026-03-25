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

type VisibleNode = {
  id: string
  label: string
  kind: ExportedNode['kind']
}

type BranchPath = {
  id: string
  from: string
  to: string
  components: ExportedComponent[]
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

  const lineChars = new Set(['─', '│', '└', '├', '┌', '┐', '┘', '┤', '├', '┴', '┬'])

  if (lineChars.has(existing) && lineChars.has(next)) {
    return '+'
  }

  if (existing === '+' || next === '+') {
    return '+'
  }

  return next
}

function sortByLabel<T extends { label: string }>(items: T[]) {
  return [...items].sort((left, right) => left.label.localeCompare(right.label))
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

function buildVisibleNodes(payload: ExportCircuitPayload, edges: RawEdge[]) {
  const degree = computeDegrees(edges)
  const visible = new Map<string, VisibleNode>()

  for (const node of payload.nodes) {
    const nodeDegree = degree.get(node.label) ?? 0
    const isVisible =
      node.kind === 'ground' || node.kind === 'user_named' || nodeDegree !== 2

    if (isVisible) {
      visible.set(node.label, {
        id: node.label,
        label: node.label,
        kind: node.kind,
      })
    }
  }

  return visible
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

function collapseToBranches(payload: ExportCircuitPayload): {
  visibleNodes: Map<string, VisibleNode>
  branches: BranchPath[]
} {
  const rawEdges = buildRawEdges(payload)
  const visibleNodes = buildVisibleNodes(payload, rawEdges)
  const adjacency = buildAdjacency(rawEdges)
  const visitedEdges = new Set<string>()
  const branches: BranchPath[] = []

  for (const nodeId of [...visibleNodes.keys()].sort((left, right) => left.localeCompare(right))) {
    for (const edge of adjacency.get(nodeId) ?? []) {
      if (visitedEdges.has(edge.id)) {
        continue
      }

      const components: ExportedComponent[] = []
      let currentNode = nodeId
      let currentEdge: RawEdge | undefined = edge
      let nextNode = edge.from === nodeId ? edge.to : edge.from

      while (currentEdge) {
        visitedEdges.add(currentEdge.id)
        components.push(currentEdge.component)

        if (visibleNodes.has(nextNode)) {
          branches.push({
            id: `${nodeId}->${nextNode}:${components.map((item) => item.id).join('+')}`,
            from: nodeId,
            to: nextNode,
            components: [...components],
          })
          break
        }

        const candidateEdges = (adjacency.get(nextNode) ?? []).filter(
          (candidate) => candidate.id !== currentEdge?.id,
        )
        const followingEdge = candidateEdges[0]

        if (!followingEdge) {
          branches.push({
            id: `${nodeId}->${nextNode}:${components.map((item) => item.id).join('+')}`,
            from: nodeId,
            to: nextNode,
            components: [...components],
          })
          break
        }

        currentNode = nextNode
        currentEdge = followingEdge
        nextNode = followingEdge.from === currentNode ? followingEdge.to : followingEdge.from
      }
    }
  }

  return {
    visibleNodes,
    branches: branches.sort((left, right) => left.id.localeCompare(right.id)),
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

function renderNodeToken(node: VisibleNode | undefined, fallback: string) {
  if (!node) {
    return `+ ${fallback}`
  }

  if (node.kind === 'ground') {
    return 'GND'
  }

  if (node.kind === 'user_named') {
    return `+ ${node.label}`
  }

  return node.label.startsWith('N') ? '+' : `+ ${node.label}`
}

function renderBranchLine(
  branch: BranchPath,
  visibleNodes: Map<string, VisibleNode>,
  branchCurrents: ExportedBranchCurrent[],
) {
  const components = branch.components.map(renderComponentBlock).join('──')
  const currentText = findBranchCurrents(branch, branchCurrents)
    .map((annotation) => renderBranchCurrent(annotation, branch))
    .join(' ')
  const suffix = currentText ? `──${currentText}` : ''

  return `${components}${suffix}──${renderNodeToken(visibleNodes.get(branch.to), branch.to)}`
}

function selectRoot(visibleNodes: Map<string, VisibleNode>) {
  const nodes = [...visibleNodes.values()]
  return (
    nodes.find((node) => node.kind === 'ground') ??
    sortByLabel(nodes)[0] ?? {
      id: 'ROOT',
      label: 'ROOT',
      kind: 'auto_generated' as const,
    }
  )
}

function buildTreeLines(payload: ExportCircuitPayload) {
  const { visibleNodes, branches } = collapseToBranches(payload)
  const root = selectRoot(visibleNodes)
  const adjacency = new Map<string, BranchPath[]>()

  for (const branch of branches) {
    const list = adjacency.get(branch.from) ?? []
    list.push(branch)
    adjacency.set(branch.from, list)

    const reverseList = adjacency.get(branch.to) ?? []
    reverseList.push({
      ...branch,
      id: `${branch.id}:rev`,
      from: branch.to,
      to: branch.from,
    })
    adjacency.set(branch.to, reverseList)
  }

  for (const [nodeId, nodeBranches] of adjacency.entries()) {
    adjacency.set(
      nodeId,
      [...nodeBranches].sort((left, right) =>
        `${left.to}:${left.components.map((item) => item.label).join('+')}`.localeCompare(
          `${right.to}:${right.components.map((item) => item.label).join('+')}`,
        ),
      ),
    )
  }

  const lines: string[] = [renderNodeToken(root, root.label)]
  const visitedNodes = new Set<string>([root.id])
  const visitedBranchIds = new Set<string>()

  function walk(nodeId: string, prefix: string) {
    const nextBranches = (adjacency.get(nodeId) ?? []).filter((branch) => {
      const normalizedId = branch.id.replace(/:rev$/u, '')
      return !visitedBranchIds.has(normalizedId)
    })

    nextBranches.forEach((branch, index) => {
      const normalizedId = branch.id.replace(/:rev$/u, '')
      visitedBranchIds.add(normalizedId)
      const isLast = index === nextBranches.length - 1
      const connector = isLast ? '└' : '├'
      const branchPrefix = `${prefix}${connector}──`
      lines.push(
        `${branchPrefix}${renderBranchLine(branch, visibleNodes, payload.branchCurrents)}`,
      )

      if (!visitedNodes.has(branch.to)) {
        visitedNodes.add(branch.to)
        walk(branch.to, `${prefix}${isLast ? '   ' : '│  '}`)
      }
    })
  }

  walk(root.id, '')

  return lines
}

export function exportAsciiSummary(payload: ExportCircuitPayload): string {
  const lines = [`Circuit: ${payload.meta.title || 'Untitled'}`, '']
  const branches = collapseToBranches(payload).branches

  for (const branch of branches) {
    lines.push(
      `${branch.from} -- ${branch.components.map((component) => component.label).join(' -> ')} -- ${branch.to}`,
    )
  }

  return lines.join('\n')
}

export function exportAsciiDiagram(payload: ExportCircuitPayload): string {
  const grid = new CharGrid()
  const lines = [
    `Circuit: ${payload.meta.title || 'Untitled'}`,
    '',
    ...buildTreeLines(payload),
  ]

  lines.forEach((line, index) => {
    grid.write(0, index, line)
  })

  return grid.toString()
}
