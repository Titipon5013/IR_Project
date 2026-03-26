'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { useAuth } from '@/components/AuthProvider';

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/');
    }
  }, [isLoading, user, router]);

  return (
    <div className="min-h-screen bg-slate-950 py-14 px-4">
      <div className="container mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-100 leading-tight">
            Welcome to <span className="text-sky-400">Food Assemble</span>
          </h1>
          <p className="text-slate-400 mt-4 text-lg">
            Login or register to save recipes into your folders and build your personal food archive.
          </p>
        </div>
        <div className="flex justify-center lg:justify-end">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
