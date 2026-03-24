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

const containerStyle: CSSProperties = {
  minWidth: 120,
  minHeight: 76,
  border: '1.5px solid #1f2937',
  borderRadius: 12,
  background: '#fffef7',
  boxShadow: '0 3px 10px rgba(15, 23, 42, 0.08)',
  color: '#0f172a',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '10px 16px',
  position: 'relative',
}

const labelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1,
}

const parameterStyle: CSSProperties = {
  fontSize: 11,
  color: '#475569',
  lineHeight: 1,
}

const handleBaseStyle: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  border: '1px solid #0f172a',
  background: '#f8fafc',
}

export function BaseCircuitNode({
  data,
  selected,
  symbol,
  handles,
}: BaseCircuitNodeProps) {
  return (
    <div
      style={{
        ...containerStyle,
        borderColor: selected ? '#0f766e' : containerStyle.borderColor,
        boxShadow: selected
          ? '0 0 0 2px rgba(15, 118, 110, 0.18), 0 8px 18px rgba(15, 23, 42, 0.12)'
          : containerStyle.boxShadow,
      }}
    >
      {handles.map((handle) => (
        <Handle
          key={`${data.kind}-${handle.id}`}
          id={handle.id}
          type="source"
          position={handle.position}
          style={{ ...handleBaseStyle, ...handle.style }}
        />
      ))}
      <div style={labelStyle}>{data.label}</div>
      <div>{symbol}</div>
      {data.parameterText ? <div style={parameterStyle}>{data.parameterText}</div> : null}
    </div>
  )
}
