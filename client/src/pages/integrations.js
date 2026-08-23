import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute';
import AppShell from '../components/AppShell';
import api from '../services/api';
import {
  Mail,
  MessageSquare,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Link2,
  Unlink,
  RefreshCw,
  Loader2,
  Key,
  ShieldCheck,
  Sparkles,
  ExternalLink
} from 'lucide-react';

const PROVIDER_METADATA = {
  gmail: {
    name: 'Gmail & Google Workspace',
    description: 'Send alerts, draft replies, and parse inbound emails.',
    icon: Mail,
    color: 'text-rose-400 border-rose-500/40 bg-rose-950/20'
  },
  slack: {
    name: 'Slack Workspaces',
    description: 'Post messages to channels, send webhooks, and trigger bot actions.',
    icon: MessageSquare,
    color: 'text-amber-400 border-amber-500/40 bg-amber-950/20'
  },
  discord: {
    name: 'Discord Servers & Webhooks',
    description: 'Broadcast alerts to war-rooms, dispatch incident embeds, and manage bot channels.',
    icon: MessageSquare,
    color: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/20'
  },
  'google-sheets': {
    name: 'Google Sheets',
    description: 'Append live execution logs, sync CRM leads, and read tabular ranges.',
    icon: FileSpreadsheet,
    color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20'
  }
};

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [manualModal, setManualModal] = useState(null); // provider key
  const [manualForm, setManualForm] = useState({ accessToken: '', apiKey: '', webhookUrl: '', accountName: '' });

  const fetchIntegrations = async () => {
    try {
      const res = await api.get('/integrations');
      if (res.success && res.data) {
        setIntegrations(res.data);
      }
    } catch (e) {
      console.error('Failed to load integrations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();

    if (router.query.status === 'connected') {
      alert(`Successfully connected ${router.query.provider} via OAuth!`);
      router.replace('/integrations', undefined, { shallow: true });
    }
  }, [router.query]);

  const handleConnectOAuth = async (provider) => {
    setActionLoading(provider);
    try {
      const res = await api.get(`/integrations/oauth/${provider}/start`);
      if (res.success && res.data?.authUrl) {
        window.location.href = res.data.authUrl;
      }
    } catch (err) {
      alert(err.message || 'Failed to start OAuth');
      setActionLoading(null);
    }
  };

  const handleDisconnect = async (provider) => {
    if (!confirm(`Disconnect ${provider} integration?`)) return;
    setActionLoading(provider);
    try {
      await api.delete(`/integrations/${provider}`);
      await fetchIntegrations();
    } catch (err) {
      alert(err.message || 'Disconnect failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveManual = async (e) => {
    e.preventDefault();
    if (!manualModal) return;

    setActionLoading(manualModal);
    try {
      await api.post('/integrations', {
        provider: manualModal,
        ...manualForm
      });
      setManualModal(null);
      setManualForm({ accessToken: '', apiKey: '', webhookUrl: '', accountName: '' });
      await fetchIntegrations();
    } catch (err) {
      alert(err.message || 'Failed to save credentials');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell
        title="Third-Party Integrations"
        subtitle="Manage OAuth connections, webhook endpoints, and encrypted API credentials"
      >
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Security Banner */}
          <div className="p-4 rounded-2xl bg-surface/80 border border-surface-border backdrop-blur-md flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100">Application-Level AES-256 Encryption Active</div>
                <div className="text-[11px] text-slate-400">
                  All OAuth access tokens, refresh tokens, and bot secrets are encrypted at rest with your CREDENTIAL_ENCRYPTION_KEY.
                </div>
              </div>
            </div>
          </div>

          {/* Integrations Grid */}
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {integrations.map((item) => {
                const meta = PROVIDER_METADATA[item.provider] || {
                  name: item.provider,
                  description: '',
                  icon: Key,
                  color: 'text-slate-400 border-slate-700 bg-slate-900'
                };
                const Icon = meta.icon;
                const isBusy = actionLoading === item.provider;

                return (
                  <div
                    key={item.provider}
                    className="p-6 rounded-2xl border border-surface-border bg-surface/80 backdrop-blur-md flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      {/* Top Provider Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl border ${meta.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-100">{meta.name}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {item.isConnected ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3" />
                                  CONNECTED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-surface-elevated px-2 py-0.5 rounded border border-surface-border">
                                  <XCircle className="w-3 h-3 text-slate-400" />
                                  DISCONNECTED
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mb-4 leading-relaxed">{meta.description}</p>

                      {item.isConnected && (
                        <div className="p-3 rounded-xl bg-surface-elevated/60 border border-surface-border text-xs space-y-1 mb-4">
                          <div className="flex justify-between text-slate-400">
                            <span>Account:</span>
                            <span className="text-slate-200 font-mono text-[11px]">
                              {item.accountEmail || item.accountName || 'Active Account'}
                            </span>
                          </div>
                          {item.expiresAt && (
                            <div className="flex justify-between text-slate-400">
                              <span>Token Expiry:</span>
                              <span className="text-slate-200 font-mono text-[11px]">
                                {new Date(item.expiresAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-4 border-t border-surface-border/60">
                      {item.isConnected ? (
                        <>
                          <button
                            onClick={() => handleDisconnect(item.provider)}
                            disabled={isBusy}
                            className="flex-1 py-2 px-3 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
                            <span>Disconnect</span>
                          </button>
                          <button
                            onClick={() => handleConnectOAuth(item.provider)}
                            disabled={isBusy}
                            className="py-2 px-3 rounded-xl bg-surface-elevated hover:bg-slate-700 border border-surface-border text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Reconnect</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleConnectOAuth(item.provider)}
                            disabled={isBusy}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-primary-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                            <span>Connect via OAuth</span>
                          </button>
                          <button
                            onClick={() => {
                              setManualModal(item.provider);
                              setManualForm({ accessToken: '', apiKey: '', webhookUrl: '', accountName: '' });
                            }}
                            className="py-2.5 px-3 rounded-xl bg-surface-elevated hover:bg-slate-700 border border-surface-border text-slate-300 text-xs font-medium transition-colors"
                          >
                            Manual Config
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Manual Credential Setup Modal */}
          {manualModal && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-surface border border-surface-border rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-3">
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                    Manual Config: {manualModal}
                  </h3>
                  <button
                    onClick={() => setManualModal(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleSaveManual} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Account Label / Identifier</label>
                    <input
                      type="text"
                      placeholder="e.g. Production Bot or Sandbox"
                      value={manualForm.accountName}
                      onChange={(e) => setManualForm({ ...manualForm, accountName: e.target.value })}
                      className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Access Token / Bot Secret</label>
                    <input
                      type="password"
                      placeholder="Bearer token or bot token"
                      value={manualForm.accessToken}
                      onChange={(e) => setManualForm({ ...manualForm, accessToken: e.target.value })}
                      className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Webhook URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://hooks.slack.com/... or Discord webhook"
                      value={manualForm.webhookUrl}
                      onChange={(e) => setManualForm({ ...manualForm, webhookUrl: e.target.value })}
                      className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setManualModal(null)}
                      className="px-4 py-2 rounded-lg bg-surface-elevated text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading === manualModal}
                      className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-bold"
                    >
                      Save &amp; Connect
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
