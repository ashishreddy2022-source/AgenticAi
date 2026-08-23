import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell from '../../components/AppShell';
import api from '../../services/api';
import {
  Workflow,
  Plus,
  Sparkles,
  Search,
  Copy,
  Trash2,
  Play,
  Clock,
  Tag,
  Loader2,
  CheckCircle2,
  Filter,
  Layers
} from 'lucide-react';

export default function WorkflowsListPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [executingId, setExecutingId] = useState(null);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workflows', {
        params: { search, status: statusFilter }
      });
      if (res.success && res.data) {
        setWorkflows(res.data.workflows || []);
      }
    } catch (e) {
      console.error('Failed to fetch workflows:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [search, statusFilter]);

  const handleCreateManual = async () => {
    try {
      const res = await api.post('/workflows', {
        name: 'Untitled Automation Workflow',
        description: 'Custom operator workflow',
        tags: ['Custom'],
        nodes: [
          {
            id: 'node-1',
            type: 'trigger',
            position: { x: 250, y: 80 },
            data: {
              label: 'Manual Ingress Trigger',
              category: 'trigger',
              provider: 'system',
              action: 'manual_trigger',
              config: {}
            }
          }
        ],
        edges: []
      });

      if (res.success && res.data) {
        router.push(`/workflows/${res.data._id}`);
      }
    } catch (err) {
      alert(err.message || 'Failed to create workflow');
    }
  };

  const handleDuplicate = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/workflows/${id}/duplicate`);
      if (res.success && res.data) {
        fetchWorkflows();
      }
    } catch (err) {
      alert(err.message || 'Failed to duplicate workflow');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      await api.delete(`/workflows/${id}`);
      setWorkflows((prev) => prev.filter((w) => w._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete workflow');
    }
  };

  const handleExecute = async (id, e) => {
    e.stopPropagation();
    setExecutingId(id);
    try {
      const res = await api.post(`/workflows/${id}/execute`, { inputs: { trigger: 'operator_manual_run' } });
      if (res.success && res.data) {
        router.push(`/executions/${res.data._id}`);
      }
    } catch (err) {
      alert(err.message || 'Execution failed');
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell
        title="Workflow Directory"
        subtitle="Manage, edit, version, and launch visual automation graphs"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Controls Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Search & Filter */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search workflows by name or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-surface border border-surface-border rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-surface border border-surface-border rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-primary-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Creation Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/workflows/builder"
                className="px-4 py-2 rounded-xl bg-surface-elevated border border-primary-500/40 text-primary-300 hover:text-white hover:bg-primary-950/40 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                <span>AI Prompt Builder</span>
              </Link>

              <button
                onClick={handleCreateManual}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-primary-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Workflow Canvas</span>
              </button>
            </div>
          </div>

          {/* Workflow Cards Grid */}
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : workflows.length === 0 ? (
            <div className="rounded-2xl border border-surface-border bg-surface/60 p-12 text-center">
              <Workflow className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-200">No workflows found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
                Create your first workflow manually on the visual canvas or generate one with the AI prompt studio.
              </p>
              <div className="flex justify-center gap-3">
                <Link
                  href="/workflows/builder"
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Build with AI</span>
                </Link>
                <button
                  onClick={handleCreateManual}
                  className="px-4 py-2 rounded-xl bg-surface-elevated border border-surface-border text-slate-200 text-xs font-semibold"
                >
                  Create Canvas
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {workflows.map((wf) => (
                <div
                  key={wf._id}
                  onClick={() => router.push(`/workflows/${wf._id}`)}
                  className="rounded-2xl border border-surface-border bg-surface/80 hover:bg-surface-elevated/70 backdrop-blur-md p-5 flex flex-col justify-between transition-all hover:border-slate-500 shadow-md cursor-pointer group"
                >
                  <div>
                    {/* Header: Title & Version Pill */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm text-slate-100 group-hover:text-primary-300 transition-colors line-clamp-1">
                        {wf.name}
                      </h3>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-surface-elevated border border-surface-border text-slate-400 shrink-0">
                        v{wf.version || 1}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {wf.description || 'No description provided.'}
                    </p>

                    {/* Tags */}
                    {wf.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {wf.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-primary-950/40 text-primary-300 border border-primary-500/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Metrics & Actions */}
                  <div className="pt-4 border-t border-surface-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        {wf.nodes?.length || 0} nodes
                      </span>
                      <span className="capitalize text-emerald-400">&bull; {wf.status}</span>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDuplicate(wf._id, e)}
                        title="Duplicate workflow"
                        className="p-1.5 rounded-lg bg-surface border border-surface-border text-slate-400 hover:text-slate-200 hover:bg-surface-elevated transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(wf._id, e)}
                        title="Delete workflow"
                        className="p-1.5 rounded-lg bg-surface border border-surface-border text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleExecute(wf._id, e)}
                        disabled={executingId === wf._id}
                        title="Run workflow"
                        className="px-2.5 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                      >
                        {executingId === wf._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                        <span>Run</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
