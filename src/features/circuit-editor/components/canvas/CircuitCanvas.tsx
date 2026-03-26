import React, { useEffect, useRef, useState } from 'react'
import type { DragEvent, MouseEvent as ReactMouseEvent } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  Position,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeDragHandler,
  type EdgeMouseHandler,
  type NodeMouseHandler,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { componentTemplates } from '../../componentTemplates'
import { resolveNodes } from '../../resolveNodes'
import {
  CapacitorNode,
  ConductanceNode,
  ControlledCurrentSourceNode,
  ControlledVoltageSourceNode,
  CurrentSourceNode,
  GenericLoadNode,
  GroundNode,
  InductorNode,
  JunctionNode,
  ResistorNode,
  SwitchSPDTNode,
  SwitchSPSTNode,
  VoltageSourceNode,
} from '../nodes'
import { useCircuitStore } from '../../store/circuitStore'
import type {
  BranchCurrentAnnotation,
  CircuitComponent,
  CircuitWire,
} from '../../types/circuit'
import type { ComponentKind } from '../../types/circuit'
import type { CircuitFlowNodeData } from '../nodes'
import i18n from '../../../../i18n'
import { BranchWireEdge } from './BranchWireEdge'
import { makePinKey } from '../../unionFind'

const nodeTypes = {
  resistor: ResistorNode,
  conductance: ConductanceNode,
  capacitor: CapacitorNode,
  inductor: InductorNode,
  voltage_source: VoltageSourceNode,
  current_source: CurrentSourceNode,
  controlled_voltage_source: ControlledVoltageSourceNode,
  controlled_current_source: ControlledCurrentSourceNode,
  generic_load: GenericLoadNode,
  switch_spst: SwitchSPSTNode,
  switch_spdt: SwitchSPDTNode,
  junction: JunctionNode,
  ground: GroundNode,
}

const edgeTypes = {
  branchWire: BranchWireEdge,
}

const CANVAS_GRID_SIZE: [number, number] = [20, 20]
const PALETTE_MIME_TYPE = 'application/x-circuit-component'

function formatParameterText(component: CircuitComponent): string | undefined {
  const parameterEntries = Object.entries(component.parameters)

  if (parameterEntries.length === 0) {
    if (component.metadata?.state === 'open') {
      return i18n.t('panel.switch.open')
    }

    if (component.metadata?.state === 'closed') {
      return i18n.t('panel.switch.closed')
    }

    return component.metadata?.state
  }

  const [parameterKey, parameterValue] = parameterEntries[0]
  const parameterLabel = i18n.t(`panel.parameterNames.${parameterKey}`, {
    defaultValue: parameterKey,
  })

  if (parameterValue.isUnknown) {
    return `${parameterLabel}: ?`
  }

  if (parameterValue.magnitude != null) {
    return parameterValue.unit
      ? `${parameterValue.magnitude} ${parameterValue.unit}`
      : `${parameterValue.magnitude}`
  }

  if (parameterValue.expression) {
    return parameterValue.expression
  }

  return parameterValue.unit ?? component.metadata?.state
}

function toFlowNode(component: CircuitComponent): Node<CircuitFlowNodeData> {
  return {
    id: component.id,
    type: component.kind,
    position: component.position,
    data: {
      kind: component.kind,
      label: component.label,
      pins: [...component.pins],
      parameterText: formatParameterText(component),
      rotation: component.rotation,
      connectedPinIds: [],
    },
    draggable: true,
    selectable: true,
  }
}

function formatBranchCurrentValue(
  annotation: BranchCurrentAnnotation | undefined,
): string | undefined {
  if (!annotation?.value) {
    return undefined
  }

  if (annotation.value.isUnknown) {
    return '?'
  }

  if (annotation.value.magnitude != null) {
    return annotation.value.unit
      ? `${annotation.value.magnitude} ${annotation.value.unit}`
      : `${annotation.value.magnitude}`
  }

  return annotation.value.unit
}

