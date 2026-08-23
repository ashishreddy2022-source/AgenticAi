import { useState, useEffect } from 'react';
import Link from 'next/router';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../store/authStore';
import { getSocket, joinUserRoom } from '../../services/socket';
import api from '../../services/api';
import {
  LayoutDashboard,
  Workflow,
  Sparkles,
  PlayCircle,
  Puzzle,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  Bot,
  Activity,
  CheckCircle2,
  AlertTriangle,
  X,
  Check
} from 'lucide-react';

export default function AppShell({ children, title, subtitle }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();

    if (user?.id) {
      joinUserRoom(user.id);
    }

    const socket = getSocket();
    if (socket) {
      const handleNewNotification = (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((c) => c + 1);
      };

      socket.on('notification:new', handleNewNotification);
      return () => {
        socket.off('notification:new', handleNewNotification);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {
      // ignore in silent fail
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'AI Builder', href: '/workflows/builder', icon: Sparkles, badge: 'AI' },
    { label: 'Workflows', href: '/workflows', icon: Workflow },
    { label: 'Executions', href: '/executions', icon: PlayCircle },
    { label: 'Integrations', href: '/integrations', icon: Puzzle },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-surface-border bg-surface/80 backdrop-blur-xl flex flex-col shrink-0">
        {/* Brand */}
        <div className="h-16 border-b border-surface-border flex items-center px-6 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-wide bg-gradient-to-r from-white via-slate-200 to-primary-300 bg-clip-text text-transparent">
              Agentflow AI
            </div>
            <div className="text-[10px] text-primary-400 font-mono tracking-wider uppercase">Operations Engine</div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href || (item.href !== '/dashboard' && router.pathname.startsWith(item.href) && item.href !== '/workflows/builder');
            return (
              <NextLink
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-gradient-to-r from-primary-500 to-cyan-500 text-white uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}
              </NextLink>
            );
          })}
        </nav>

        {/* Multi-Agent status indicator */}
        <div className="p-3 m-3 rounded-xl bg-surface-elevated/40 border border-surface-border/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Orchestrator Status</span>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
              ONLINE
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            5 Cooperating Agents Active (Planner, Execution, Validation, Recovery, Monitoring)
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="p-3 border-t border-surface-border/80 flex items-center justify-between bg-surface-elevated/20">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-primary-900/60 border border-primary-500/40 flex items-center justify-center font-bold text-xs text-primary-300">
              {user?.name ? user.name[0].toUpperCase() : 'O'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Operator'}</div>
              <div className="text-[10px] text-slate-400 font-mono capitalize">{user?.role || 'operator'}</div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-surface-border bg-surface/60 backdrop-blur-md px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-base font-semibold text-slate-100">{title || 'Console'}</h1>
              {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Link to AI Builder */}
            <NextLink
              href="/workflows/builder"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-primary-600/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Prompt to Workflow</span>
            </NextLink>

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-surface-elevated/80 border border-surface-border transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Drawer */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 max-h-[480px] bg-surface-elevated border border-surface-border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-3.5 border-b border-surface-border flex items-center justify-between bg-surface/80">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary-400" />
                      <span className="text-xs font-semibold text-slate-200">Audit & Alerts ({unreadCount} unread)</span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-surface-border/50 max-h-80">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">No new notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          className={`p-3 text-xs transition-colors hover:bg-surface/50 ${
                            !n.isRead ? 'bg-primary-950/20' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-semibold text-slate-200">{n.title}</div>
                            {!n.isRead && (
                              <button
                                onClick={() => markAsRead(n._id)}
                                className="text-[10px] text-slate-400 hover:text-slate-200"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                          <p className="text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                            <span className="capitalize">{n.type}</span>
                            <span>{new Date(n.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
