import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell from '../../components/AppShell';
import WorkflowCanvas from '../../components/WorkflowCanvas';
import NodePalette from '../../components/NodePalette';
import NodeConfigPanel from '../../components/NodeConfigPanel';
import { useWorkflowStore } from '../../store/workflowStore';
import api from '../../services/api';
import {
  Save,
  Play,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Tag,
  Clock,
  Layers,
  ChevronRight,
  Sliders,
  Share2
} from 'lucide-react';
import Link from 'next/link';

export default function WorkflowEditorPage() {
  const router = useRouter();
  const { id } = router.query;

  const {
    workflow,
    loadWorkflow,
    saveWorkflow,
    selectedNode,
    selectNode,
    isDirty,
    isSaving,
    isLoading
  } = useWorkflowStore();

  const [executing, setExecuting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDesc, setWorkflowDesc] = useState('');

  useEffect(() => {
    if (id) {
      loadWorkflow(id).then((wf) => {
        if (wf) {
          setWorkflowName(wf.name || 'Untitled Workflow');
          setWorkflowDesc(wf.description || '');
        }
      });
    }
  }, [id, loadWorkflow]);

  const handleSave = async () => {
    try {
      await saveWorkflow({ name: workflowName, description: workflowDesc });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert(err.message || 'Failed to save workflow');
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      // Auto-save before running
      await saveWorkflow({ name: workflowName, description: workflowDesc });
      const res = await api.post(`/workflows/${id}/execute`, {
        inputs: { triggeredAt: new Date().toISOString() }
      });
      if (res.success && res.data) {
        router.push(`/executions/${res.data._id}`);
      }
    } catch (err) {
      alert(err.message || 'Execution initiation failed');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="h-screen w-screen flex flex-col bg-background text-slate-100 overflow-hidden">
        {/* Top Studio Navbar */}
        <header className="h-16 border-b border-surface-border bg-surface/90 backdrop-blur-xl px-5 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
            <Link
              href="/workflows"
              className="p-2 rounded-lg bg-surface-elevated hover:bg-slate-700 text-slate-300 hover:text-white border border-surface-border transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="bg-transparent font-bold text-sm text-slate-100 focus:outline-none focus:bg-surface-elevated px-1.5 py-0.5 rounded border border-transparent focus:border-surface-border"
                />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-950/50 text-primary-400 border border-primary-500/30">
                  v{workflow?.version || 1}
                </span>
                {isDirty && (
                  <span className="text-[10px] text-amber-400 font-mono italic animate-pulse">
                    &bull; Unsaved changes
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 px-1.5 line-clamp-1">
                {workflowDesc || 'Visual DAG automation graph'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                saveSuccess
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                  : 'bg-surface-elevated border-surface-border text-slate-200 hover:border-slate-500'
              }`}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-400" />
              ) : saveSuccess ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{saveSuccess ? 'Saved' : 'Save Graph'}</span>
            </button>

            <button
              onClick={handleExecute}
              disabled={executing}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-primary-600/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {executing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Run Execution</span>
            </button>
          </div>
        </header>

        {/* 3-Column Studio Workspace */}
        <div className="flex-1 flex min-h-0 relative">
          {/* Left Palette */}
          <NodePalette />

          {/* Central React Flow Canvas */}
          <div className="flex-1 relative h-full bg-background overflow-hidden">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              </div>
            ) : (
              <WorkflowCanvas
                onNodeClick={(node) => selectNode(node)}
                onPaneClick={() => selectNode(null)}
              />
            )}
          </div>

          {/* Right Config Inspector */}
          {selectedNode && (
            <NodeConfigPanel onClose={() => selectNode(null)} />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
