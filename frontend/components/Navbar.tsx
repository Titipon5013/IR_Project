'use client';

import Link from 'next/link';
import { Search, FolderHeart, Bookmark, LogIn, LogOut } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleAuth = () => {
    setIsLoggedIn(!isLoggedIn);
  };

  return (
    <nav className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-zinc-100 to-emerald-400 bg-clip-text text-transparent hover:from-emerald-400 hover:to-emerald-500 transition-all"
          >
            FoodVault
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-zinc-300 hover:text-emerald-400 transition-colors"
            >
              <Search size={18} />
              <span>Discover</span>
            </Link>
            <Link
              href="/folders"
              className="flex items-center gap-2 text-zinc-300 hover:text-emerald-400 transition-colors"
            >
              <FolderHeart size={18} />
              <span>Folders</span>
            </Link>
            <Link
              href="/bookmarks"
              className="flex items-center gap-2 text-zinc-300 hover:text-emerald-400 transition-colors"
            >
              <Bookmark size={18} />
              <span>Bookmarks</span>
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button
                onClick={handleAuth}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            ) : (
              <button
                onClick={handleAuth}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-medium rounded-lg transition-colors"
              >
                <LogIn size={18} />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center justify-around pb-3 space-x-4">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            <Search size={20} />
            <span className="text-xs">Discover</span>
          </Link>
          <Link
            href="/folders"
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            <FolderHeart size={20} />
            <span className="text-xs">Folders</span>
          </Link>
          <Link
            href="/bookmarks"
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            <Bookmark size={20} />
            <span className="text-xs">Bookmarks</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
