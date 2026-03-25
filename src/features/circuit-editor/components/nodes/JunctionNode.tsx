import { useEffect, type CSSProperties } from 'react'
import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type NodeProps,
} from 'reactflow'
import type { CircuitFlowNodeData } from './BaseCircuitNode'

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
    const nextStyle: CSSProperties = {}

    if (style.top != null) {
      nextStyle.left = style.top
    }

    if (rotation === 90) {
      if (style.left != null) {
        nextStyle.top = style.left
      }

      if (style.right != null) {
        nextStyle.bottom = style.right
      }
    }

    if (rotation === 270) {
      if (style.left != null) {
        nextStyle.bottom = style.left
      }

      if (style.right != null) {
        nextStyle.top = style.right
      }
    }

    return nextStyle
  }

  if (rotation === 180) {
    const nextStyle: CSSProperties = {}

    if (style.top != null) {
      nextStyle.bottom = style.top
    }

    if (style.bottom != null) {
      nextStyle.top = style.bottom
    }

    if (style.left != null) {
      nextStyle.right = style.left
    }

    if (style.right != null) {
      nextStyle.left = style.right
    }

    return nextStyle
  }

  return style
}

function getExtraHandleStyle(index: number): JunctionHandle {
  const side = index % 2 === 0 ? Position.Left : Position.Right
  const row = Math.floor(index / 2)
  const top = `${Math.min(26 + row * 22, 74)}%`

  return {
    id: `x${index + 1}`,
    position: side,
    style: { top },
  }
}

function getJunctionHandles(pinIds: string[]): JunctionHandle[] {
  return pinIds.map((pinId) => {
    if (pinId === 'n') {
      return { id: pinId, position: Position.Top }
    }

    if (pinId === 's') {
      return { id: pinId, position: Position.Bottom }
    }

    if (pinId === 'e') {
      return { id: pinId, position: Position.Right }
    }

    if (pinId === 'w') {
      return { id: pinId, position: Position.Left }
    }

    const extraIndex = Number(pinId.slice(1)) - 1
    return getExtraHandleStyle(Number.isFinite(extraIndex) ? extraIndex : 0)
  })
}

export function JunctionNode({
  id,
  data,
  selected,
}: NodeProps<CircuitFlowNodeData>) {
  const updateNodeInternals = useUpdateNodeInternals()
  const junctionHandles = getJunctionHandles(data.pins)

  useEffect(() => {
    updateNodeInternals(id)
  }, [data.rotation, data.pins, id, updateNodeInternals])

  return (
    <div className="junction-node" data-selected={selected}>
      {junctionHandles.map((handle) => (
        <Handle
          key={`junction-${handle.id}`}
          id={handle.id}
          type="source"
          position={getRotatedPosition(handle.position, data.rotation)}
          style={{
            ...handleStyle,
            ...getRotatedHandleStyle(handle.style, data.rotation),
          }}
        />
      ))}
      <div className="junction-node-dot" />
      <div className="junction-node-label">{data.label}</div>
    </div>
  )
}
