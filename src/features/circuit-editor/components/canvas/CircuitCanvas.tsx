import React from 'react'
import ReactFlow, {
  Background,
  ConnectionMode,
  Controls,
  MarkerType,
  type Connection,
  type Edge,
  type Node,
  type NodeDragHandler,
  type NodeMouseHandler,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  CapacitorNode,
  ConductanceNode,
  ControlledCurrentSourceNode,
  ControlledVoltageSourceNode,
  CurrentSourceNode,
  GenericLoadNode,
  GroundNode,
  InductorNode,
  ResistorNode,
  SwitchSPDTNode,
  SwitchSPSTNode,
  VoltageSourceNode,
} from '../nodes'
import { useCircuitStore } from '../../store/circuitStore'
import type { CircuitComponent, CircuitWire } from '../../types/circuit'
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
  ground: GroundNode,
}

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
  const components = useCircuitStore((state) => state.doc.components)
  const wires = useCircuitStore((state) => state.doc.wires)
  const addWire = useCircuitStore((state) => state.addWire)
  const clearCanvas = useCircuitStore((state) => state.clearCanvas)
  const selectedComponentId = useCircuitStore((state) => state.selectedComponentId)
  const selectComponent = useCircuitStore((state) => state.selectComponent)
  const updateComponentPosition = useCircuitStore(
    (state) => state.updateComponentPosition,
  )
  const nodes = components.map((component) => ({
    ...toFlowNode(component),
    selected: component.id === selectedComponentId,
  }))
  const edges = wires.map(toFlowEdge)

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
    updateComponentPosition(node.id, node.position)
  }

  const handleNodeClick: NodeMouseHandler = (_, node) => {
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

  return (
    <>
      <div className="canvas-stage">
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
          onNodeDragStop={handleNodeDragStop}
          onNodeClick={handleNodeClick}
          onPaneClick={() => selectComponent(null)}
        >
          <Background />
          <Controls />
        </ReactFlow>
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
