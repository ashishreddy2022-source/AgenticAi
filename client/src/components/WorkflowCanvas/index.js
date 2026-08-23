import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './CustomNodes';
import { edgeTypes } from './CustomEdges';
import { useWorkflowStore } from '../../store/workflowStore';

function CanvasInternal({ onNodeClick, onPaneClick }) {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode
  } = useWorkflowStore();

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const rawData = event.dataTransfer.getData('application/agentflow-node');
      if (!rawData) return;

      try {
        const nodeData = JSON.parse(rawData);
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        addNode(nodeData, position);
      } catch (err) {
        console.error('Failed to parse dropped node data:', err);
      }
    },
    [screenToFlowPosition, addNode]
  );

  const handleNodeClick = useCallback(
    (event, node) => {
      selectNode(node);
      if (onNodeClick) onNodeClick(node);
    },
    [selectNode, onNodeClick]
  );

  const handlePaneClick = useCallback(() => {
    selectNode(null);
    if (onPaneClick) onPaneClick();
  }, [selectNode, onPaneClick]);

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 }
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="#334155"
        />
        <Controls position="bottom-left" />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'trigger') return '#06b6d4';
            if (n.type === 'agent') return '#8b5cf6';
            if (n.type === 'integration') return '#3b82f6';
            if (n.type === 'condition') return '#f59e0b';
            return '#64748b';
          }}
          maskColor="rgba(9, 13, 22, 0.75)"
          position="bottom-right"
        />
      </ReactFlow>
    </div>
  );
}

export default function WorkflowCanvas(props) {
  return (
    <ReactFlowProvider>
      <CanvasInternal {...props} />
    </ReactFlowProvider>
  );
}
