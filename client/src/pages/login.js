import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';
import { Bot, Lock, Mail, ArrowRight, Loader2, Sparkles, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    const res = await login(email, password);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setLocalError(res.error || 'Authentication failed');
    }
  };

  const handleDemoLogin = async () => {
    setLocalError(null);
    // Auto register or login default operator demo account
    const demoEmail = 'operator@agentflow.ai';
    const demoPass = 'OperatorPass2026!';

    let res = await login(demoEmail, demoPass);
    if (!res.success) {
      // If not yet registered, register demo account on the fly
      res = await register('Lead Operator', demoEmail, demoPass, 'operator');
    }

    if (res.success) {
      router.push('/dashboard');
    } else {
      setLocalError(res.error || 'Demo login failed');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 selection:bg-primary-500 selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-primary-500/25 mb-3">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Operator Authentication</h1>
          <p className="text-xs text-slate-400 mt-1">Sign in to manage workflows and AI agent executions</p>
        </div>

        {/* Card Form */}
        <div className="p-8 rounded-2xl border border-surface-border bg-surface/80 backdrop-blur-xl shadow-2xl">
          {(error || localError) && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300">
              {localError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Operator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="operator@agentflow.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-elevated border border-surface-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-elevated border border-surface-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-primary-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Button */}
          <div className="mt-5 pt-5 border-t border-surface-border">
            <button
              onClick={handleDemoLogin}
              type="button"
              className="w-full py-2.5 px-4 rounded-xl border border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>1-Click Instant Demo Login</span>
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary-400 hover:text-primary-300 font-semibold">
            Create Operator Account
          </Link>
        </p>
      </div>
    </div>
  );
}
