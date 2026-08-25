import React, { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell from '../../components/AppShell';
import WorkflowCanvas from '../../components/WorkflowCanvas';
import NodeConfigPanel from '../../components/NodeConfigPanel';
import { useWorkflowStore } from '../../store/workflowStore';
import api from '../../services/api';
import {
  Sparkles,
  Send,
  Loader2,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  Cpu,
  Layers,
  Wand2,
  Play,
  Sliders,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';

const PROMPT_SUGGESTIONS = [
  'Process incoming Gmail invoices, extract total amount with AI, add to Google Sheets and notify Slack #finance',
  'Listen for webhook incident alerts, classify severity with Gemini, post to Discord war-room and email on-call',
  'Lead qualification pipeline: score inbound form leads with LLM, sync to Google Sheets CRM, and alert sales on Slack',
  'Daily system health report: summarize logs, generate executive digest, and post notification to Discord'
];

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const { setWorkflow, nodes, edges, selectedNode, selectNode, resetCanvas } = useWorkflowStore();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async (targetPrompt) => {
    const promptToUse = targetPrompt || prompt;
    if (!promptToUse.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/workflows/generate', { prompt: promptToUse });
      if (res.success && res.data) {
        setGeneratedResult(res.data);
        setWorkflow({
          name: res.data.name,
          description: res.data.description,
          tags: res.data.tags || ['AI-Generated'],
          nodes: res.data.nodes,
          edges: res.data.edges
        });
      }
    } catch (err) {
      setError(err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndOpenStudio = async () => {
    if (nodes.length === 0) return;
    setLoading(true);
    try {
      const res = await api.post('/workflows', {
        name: generatedResult?.name || 'AI Automation Flow',
        description: generatedResult?.description || prompt || 'Created via Prompt Builder',
        tags: generatedResult?.tags || ['AI-Generated'],
        nodes,
        edges,
        status: 'active'
      });

      if (res.success && res.data) {
        router.push(`/workflows/${res.data._id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to save workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteNow = async () => {
    if (nodes.length === 0) return;
    setLoading(true);
    try {
      const name = generatedResult?.name || 'Quick AI Automation Flow';
      const description = generatedResult?.description || prompt || 'Executed via AI Builder';
      const tags = generatedResult?.tags || ['AI-Generated'];

      const res = await api.post('/workflows', {
        name,
        description,
        tags,
        nodes,
        edges,
        status: 'active'
      });

      if (res.success && res.data) {
        const wfId = res.data._id;
        const execRes = await api.post(`/workflows/${wfId}/execute`, {
          inputs: { triggeredAt: new Date().toISOString(), source: 'builder_quick_run' }
        });
        if (execRes.success && execRes.data) {
          router.push(`/executions/${execRes.data._id}`);
        } else {
          router.push(`/workflows/${wfId}`);
        }
      }
    } catch (err) {
      setError(err.message || 'Execution initiation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell
        title="Prompt-to-Workflow Builder"
        subtitle="Translate natural language automation instructions into structured visual graphs"
      >
        <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
          {/* Top Control Bar: Prompt Input & Engine Info */}
          <div className="p-4 rounded-2xl border border-surface-border bg-surface/90 backdrop-blur-xl shadow-lg shrink-0">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex-1 w-full">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleGenerate();
                  }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <Wand2 className="w-4 h-4 absolute left-3.5 top-3.5 text-primary-400" />
                    <input
                      type="text"
                      placeholder="Describe your automation (e.g. Ingest customer email -> AI classify -> Slack alert -> Google Sheets log)..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full bg-surface-elevated border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-primary-600/30 flex items-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate Workflow Graph</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Suggestion Chips */}
                <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 text-[11px]">
                  <span className="text-slate-400 font-semibold shrink-0">Try examples:</span>
                  {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPrompt(suggestion);
                        handleGenerate(suggestion);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-surface-elevated hover:bg-primary-950/40 border border-surface-border hover:border-primary-500/40 text-slate-300 hover:text-primary-300 truncate max-w-xs transition-all cursor-pointer shrink-0"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Toolbar on Generation */}
              {nodes.length > 0 && (
                <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 border-surface-border w-full lg:w-auto justify-end">
                  <button
                    onClick={handleExecuteNow}
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>Execute Workflow</span>
                  </button>

                  <button
                    onClick={handleSaveAndOpenStudio}
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl bg-surface-elevated hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-surface-border hover:border-slate-500 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-primary-400" />
                    <span>Open in Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300">
                {error}
              </div>
            )}
          </div>

          {/* Canvas Graph Preview Area & Inspector */}
          <div className="flex-1 rounded-2xl border border-surface-border bg-background overflow-hidden relative shadow-inner flex">
            <div className="flex-1 relative h-full">
              {nodes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-surface-border flex items-center justify-center mb-4 text-primary-400 shadow-xl">
                    <Cpu className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-200">Interactive Visual Canvas</h3>
                  <p className="text-xs text-slate-400 max-w-md mt-1">
                    Type a prompt above or pick a sample template to watch the multi-agent engine assemble nodes, positions, and connections in real time.
                  </p>
                </div>
              ) : (
                <>
                  {/* Floating helper hint */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-surface/90 backdrop-blur-md border border-surface-border px-3 py-1.5 rounded-xl shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] text-slate-300">
                      Click any node to inspect &amp; edit configuration (Gmail, Slack, Prompts, Sheets)
                    </span>
                  </div>

                  <WorkflowCanvas
                    onNodeClick={(node) => selectNode(node)}
                    onPaneClick={() => selectNode(null)}
                  />
                </>
              )}
            </div>

            {/* Right Config Inspector in Builder */}
            {selectedNode && (
              <NodeConfigPanel onClose={() => selectNode(null)} />
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
