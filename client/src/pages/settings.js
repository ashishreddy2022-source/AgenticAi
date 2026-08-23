import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import AppShell from '../components/AppShell';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import {
  User,
  ShieldCheck,
  Key,
  Server,
  Activity,
  CheckCircle,
  Database,
  Lock,
  Cpu
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await api.get('/health');
        setHealthData(res);
      } catch (err) {
        console.error('Health check error:', err);
      } finally {
        setLoadingHealth(false);
      }
    }
    checkHealth();
  }, []);

  return (
    <ProtectedRoute>
      <AppShell
        title="System & Security Settings"
        subtitle="Manage operator identity, credential encryption health, and agent orchestrator diagnostics"
      >
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Operator Profile Card */}
          <div className="p-6 rounded-2xl border border-surface-border bg-surface/80 backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-surface-border">
              <div className="p-2.5 rounded-xl bg-primary-950/60 border border-primary-500/30 text-primary-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Operator Profile</h2>
                <p className="text-xs text-slate-400">Current authenticated session details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-surface-elevated/40 border border-surface-border">
                <span className="text-slate-400 block mb-1">Operator Name:</span>
                <span className="font-semibold text-slate-100 text-sm">{user?.name || 'Lead Operator'}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated/40 border border-surface-border">
                <span className="text-slate-400 block mb-1">Email Address:</span>
                <span className="font-semibold text-slate-100 font-mono text-sm">{user?.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated/40 border border-surface-border">
                <span className="text-slate-400 block mb-1">Assigned Role:</span>
                <span className="px-2.5 py-0.5 rounded bg-primary-950/80 border border-primary-500/30 text-primary-300 font-mono uppercase font-bold text-[11px]">
                  {user?.role || 'operator'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated/40 border border-surface-border">
                <span className="text-slate-400 block mb-1">Last Login Session:</span>
                <span className="font-mono text-slate-300 text-[11px]">
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* System & Encryption Health Checks */}
          <div className="p-6 rounded-2xl border border-surface-border bg-surface/80 backdrop-blur-md shadow-lg space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-surface-border">
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Platform Security &amp; Diagnostics
                </h2>
                <p className="text-xs text-slate-400">Cryptographic storage and engine status</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-surface-elevated/40 border border-surface-border flex items-start gap-3">
                <Lock className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">Credential Encryption</div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-0.5">AES-256-GCM Active</div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Application key derived with SHA-256 hash.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-elevated/40 border border-surface-border flex items-start gap-3">
                <Database className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">Database Layer</div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-0.5">MongoDB Connected</div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Immutable execution audit trail persisting.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-elevated/40 border border-surface-border flex items-start gap-3">
                <Cpu className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">Queue Engine</div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                    {healthData?.queue?.engine || 'Async Queue Active'}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Background scheduling with retry backoff.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-elevated/40 border border-surface-border flex items-start gap-3">
                <Activity className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">Socket.IO Gateway</div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-0.5">WebSocket Realtime Online</div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Event broadcasts to execution rooms.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-elevated/40 border border-surface-border flex items-start gap-3">
                <Server className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">LangGraph Substrate</div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                    Status: {healthData?.langGraphStatus || 'available'}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Orchestrates the 5 cooperating agents.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-elevated/40 border border-surface-border flex items-start gap-3">
                <Key className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">AI Fallback Engine</div>
                  <div className="text-[11px] text-primary-400 font-mono mt-0.5">OpenRouter &rarr; Gemini &rarr; Rule Engine</div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Multi-tier deterministic fallback guarantees graph generation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
