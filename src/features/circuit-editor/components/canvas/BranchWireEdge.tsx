import {
  BaseEdge,
  EdgeLabelRenderer,
  Position,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
} from 'reactflow'

type BranchWireEdgeData = {
  currentLabel?: string
  currentValueText?: string
  isSelected?: boolean
  hasBranchCurrent?: boolean
  directionReversed?: boolean
  sourceHandlePosition?: Position
  targetHandlePosition?: Position
}

export function BranchWireEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps<BranchWireEdgeData>) {
  const deltaX = targetX - sourceX
  const deltaY = targetY - sourceY
  const alignedThreshold = 8
  const isNearlyVertical = Math.abs(deltaX) <= alignedThreshold
  const isNearlyHorizontal = Math.abs(deltaY) <= alignedThreshold

  const inferredSourcePosition =
    data?.sourceHandlePosition ??
    (isNearlyVertical
      ? deltaY >= 0
        ? Position.Bottom
        : Position.Top
      : isNearlyHorizontal
        ? deltaX >= 0
          ? Position.Right
          : Position.Left
        : sourcePosition)

  const inferredTargetPosition =
    data?.targetHandlePosition ??
    (isNearlyVertical
      ? deltaY >= 0
        ? Position.Top
        : Position.Bottom
      : isNearlyHorizontal
        ? deltaX >= 0
          ? Position.Left
          : Position.Right
        : targetPosition)

  const [path, labelX, labelY] =
    isNearlyVertical || isNearlyHorizontal
      ? getStraightPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
        })
      : getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition: inferredSourcePosition,
          targetX,
          targetY,
          targetPosition: inferredTargetPosition,
          borderRadius: 10,
        })
  const length = Math.max(Math.hypot(deltaX, deltaY), 1)
  const normalX = (-deltaY / length) * 22
  const normalY = (deltaX / length) * 22
  const lineRotation = `${Math.atan2(deltaY, deltaX) * (180 / Math.PI)}deg`

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke: data?.isSelected ? '#f97316' : '#2563eb',
          strokeWidth: data?.isSelected ? 3 : 2.5,
        }}
      />
      {data?.hasBranchCurrent ? (
        <EdgeLabelRenderer>
          <div
            className="branch-current-callout nodrag nopan"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX + normalX}px, ${labelY + normalY}px)`,
            }}
          >
            <div
              className="branch-current-indicator"
              style={{
                transform: `rotate(${lineRotation}) scaleX(${data?.directionReversed ? -1 : 1})`,
              }}
              aria-hidden="true"
            >
              <span className="branch-current-indicator-line" />
              <span className="branch-current-indicator-arrow" />
            </div>
            <div className="branch-current-meta">
              <span className="branch-current-text">{data.currentLabel}</span>
              {data.currentValueText ? (
                <span className="branch-current-value">{data.currentValueText}</span>
              ) : null}
            </div>
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}