function isSameEndpoint(
  left: { componentId: string; pinId: string },
  right: { componentId: string; pinId: string },
) {
  return left.componentId === right.componentId && left.pinId === right.pinId
}

function rotateHandlePosition(
  position: Position,
  rotation: CircuitComponent['rotation'],
): Position {
  switch (rotation) {
    case 90:
      if (position === Position.Left) return Position.Top
      if (position === Position.Right) return Position.Bottom
      if (position === Position.Top) return Position.Right
      return Position.Left
    case 180:
      if (position === Position.Left) return Position.Right
      if (position === Position.Right) return Position.Left
      if (position === Position.Top) return Position.Bottom
      return Position.Top
    case 270:
      if (position === Position.Left) return Position.Bottom
      if (position === Position.Right) return Position.Top
      if (position === Position.Top) return Position.Left
      return Position.Right
    default:
      return position
  }
}

function getBaseHandlePosition(
  component: CircuitComponent,
  pinId: string,
): Position {
  if (component.kind === 'ground') {
    return Position.Top
  }

  if (component.kind === 'switch_spdt') {
    if (pinId === 'common') return Position.Left
    return Position.Right
  }

  if (component.kind === 'junction') {
    if (pinId === 'n') return Position.Top
    if (pinId === 's') return Position.Bottom
    if (pinId === 'e') return Position.Right
    if (pinId === 'w') return Position.Left
    const extraIndex = Number(pinId.slice(1)) - 1
    return extraIndex % 2 === 0 ? Position.Left : Position.Right
  }

  const pinIndex = component.pins.indexOf(pinId)
  return pinIndex <= 0 ? Position.Left : Position.Right
}

function getHandlePositionHint(
  component: CircuitComponent | undefined,
  pinId: string,
): Position | undefined {
  if (!component) {
    return undefined
  }

  return rotateHandlePosition(
    getBaseHandlePosition(component, pinId),
    component.rotation,
  )
}

function toFlowEdge(
  wire: CircuitWire,
  branchCurrent: BranchCurrentAnnotation | undefined,
  isSelected: boolean,
  sourceHandlePosition: Position | undefined,
  targetHandlePosition: Position | undefined,
): Edge {
  const directionMatchesWire =
    branchCurrent &&
    isSameEndpoint(branchCurrent.fromPinRef, wire.from) &&
    isSameEndpoint(branchCurrent.toPinRef, wire.to)

  return {
    id: wire.id,
    source: wire.from.componentId,
    sourceHandle: wire.from.pinId,
    target: wire.to.componentId,
    targetHandle: wire.to.pinId,
    type: 'branchWire',
    animated: false,
    selected: isSelected,
    data: {
      currentLabel: branchCurrent?.label,
      currentValueText: formatBranchCurrentValue(branchCurrent),
      hasBranchCurrent: Boolean(branchCurrent),
      isSelected,
      directionReversed: branchCurrent ? !directionMatchesWire : undefined,
      sourceHandlePosition,
      targetHandlePosition,
    },
  }
}

function isValidConnection(connection: Connection): connection is Required<
  Pick<Connection, 'source' | 'sourceHandle' | 'target' | 'targetHandle'>
> {
  return Boolean(
    connection.source &&
      connection.sourceHandle &&
      connection.target &&
      connection.targetHandle,
  )
}

