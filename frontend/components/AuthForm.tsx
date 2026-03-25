'use client';

import { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { usePopup } from './PopupProvider';
import GoogleIcon from './GoogleIcon';

type Mode = 'login' | 'register';

export default function AuthForm() {
  const { signInWithPassword, signUpWithPassword, signInWithGoogle, isAuthEnabled } = useAuth();
  const { showMessage } = usePopup();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isAuthEnabled) {
      showMessage('Supabase auth is not configured', 'error');
      return;
    }

    if (!email.trim() || !password.trim()) {
      showMessage('Please enter both email and password', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await signInWithPassword(email.trim(), password);
        showMessage('Login successful', 'success');
      } else {
        await signUpWithPassword(email.trim(), password);
        showMessage('Account created. Check your email for verification if enabled.', 'success');
      }
      setPassword('');
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Authentication failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-100">
          {mode === 'login' ? 'Login' : 'Register'}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {mode === 'login'
            ? 'Sign in to manage your folders and bookmarks.'
            : 'Create an account to start saving recipes.'}
        </p>
      </div>

      <div className="mb-5 flex rounded-lg bg-slate-950 p-1">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === 'login' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === 'register'
              ? 'bg-sky-500 text-slate-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          autoComplete="email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
          minLength={6}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 font-semibold text-slate-950 hover:bg-sky-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
          <span>{isSubmitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}</span>
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-800" />
        <span className="text-xs text-slate-500">OR</span>
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        disabled={!isAuthEnabled}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-slate-200 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        <GoogleIcon className="h-4 w-4" />
        <span>Continue with Google</span>
      </button>
    </div>
  );
}
