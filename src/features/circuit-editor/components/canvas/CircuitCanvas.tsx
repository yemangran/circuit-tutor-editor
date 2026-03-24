import React from 'react'
import ReactFlow, { Background, Controls } from 'reactflow'
import 'reactflow/dist/style.css'

export default function CircuitCanvas() {
  return (
    <div style={{ width: '100%', height: '600px', border: '1px solid #ccc' }}>
      <ReactFlow nodes={[]} edges={[]}>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
