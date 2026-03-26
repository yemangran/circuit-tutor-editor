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
  | 'junction'
  | 'ground'

export type CircuitFlowNodeData = {
  kind: CircuitFlowNodeKind
  label: string
  pins: string[]
  parameterText?: string
  rotation: 0 | 90 | 180 | 270
  connectedPinIds?: string[]
  pinNodeLabels?: Record<string, string>
  namedPinIds?: string[]
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

function getPinLabelStyle(handle: HandleConfig): CSSProperties {
  const sideOffset = 42

  if (handle.position === Position.Left) {
    return {
      top: handle.style?.top ?? '50%',
      left: `${-sideOffset}px`,
      transform: 'translate(-100%, -50%)',
    }
  }

  if (handle.position === Position.Right) {
    return {
      top: handle.style?.top ?? '50%',
      right: `${-sideOffset}px`,
      transform: 'translate(100%, -50%)',
    }
  }

  if (handle.position === Position.Top) {
    return {
      top: `${-sideOffset + 4}px`,
      left: handle.style?.left ?? '50%',
      transform: 'translate(-50%, -100%)',
    }
  }

  return {
    bottom: `${-sideOffset + 4}px`,
    left: handle.style?.left ?? '50%',
    transform: 'translate(-50%, 100%)',
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
      data-rotation={data.rotation}
      style={{
        ['--node-accent' as string]: accent.accent,
        ['--node-accent-soft' as string]: accent.soft,
        transform: `rotate(${data.rotation}deg)`,
      }}
    >
      <div className="circuit-node-badge">
        {i18n.t(`editor.nodeBadges.${accent.badgeKey}`)}
      </div>
      {handles.map((handle) => (
        <div key={`${data.kind}-${handle.id}`}>
          <Handle
            id={handle.id}
            type="source"
            position={handle.position}
            className={
              data.connectedPinIds?.includes(handle.id)
                ? 'pin-handle pin-handle-connected'
                : 'pin-handle'
            }
            isConnectable={!data.connectedPinIds?.includes(handle.id)}
            style={{
              ...handleBaseStyle,
              ...handle.style,
              ...(data.connectedPinIds?.includes(handle.id)
                ? {
                    background: '#172033',
                    borderColor: '#172033',
                  }
                : {}),
            }}
          />
          {data.pinNodeLabels?.[handle.id] &&
          (selected || data.namedPinIds?.includes(handle.id)) ? (
            <div className="pin-node-label" style={getPinLabelStyle(handle)}>
              {data.pinNodeLabels[handle.id]}
            </div>
          ) : null}
        </div>
      ))}
      <div className="circuit-node-label">{data.label}</div>
      <div className="circuit-node-symbol">{symbol}</div>
      {data.parameterText ? (
        <div className="circuit-node-parameter">{data.parameterText}</div>
      ) : null}
    </div>
  )
}
