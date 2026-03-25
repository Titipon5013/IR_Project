'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FolderHeart, Plus, Edit2, Trash2, BookmarkCheck, ChevronRight } from 'lucide-react';
import {
  createFolder,
  deleteFolder,
  getBookmarks,
  getFolders,
  updateFolder,
  type Folder,
} from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';
import { usePopup } from '@/components/PopupProvider';
import { useAuth } from '@/components/AuthProvider';

export default function FoldersPage() {
  const { user } = useAuth();
  const { showConfirm, showMessage } = usePopup();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [bookmarkCountByFolder, setBookmarkCountByFolder] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [storedFolders, storedBookmarks] = await Promise.all([getFolders(user.id), getBookmarks(user.id)]);
      const counts = storedBookmarks.reduce<Record<string, number>>((acc, bookmark) => {
        acc[bookmark.folderId] = (acc[bookmark.folderId] || 0) + 1;
        return acc;
      }, {});
      setFolders(storedFolders);
      setBookmarkCountByFolder(counts);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to load folders', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [user]);

  const totalBookmarks = useMemo(
    () => Object.values(bookmarkCountByFolder).reduce((sum, count) => sum + count, 0),
    [bookmarkCountByFolder]
  );

  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    try {
      const created = await createFolder(user.id, newFolderName.trim());
      setFolders((prev) => [...prev, created]);
      setNewFolderName('');
      setIsCreating(false);
      showMessage('Folder created', 'success');
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to create folder', 'error');
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!user) return;
    const shouldDelete = await showConfirm(
      'Delete folder',
      'Are you sure you want to delete this folder? Bookmarks inside will be removed from this folder.'
    );
    if (!shouldDelete) return;

    try {
      await deleteFolder(user.id, id);
      setFolders((prev) => prev.filter((folder) => folder.id !== id));
      const nextCounts = { ...bookmarkCountByFolder };
      delete nextCounts[id];
      setBookmarkCountByFolder(nextCounts);
      showMessage('Folder deleted', 'success');
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to delete folder', 'error');
    }
  };

  const handleStartEdit = (folder: Folder) => {
    setEditingFolderId(folder.id);
    setEditFolderName(folder.name);
  };

  const handleSaveEdit = async () => {
    if (!user || !editingFolderId || !editFolderName.trim()) return;
    try {
      await updateFolder(user.id, editingFolderId, editFolderName.trim());
      setFolders((prev) =>
        prev.map((folder) => (folder.id === editingFolderId ? { ...folder, name: editFolderName.trim() } : folder))
      );
      setEditingFolderId(null);
      setEditFolderName('');
      showMessage('Folder updated', 'success');
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to update folder', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingFolderId(null);
    setEditFolderName('');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-950 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8" data-aos="fade-down">
            <div className="flex items-center gap-3 mb-3">
              <FolderHeart className="text-sky-400" size={32} />
              <h1 className="text-4xl font-bold text-slate-100">
                Your <span className="text-sky-400">Food Assemble</span>
              </h1>
            </div>
            <p className="text-slate-400 text-lg">
              Organize your recipes into collections and discover AI-powered recommendations
            </p>
            <p className="text-slate-500 text-sm mt-2">
              {folders.length} folders • {totalBookmarks} bookmarked recipes
            </p>
          </div>

          <div className="mb-8" data-aos="fade-up">
            {!isCreating ? (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-slate-950 font-semibold rounded-lg transition-colors"
              >
                <Plus size={20} />
                Create New Folder
              </button>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md">
                <h3 className="text-lg font-bold text-slate-100 mb-4">Create New Folder</h3>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="w-full px-4 py-2.5 mb-4 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => void handleCreateFolder()}
                    className="flex-1 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-slate-950 font-semibold rounded-lg transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="text-slate-400">Loading folders...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {folders.map((folder, index) => {
                const isEditing = editingFolderId === folder.id;
                return (
                  <div
                    key={folder.id}
                    data-aos="fade-up"
                    data-aos-delay={index * 50}
                    className="group bg-slate-900 rounded-xl p-6 border border-slate-800 hover:border-sky-500 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/10"
                  >
                    {isEditing ? (
                      <div className="block">
                        <div className="bg-sky-500/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                          <FolderHeart className="text-sky-400" size={28} />
                        </div>

                        <div className="space-y-2 mb-4">
                          <input
                            type="text"
                            value={editFolderName}
                            onChange={(event) => setEditFolderName(event.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-sky-500"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <BookmarkCheck size={16} />
                            <span>
                              {(bookmarkCountByFolder[folder.id] || 0)}{' '}
                              {(bookmarkCountByFolder[folder.id] || 0) === 1 ? 'recipe' : 'recipes'}
                            </span>
                          </div>
                          <ChevronRight className="text-slate-600 transition-colors" size={20} />
                        </div>
                      </div>
                    ) : (
                      <Link href={`/folders/${folder.id}`} className="block">
                        <div className="bg-sky-500/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                          <FolderHeart className="text-sky-400" size={28} />
                        </div>

                        <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-sky-400 transition-colors">
                          {folder.name}
                        </h3>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <BookmarkCheck size={16} />
                            <span>
                              {(bookmarkCountByFolder[folder.id] || 0)}{' '}
                              {(bookmarkCountByFolder[folder.id] || 0) === 1 ? 'recipe' : 'recipes'}
                            </span>
                          </div>
                          <ChevronRight className="text-slate-600 group-hover:text-sky-400 transition-colors" size={20} />
                        </div>
                      </Link>
                    )}

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800">
                      {isEditing ? (
                        <>
                          <button
                            onClick={(event) => {
                              event.preventDefault();
                              void handleSaveEdit();
                            }}
                            className="flex-1 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-slate-950 rounded-lg transition-colors text-sm font-semibold"
                          >
                            Save
                          </button>
                          <button
                            onClick={(event) => {
                              event.preventDefault();
                              handleCancelEdit();
                            }}
                            className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(event) => {
                              event.preventDefault();
                              handleStartEdit(folder);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm"
                          >
                            <Edit2 size={14} />
                            Edit
                          </button>
                          <button
                            onClick={(event) => {
                              event.preventDefault();
                              void handleDeleteFolder(folder.id);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-400 rounded-lg transition-colors text-sm"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
