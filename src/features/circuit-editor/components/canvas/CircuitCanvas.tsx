import React from 'react'
import ReactFlow, {
  Background,
  ConnectionMode,
  Controls,
  MarkerType,
  type Connection,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type NodeDragHandler,
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
    return component.metadata?.state
  }

  const [parameterKey, parameterValue] = parameterEntries[0]

  if (parameterValue.isUnknown) {
    return `${parameterKey}: ?`
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
      stroke: '#334155',
      strokeWidth: 2,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color: '#334155',
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

  return (
    <div
      style={{
        width: '100%',
        height: '680px',
        border: '1px solid #d6d3d1',
        borderRadius: 18,
        overflow: 'hidden',
        background: '#fcfcf9',
      }}
    >
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
  )
}
