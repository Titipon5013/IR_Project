'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Search, FolderHeart, Bookmark, LogIn, LogOut } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { SUPABASE_CONFIG_HINTS } from '@/lib/supabase/constants';
import { usePopup } from './PopupProvider';
import GoogleIcon from './GoogleIcon';

export default function Navbar() {
  const { user, signInWithGoogle, signOut, isAuthEnabled } = useAuth();
  const { showMessage } = usePopup();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-slate-100 to-sky-400 bg-clip-text text-transparent hover:from-sky-400 hover:to-sky-500 transition-all"
          >
            Food Assemble
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-300 hover:text-sky-400 transition-colors"
            >
              <Search size={18} />
              <span>Discover</span>
            </Link>
            <Link
              href="/folders"
              className="flex items-center gap-2 text-slate-300 hover:text-sky-400 transition-colors"
            >
              <FolderHeart size={18} />
              <span>Folders</span>
            </Link>
            <Link
              href="/bookmarks"
              className="flex items-center gap-2 text-slate-300 hover:text-sky-400 transition-colors"
            >
              <Bookmark size={18} />
              <span>Bookmarks</span>
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {isAuthEnabled && user ? (
              <>
                <span className="hidden sm:inline text-sm text-slate-300 max-w-[220px] truncate" title={user.email ?? ''}>
                  {user.email ?? '-'}
                </span>
                <button
                  onClick={() => void signOut()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-slate-950 font-medium rounded-lg transition-colors"
                >
                  <LogIn size={18} />
                  <span>{mounted && !isAuthEnabled ? 'Configure Auth' : 'Login'}</span>
                </Link>
                {isAuthEnabled && (
                  <button
                    onClick={() => void signInWithGoogle()}
                    className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg transition-colors"
                  >
                    <GoogleIcon className="h-4 w-4" />
                    <span>Google</span>
                  </button>
                )}
                {!isAuthEnabled && mounted && (
                  <button
                    onClick={() => {
                      showMessage(`Set env first: ${SUPABASE_CONFIG_HINTS.join(' | ')}`, 'info');
                    }}
                    className="hidden sm:inline-flex items-center px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors text-sm"
                  >
                    Env help
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center justify-around pb-3 space-x-4">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-sky-400 transition-colors"
          >
            <Search size={20} />
            <span className="text-xs">Discover</span>
          </Link>
          <Link
            href="/folders"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-sky-400 transition-colors"
          >
            <FolderHeart size={20} />
            <span className="text-xs">Folders</span>
          </Link>
          <Link
            href="/bookmarks"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-sky-400 transition-colors"
          >
            <Bookmark size={20} />
            <span className="text-xs">Bookmarks</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
