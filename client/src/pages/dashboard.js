import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute';
import AppShell from '../components/AppShell';
import MetricGrid from '../components/MetricGrid';
import api from '../services/api';
import { getSocket } from '../services/socket';
import {
  Sparkles,
  Play,
  ArrowUpRight,
  Workflow,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Plus,
  Loader2,
  Send,
  Zap
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quickPrompt, setQuickPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/workflows/dashboard');
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (e) {
      console.error('Failed to load dashboard metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    const socket = getSocket();
    if (socket) {
      const handleExecutionStatus = () => {
        fetchDashboard();
      };
      socket.on('execution:status_change', handleExecutionStatus);
      return () => {
        socket.off('execution:status_change', handleExecutionStatus);
      };
    }
  }, []);

  const handleQuickGenerate = async (e) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;

    setGenerating(true);
    try {
      const res = await api.post('/workflows/generate', { prompt: quickPrompt });
      if (res.success && res.data) {
        // Create workflow directly
        const createRes = await api.post('/workflows', {
          name: res.data.name,
          description: res.data.description,
          tags: res.data.tags || ['AI-Generated'],
          nodes: res.data.nodes,
          edges: res.data.edges,
          status: 'active'
        });

        if (createRes.success && createRes.data) {
          router.push(`/workflows/${createRes.data._id}`);
        }
      }
    } catch (err) {
      alert(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell
        title="Operations Control Console"
        subtitle="Real-time telemetry, agent metrics, and visual workflow orchestration"
      >
        <div className="space-y-8 max-w-7xl mx-auto">
          {/* Quick AI Workflow Generator Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-primary-950/70 via-surface-elevated/80 to-surface border border-primary-500/40 p-6 backdrop-blur-xl shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-500/20 text-primary-300 text-[11px] font-mono font-bold mb-2 border border-primary-500/30">
                  <Sparkles className="w-3 h-3 text-primary-400" />
                  <span>NATURAL LANGUAGE AUTOMATION GENERATOR</span>
                </div>
                <h2 className="text-xl font-bold text-slate-100">Describe an automation to build it visually</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Type any instruction. The AI multi-agent planner will assemble triggers, AI reasoning nodes, and OAuth integrations.
                </p>
              </div>

              <form onSubmit={handleQuickGenerate} className="w-full md:w-auto flex-1 max-w-md">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Read invoice emails, extract total via AI, save to Google Sheets & ping Slack"
                    value={quickPrompt}
                    onChange={(e) => setQuickPrompt(e.target.value)}
                    className="flex-1 bg-background/80 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={generating || !quickPrompt.trim()}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-primary-600/30 flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Generate</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Metric Grid */}
          {loading ? (
            <div className="h-28 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : (
            <MetricGrid metrics={data?.metrics} />
          )}

          {/* Dual Panel: Recent Executions & Live AI Agent Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Recent Executions Table (2 cols) */}
            <div className="lg:col-span-2 rounded-2xl border border-surface-border bg-surface/70 backdrop-blur-md p-5 flex flex-col shadow-lg">
              <div className="flex items-center justify-between pb-4 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Recent Workflow Executions
                  </h3>
                </div>
                <Link
                  href="/executions"
                  className="text-xs font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1"
                >
                  <span>View all executions</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="flex-1 overflow-x-auto mt-4">
                {data?.recentExecutions?.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    No executions recorded yet. Launch your first workflow!
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-surface-border/60 text-slate-400">
                        <th className="pb-3 font-semibold">Workflow</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Duration</th>
                        <th className="pb-3 font-semibold">Confidence</th>
                        <th className="pb-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border/40">
                      {data?.recentExecutions?.map((exec) => {
                        const statusColors = {
                          COMPLETED: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30',
                          RUNNING: 'bg-blue-950/60 text-blue-400 border-blue-500/30 animate-pulse',
                          FAILED: 'bg-rose-950/60 text-rose-400 border-rose-500/30',
                          PENDING: 'bg-slate-900 text-slate-400 border-slate-700',
                          PAUSED: 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                        };

                        return (
                          <tr key={exec._id} className="hover:bg-surface-elevated/40 transition-colors">
                            <td className="py-3.5 font-medium text-slate-200">
                              <div className="font-semibold">{exec.workflowSnapshot?.name || 'Workflow Run'}</div>
                              <div className="text-[10px] text-slate-400 font-mono">v{exec.workflowSnapshot?.version || 1}</div>
                            </td>
                            <td className="py-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                  statusColors[exec.status] || statusColors.PENDING
                                }`}
                              >
                                {exec.status}
                              </span>
                            </td>
                            <td className="py-3.5 font-mono text-slate-400 text-[11px]">
                              {exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : 'active'}
                            </td>
                            <td className="py-3.5 font-mono text-slate-300 text-[11px]">
                              {exec.agentConfidence ? `${Math.round(exec.agentConfidence * 100)}%` : '95%'}
                            </td>
                            <td className="py-3.5 text-right">
                              <Link
                                href={`/executions/${exec._id}`}
                                className="px-2.5 py-1 rounded bg-surface-elevated hover:bg-primary-600/20 text-slate-300 hover:text-primary-300 border border-surface-border text-[11px] font-medium transition-all"
                              >
                                Inspect
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Right: Live AI Agent Activity Stream (1 col) */}
            <div className="rounded-2xl border border-surface-border bg-surface/70 backdrop-blur-md p-5 flex flex-col shadow-lg">
              <div className="flex items-center justify-between pb-4 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Agent Activity Feed
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  LIVE
                </span>
              </div>

              <div className="flex-1 overflow-y-auto mt-4 space-y-3 max-h-[380px]">
                {data?.recentLogs?.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    No recent agent events.
                  </div>
                ) : (
                  data?.recentLogs?.map((log, i) => (
                    <div
                      key={log._id || i}
                      className="p-2.5 rounded-xl bg-surface-elevated/40 border border-surface-border text-xs"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-[10px] font-bold uppercase text-primary-400">
                          {log.agent} Agent
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">{log.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
