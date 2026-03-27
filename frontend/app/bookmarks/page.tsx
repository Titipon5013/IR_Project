'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Recipe } from '@/components/RecipeCard';
import RecipeModal from '@/components/RecipeModal';
import { Trophy, Star, Bookmark, Loader2, FolderSync, Trash2 } from 'lucide-react';
import { deleteBookmark, getBookmarks, getFolders, getRecipesByIds, toUiRecipe, updateBookmark } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/components/AuthProvider';
import { usePopup } from '@/components/PopupProvider';

type BookmarkedRecipe = Recipe & {
  bookmarkId: string;
  folderId: string;
  folderName: string;
  userRating: number;
};

export default function BookmarksPage() {
  const { user } = useAuth();
  const { showConfirm, showMessage } = usePopup();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookmarkedRecipes, setBookmarkedRecipes] = useState<BookmarkedRecipe[]>([]);
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [movingBookmarkId, setMovingBookmarkId] = useState<string | null>(null);
  const [removingBookmarkId, setRemovingBookmarkId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const loadBookmarks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [bookmarkEntries, folders] = await Promise.all([getBookmarks(user.id), getFolders(user.id)]);
        setFolders(folders.map((folder) => ({ id: folder.id, name: folder.name })));
        const folderNameById = new Map(folders.map((folder) => [folder.id, folder.name]));

        if (bookmarkEntries.length === 0) {
          if (isMounted) setBookmarkedRecipes([]);
          return;
        }

        const recipeIds = Array.from(new Set(bookmarkEntries.map((entry) => entry.recipeId)));
        const recipeDetails = await getRecipesByIds(recipeIds);
        if (!isMounted) return;

        const recipeById = new Map(recipeDetails.map((recipe) => [recipe.RecipeId, toUiRecipe(recipe)]));
        const merged = bookmarkEntries
          .map((entry) => {
            const recipe = recipeById.get(entry.recipeId);
            if (!recipe) return null;
            return {
              ...recipe,
              bookmarkId: entry.id,
              folderId: entry.folderId,
              userRating: entry.userRating,
              folderName: folderNameById.get(entry.folderId) || 'Uncategorized',
            };
          })
          .filter((item): item is BookmarkedRecipe => item !== null);

        setBookmarkedRecipes(merged);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load bookmarks');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadBookmarks();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const sortedBookmarks = useMemo(
    () => [...bookmarkedRecipes].sort((a, b) => b.userRating - a.userRating),
    [bookmarkedRecipes]
  );

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleMoveBookmark = async (bookmarkId: string, nextFolderId: string) => {
    if (!user || !nextFolderId) return;
    const targetFolder = folders.find((folder) => folder.id === nextFolderId);
    if (!targetFolder) return;

    const currentBookmark = bookmarkedRecipes.find((item) => item.bookmarkId === bookmarkId);
    if (!currentBookmark || currentBookmark.folderId === nextFolderId) return;

    setMovingBookmarkId(bookmarkId);
    try {
      await updateBookmark(user.id, bookmarkId, { folderId: nextFolderId });
      setBookmarkedRecipes((prev) =>
        prev.map((item) =>
          item.bookmarkId === bookmarkId
            ? { ...item, folderId: nextFolderId, folderName: targetFolder.name }
            : item
        )
      );
      showMessage('Moved to another folder', 'success');
    } catch (moveError) {
      showMessage(moveError instanceof Error ? moveError.message : 'Failed to move bookmark', 'error');
    } finally {
      setMovingBookmarkId(null);
    }
  };

  const handleRemoveBookmark = async (bookmarkId: string) => {
    if (!user) return;
    const shouldRemove = await showConfirm(
      'Remove bookmark',
      'Do you want to remove this recipe from your bookmarks?'
    );
    if (!shouldRemove) return;

    setRemovingBookmarkId(bookmarkId);
    try {
      await deleteBookmark(user.id, bookmarkId);
      setBookmarkedRecipes((prev) => prev.filter((item) => item.bookmarkId !== bookmarkId));
      showMessage('Bookmark removed', 'success');
    } catch (removeError) {
      showMessage(removeError instanceof Error ? removeError.message : 'Failed to remove bookmark', 'error');
    } finally {
      setRemovingBookmarkId(null);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-950 py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8" data-aos="fade-down">
            <div className="flex items-center gap-3 mb-3">
              <Bookmark className="text-sky-400" size={32} />
              <h1 className="text-4xl font-bold text-slate-100">
                Your <span className="text-sky-400">Archives</span>
              </h1>
            </div>
          </div>

          <div className="mb-8 p-6 bg-slate-900 rounded-xl border border-slate-800" data-aos="fade-up">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Trophy className="text-amber-400" size={24} />
                <div>
                  <p className="text-sm text-slate-500">Total Bookmarks</p>
                  <p className="text-2xl font-bold text-slate-100">{bookmarkedRecipes.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Star className="text-amber-400" size={24} fill="currentColor" />
                <div>
                  <p className="text-sm text-slate-500">Average Rating</p>
                  <p className="text-2xl font-bold text-slate-100">
                    {bookmarkedRecipes.length > 0
                      ? (
                          bookmarkedRecipes.reduce((sum, r) => sum + r.userRating, 0) /
                          bookmarkedRecipes.length
                        ).toFixed(1)
                      : '0.0'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="text-sky-400 animate-spin" size={48} />
              </div>
            ) : sortedBookmarks.length > 0 ? (
              sortedBookmarks.map((recipe, index) => (
                <div
                  key={recipe.id}
                  data-aos="fade-up"
                  data-aos-delay={index * 50}
                  onClick={() => handleRecipeClick(recipe)}
                  className="group cursor-pointer bg-slate-900 rounded-xl p-5 border border-slate-800 hover:border-sky-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/10"
                >
                  <div className="flex items-center gap-6 flex-wrap md:flex-nowrap">
                    <div className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl bg-slate-800/50 text-slate-500 border border-slate-700">
                      #{index + 1}
                    </div>
                    <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                      <Image
                        src={recipe.image}
                        alt={recipe.name}
                        fill
                        unoptimized
                        sizes="80px"
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-100 mb-1 truncate group-hover:text-sky-400 transition-colors">
                        {recipe.name}
                      </h3>
                      <p className="text-sm text-slate-400 line-clamp-1 mb-1">{recipe.description}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="px-2 py-1 bg-slate-800 rounded-md">{recipe.folderName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={20}
                          className={i < recipe.userRating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}
                        />
                      ))}
                    </div>
                    <div
                      className="w-full md:w-auto md:min-w-67.5 flex items-center gap-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="relative flex-1">
                        <select
                          value={recipe.folderId}
                          onChange={(event) => void handleMoveBookmark(recipe.bookmarkId, event.target.value)}
                          disabled={movingBookmarkId === recipe.bookmarkId || folders.length === 0}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-sky-500 disabled:opacity-60"
                        >
                          {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.name}
                            </option>
                          ))}
                        </select>
                        {movingBookmarkId === recipe.bookmarkId && (
                          <Loader2 size={14} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-sky-400" />
                        )}
                      </div>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleRemoveBookmark(recipe.bookmarkId);
                        }}
                        disabled={removingBookmarkId === recipe.bookmarkId}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-300 rounded-lg text-sm transition-colors disabled:opacity-60"
                      >
                        {removingBookmarkId === recipe.bookmarkId ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <FolderSync size={13} className="text-slate-600" />
                    <span>Manage folder directly from this list</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20">
                <Bookmark className="mx-auto text-slate-700 mb-4" size={64} />
                <p className="text-slate-500 text-lg">No bookmarks yet</p>
              </div>
            )}
          </div>
        </div>

        <RecipeModal recipe={selectedRecipe} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </AuthGuard>
  );
}
