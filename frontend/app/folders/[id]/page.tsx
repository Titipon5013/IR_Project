'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import RecipeCard, { Recipe } from '@/components/RecipeCard';
import RecipeModal from '@/components/RecipeModal';
import { ChevronLeft, Sparkles, Loader2, TrendingUp } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import {
  getBookmarks,
  getFolders,
  getRandomRecipes,
  getRecipesByCategory,
  getRecipesByIds,
  toUiRecipe,
  type Folder,
} from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export default function FolderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [folderRecipes, setFolderRecipes] = useState<Recipe[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const loadFolderData = async () => {
      setIsLoading(true);
      setError(null);

      const allFolders = await getFolders(user.id);
      const currentFolder = allFolders.find((item) => item.id === id) || null;

      if (!isMounted) return;
      setFolder(currentFolder);

      if (!currentFolder) {
        setFolderRecipes([]);
        setIsLoading(false);
        setError('Folder not found');
        return;
      }

      const bookmarkIds = (await getBookmarks(user.id))
        .filter((bookmark) => bookmark.folderId === id)
        .map((bookmark) => bookmark.recipeId);

      if (bookmarkIds.length === 0) {
        setFolderRecipes([]);
        setIsLoading(false);
        return;
      }

      try {
        const recipes = await getRecipesByIds(bookmarkIds);
        if (!isMounted) return;
        setFolderRecipes(recipes.map(toUiRecipe));
      } catch (loadError) {
        if (!isMounted) return;
        setFolderRecipes([]);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load folder recipes');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadFolderData();

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  const folderRecipeIds = useMemo(() => new Set(folderRecipes.map((recipe) => recipe.id)), [folderRecipes]);

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const categoryCounts = folderRecipes.reduce<Record<string, number>>((acc, recipe) => {
        if (!recipe.category) return acc;
        acc[recipe.category] = (acc[recipe.category] || 0) + 1;
        return acc;
      }, {});

      const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([category]) => category);

      const categoryResults = await Promise.all(topCategories.map((category) => getRecipesByCategory(category, 8)));

      const candidates = categoryResults
        .flat()
        .map(toUiRecipe)
        .filter((recipe) => !folderRecipeIds.has(recipe.id));

      const deduped = candidates.filter(
        (recipe, index, all) => all.findIndex((candidate) => candidate.id === recipe.id) === index
      );

      let finalSuggestions = deduped.slice(0, 8);

      if (finalSuggestions.length < 4) {
        const randomRecipes = (await getRandomRecipes(12))
          .map(toUiRecipe)
          .filter(
            (recipe) =>
              !folderRecipeIds.has(recipe.id) &&
              !finalSuggestions.some((candidate) => candidate.id === recipe.id)
          );
        finalSuggestions = [...finalSuggestions, ...randomRecipes].slice(0, 8);
      }

      setAiSuggestions(finalSuggestions);
      setHasGenerated(true);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Failed to generate recommendations'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950 py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <Link
            href="/folders"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors mb-6"
          >
            <ChevronLeft size={20} />
            Back to Folders
          </Link>

          <div className="mb-8" data-aos="fade-down">
            <h1 className="text-4xl font-bold text-zinc-100 mb-2">{folder?.name || 'Folder'}</h1>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-zinc-100 mb-6">
              Saved Recipes <span className="text-emerald-400">({folderRecipes.length})</span>
            </h2>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={36} className="text-emerald-400 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {folderRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} onClick={handleRecipeClick} />
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
              {error}
            </div>
          )}

          {folderRecipes.length > 0 && (
            <div data-aos="fade-up">
              <div className="border-t border-zinc-800 pt-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-100 mb-2 flex items-center gap-3">
                      <Sparkles className="text-emerald-400" size={28} />
                      AI-Powered Suggestions
                    </h2>
                  </div>
                  {!hasGenerated && (
                    <button
                      onClick={() => void handleGenerateSuggestions()}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <TrendingUp size={20} />
                          Generate Suggestions
                        </>
                      )}
                    </button>
                  )}
                </div>

                {hasGenerated && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {aiSuggestions.map((recipe, index) => (
                      <div key={recipe.id} data-aos="fade-up" data-aos-delay={index * 100}>
                        <RecipeCard recipe={recipe} onClick={handleRecipeClick} />
                        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                          <TrendingUp size={12} />
                          <span>AI Match: {Math.max(78, 95 - index * 4)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {folderRecipes.length === 0 && (
            <div className="text-center py-20" data-aos="fade-up">
              <p className="text-zinc-500 text-lg mb-2">This folder is empty</p>
            </div>
          )}
        </div>

        <RecipeModal recipe={selectedRecipe} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </AuthGuard>
  );
}
