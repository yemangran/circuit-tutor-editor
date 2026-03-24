import type { CSSProperties, ReactNode } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'

export type CircuitFlowNodeKind =
  | 'resistor'
  | 'conductance'
  | 'capacitor'
  | 'inductor'
  | 'voltage_source'
  | 'current_source'
  | 'controlled_voltage_source'
  | 'controlled_current_source'
  | 'generic_load'
  | 'switch_spst'
  | 'switch_spdt'
  | 'ground'

export type CircuitFlowNodeData = {
  kind: CircuitFlowNodeKind
  label: string
  pins: string[]
  parameterText?: string
}

type HandleConfig = {
  id: string
  position: Position
  style?: CSSProperties
}

type BaseCircuitNodeProps = NodeProps<CircuitFlowNodeData> & {
  symbol: ReactNode
  handles: HandleConfig[]
}

const handleBaseStyle: CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: 999,
  border: '2px solid rgba(20, 35, 58, 0.4)',
  background: '#ffffff',
}

function getNodeAccent(kind: CircuitFlowNodeKind) {
  switch (kind) {
    case 'resistor':
    case 'conductance':
    case 'generic_load':
      return {
        accent: '#2563eb',
        soft: 'rgba(219, 234, 254, 0.86)',
        badge: 'Passive',
      }
    case 'capacitor':
    case 'inductor':
      return {
        accent: '#7c3aed',
        soft: 'rgba(237, 233, 254, 0.86)',
        badge: 'Reactive',
      }
    case 'voltage_source':
    case 'current_source':
      return {
        accent: '#f97316',
        soft: 'rgba(255, 237, 213, 0.92)',
        badge: 'Source',
      }
    case 'controlled_voltage_source':
    case 'controlled_current_source':
      return {
        accent: '#0f766e',
        soft: 'rgba(204, 251, 241, 0.92)',
        badge: 'Control',
      }
    case 'ground':
      return {
        accent: '#0f172a',
        soft: 'rgba(226, 232, 240, 0.92)',
        badge: 'Ref',
      }
    default:
      return {
        accent: '#475569',
        soft: 'rgba(241, 245, 249, 0.92)',
        badge: 'Switch',
      }
  }
}

export function BaseCircuitNode({
  data,
  selected,
  symbol,
  handles,
}: BaseCircuitNodeProps) {
  const accent = getNodeAccent(data.kind)

  return (
    <div
      className="circuit-node"
      data-selected={selected}
      style={{
        ['--node-accent' as string]: accent.accent,
        ['--node-accent-soft' as string]: accent.soft,
      }}
    >
      <div className="circuit-node-badge">{accent.badge}</div>
      {handles.map((handle) => (
        <Handle
          key={`${data.kind}-${handle.id}`}
          id={handle.id}
          type="source"
          position={handle.position}
          style={{ ...handleBaseStyle, ...handle.style }}
        />
      ))}
      <div className="circuit-node-label">{data.label}</div>
      <div>{symbol}</div>
      {data.parameterText ? (
        <div className="circuit-node-parameter">{data.parameterText}</div>
      ) : null}
    </div>
  )
}
