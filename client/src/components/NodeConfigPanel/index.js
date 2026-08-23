import React from 'react';
import { X, Trash2, Sliders, ShieldCheck, HelpCircle } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

export default function NodeConfigPanel({ onClose }) {
  const { selectedNode, updateNodeData, deleteNode } = useWorkflowStore();

  if (!selectedNode) return null;

  const { id, type, data = {} } = selectedNode;
  const { label = '', category = '', provider = '', action = '', config = {}, validationRules = {} } = data;

  const handleFieldChange = (key, value) => {
    updateNodeData(id, {
      config: {
        ...config,
        [key]: value
      }
    });
  };

  const handleLabelChange = (newLabel) => {
    updateNodeData(id, { label: newLabel });
  };

  return (
    <div className="w-88 border-l border-surface-border bg-surface/95 backdrop-blur-xl flex flex-col h-full shrink-0 shadow-2xl z-20">
      {/* Header */}
      <div className="p-4 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Node Inspector</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => deleteNode(id)}
            title="Delete node"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Node Meta Details */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Node Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-primary-500 transition-colors font-medium"
          />
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-primary-950/60 border border-primary-500/30 text-primary-300 font-mono">
              ID: {id}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-surface-elevated border border-surface-border text-slate-400 font-mono capitalize">
              {provider || type}
            </span>
          </div>
        </div>

        {/* Dynamic Provider / Action Form Fields */}
        <div className="border-t border-surface-border pt-4">
          <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
            <span>Execution Configuration</span>
          </h3>

          {/* 1. Gmail Configuration */}
          {provider === 'gmail' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Recipient (To)</label>
                <input
                  type="text"
                  value={config.to || ''}
                  onChange={(e) => handleFieldChange('to', e.target.value)}
                  placeholder="operator@agentflow.ai or {{node-1.email}}"
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Subject</label>
                <input
                  type="text"
                  value={config.subject || ''}
                  onChange={(e) => handleFieldChange('subject', e.target.value)}
                  placeholder="System Notification: {{node-1.summary}}"
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email Body (HTML/Text)</label>
                <textarea
                  rows={4}
                  value={config.body || ''}
                  onChange={(e) => handleFieldChange('body', e.target.value)}
                  placeholder="Hello, operation result: {{node-2.output}}"
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-100 font-mono resize-none"
                />
              </div>
            </div>
          )}

          {/* 2. Slack Configuration */}
          {provider === 'slack' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Channel / Webhook</label>
                <input
                  type="text"
                  value={config.channel || ''}
                  onChange={(e) => handleFieldChange('channel', e.target.value)}
                  placeholder="#ops-alerts or #general"
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Message Content (Markdown)</label>
                <textarea
                  rows={4}
                  value={config.message || config.text || ''}
                  onChange={(e) => handleFieldChange('message', e.target.value)}
                  placeholder="🔔 *Agent Alert*: {{node-2.summary}}"
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-100 font-mono resize-none"
                />
              </div>
            </div>
          )}

          {/* 3. Discord Configuration */}
          {provider === 'discord' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Discord Channel ID / Webhook</label>
                <input
                  type="text"
                  value={config.channelId || ''}
                  onChange={(e) => handleFieldChange('channelId', e.target.value)}
                  placeholder="123456789012345678"
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Alert Message</label>
                <textarea
                  rows={4}
                  value={config.message || config.content || ''}
                  onChange={(e) => handleFieldChange('message', e.target.value)}
                  placeholder="🚨 **Outage Detected**: {{node-2.error}}"
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-100 font-mono resize-none"
                />
              </div>
            </div>
          )}

          {/* 4. Google Sheets Configuration */}
          {provider === 'google-sheets' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Spreadsheet ID</label>
                <input
                  type="text"
                  value={config.spreadsheetId || ''}
                  onChange={(e) => handleFieldChange('spreadsheetId', e.target.value)}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Range</label>
                <input
                  type="text"
                  value={config.range || ''}
                  onChange={(e) => handleFieldChange('range', e.target.value)}
                  placeholder="Sheet1!A1"
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>
          )}

          {/* 5. AI Agent Prompt Configuration */}
          {(type === 'agent' || provider === 'openrouter' || provider === 'gemini') && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Agent Prompt & Directive</label>
                <textarea
                  rows={5}
                  value={config.prompt || ''}
                  onChange={(e) => handleFieldChange('prompt', e.target.value)}
                  placeholder="Analyze the incoming payload, extract the key entities, and formulate an operational decision..."
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-100 resize-none font-sans leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Temperature ({config.temperature ?? 0.3})</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.temperature ?? 0.3}
                  onChange={(e) => handleFieldChange('temperature', parseFloat(e.target.value))}
                  className="w-full accent-primary-500"
                />
              </div>
            </div>
          )}

          {/* 6. Condition Configuration */}
          {type === 'condition' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Context Field</label>
                <input
                  type="text"
                  value={config.field || ''}
                  onChange={(e) => handleFieldChange('field', e.target.value)}
                  placeholder="status or node-1.severity"
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Operator</label>
                <select
                  value={config.operator || 'equals'}
                  onChange={(e) => handleFieldChange('operator', e.target.value)}
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-100"
                >
                  <option value="equals">Equals (==)</option>
                  <option value="contains">Contains substring</option>
                  <option value="greaterThan">Greater Than (&gt;)</option>
                  <option value="isTruthy">Is Truthy / Present</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Expected Match Value</label>
                <input
                  type="text"
                  value={config.value || ''}
                  onChange={(e) => handleFieldChange('value', e.target.value)}
                  placeholder="true or P0 or success"
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Validation Agent Contract Rules */}
        <div className="border-t border-surface-border pt-4">
          <div className="flex items-center gap-1.5 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-300">Validation Agent Contract</h3>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">
            The Validation Agent will inspect this node&apos;s output schema to ensure contracts are met before next steps.
          </p>
          <input
            type="text"
            placeholder="Required keys (e.g. status, id, score)"
            value={validationRules.requiredFields ? validationRules.requiredFields.join(', ') : ''}
            onChange={(e) => {
              const fields = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
              updateNodeData(id, {
                validationRules: {
                  ...validationRules,
                  requiredFields: fields
                }
              });
            }}
            className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
          />
        </div>

        {/* Help Tip */}
        <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border/50 text-[11px] text-slate-400 flex items-start gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-primary-400 shrink-0 mt-0.5" />
          <span>
            Use mustache tags like <code className="text-primary-300 font-mono text-[10px]">{'{{node-1.summary}}'}</code> to pass step results downstream.
          </span>
        </div>
      </div>
    </div>
  );
}
