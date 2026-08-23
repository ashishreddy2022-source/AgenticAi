import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';
import {
  Bot,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Activity,
  Layers,
  CheckCircle2,
  Terminal,
  PlayCircle
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const agents = [
    {
      name: 'Planner Agent',
      color: 'border-purple-500/40 bg-purple-950/20 text-purple-400',
      description: 'Calculates DAG graph topology, optimizes node ordering, and assigns execution confidence score.'
    },
    {
      name: 'Execution Agent',
      color: 'border-blue-500/40 bg-blue-950/20 text-blue-400',
      description: 'Dispatches actions to Gmail, Slack, Discord, Google Sheets, or AI LLMs with mustache variable resolution.'
    },
    {
      name: 'Validation Agent',
      color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400',
      description: 'Enforces strict output schemas and contract rules at every step before letting the workflow progress.'
    },
    {
      name: 'Recovery Agent',
      color: 'border-amber-500/40 bg-amber-950/20 text-amber-400',
      description: 'Classifies failure taxonomy (MISSING_FIELDS, API_FAILURE, AUTH_EXPIRED, RATE_LIMIT) and triggers backoff or escalation.'
    },
    {
      name: 'Monitoring Agent',
      color: 'border-pink-500/40 bg-pink-950/20 text-pink-400',
      description: 'Streams live execution events over Socket.IO and maintains an immutable audit trail in MongoDB.'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col selection:bg-primary-500 selection:text-white">
      {/* Top Navbar */}
      <header className="h-20 border-b border-surface-border/80 bg-surface/50 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-primary-300 bg-clip-text text-transparent">
              Agentflow AI
            </span>
            <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 font-mono border border-primary-500/30">
              OPERATIONS CONSOLE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-surface-elevated transition-colors"
          >
            Operator Sign In
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white shadow-lg shadow-primary-600/25 transition-all"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-8 py-20 max-w-6xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-950/50 border border-primary-500/40 text-primary-300 text-xs font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5 text-primary-400 animate-spin" />
          <span>Next-Generation Multi-Agent Operations Automation</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.15] bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Turn natural language prompts into resilient, agentic workflows.
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mt-6 leading-relaxed">
          Describe an automation in plain English. Watch it materialize on a visual canvas, executed and safeguarded by 5 cooperating AI agents with live Socket.IO telemetry and third-party integrations.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
          <Link
            href="/register"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-cyan-500 hover:from-primary-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-xl shadow-primary-600/30 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Prompt Studio</span>
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-surface-elevated border border-surface-border hover:border-slate-500 text-slate-200 font-semibold text-sm transition-all"
          >
            <PlayCircle className="w-4 h-4 text-slate-400" />
            <span>Test Demo Console</span>
          </Link>
        </div>
      </section>

      {/* 5-Agent Architecture Showcase */}
      <section className="px-8 py-16 bg-surface/40 border-y border-surface-border/70">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
              The 5 Cooperating AI Agent Chain
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Every workflow step is guarded, orchestrated, and validated autonomously.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {agents.map((agent, i) => (
              <div
                key={i}
                className={`p-5 rounded-2xl border backdrop-blur-md flex flex-col justify-between ${agent.color}`}
              >
                <div>
                  <div className="text-xs font-mono font-bold mb-2">0{i + 1} // AGENT</div>
                  <h3 className="text-sm font-bold text-slate-100 mb-2">{agent.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{agent.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Visual Canvas Preview Box */}
      <section className="px-8 py-20 max-w-6xl mx-auto w-full">
        <div className="rounded-2xl border border-surface-border bg-surface/70 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-surface-border pb-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-mono text-slate-400 ml-2">agentflow-console // invoice-approval.graph</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              STATUS: AGENTS RUNNING
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surface-elevated/70 border border-cyan-500/30">
              <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">1. Trigger Ingress</div>
              <div className="text-xs font-semibold text-slate-100 mt-1">Gmail New Invoice Received</div>
              <div className="text-[11px] text-slate-400 mt-1">subject:invoice has:attachment</div>
            </div>

            <div className="p-4 rounded-xl bg-surface-elevated/70 border border-primary-500/30">
              <div className="text-[10px] font-mono text-primary-400 uppercase font-bold">2. Multi-Agent Reasoning</div>
              <div className="text-xs font-semibold text-slate-100 mt-1">AI Line Item Extraction</div>
              <div className="text-[11px] text-slate-400 mt-1">Confidence Score: 98% [Claude 3.5]</div>
            </div>

            <div className="p-4 rounded-xl bg-surface-elevated/70 border border-emerald-500/30">
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold">3. Multi-Channel Dispatch</div>
              <div className="text-xs font-semibold text-slate-100 mt-1">Google Sheets + Slack Notification</div>
              <div className="text-[11px] text-slate-400 mt-1">Appended row &amp; alerted #finance-ops</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-surface-border bg-surface/60 py-8 px-8 text-center text-xs text-slate-400">
        <p>Agentflow AI Operations Automation Platform &bull; Built with Next.js, React Flow, Node.js, Express, and Socket.IO</p>
      </footer>
    </div>
  );
}
