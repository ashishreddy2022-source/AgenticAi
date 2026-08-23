import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell from '../../components/AppShell';
import ExecutionTimeline from '../../components/ExecutionTimeline';
import api from '../../services/api';
import { getSocket, joinExecutionRoom, leaveExecutionRoom } from '../../services/socket';
import {
  ArrowLeft,
  Play,
  Pause,
  XCircle,
  RotateCcw,
  Loader2,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
  Layers,
  Code,
  ShieldAlert
} from 'lucide-react';

export default function ExecutionDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [execution, setExecution] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'outputs' | 'snapshot'
  const [actionLoading, setActionLoading] = useState(false);

  const fetchExecutionData = async () => {
    if (!id) return;
    try {
      const [execRes, timelineRes] = await Promise.all([
        api.get(`/executions/${id}`),
        api.get(`/executions/${id}/timeline`)
      ]);

      if (execRes.success && execRes.data) {
        setExecution(execRes.data);
      }
      if (timelineRes.success && timelineRes.data) {
        setLogs(timelineRes.data);
      }
    } catch (err) {
      console.error('Failed to load execution data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutionData();

    if (id) {
      joinExecutionRoom(id);

      const socket = getSocket();
      if (socket) {
        const handleLogEvent = (newLog) => {
          if (newLog.executionId === id) {
            setLogs((prev) => [...prev, newLog]);
          }
        };

        const handleStatusChange = (data) => {
          if (data.executionId === id) {
            setExecution((prev) => (prev ? { ...prev, status: data.status, duration: data.duration } : prev));
          }
        };

        const handleNodeStart = (data) => {
          if (data.executionId === id) {
            setExecution((prev) => (prev ? { ...prev, currentNode: data.nodeId } : prev));
          }
        };

        socket.on('execution:log', handleLogEvent);
        socket.on('execution:status_change', handleStatusChange);
        socket.on('execution:node_start', handleNodeStart);

        return () => {
          leaveExecutionRoom(id);
          socket.off('execution:log', handleLogEvent);
          socket.off('execution:status_change', handleStatusChange);
          socket.off('execution:node_start', handleNodeStart);
        };
      }
    }
  }, [id]);

  const handlePause = async () => {
    setActionLoading(true);
    try {
      const res = await api.post(`/executions/${id}/pause`);
      if (res.success && res.data) {
        setExecution(res.data);
      }
    } catch (err) {
      alert(err.message || 'Pause failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      const res = await api.post(`/executions/${id}/resume`);
      if (res.success && res.data) {
        setExecution(res.data);
      }
    } catch (err) {
      alert(err.message || 'Resume failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to terminate this execution?')) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/executions/${id}/cancel`);
      if (res.success && res.data) {
        setExecution(res.data);
      }
    } catch (err) {
      alert(err.message || 'Cancel failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-3" />
          <p className="text-xs text-slate-400">Loading Execution Telemetry...</p>
        </div>
      </ProtectedRoute>
    );
  }

  const isTerminal = ['COMPLETED', 'FAILED', 'CANCELLED'].includes(execution?.status);

  return (
    <ProtectedRoute>
      <AppShell
        title={`Execution Run #${id?.substring(id.length - 6)}`}
        subtitle={`Workflow: ${execution?.workflowSnapshot?.name || 'Automation'}`}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Control Bar */}
          <div className="p-5 rounded-2xl border border-surface-border bg-surface/90 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/executions"
                className="p-2 rounded-xl bg-surface-elevated hover:bg-slate-700 text-slate-300 hover:text-white border border-surface-border transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-bold text-slate-100">
                    {execution?.workflowSnapshot?.name || 'Execution Details'}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase ${
                      execution?.status === 'COMPLETED'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                        : execution?.status === 'RUNNING'
                        ? 'bg-blue-950/60 text-blue-400 border-blue-500/30 animate-pulse'
                        : execution?.status === 'PAUSED'
                        ? 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                        : 'bg-rose-950/60 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {execution?.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
                  <span>ID: {execution?._id}</span>
                  <span>&bull;</span>
                  <span>Duration: {execution?.duration ? `${(execution.duration / 1000).toFixed(2)}s` : 'Active'}</span>
                  <span>&bull;</span>
                  <span>Confidence: {Math.round((execution?.agentConfidence || 0.95) * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Lifecycle Controls */}
            <div className="flex items-center gap-2">
              {execution?.status === 'RUNNING' && (
                <button
                  onClick={handlePause}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Run</span>
                </button>
              )}

              {execution?.status === 'PAUSED' && (
                <button
                  onClick={handleResume}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Run</span>
                </button>
              )}

              {!isTerminal && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}

              {isTerminal && (
                <Link
                  href={`/workflows/${execution?.workflowId}`}
                  className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-primary-600/20 border border-surface-border hover:border-primary-500/40 text-slate-200 text-xs font-semibold transition-all"
                >
                  Open in Workflow Studio
                </Link>
              )}
            </div>
          </div>

          {/* Active Node Highlight Banner (If Running) */}
          {execution?.currentNode && (
            <div className="p-3.5 rounded-xl bg-primary-950/40 border border-primary-500/40 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary-300">
                <Activity className="w-4 h-4 text-primary-400" />
                <span>Executing Node: <code className="font-mono text-white">{execution.currentNode}</code></span>
              </div>
              <span className="text-[10px] font-mono bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded border border-primary-500/30">
                DISPATCHED TO AGENT CHAIN
              </span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-surface-border pb-1">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all ${
                activeTab === 'timeline'
                  ? 'bg-surface-elevated text-primary-400 border-t border-x border-surface-border'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live Agent Timeline ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('outputs')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all ${
                activeTab === 'outputs'
                  ? 'bg-surface-elevated text-primary-400 border-t border-x border-surface-border'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Step Outputs &amp; State
            </button>
            <button
              onClick={() => setActiveTab('snapshot')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all ${
                activeTab === 'snapshot'
                  ? 'bg-surface-elevated text-primary-400 border-t border-x border-surface-border'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Workflow Snapshot
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'timeline' && (
            <ExecutionTimeline logs={logs} isLive={execution?.status === 'RUNNING'} />
          )}

          {activeTab === 'outputs' && (
            <div className="rounded-2xl border border-surface-border bg-surface/80 p-6 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Execution Context &amp; Outputs
              </h3>
              <pre className="p-4 rounded-xl bg-background border border-surface-border text-xs font-mono text-emerald-400 overflow-x-auto">
                {JSON.stringify(execution?.outputs || {}, null, 2)}
              </pre>

              {execution?.error && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Encountered Escalated Error:</span>
                  </div>
                  <pre className="p-3 rounded bg-background/80 text-rose-300 font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(execution.error, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'snapshot' && (
            <div className="rounded-2xl border border-surface-border bg-surface/80 p-6 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Runtime Graph Snapshot (Immutable)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-elevated/40 border border-surface-border">
                  <div className="text-xs font-bold text-slate-300 mb-2">Snapshot Nodes ({execution?.workflowSnapshot?.nodes?.length || 0})</div>
                  <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto max-h-80">
                    {JSON.stringify(execution?.workflowSnapshot?.nodes || [], null, 2)}
                  </pre>
                </div>

                <div className="p-4 rounded-xl bg-surface-elevated/40 border border-surface-border">
                  <div className="text-xs font-bold text-slate-300 mb-2">Snapshot Edges ({execution?.workflowSnapshot?.edges?.length || 0})</div>
                  <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto max-h-80">
                    {JSON.stringify(execution?.workflowSnapshot?.edges || [], null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
