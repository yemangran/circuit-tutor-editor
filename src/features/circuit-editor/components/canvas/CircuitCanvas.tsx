import React, { useRef, useState } from 'react'
import type { DragEvent, MouseEvent as ReactMouseEvent } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MarkerType,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeDragHandler,
  type NodeMouseHandler,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { componentTemplates } from '../../componentTemplates'
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
import type { CircuitComponent, CircuitWire } from '../../types/circuit'
import type { ComponentKind } from '../../types/circuit'
import type { CircuitFlowNodeData } from '../nodes'
import i18n from '../../../../i18n'

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
    },
    draggable: true,
    selectable: true,
  }
}

function toFlowEdge(wire: CircuitWire): Edge {
  return {
    id: wire.id,
    source: wire.from.componentId,
    sourceHandle: wire.from.pinId,
    target: wire.to.componentId,
    targetHandle: wire.to.pinId,
    type: 'smoothstep',
    animated: false,
    style: {
      stroke: '#2563eb',
      strokeWidth: 2.5,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: '#2563eb',
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
  const [contextMenu, setContextMenu] = useState<{
    componentId: string
    top: number
    left: number
  } | null>(null)
  const components = useCircuitStore((state) => state.doc.components)
  const wires = useCircuitStore((state) => state.doc.wires)
  const addComponent = useCircuitStore((state) => state.addComponent)
  const addWire = useCircuitStore((state) => state.addWire)
  const clearCanvas = useCircuitStore((state) => state.clearCanvas)
  const deleteComponent = useCircuitStore((state) => state.deleteComponent)
  const duplicateComponent = useCircuitStore((state) => state.duplicateComponent)
  const selectedComponentId = useCircuitStore((state) => state.selectedComponentId)
  const selectComponent = useCircuitStore((state) => state.selectComponent)
  const updateComponentPosition = useCircuitStore(
    (state) => state.updateComponentPosition,
  )
  const updateComponentRotation = useCircuitStore(
    (state) => state.updateComponentRotation,
  )
  const nodes = components.map((component) => ({
    ...toFlowNode(component),
    selected: component.id === selectedComponentId,
  }))
  const edges = wires.map(toFlowEdge)

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

  const handleNodeContextMenu: NodeMouseHandler = (event, node) => {
    event.preventDefault()

    const stageBounds = stageRef.current?.getBoundingClientRect()

    if (!stageBounds) {
      return
    }

    setContextMenu({
      componentId: node.id,
      left: Math.min(event.clientX - stageBounds.left, stageBounds.width - 176),
      top: Math.min(event.clientY - stageBounds.top, stageBounds.height - 148),
    })
    selectComponent(node.id)
  }

  function handleClearCanvas() {
    if (components.length === 0) {
      return
    }

    const confirmed = window.confirm(i18n.t('editor.canvas.clearCanvasConfirm'))

    if (!confirmed) {
      return
    }

    clearCanvas()
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
    if (!contextMenu) {
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
    if (!contextMenu) {
      return
    }

    deleteComponent(contextMenu.componentId)
    closeContextMenu()
  }

  function handleDuplicateSelected() {
    if (!contextMenu) {
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

  function handleCanvasContextMenu(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      event.preventDefault()
      closeContextMenu()
    }
  }

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
          fitView
          connectionMode={ConnectionMode.Loose}
          onConnect={handleConnect}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onNodeDrag={handleNodeDrag}
          onNodeDragStop={handleNodeDragStop}
          onNodeClick={handleNodeClick}
          onNodeContextMenu={handleNodeContextMenu}
          onPaneClick={() => {
            closeContextMenu()
            selectComponent(null)
          }}
        >
          <Background
            variant={BackgroundVariant.Lines}
            gap={CANVAS_GRID_SIZE[0]}
            size={1}
            color="rgba(0, 0, 0, 0.24)"
          />
          <Controls />
        </ReactFlow>
        {contextMenu ? (
          <div
            className="canvas-context-menu"
            style={{ top: contextMenu.top, left: contextMenu.left }}
          >
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
          </div>
        ) : null}
      </div>
      <div className="canvas-foot">
        <div className="canvas-legend">
          <div className="mini-chip">{i18n.t('editor.canvas.legend.drag')}</div>
          <div className="mini-chip">{i18n.t('editor.canvas.legend.connect')}</div>
          <div className="mini-chip">{i18n.t('editor.canvas.legend.inspect')}</div>
        </div>
        <button
          type="button"
          className="toolbar-button canvas-foot-action"
          onClick={handleClearCanvas}
          disabled={components.length === 0}
        >
          {i18n.t('editor.canvas.clearCanvas')}
        </button>
      </div>
    </>
  )
}
