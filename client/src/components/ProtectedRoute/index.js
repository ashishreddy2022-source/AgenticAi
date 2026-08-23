import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../store/authStore';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const { isAuthenticated, initAuth } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      await initAuth();
      const authData = localStorage.getItem('agentflow_auth');
      if (!authData && !isAuthenticated) {
        router.push('/login');
      } else {
        setChecking(false);
      }
    }
    check();
  }, [isAuthenticated, router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Authenticating Operator Session...</p>
      </div>
    );
  }

  return children;
}
