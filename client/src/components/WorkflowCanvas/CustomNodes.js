import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Zap,
  Bot,
  Mail,
  MessageSquare,
  FileSpreadsheet,
  GitFork,
  Terminal,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const providerIcons = {
  gmail: Mail,
  slack: MessageSquare,
  discord: MessageSquare,
  'google-sheets': FileSpreadsheet,
  openrouter: Bot,
  gemini: Bot,
  system: Zap
};

const providerColors = {
  gmail: 'text-rose-400 border-rose-500/40 bg-rose-950/20',
  slack: 'text-amber-400 border-amber-500/40 bg-amber-950/20',
  discord: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/20',
  'google-sheets': 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20',
  openrouter: 'text-purple-400 border-purple-500/40 bg-purple-950/20',
  gemini: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/20',
  system: 'text-slate-400 border-slate-500/40 bg-slate-900/40'
};

// 1. Trigger Node
export const TriggerNode = memo(({ data, selected }) => {
  return (
    <div
      className={`px-4 py-3 rounded-xl min-w-[200px] bg-surface/90 backdrop-blur-md border transition-all shadow-lg ${
        selected ? 'border-cyan-400 ring-2 ring-cyan-500/30' : 'border-cyan-500/40'
      }`}
    >
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-cyan-400">Trigger</div>
          <div className="text-xs font-semibold text-slate-100">{data.label || 'Trigger'}</div>
        </div>
      </div>
      {data.action && (
        <div className="text-[10px] text-slate-400 font-mono mt-1 bg-surface-elevated/80 px-2 py-0.5 rounded border border-surface-border truncate">
          {data.action}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-background hover:!scale-125 transition-transform"
      />
    </div>
  );
});

// 2. AI Agent Node
export const AgentNode = memo(({ data, selected }) => {
  return (
    <div
      className={`px-4 py-3 rounded-xl min-w-[220px] bg-surface/90 backdrop-blur-md border transition-all shadow-lg ${
        selected ? 'border-primary-400 ring-2 ring-primary-500/30' : 'border-primary-500/40'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary-400 !border-2 !border-background hover:!scale-125 transition-transform"
      />
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="p-1.5 rounded-lg bg-primary-500/20 text-primary-400 border border-primary-500/30">
          <Bot className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-primary-400">AI Agent Step</div>
          <div className="text-xs font-semibold text-slate-100">{data.label || 'AI Reasoning'}</div>
        </div>
      </div>
      {data.config?.prompt && (
        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 italic bg-surface-elevated/40 p-1.5 rounded border border-surface-border/40">
          &ldquo;{data.config.prompt}&rdquo;
        </p>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary-400 !border-2 !border-background hover:!scale-125 transition-transform"
      />
    </div>
  );
});

// 3. Integration Node
export const IntegrationNode = memo(({ data, selected }) => {
  const provider = data.provider || 'system';
  const Icon = providerIcons[provider] || Terminal;
  const colorClass = providerColors[provider] || providerColors.system;

  return (
    <div
      className={`px-4 py-3 rounded-xl min-w-[220px] bg-surface/90 backdrop-blur-md border transition-all shadow-lg ${
        selected ? 'border-indigo-400 ring-2 ring-indigo-500/30' : 'border-surface-border'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-background hover:!scale-125 transition-transform"
      />
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className={`p-1.5 rounded-lg border ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{provider}</div>
          <div className="text-xs font-semibold text-slate-100">{data.label || provider}</div>
        </div>
      </div>
      <div className="text-[10px] text-slate-400 font-mono bg-surface-elevated/80 px-2 py-0.5 rounded border border-surface-border truncate">
        Action: {data.action || 'execute'}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-background hover:!scale-125 transition-transform"
      />
    </div>
  );
});

// 4. Condition Node
export const ConditionNode = memo(({ data, selected }) => {
  return (
    <div
      className={`px-4 py-3 rounded-xl min-w-[200px] bg-surface/90 backdrop-blur-md border transition-all shadow-lg ${
        selected ? 'border-amber-400 ring-2 ring-amber-500/30' : 'border-amber-500/40'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-background hover:!scale-125 transition-transform"
      />
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <GitFork className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-amber-400">Logic Branch</div>
          <div className="text-xs font-semibold text-slate-100">{data.label || 'Condition'}</div>
        </div>
      </div>
      <div className="text-[10px] text-slate-400 font-mono bg-surface-elevated/80 px-2 py-0.5 rounded border border-surface-border truncate">
        {data.config?.field || 'status'} == {data.config?.value || 'true'}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-background hover:!scale-125 transition-transform"
      />
    </div>
  );
});

// 5. Generic Action Node
export const ActionNode = memo(({ data, selected }) => {
  return (
    <div
      className={`px-4 py-3 rounded-xl min-w-[200px] bg-surface/90 backdrop-blur-md border transition-all shadow-lg ${
        selected ? 'border-slate-300 ring-2 ring-slate-400/30' : 'border-surface-border'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-background hover:!scale-125 transition-transform"
      />
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
          <Terminal className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Action</div>
          <div className="text-xs font-semibold text-slate-100">{data.label || 'Action'}</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-background hover:!scale-125 transition-transform"
      />
    </div>
  );
});

export const nodeTypes = {
  trigger: TriggerNode,
  agent: AgentNode,
  integration: IntegrationNode,
  condition: ConditionNode,
  action: ActionNode
};
