import React from 'react';
import { BaseEdge, getSmoothStepPath } from '@xyflow/react';

export function AnimatedGlowingEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: '#6366f1',
          strokeWidth: 2.5,
          filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.6))',
          ...style,
        }}
      />
    </>
  );
}

export const edgeTypes = {
  glowing: AnimatedGlowingEdge,
};
