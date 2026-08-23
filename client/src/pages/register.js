import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';
import { Bot, Lock, Mail, User, ArrowRight, Loader2, Shield } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('operator');
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    const res = await register(name, email, password, role);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setLocalError(res.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 selection:bg-primary-500 selection:text-white">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-primary-500/25 mb-3">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Register Operator</h1>
          <p className="text-xs text-slate-400 mt-1">Set up your Agentflow operations access</p>
        </div>

        <div className="p-8 rounded-2xl border border-surface-border bg-surface/80 backdrop-blur-xl shadow-2xl">
          {(error || localError) && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300">
              {localError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Alex Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-elevated border border-surface-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="alex@ops.agentflow.ai"
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
                  minLength={6}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-elevated border border-surface-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Role Separation
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('operator')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                    role === 'operator'
                      ? 'bg-primary-950/60 border-primary-500 text-primary-300 shadow-sm'
                      : 'bg-surface-elevated border-surface-border text-slate-400'
                  }`}
                >
                  Operator
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                    role === 'admin'
                      ? 'bg-primary-950/60 border-primary-500 text-primary-300 shadow-sm'
                      : 'bg-surface-elevated border-surface-border text-slate-400'
                  }`}
                >
                  Admin
                </button>
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
                  <span>Create Account &amp; Access Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-400 hover:text-primary-300 font-semibold">
            Operator Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
