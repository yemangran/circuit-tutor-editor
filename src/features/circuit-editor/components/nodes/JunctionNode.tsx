import { useEffect, type CSSProperties } from 'react'
import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type NodeProps,
} from 'reactflow'
import type { CircuitFlowNodeData } from './BaseCircuitNode'
import { getJunctionHandleLayout } from '../../junctionLayout'

const handleStyle: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  border: '2px solid rgba(20, 35, 58, 0.34)',
  background: '#ffffff',
}

type JunctionHandle = {
  id: string
  position: Position
  style?: CSSProperties
}

function getPinLabelStyle(handle: JunctionHandle): CSSProperties {
  const sideOffset = 30

  if (handle.position === Position.Left) {
    return {
      top: handle.style?.top ?? '50%',
      left: `calc(${handle.style?.left ?? '50%'} - ${sideOffset}px)`,
      transform: 'translate(-100%, -50%)',
    }
  }

  if (handle.position === Position.Right) {
    return {
      top: handle.style?.top ?? '50%',
      left: `calc(${handle.style?.left ?? '50%'} + ${sideOffset}px)`,
      transform: 'translate(0, -50%)',
    }
  }

  if (handle.position === Position.Top) {
    return {
      top: `calc(${handle.style?.top ?? '50%'} - ${sideOffset - 4}px)`,
      left: handle.style?.left ?? '50%',
      transform: 'translate(-50%, -100%)',
    }
  }

  return {
    top: `calc(${handle.style?.top ?? '50%'} + ${sideOffset - 4}px)`,
    left: handle.style?.left ?? '50%',
    transform: 'translate(-50%, 0)',
  }
}

export function JunctionNode({
  id,
  data,
  selected,
}: NodeProps<CircuitFlowNodeData>) {
  const updateNodeInternals = useUpdateNodeInternals()
  const junctionHandles = data.pins.map((pinId) => ({
    id: pinId,
    ...getJunctionHandleLayout(pinId, data.rotation),
  }))

  useEffect(() => {
    updateNodeInternals(id)
  }, [data.rotation, data.pins, id, updateNodeInternals])

  return (
    <div className="junction-node" data-selected={selected}>
      {junctionHandles.map((handle) => (
        <div key={`junction-${handle.id}`}>
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
              ...handleStyle,
              ...handle.style,
              transform: 'translate(-50%, -50%)',
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
            <div
              className="pin-node-label pin-node-label-junction"
              style={getPinLabelStyle(handle)}
            >
              {data.pinNodeLabels[handle.id]}
            </div>
          ) : null}
        </div>
      ))}
      <div className="junction-node-dot" />
      <div className="junction-node-label">{data.label}</div>
    </div>
  )
}
