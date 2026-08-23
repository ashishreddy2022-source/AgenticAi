import React, { useState } from 'react';
import {
  Zap,
  Bot,
  Mail,
  MessageSquare,
  FileSpreadsheet,
  GitFork,
  Search,
  Plus,
  Clock,
  Code,
  Filter
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

const PALETTE_CATEGORIES = [
  {
    name: 'Triggers',
    items: [
      {
        type: 'trigger',
        category: 'trigger',
        provider: 'system',
        action: 'manual_trigger',
        label: 'Manual Run Trigger',
        description: 'Initiate workflow execution on operator demand',
        icon: Zap,
        color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/30'
      },
      {
        type: 'trigger',
        category: 'trigger',
        provider: 'system',
        action: 'webhook_receive',
        label: 'Webhook Listener',
        description: 'Trigger from external HTTP POST webhook',
        config: { webhookPath: '/webhooks/custom-ingress' },
        icon: Zap,
        color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/30'
      },
      {
        type: 'trigger',
        category: 'trigger',
        provider: 'gmail',
        action: 'read_emails',
        label: 'Gmail New Email Ingress',
        description: 'Polls incoming inbox for specific queries/attachments',
        config: { query: 'is:unread', interval: '5m' },
        icon: Mail,
        color: 'text-rose-400 border-rose-500/30 bg-rose-950/30'
      }
    ]
  },
  {
    name: 'AI Agent Nodes',
    items: [
      {
        type: 'agent',
        category: 'agent',
        provider: 'openrouter',
        action: 'ai_reasoning',
        label: 'AI Reasoning & Decision',
        description: 'LLM agent evaluates context and produces structured output',
        config: { prompt: 'Analyze previous step data and make decisions', temperature: 0.3 },
        icon: Bot,
        color: 'text-primary-400 border-primary-500/30 bg-primary-950/30'
      },
      {
        type: 'agent',
        category: 'agent',
        provider: 'gemini',
        action: 'ai_reasoning',
        label: 'Gemini Data Extractor',
        description: 'Extracts structured JSON entities from unstructured text',
        config: { prompt: 'Extract fields: name, amount, date, status', temperature: 0.1 },
        icon: Bot,
        color: 'text-purple-400 border-purple-500/30 bg-purple-950/30'
      }
    ]
  },
  {
    name: 'Third-Party Integrations',
    items: [
      {
        type: 'integration',
        category: 'integration',
        provider: 'gmail',
        action: 'send_email',
        label: 'Gmail Send Email',
        description: 'Dispatch formatted emails via Gmail OAuth',
        config: { to: 'operator@agentflow.ai', subject: 'Automated Operations Notification', body: 'Step completed: {{node-1.summary}}' },
        icon: Mail,
        color: 'text-rose-400 border-rose-500/30 bg-rose-950/30'
      },
      {
        type: 'integration',
        category: 'integration',
        provider: 'slack',
        action: 'post_message',
        label: 'Slack Post Message',
        description: 'Broadcast channel message or direct webhook',
        config: { channel: '#ops-alerts', message: '🔔 *Workflow Update*: Execution step passed.' },
        icon: MessageSquare,
        color: 'text-amber-400 border-amber-500/30 bg-amber-950/30'
      },
      {
        type: 'integration',
        category: 'integration',
        provider: 'discord',
        action: 'send_message',
        label: 'Discord Send Alert',
        description: 'Send bot messages or webhook payloads to Discord server',
        config: { channelId: 'general-ops', message: '🚀 **Agentflow Notification**: Operation completed.' },
        icon: MessageSquare,
        color: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/30'
      },
      {
        type: 'integration',
        category: 'integration',
        provider: 'google-sheets',
        action: 'append_row',
        label: 'Google Sheets Append Row',
        description: 'Append real-time data rows to Google Spreadsheet ledger',
        config: { spreadsheetId: 'ops_ledger', range: 'Sheet1!A1', values: ['{{timestamp}}', '{{node-1.output}}'] },
        icon: FileSpreadsheet,
        color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30'
      }
    ]
  },
  {
    name: 'Logic & Flow Control',
    items: [
      {
        type: 'condition',
        category: 'condition',
        provider: 'system',
        action: 'evaluate_condition',
        label: 'Condition / Branch',
        description: 'Split workflow execution based on variable evaluation',
        config: { field: 'status', operator: 'equals', value: 'success' },
        icon: GitFork,
        color: 'text-amber-400 border-amber-500/30 bg-amber-950/30'
      },
      {
        type: 'action',
        category: 'action',
        provider: 'system',
        action: 'json_transform',
        label: 'JSON Data Transform',
        description: 'Map, format, and filter JSON payload attributes',
        icon: Code,
        color: 'text-slate-300 border-slate-600 bg-slate-800/40'
      }
    ]
  }
];

export default function NodePalette() {
  const [search, setSearch] = useState('');
  const { addNode } = useWorkflowStore();

  const onDragStart = (event, item) => {
    event.dataTransfer.setData('application/agentflow-node', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredCategories = PALETTE_CATEGORIES.map((category) => ({
    ...category,
    items: category.items.filter(
      (item) =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.provider.toLowerCase().includes(search.toLowerCase())
    )
  })).filter((category) => category.items.length > 0);

  return (
    <div className="w-80 border-r border-surface-border bg-surface/90 flex flex-col h-full shrink-0 select-none">
      <div className="p-4 border-b border-surface-border">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Node Palette</h2>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search triggers, AI, tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-elevated/70 border border-surface-border rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          Drag cards to canvas or click <Plus className="w-3 h-3 inline text-primary-400" /> to add
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {filteredCategories.map((category, idx) => (
          <div key={idx}>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              {category.name}
            </div>
            <div className="space-y-2">
              {category.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={itemIdx}
                    draggable
                    onDragStart={(e) => onDragStart(e, item)}
                    className="p-2.5 rounded-lg border border-surface-border bg-surface-elevated/40 hover:bg-surface-elevated hover:border-slate-500 cursor-grab active:cursor-grabbing transition-all group flex items-start justify-between gap-2 shadow-sm"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-md border shrink-0 mt-0.5 ${item.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-primary-300 transition-colors">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => addNode(item)}
                      title="Add to canvas"
                      className="p-1 rounded bg-surface border border-surface-border text-slate-400 hover:text-white hover:border-primary-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