export default function CircuitCanvas() {
  const { screenToFlowPosition } = useReactFlow()
  const stageRef = useRef<HTMLDivElement>(null)
  const [contextMenu, setContextMenu] = useState<
    | {
        kind: 'component'
        componentId: string
        top: number
        left: number
      }
    | {
        kind: 'wire'
        wireId: string
        top: number
        left: number
      }
    | null
  >(null)
  const components = useCircuitStore((state) => state.doc.components)
  const wires = useCircuitStore((state) => state.doc.wires)
  const annotations = useCircuitStore((state) => state.doc.annotations)
  const namedNodes = useCircuitStore((state) => state.doc.namedNodes)
  const addComponent = useCircuitStore((state) => state.addComponent)
  const addWire = useCircuitStore((state) => state.addWire)
  const deleteComponent = useCircuitStore((state) => state.deleteComponent)
  const deleteWire = useCircuitStore((state) => state.deleteWire)
  const duplicateComponent = useCircuitStore((state) => state.duplicateComponent)
  const selectedComponentId = useCircuitStore((state) => state.selectedComponentId)
  const selectedWireId = useCircuitStore((state) => state.selectedWireId)
  const selectComponent = useCircuitStore((state) => state.selectComponent)
  const selectWire = useCircuitStore((state) => state.selectWire)
  const updateComponentPosition = useCircuitStore(
    (state) => state.updateComponentPosition,
  )
  const updateComponentRotation = useCircuitStore(
    (state) => state.updateComponentRotation,
  )
  const upsertBranchCurrentAnnotation = useCircuitStore(
    (state) => state.upsertBranchCurrentAnnotation,
  )
  const removeBranchCurrentAnnotation = useCircuitStore(
    (state) => state.removeBranchCurrentAnnotation,
  )
  const connectedPinsByComponent = new Map<string, Set<string>>()

  for (const wire of wires) {
    if (!connectedPinsByComponent.has(wire.from.componentId)) {
      connectedPinsByComponent.set(wire.from.componentId, new Set())
    }
    if (!connectedPinsByComponent.has(wire.to.componentId)) {
      connectedPinsByComponent.set(wire.to.componentId, new Set())
    }

    connectedPinsByComponent.get(wire.from.componentId)?.add(wire.from.pinId)
    connectedPinsByComponent.get(wire.to.componentId)?.add(wire.to.pinId)
  }

  const resolved = resolveNodes({
    components,
    wires,
    namedNodes,
  })
  const namedPinIdsByComponent = new Map<string, string[]>()

  for (const namedNode of namedNodes) {
    const [componentId, pinId] = namedNode.id.split(':')

    if (!componentId || !pinId) {
      continue
    }

    const pinIds = namedPinIdsByComponent.get(componentId) ?? []
    pinIds.push(pinId)
    namedPinIdsByComponent.set(componentId, pinIds)
  }

  const nodes = components.map((component) => {
    const flowNode = toFlowNode(component)

    return {
      ...flowNode,
      data: {
        ...flowNode.data,
        connectedPinIds: Array.from(
          connectedPinsByComponent.get(component.id) ?? [],
        ),
        pinNodeLabels: Object.fromEntries(
          component.pins.map((pinId) => [
            pinId,
            resolved.pinToNode[makePinKey(component.id, pinId)] ?? '',
          ]),
        ),
        namedPinIds: namedPinIdsByComponent.get(component.id) ?? [],
      },
      selected: component.id === selectedComponentId,
    }
  })
  const componentMap = new Map(
    components.map((component) => [component.id, component] as const),
  )
  const branchCurrentMap = new Map(
    annotations
      .filter(
        (annotation): annotation is BranchCurrentAnnotation =>
          annotation.type === 'branch_current',
      )
      .flatMap((annotation) =>
        annotation.targetWireIds.map((wireId) => [wireId, annotation] as const),
      ),
  )
  const edges = wires.map((wire) =>
    toFlowEdge(
      wire,
      branchCurrentMap.get(wire.id),
      wire.id === selectedWireId,
      getHandlePositionHint(componentMap.get(wire.from.componentId), wire.from.pinId),
      getHandlePositionHint(componentMap.get(wire.to.componentId), wire.to.pinId),
    ),
  )

  function snapToCanvasGrid(position: { x: number; y: number }) {
    return {
      x: Math.round(position.x / CANVAS_GRID_SIZE[0]) * CANVAS_GRID_SIZE[0],
      y: Math.round(position.y / CANVAS_GRID_SIZE[1]) * CANVAS_GRID_SIZE[1],
    }
  }

  function isComponentKind(value: string): value is ComponentKind {
    return value in componentTemplates
  }

  function handleConnect(connection: Connection) {
    if (!isValidConnection(connection)) {
      return
    }

    if (
      connection.source === connection.target &&
      connection.sourceHandle === connection.targetHandle
    ) {
      return
    }

    addWire(
      {
        componentId: connection.source!,
        pinId: connection.sourceHandle!,
      },
      {
        componentId: connection.target!,
        pinId: connection.targetHandle!,
      },
    )
  }

  const handleNodeDragStop: NodeDragHandler = (_, node) => {
    const component = components.find((c) => c.id === node.id)

    let snappedPosition
    if (component?.kind === 'junction') {
      // Junction 节点尺寸是 28x28，让中心点吸附到网格交点
      const JUNCTION_HALF_SIZE = 14

      // 计算中心点
      const centerX = node.position.x + JUNCTION_HALF_SIZE
      const centerY = node.position.y + JUNCTION_HALF_SIZE

      // 将中心点吸附到网格交点
      const snappedCenterX = Math.round(centerX / CANVAS_GRID_SIZE[0]) * CANVAS_GRID_SIZE[0]
      const snappedCenterY = Math.round(centerY / CANVAS_GRID_SIZE[1]) * CANVAS_GRID_SIZE[1]

      // 计算新的 position（左上角坐标）
      snappedPosition = {
        x: snappedCenterX - JUNCTION_HALF_SIZE,
        y: snappedCenterY - JUNCTION_HALF_SIZE,
      }
    } else {
      // 其他节点：左上角吸附到网格交点
      snappedPosition = snapToCanvasGrid(node.position)
    }

    updateComponentPosition(node.id, snappedPosition)
  }

  const handleNodeDrag: NodeDragHandler = (_, node) => {
    updateComponentPosition(node.id, node.position)
  }

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    setContextMenu(null)
    selectComponent(node.id)
  }

  const handleEdgeClick: EdgeMouseHandler = (_, edge) => {
    setContextMenu(null)
    selectWire(edge.id)
  }

  const handleEdgeContextMenu: EdgeMouseHandler = (event, edge) => {
    event.preventDefault()

    const stageBounds = stageRef.current?.getBoundingClientRect()

    if (!stageBounds) {
      return
    }

    setContextMenu({
      kind: 'wire',
      wireId: edge.id,
      left: Math.min(event.clientX - stageBounds.left, stageBounds.width - 192),
      top: Math.min(event.clientY - stageBounds.top, stageBounds.height - 112),
    })
    selectWire(edge.id)
  }

  const handleNodeContextMenu: NodeMouseHandler = (event, node) => {
    event.preventDefault()

    const stageBounds = stageRef.current?.getBoundingClientRect()

    if (!stageBounds) {
      return
    }

    setContextMenu({
      kind: 'component',
      componentId: node.id,
      left: Math.min(event.clientX - stageBounds.left, stageBounds.width - 176),
      top: Math.min(event.clientY - stageBounds.top, stageBounds.height - 148),
    })
    selectComponent(node.id)
  }


  function closeContextMenu() {
    setContextMenu(null)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    closeContextMenu()

    const kind = event.dataTransfer.getData(PALETTE_MIME_TYPE)

    if (!isComponentKind(kind)) {
      return
    }

    const position = snapToCanvasGrid(
      screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      }),
    )

    addComponent(kind, position)
  }

  function handleRotateSelected() {
    if (!contextMenu || contextMenu.kind !== 'component') {
      return
    }

    const component = components.find(
      (item) => item.id === contextMenu.componentId,
    )

    if (!component) {
      closeContextMenu()
      return
    }

    updateComponentRotation(
      component.id,
      ((component.rotation + 90) % 360) as 0 | 90 | 180 | 270,
    )
    closeContextMenu()
  }

  function handleDeleteSelected() {
    if (!contextMenu || contextMenu.kind !== 'component') {
      return
    }

    deleteComponent(contextMenu.componentId)
    closeContextMenu()
  }

  function handleDeleteSelectedWire() {
    if (!contextMenu || contextMenu.kind !== 'wire') {
      return
    }

    deleteWire(contextMenu.wireId)
    closeContextMenu()
  }

  function handleDuplicateSelected() {
    if (!contextMenu || contextMenu.kind !== 'component') {
      return
    }

    const component = components.find(
      (item) => item.id === contextMenu.componentId,
    )

    if (!component) {
      closeContextMenu()
      return
    }

    duplicateComponent(contextMenu.componentId, {
      x: component.position.x + CANVAS_GRID_SIZE[0] * 2,
      y: component.position.y + CANVAS_GRID_SIZE[1] * 2,
    })
    closeContextMenu()
  }

  function handleCreateBranchCurrent() {
    if (!contextMenu || contextMenu.kind !== 'wire') {
      return
    }

    upsertBranchCurrentAnnotation(contextMenu.wireId)
    closeContextMenu()
  }

  function handleRemoveBranchCurrent() {
    if (!contextMenu || contextMenu.kind !== 'wire') {
      return
    }

    removeBranchCurrentAnnotation(contextMenu.wireId)
    closeContextMenu()
  }

  function handleCanvasContextMenu(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      event.preventDefault()
      closeContextMenu()
    }
  }

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) {
        return false
      }

      return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      )
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      if (selectedComponentId) {
        event.preventDefault()
        closeContextMenu()
        deleteComponent(selectedComponentId)
        return
      }

      if (selectedWireId) {
        event.preventDefault()
        closeContextMenu()
        deleteWire(selectedWireId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteComponent, deleteWire, selectedComponentId, selectedWireId])

  return (
    <>
      <div
        ref={stageRef}
        className="canvas-stage"
        onContextMenu={handleCanvasContextMenu}
      >
        {components.length === 0 ? (
          <div className="canvas-empty empty-state">
            <div className="field-label">{i18n.t('editor.canvas.emptyTitle')}</div>
            <p className="support-text">{i18n.t('editor.canvas.emptyBody')}</p>
          </div>
        ) : null}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          connectionMode={ConnectionMode.Loose}
          onConnect={handleConnect}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onNodeDrag={handleNodeDrag}
          onNodeDragStop={handleNodeDragStop}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onEdgeContextMenu={handleEdgeContextMenu}
          onNodeContextMenu={handleNodeContextMenu}
          onPaneClick={() => {
            closeContextMenu()
            selectComponent(null)
            selectWire(null)
          }}
        >
          <Background
            variant={BackgroundVariant.Lines}
            gap={CANVAS_GRID_SIZE[0]}
            size={1}
            color="rgba(0, 0, 0, 0.24)"
          />
          <Controls showInteractive={false} />
        </ReactFlow>
        {contextMenu ? (
          <div
            className="canvas-context-menu"
            style={{ top: contextMenu.top, left: contextMenu.left }}
          >
            {contextMenu.kind === 'component' ? (
              <>
                <button
                  type="button"
                  className="canvas-context-menu-item"
                  onClick={handleRotateSelected}
                >
                  {i18n.t('editor.contextMenu.rotate')}
                </button>
                <button
                  type="button"
                  className="canvas-context-menu-item"
                  onClick={handleDuplicateSelected}
                >
                  {i18n.t('editor.contextMenu.duplicate')}
                </button>
                <button
                  type="button"
                  className="canvas-context-menu-item"
                  data-tone="danger"
                  onClick={handleDeleteSelected}
                >
                  {i18n.t('editor.contextMenu.delete')}
                </button>
              </>
            ) : (
              <>
                {!branchCurrentMap.has(contextMenu.wireId) ? (
                  <button
                    type="button"
                    className="canvas-context-menu-item"
                    onClick={handleCreateBranchCurrent}
                  >
                    {i18n.t('editor.contextMenu.addBranchCurrent')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="canvas-context-menu-item"
                    data-tone="danger"
                    onClick={handleRemoveBranchCurrent}
                  >
                    {i18n.t('editor.contextMenu.removeBranchCurrent')}
                  </button>
                )}
                <button
                  type="button"
                  className="canvas-context-menu-item"
                  data-tone="danger"
                  onClick={handleDeleteSelectedWire}
                >
                  {i18n.t('editor.contextMenu.delete')}
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </>
  )
}
