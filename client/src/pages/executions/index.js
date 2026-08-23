import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell from '../../components/AppShell';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import {
  PlayCircle,
  Clock,
  Activity,
  Search,
  Filter,
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PauseCircle,
  Sparkles
} from 'lucide-react';

export default function ExecutionsListPage() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchExecutions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/executions', {
        params: { status: statusFilter }
      });
      if (res.success && res.data) {
        setExecutions(res.data.executions || []);
      }
    } catch (e) {
      console.error('Failed to fetch executions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();

    const socket = getSocket();
    if (socket) {
      const handleStatusChange = (data) => {
        setExecutions((prev) =>
          prev.map((item) =>
            item._id === data.executionId ? { ...item, status: data.status, duration: data.duration } : item
          )
        );
      };

      socket.on('execution:status_change', handleStatusChange);
      return () => {
        socket.off('execution:status_change', handleStatusChange);
      };
    }
  }, [statusFilter]);

  const statusConfig = {
    COMPLETED: {
      color: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30',
      icon: CheckCircle2
    },
    RUNNING: {
      color: 'bg-blue-950/60 text-blue-400 border-blue-500/30 animate-pulse',
      icon: Activity
    },
    FAILED: {
      color: 'bg-rose-950/60 text-rose-400 border-rose-500/30',
      icon: XCircle
    },
    PENDING: {
      color: 'bg-slate-900 text-slate-400 border-slate-700',
      icon: Clock
    },
    PAUSED: {
      color: 'bg-amber-950/60 text-amber-400 border-amber-500/30',
      icon: PauseCircle
    },
    CANCELLED: {
      color: 'bg-slate-950 text-slate-500 border-slate-800',
      icon: XCircle
    }
  };

  return (
    <ProtectedRoute>
      <AppShell
        title="Execution Run Logs"
        subtitle="Real-time multi-agent execution audit trail, timeline logs, and status telemetry"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Status Filter Tabs */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-surface p-1.5 rounded-2xl border border-surface-border">
              {['all', 'RUNNING', 'COMPLETED', 'FAILED', 'PAUSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={fetchExecutions}
              className="px-3.5 py-2 rounded-xl bg-surface-elevated border border-surface-border text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              Refresh Table
            </button>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-surface-border bg-surface/80 backdrop-blur-md overflow-hidden shadow-xl">
            {loading ? (
              <div className="py-20 flex justify-center items-center">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              </div>
            ) : executions.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No execution logs found for filter: <span className="font-mono text-slate-300">{statusFilter}</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-surface-elevated/60 border-b border-surface-border text-slate-400">
                      <th className="py-3.5 px-5 font-semibold">Execution ID &amp; Workflow</th>
                      <th className="py-3.5 px-4 font-semibold">Status</th>
                      <th className="py-3.5 px-4 font-semibold">Duration</th>
                      <th className="py-3.5 px-4 font-semibold">Agent Confidence</th>
                      <th className="py-3.5 px-4 font-semibold">Started At</th>
                      <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/40">
                    {executions.map((exec) => {
                      const cfg = statusConfig[exec.status] || statusConfig.PENDING;
                      const Icon = cfg.icon;

                      return (
                        <tr key={exec._id} className="hover:bg-surface-elevated/40 transition-colors">
                          <td className="py-4 px-5">
                            <div className="font-bold text-slate-100">{exec.workflowSnapshot?.name || 'Workflow Run'}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              ID: {exec._id} &bull; v{exec.workflowSnapshot?.version || 1}
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${cfg.color}`}
                            >
                              <Icon className="w-3 h-3" />
                              {exec.status}
                            </span>
                          </td>

                          <td className="py-4 px-4 font-mono text-slate-300">
                            {exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : 'Active'}
                          </td>

                          <td className="py-4 px-4 font-mono text-slate-300">
                            {exec.agentConfidence ? `${Math.round(exec.agentConfidence * 100)}%` : '95%'}
                          </td>

                          <td className="py-4 px-4 text-slate-400">
                            {new Date(exec.createdAt).toLocaleString()}
                          </td>

                          <td className="py-4 px-5 text-right">
                            <Link
                              href={`/executions/${exec._id}`}
                              className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-primary-600/30 text-slate-200 hover:text-primary-300 border border-surface-border hover:border-primary-500/40 text-xs font-semibold transition-all inline-flex items-center gap-1"
                            >
                              <span>Console</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
