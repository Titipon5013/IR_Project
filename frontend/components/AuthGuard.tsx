'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthEnabled } = useAuth();

  if (isLoading) {
    return <div className="text-center py-20 text-zinc-500">Checking authentication...</div>;
  }

  if (!isAuthEnabled) {
    return (
      <div className="min-h-screen bg-zinc-950 py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
            <h1 className="text-2xl font-bold text-zinc-100 mb-2">Authentication is not configured</h1>
            <p className="text-zinc-300">
              Please set Supabase env variables, then refresh this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <Lock className="mx-auto text-emerald-400 mb-4" size={36} />
            <h1 className="text-2xl font-bold text-zinc-100 mb-2">Sign in required</h1>
            <p className="text-zinc-400 mb-6">
              Please sign in to access bookmarks and folders.
            </p>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

