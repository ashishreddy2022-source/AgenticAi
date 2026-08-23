import React, { useState } from 'react';
import {
  Bot,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

const agentStyles = {
  planner: {
    label: 'Planner Agent',
    icon: Sparkles,
    badge: 'bg-purple-950/40 text-purple-300 border-purple-500/30',
    dot: 'bg-purple-400'
  },
  execution: {
    label: 'Execution Agent',
    icon: Zap,
    badge: 'bg-blue-950/40 text-blue-300 border-blue-500/30',
    dot: 'bg-blue-400'
  },
  validation: {
    label: 'Validation Agent',
    icon: ShieldCheck,
    badge: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400'
  },
  recovery: {
    label: 'Recovery Agent',
    icon: RotateCcw,
    badge: 'bg-amber-950/40 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400'
  },
  monitoring: {
    label: 'Monitoring Agent',
    icon: Activity,
    badge: 'bg-pink-950/40 text-pink-300 border-pink-500/30',
    dot: 'bg-pink-400'
  },
  system: {
    label: 'System Orchestrator',
    icon: Bot,
    badge: 'bg-slate-900/60 text-slate-300 border-slate-700',
    dot: 'bg-slate-400'
  }
};

const levelStyles = {
  info: 'text-slate-300',
  success: 'text-emerald-300',
  warning: 'text-amber-300',
  error: 'text-rose-300 font-semibold'
};

export default function ExecutionTimeline({ logs = [], isLive = false }) {
  const [expandedIndices, setExpandedIndices] = useState(new Set());

  const toggleExpand = (idx) => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-surface-border bg-surface/80 backdrop-blur-md overflow-hidden flex flex-col shadow-lg">
      <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-elevated/40">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-primary-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Agentic Execution Stream
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              LIVE STREAMING
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono text-slate-400 bg-surface-elevated border border-surface-border">
              PERSISTED TIMELINE
            </span>
          )}
        </div>
      </div>

      <div className="p-5 overflow-y-auto max-h-[600px] space-y-4">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <Bot className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-pulse" />
            Awaiting agent pipeline initialization...
          </div>
        ) : (
          logs.map((log, index) => {
            const agentKey = log.agent || 'system';
            const agentCfg = agentStyles[agentKey] || agentStyles.system;
            const Icon = agentCfg.icon;
            const isExpanded = expandedIndices.has(index);
            const hasMeta = log.metadata && Object.keys(log.metadata).length > 0;

            return (
              <div key={log._id || index} className="relative pl-6 border-l border-surface-border/70 group">
                {/* Timeline Dot */}
                <div
                  className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 border-background ${agentCfg.dot}`}
                />

                <div className="p-3.5 rounded-xl border border-surface-border bg-surface-elevated/50 hover:bg-surface-elevated transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${agentCfg.badge}`}
                      >
                        <Icon className="w-3 h-3" />
                        {agentCfg.label}
                      </span>
                      {log.nodeId && (
                        <span className="text-[10px] text-slate-400 font-mono bg-surface px-1.5 py-0.5 rounded border border-surface-border">
                          Node: {log.nodeId}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                    </span>
                  </div>

                  <p className={`text-xs ${levelStyles[log.level] || 'text-slate-300'} leading-relaxed`}>
                    {log.message}
                  </p>

                  {hasMeta && (
                    <div className="mt-2 pt-2 border-t border-surface-border/40">
                      <button
                        onClick={() => toggleExpand(index)}
                        className="text-[10px] font-mono text-primary-400 hover:text-primary-300 flex items-center gap-1"
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        {isExpanded ? 'Hide Payload Details' : 'View Agent Payload Metadata'}
                      </button>
                      {isExpanded && (
                        <pre className="mt-2 p-2.5 rounded bg-background/90 text-[10px] font-mono text-slate-300 overflow-x-auto border border-surface-border">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
