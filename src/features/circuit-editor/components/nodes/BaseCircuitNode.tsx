import { useEffect, type CSSProperties, type ReactNode } from 'react'
import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type NodeProps,
} from 'reactflow'
import i18n from '../../../../i18n'

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
  rotation: 0 | 90 | 180 | 270
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

function getRotatedPosition(
  position: Position,
  rotation: CircuitFlowNodeData['rotation'],
) {
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

function getRotatedHandleStyle(
  style: CSSProperties | undefined,
  rotation: CircuitFlowNodeData['rotation'],
): CSSProperties | undefined {
  if (!style) {
    return undefined
  }

  if (rotation === 90 || rotation === 270) {
    const axisValue = style.top

    if (axisValue == null) {
      return undefined
    }

    return { left: axisValue }
  }

  return style
}

function getNodeAccent(kind: CircuitFlowNodeKind) {
  switch (kind) {
    case 'resistor':
    case 'conductance':
    case 'generic_load':
      return {
        accent: '#2563eb',
        soft: 'rgba(219, 234, 254, 0.86)',
        badgeKey: 'passive',
      }
    case 'capacitor':
    case 'inductor':
      return {
        accent: '#7c3aed',
        soft: 'rgba(237, 233, 254, 0.86)',
        badgeKey: 'reactive',
      }
    case 'voltage_source':
    case 'current_source':
      return {
        accent: '#f97316',
        soft: 'rgba(255, 237, 213, 0.92)',
        badgeKey: 'source',
      }
    case 'controlled_voltage_source':
    case 'controlled_current_source':
      return {
        accent: '#0f766e',
        soft: 'rgba(204, 251, 241, 0.92)',
        badgeKey: 'control',
      }
    case 'ground':
      return {
        accent: '#0f172a',
        soft: 'rgba(226, 232, 240, 0.92)',
        badgeKey: 'reference',
      }
    default:
      return {
        accent: '#475569',
        soft: 'rgba(241, 245, 249, 0.92)',
        badgeKey: 'switch',
      }
  }
}

export function BaseCircuitNode({
  id,
  data,
  selected,
  symbol,
  handles,
}: BaseCircuitNodeProps) {
  const accent = getNodeAccent(data.kind)
  const updateNodeInternals = useUpdateNodeInternals()

  useEffect(() => {
    updateNodeInternals(id)
  }, [data.rotation, id, updateNodeInternals])

  return (
    <div
      className="circuit-node"
      data-selected={selected}
      style={{
        ['--node-accent' as string]: accent.accent,
        ['--node-accent-soft' as string]: accent.soft,
      }}
    >
      <div className="circuit-node-badge">
        {i18n.t(`editor.nodeBadges.${accent.badgeKey}`)}
      </div>
      {handles.map((handle) => (
        <Handle
          key={`${data.kind}-${handle.id}`}
          id={handle.id}
          type="source"
          position={getRotatedPosition(handle.position, data.rotation)}
          style={{
            ...handleBaseStyle,
            ...getRotatedHandleStyle(handle.style, data.rotation),
          }}
        />
      ))}
      <div className="circuit-node-label">{data.label}</div>
      <div
        className="circuit-node-symbol"
        style={{ transform: `rotate(${data.rotation}deg)` }}
      >
        {symbol}
      </div>
      {data.parameterText ? (
        <div className="circuit-node-parameter">{data.parameterText}</div>
      ) : null}
    </div>
  )
}
