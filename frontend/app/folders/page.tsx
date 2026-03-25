'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FolderHeart, Plus, Edit2, Trash2, BookmarkCheck, ChevronRight } from 'lucide-react';
import { deleteFolder, getBookmarks, getFolders, saveFolders, type Folder } from '@/lib/api';

export default function FoldersPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [bookmarkCountByFolder, setBookmarkCountByFolder] = useState<Record<string, number>>({});

  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');

  useEffect(() => {
    const storedFolders = getFolders();
    const storedBookmarks = getBookmarks();
    const counts = storedBookmarks.reduce<Record<string, number>>((acc, bookmark) => {
      acc[bookmark.folderId] = (acc[bookmark.folderId] || 0) + 1;
      return acc;
    }, {});

    setFolders(storedFolders);
    setBookmarkCountByFolder(counts);
  }, []);

  const totalBookmarks = useMemo(
    () => Object.values(bookmarkCountByFolder).reduce((sum, count) => sum + count, 0),
    [bookmarkCountByFolder]
  );

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      description: newFolderDescription,
      color: 'emerald',
    };

    const nextFolders = [...folders, newFolder];
    setFolders(nextFolders);
    saveFolders(nextFolders);
    setNewFolderName('');
    setNewFolderDescription('');
    setIsCreating(false);
  };

  const handleDeleteFolder = (id: string) => {
    if (confirm('Are you sure you want to delete this folder?')) {
      const nextFolders = folders.filter((folder) => folder.id !== id);
      setFolders(nextFolders);
      deleteFolder(id);
      const nextCounts = { ...bookmarkCountByFolder };
      delete nextCounts[id];
      setBookmarkCountByFolder(nextCounts);
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; hover: string }> = {
      emerald: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        hover: 'hover:border-emerald-500',
      },
      blue: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        hover: 'hover:border-blue-500',
      },
      purple: {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        hover: 'hover:border-purple-500',
      },
      amber: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        hover: 'hover:border-amber-500',
      },
    };
    return colors[color] || colors.emerald;
  };

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8" data-aos="fade-down">
          <div className="flex items-center gap-3 mb-3">
            <FolderHeart className="text-emerald-400" size={32} />
            <h1 className="text-4xl font-bold text-zinc-100">
              Your <span className="text-emerald-400">Vault</span>
            </h1>
          </div>
          <p className="text-zinc-400 text-lg">
            Organize your recipes into collections and discover AI-powered recommendations
          </p>
          <p className="text-zinc-500 text-sm mt-2">
            {folders.length} folders • {totalBookmarks} bookmarked recipes
          </p>
        </div>

        {/* Create Folder Button */}
        <div className="mb-8" data-aos="fade-up">
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold rounded-lg transition-colors"
            >
              <Plus size={20} />
              Create New Folder
            </button>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md">
              <h3 className="text-lg font-bold text-zinc-100 mb-4">Create New Folder</h3>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full px-4 py-2.5 mb-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <input
                type="text"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-4 py-2.5 mb-4 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCreateFolder}
                  className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold rounded-lg transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Folders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.map((folder, index) => {
            const colorClasses = getColorClasses(folder.color);
            return (
              <div
                key={folder.id}
                data-aos="fade-up"
                data-aos-delay={index * 50}
                className={`group bg-zinc-900 rounded-xl p-6 border ${colorClasses.border} ${colorClasses.hover} transition-all duration-300 hover:shadow-lg hover:shadow-${folder.color}-500/10`}
              >
                <Link href={`/folders/${folder.id}`} className="block">
                  {/* Folder Icon */}
                  <div className={`${colorClasses.bg} w-14 h-14 rounded-lg flex items-center justify-center mb-4`}>
                    <FolderHeart className={colorClasses.text} size={28} />
                  </div>

                  {/* Folder Info */}
                  <h3 className="text-xl font-bold text-zinc-100 mb-2 group-hover:text-emerald-400 transition-colors">
                    {folder.name}
                  </h3>
                  {folder.description && (
                    <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                      {folder.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                      <BookmarkCheck size={16} />
                        <span>
                          {(bookmarkCountByFolder[folder.id] || 0)}{' '}
                          {(bookmarkCountByFolder[folder.id] || 0) === 1 ? 'recipe' : 'recipes'}
                        </span>
                      </div>
                    <ChevronRight className="text-zinc-600 group-hover:text-emerald-400 transition-colors" size={20} />
                  </div>
                </Link>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      // TODO: Implement edit functionality
                      alert('Edit folder: ' + folder.name);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors text-sm"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteFolder(folder.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-red-900/50 text-zinc-300 hover:text-red-400 rounded-lg transition-colors text-sm"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
