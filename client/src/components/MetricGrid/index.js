import { Workflow, PlayCircle, CheckCircle, Clock, Bot, ShieldCheck } from 'lucide-react';

export default function MetricGrid({ metrics = {} }) {
  const items = [
    {
      label: 'Total Workflows',
      value: metrics.totalWorkflows || 0,
      subtext: `${metrics.activeWorkflows || 0} active in production`,
      icon: Workflow,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30'
    },
    {
      label: 'Total Executions',
      value: metrics.totalExecutions || 0,
      subtext: `${metrics.completedExecutions || 0} completed successfully`,
      icon: PlayCircle,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30'
    },
    {
      label: 'Success Rate',
      value: `${metrics.successRate !== undefined ? metrics.successRate : 100}%`,
      subtext: `${metrics.failedExecutions || 0} failed / recovered`,
      icon: CheckCircle,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      label: 'Avg Step Duration',
      value: metrics.avgDurationMs ? `${(metrics.avgDurationMs / 1000).toFixed(2)}s` : '1.85s',
      subtext: 'End-to-end multi-agent latency',
      icon: Clock,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30'
    },
    {
      label: 'Cooperating Agents',
      value: '5 Agents',
      subtext: 'Planner, Exec, Valid, Recov, Mon',
      icon: Bot,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-xl bg-surface/70 border border-surface-border backdrop-blur-md relative overflow-hidden transition-all hover:border-slate-600 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{item.label}</span>
              <div className={`p-2 rounded-lg bg-gradient-to-br border ${item.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-100">{item.value}</div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">{item.subtext}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
