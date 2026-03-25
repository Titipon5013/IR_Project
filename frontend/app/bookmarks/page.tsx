'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import RecipeCard, { Recipe } from '@/components/RecipeCard';
import RecipeModal from '@/components/RecipeModal';
import { Trophy, Star, Bookmark, Loader2 } from 'lucide-react';
import { getBookmarks, getFolders, getRecipesByIds, toUiRecipe } from '@/lib/api';

export default function BookmarksPage() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookmarkedRecipes, setBookmarkedRecipes] = useState<
    (Recipe & { userRating: number; folderName: string })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadBookmarks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const bookmarkEntries = getBookmarks();
        const folders = getFolders();
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
              userRating: entry.userRating,
              folderName: folderNameById.get(entry.folderId) || 'Uncategorized',
            };
          })
          .filter((item): item is Recipe & { userRating: number; folderName: string } => item !== null);

        setBookmarkedRecipes(merged);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load bookmarks');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadBookmarks();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sort by user rating (highest first)
  const sortedBookmarks = useMemo(
    () => [...bookmarkedRecipes].sort((a, b) => b.userRating - a.userRating),
    [bookmarkedRecipes]
  );

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8" data-aos="fade-down">
          <div className="flex items-center gap-3 mb-3">
            <Bookmark className="text-emerald-400" size={32} />
            <h1 className="text-4xl font-bold text-zinc-100">
              Your <span className="text-emerald-400">Archives</span>
            </h1>
          </div>
          <p className="text-zinc-400 text-lg">
            All your bookmarked recipes ranked by your ratings
          </p>
        </div>

        {/* Leaderboard Stats */}
        <div className="mb-8 p-6 bg-zinc-900 rounded-xl border border-zinc-800" data-aos="fade-up">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Trophy className="text-amber-400" size={24} />
              <div>
                <p className="text-sm text-zinc-500">Total Bookmarks</p>
                <p className="text-2xl font-bold text-zinc-100">{bookmarkedRecipes.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Star className="text-amber-400" size={24} fill="currentColor" />
              <div>
                <p className="text-sm text-zinc-500">Average Rating</p>
                <p className="text-2xl font-bold text-zinc-100">
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

        {/* Bookmarked Recipes - Leaderboard Style */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="text-emerald-400 animate-spin" size={48} />
            </div>
          ) : sortedBookmarks.length > 0 ? (
            sortedBookmarks.map((recipe, index) => (
              <div
                key={recipe.id}
                data-aos="fade-up"
                data-aos-delay={index * 50}
                onClick={() => handleRecipeClick(recipe)}
                className="group cursor-pointer bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
              >
                <div className="flex items-center gap-6">
                  {/* Rank Badge */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl ${
                      index === 0
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : index === 1
                        ? 'bg-zinc-700/50 text-zinc-300 border border-zinc-600'
                        : index === 2
                        ? 'bg-orange-900/30 text-orange-400 border border-orange-500/30'
                        : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700'
                    }`}
                  >
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>

                  {/* Recipe Image */}
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                    <Image
                      src={recipe.image}
                      alt={recipe.name}
                      fill
                      unoptimized
                      sizes="80px"
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Recipe Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-zinc-100 mb-1 truncate group-hover:text-emerald-400 transition-colors">
                      {recipe.name}
                    </h3>
                    <p className="text-sm text-zinc-400 line-clamp-1 mb-1">
                      {recipe.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="px-2 py-1 bg-zinc-800 rounded-md">{recipe.folderName}</span>
                      <span>•</span>
                      <span>{recipe.cookTime}</span>
                    </div>
                  </div>

                  {/* User Rating */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={
                          i < recipe.userRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-zinc-700'
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20">
              <Bookmark className="mx-auto text-zinc-700 mb-4" size={64} />
              <p className="text-zinc-500 text-lg">No bookmarks yet</p>
              <p className="text-zinc-600 text-sm mt-2">
                Start exploring and save your favorite recipes!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recipe Modal */}
      <RecipeModal
        recipe={selectedRecipe}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
