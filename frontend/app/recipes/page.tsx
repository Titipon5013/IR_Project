'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import RecipeCard, { Recipe } from '@/components/RecipeCard';
import RecipeModal from '@/components/RecipeModal';
import {
  getAllRecipesPaginated,
  getRandomRecipes,
  getRecipesByCategoryPaginated,
  toUiRecipe,
} from '@/lib/api';

const PAGE_SIZE = 12;

type SectionType = 'picked' | 'trending' | 'surprise' | 'all';

function normalizeSection(value: string | null): SectionType {
  if (value === 'picked' || value === 'trending' || value === 'surprise' || value === 'all') {
    return value;
  }
  return 'all';
}

function clampPage(value: number): number {
  if (Number.isNaN(value) || value < 1) return 1;
  return value;
}

export default function RecipesPage() {
  const searchParams = useSearchParams();
  const section = normalizeSection(searchParams.get('section'));
  const category = searchParams.get('category') || '';
  const initialPage = clampPage(Number(searchParams.get('page') || '1'));

  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setPage(initialPage);
  }, [initialPage, section, category]);

  useEffect(() => {
    let isMounted = true;
    const loadPage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (section === 'trending' && category) {
          const response = await getRecipesByCategoryPaginated(category, page, PAGE_SIZE);
          if (!isMounted) return;
          setRecipes(response.results.map(toUiRecipe));
          setTotalPages(Math.max(1, response.total_pages || 1));
          return;
        }

        if (section === 'picked' || section === 'surprise') {
          const random = await getRandomRecipes(PAGE_SIZE);
          if (!isMounted) return;
          setRecipes(random.map(toUiRecipe));
          setTotalPages(Math.max(1, page));
          return;
        }

        const response = await getAllRecipesPaginated(page, PAGE_SIZE);
        if (!isMounted) return;
        setRecipes(response.results.map(toUiRecipe));
        setTotalPages(Math.max(1, response.total_pages || 1));
      } catch (loadError) {
        if (!isMounted) return;
        setRecipes([]);
        setTotalPages(1);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load recipes');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadPage();
    return () => {
      isMounted = false;
    };
  }, [section, category, page]);

  const sectionTitle = useMemo(() => {
    if (section === 'picked') return 'Picked For You';
    if (section === 'trending') return category ? `Trending: ${category}` : 'Trending';
    if (section === 'surprise') return 'Surprise Me';
    return 'All Recipes';
  }, [section, category]);

  const buildHref = (nextPage: number) => {
    const query = new URLSearchParams();
    query.set('section', section);
    if (category) query.set('category', category);
    query.set('page', String(nextPage));
    return `/recipes?${query.toString()}`;
  };

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages || section === 'picked' || section === 'surprise';

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-100">{sectionTitle}</h1>
            <p className="text-zinc-400 mt-2">Browse recipes with paginated navigation</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-500 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-20 text-zinc-500">Loading recipes...</div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">No recipes available</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={(item) => {
                setSelectedRecipe(item);
                setIsModalOpen(true);
              }} />
            ))}
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-3">
          {canGoPrev ? (
            <Link
              href={buildHref(page - 1)}
              className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-500 transition-colors"
            >
              Previous
            </Link>
          ) : (
            <span className="px-4 py-2 rounded-lg border border-zinc-800 text-zinc-600">Previous</span>
          )}

          <span className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200">
            {section === 'picked' || section === 'surprise'
              ? `Page ${page}`
              : `Page ${page} of ${totalPages}`}
          </span>

          {canGoNext ? (
            <Link
              href={buildHref(page + 1)}
              className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-500 transition-colors"
            >
              Next
            </Link>
          ) : (
            <span className="px-4 py-2 rounded-lg border border-zinc-800 text-zinc-600">Next</span>
          )}
        </div>
      </div>

      <RecipeModal
        recipe={selectedRecipe}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
