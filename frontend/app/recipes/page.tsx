'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import RecipeCard, { Recipe } from '@/components/RecipeCard';
import RecipeModal from '@/components/RecipeModal';
import {
  getAllRecipesPaginated,
  getCategories,
  getPersonalizedRecommendations,
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
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = normalizeSection(searchParams.get('section'));
  const category = searchParams.get('category') || '';
  const initialPage = clampPage(Number(searchParams.get('page') || '1'));

  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setPage(initialPage);
  }, [initialPage, section, category]);

  useEffect(() => {
    if (section !== 'all') return;

    let isMounted = true;
    const loadCategories = async () => {
      setIsCategoriesLoading(true);
      try {
        const categoryRows = await getCategories();
        if (!isMounted) return;
        setCategories(categoryRows.map((item) => item.name));
      } catch {
        if (!isMounted) return;
        setCategories([]);
      } finally {
        if (isMounted) setIsCategoriesLoading(false);
      }
    };

    loadCategories();
    return () => {
      isMounted = false;
    };
  }, [section]);

  useEffect(() => {
    let isMounted = true;
    const loadPage = async () => {
      if (section === 'picked' && isAuthLoading) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (section === 'trending' && category) {
          const response = await getRecipesByCategoryPaginated(category, page, PAGE_SIZE);
          if (!isMounted) return;
          setRecipes(response.results.map(toUiRecipe));
          setTotalResults(response.total || 0);
          setTotalPages(Math.max(1, response.total_pages || 1));
          return;
        }

        if (section === 'picked') {
          if (!user) {
            if (!isMounted) return;
            setRecipes([]);
            setTotalResults(0);
            setTotalPages(1);
            setError('Please sign in to view your personalized recommendations.');
            return;
          }

          const response = await getPersonalizedRecommendations(user.id, PAGE_SIZE);
          if (!isMounted) return;
          setRecipes(response.results.map(toUiRecipe));
          setTotalResults(response.results.length);
          setTotalPages(1);
          return;
        }

        if (section === 'surprise') {
          const random = await getRandomRecipes(PAGE_SIZE);
          if (!isMounted) return;
          setRecipes(random.map(toUiRecipe));
          setTotalResults(random.length);
          setTotalPages(Math.max(1, page));
          return;
        }

        if (section === 'all' && category) {
          const response = await getRecipesByCategoryPaginated(category, page, PAGE_SIZE);
          if (!isMounted) return;
          setRecipes(response.results.map(toUiRecipe));
          setTotalResults(response.total || 0);
          setTotalPages(Math.max(1, response.total_pages || 1));
          return;
        }

        const response = await getAllRecipesPaginated(page, PAGE_SIZE);
        if (!isMounted) return;
        setRecipes(response.results.map(toUiRecipe));
        setTotalResults(response.total || 0);
        setTotalPages(Math.max(1, response.total_pages || 1));
      } catch (loadError) {
        if (!isMounted) return;
        setRecipes([]);
        setTotalResults(0);
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
  }, [section, category, page, user, isAuthLoading]);

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

  const handleCategoryChange = (nextCategory: string) => {
    const query = new URLSearchParams();
    query.set('section', 'all');
    query.set('page', '1');
    if (nextCategory) {
      query.set('category', nextCategory);
    }
    router.push(`/recipes?${query.toString()}`);
  };

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages || section === 'surprise';

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100">{sectionTitle}</h1>
            <p className="text-slate-400 mt-2">Browse recipes with paginated navigation</p>
            {(section === 'all' || (section === 'trending' && category)) && (
              <p className="text-slate-500 mt-1 text-sm">{totalResults.toLocaleString()} menus found</p>
            )}
            {section === 'all' && (
              <div className="mt-4">
                <label htmlFor="all-recipes-category" className="block text-sm text-slate-400 mb-2">
                  Filter by category
                </label>
                <select
                  id="all-recipes-category"
                  value={category}
                  onChange={(event) => handleCategoryChange(event.target.value)}
                  className="w-full sm:w-72 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  disabled={isCategoriesLoading}
                >
                  <option value="">All Categories</option>
                  {categories.map((categoryName) => (
                    <option key={categoryName} value={categoryName}>
                      {categoryName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-slate-100 hover:border-slate-500 transition-colors"
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
          <div className="text-center py-20 text-slate-500">Loading recipes...</div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20 text-slate-500">No recipes available</div>
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
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-slate-100 hover:border-slate-500 transition-colors"
            >
              Previous
            </Link>
          ) : (
            <span className="px-4 py-2 rounded-lg border border-slate-800 text-slate-600">Previous</span>
          )}

          <span className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
            {section === 'picked' || section === 'surprise'
              ? `Page ${page}`
              : `Page ${page} of ${totalPages}`}
          </span>

          {canGoNext ? (
            <Link
              href={buildHref(page + 1)}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-slate-100 hover:border-slate-500 transition-colors"
            >
              Next
            </Link>
          ) : (
            <span className="px-4 py-2 rounded-lg border border-slate-800 text-slate-600">Next</span>
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
