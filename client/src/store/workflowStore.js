import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import api from '../services/api';

export const useWorkflowStore = create((set, get) => ({
  workflow: null,
  nodes: [],
  edges: [],
  selectedNode: null,
  isDirty: false,
  isLoading: false,
  isSaving: false,
  error: null,

  setWorkflow: (workflow) => {
    set({
      workflow,
      nodes: workflow?.nodes || [],
      edges: workflow?.edges || [],
      selectedNode: null,
      isDirty: false
    });
  },

  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
      isDirty: true
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
      isDirty: true
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge({ ...connection, animated: true, style: { stroke: '#6366f1' } }, get().edges),
      isDirty: true
    });
  },

  selectNode: (node) => set({ selectedNode: node }),

  addNode: (nodeData, position = { x: 250, y: 150 }) => {
    const id = `node-${Date.now()}`;
    const newNode = {
      id,
      type: nodeData.type || 'agent',
      position,
      data: {
        label: nodeData.label || 'New Node',
        description: nodeData.description || '',
        category: nodeData.category || 'action',
        provider: nodeData.provider || 'system',
        action: nodeData.action || 'custom',
        config: nodeData.config || {},
        validationRules: nodeData.validationRules || {}
      }
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNode: newNode,
      isDirty: true
    }));

    return newNode;
  },

  updateNodeData: (nodeId, updatedData) => {
    set((state) => {
      const newNodes = state.nodes.map((node) => {
        if (node.id === nodeId) {
          const merged = { ...node, data: { ...node.data, ...updatedData } };
          if (state.selectedNode?.id === nodeId) {
            state.selectedNode = merged;
          }
          return merged;
        }
        return node;
      });

      return {
        nodes: newNodes,
        selectedNode: state.selectedNode?.id === nodeId ? { ...state.selectedNode, data: { ...state.selectedNode.data, ...updatedData } } : state.selectedNode,
        isDirty: true
      };
    });
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
      isDirty: true
    }));
  },

  loadWorkflow: async (workflowId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/workflows/${workflowId}`);
      if (res.success && res.data) {
        set({
          workflow: res.data,
          nodes: res.data.nodes || [],
          edges: res.data.edges || [],
          selectedNode: null,
          isDirty: false,
          isLoading: false
        });
        return res.data;
      }
      throw new Error(res.message || 'Failed to load workflow');
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  saveWorkflow: async (additionalData = {}) => {
    const { workflow, nodes, edges } = get();
    if (!workflow) return;

    set({ isSaving: true, error: null });
    try {
      const payload = {
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        tags: workflow.tags,
        triggerConfig: workflow.triggerConfig,
        nodes,
        edges,
        ...additionalData
      };

      const res = await api.put(`/workflows/${workflow._id}`, payload);
      if (res.success && res.data) {
        set({
          workflow: res.data,
          isDirty: false,
          isSaving: false
        });
        return res.data;
      }
      throw new Error(res.message || 'Failed to save workflow');
    } catch (err) {
      set({ isSaving: false, error: err.message });
      throw err;
    }
  },

  resetCanvas: () => {
    set({
      workflow: null,
      nodes: [],
      edges: [],
      selectedNode: null,
      isDirty: false,
      error: null
    });
  }
}));
