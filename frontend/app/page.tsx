'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import RecipeCard, { Recipe } from '@/components/RecipeCard';
import RecipeModal from '@/components/RecipeModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getAllRecipesPaginated,
  getCategories,
  getRandomRecipes,
  getRecipesByCategory,
  searchRecipes,
  toUiRecipe,
} from '@/lib/api';

export default function Home() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [personalizedRecipes, setPersonalizedRecipes] = useState<Recipe[]>([]);
  const [categoryRecipes, setCategoryRecipes] = useState<Recipe[]>([]);
  const [randomRecipes, setRandomRecipes] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [categoryTitle, setCategoryTitle] = useState('Trending');
  const [topTrendingCategory, setTopTrendingCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [trendingScrollState, setTrendingScrollState] = useState({ canLeft: false, canRight: false });
  const sectionScrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [picked, surprise, allPage, categories] = await Promise.all([
          getRandomRecipes(8),
          getRandomRecipes(8),
          getAllRecipesPaginated(1, 8),
          getCategories(),
        ]);

        setPersonalizedRecipes(picked.slice(0, 4).map(toUiRecipe));
        setRandomRecipes(surprise.slice(0, 4).map(toUiRecipe));
        setAllRecipes(allPage.results.slice(0, 4).map(toUiRecipe));

        const topCategories = categories.slice(0, 2).map((category) => category.name);
        if (topCategories.length === 0) {
          setCategoryRecipes([]);
          setCategoryTitle('Trending');
          setTopTrendingCategory('');
          return;
        }

        const categoryGroups = await Promise.all(
          topCategories.map((categoryName) => getRecipesByCategory(categoryName, 6))
        );
        const merged = categoryGroups.flat().slice(0, 8).map(toUiRecipe);
        setCategoryRecipes(merged);
        setCategoryTitle(`Trending in ${topCategories.join(' & ')}`);
        setTopTrendingCategory(topCategories[0]);
      } catch {
        setPersonalizedRecipes([]);
        setCategoryRecipes([]);
        setRandomRecipes([]);
        setAllRecipes([]);
        setTopTrendingCategory('');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [refreshKey]);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await searchRecipes(query, 24);
      setSearchResults(response.results.map(toUiRecipe));
    } catch {
      setSearchResults([]);
    }
  };

  const handleClear = () => {
    setIsSearching(false);
    setSearchResults([]);
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  const updateTrendingScrollState = () => {
    const container = sectionScrollRefs.current.trending;
    if (!container) {
      setTrendingScrollState({ canLeft: false, canRight: false });
      return;
    }

    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    setTrendingScrollState({
      canLeft: container.scrollLeft > 4,
      canRight: container.scrollLeft < maxScrollLeft - 4,
    });
  };

  const handleScroll = (sectionKey: string, direction: 'left' | 'right') => {
    const container = sectionScrollRefs.current[sectionKey];
    if (!container) return;

    const distance = Math.max(260, Math.floor(container.clientWidth * 0.8));
    container.scrollBy({
      left: direction === 'right' ? distance : -distance,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    updateTrendingScrollState();

    const onResize = () => updateTrendingScrollState();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [categoryRecipes.length, isLoading]);

  const homeSections = useMemo(
    () => [
      {
        key: 'picked',
        title: 'Picked For You',
        recipes: personalizedRecipes,
        href: '/recipes?section=picked',
      },
      {
        key: 'trending',
        title: categoryTitle,
        recipes: categoryRecipes,
        href: topTrendingCategory
          ? `/recipes?section=trending&category=${encodeURIComponent(topTrendingCategory)}`
          : '/recipes?section=trending',
      },
      {
        key: 'surprise',
        title: 'Surprise Me',
        recipes: randomRecipes,
        href: '/recipes?section=surprise',
      },
      {
        key: 'all',
        title: 'All Recipes',
        recipes: allRecipes,
        href: '/recipes?section=all',
      },
    ],
    [personalizedRecipes, categoryRecipes, randomRecipes, allRecipes, categoryTitle, topTrendingCategory]
  );

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="container mx-auto max-w-5xl text-center">
          <h1
            className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-slate-100 to-sky-400 bg-clip-text text-transparent"
            data-aos="fade-down"
          >
            Discover Food Assemble
          </h1>
          <p
            className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Search thousands of recipes, bookmark your favorites, and get AI-powered
            recommendations tailored to your taste.
          </p>
          <div data-aos="fade-up" data-aos-delay="200">
            <SearchBar onSearch={handleSearch} onClear={handleClear} />
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {isSearching ? (
            /* Search Results Grid */
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-100">
                  Search Results{' '}
                  <span className="text-sky-400">({searchResults.length})</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.length > 0 ? (
                  searchResults.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onClick={handleRecipeClick}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-20">
                    <p className="text-slate-500 text-lg">No recipes found</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Curated Carousels */
              <div className="space-y-12">
                {isLoading ? (
                  <div className="text-center py-20 text-slate-500">Loading recipes...</div>
                ) : (
                  homeSections.map((section, index) => (
                    <div key={section.key} data-aos="fade-up" data-aos-delay={index * 100}>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-100">{section.title}</h2>
                        <div className="flex items-center gap-4">
                          {section.key === 'trending' && section.recipes.length > 0 && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleScroll(section.key, 'left')}
                                disabled={!trendingScrollState.canLeft}
                                className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-slate-700 text-slate-300 enabled:hover:text-sky-400 enabled:hover:border-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                aria-label="Scroll trending recipes to the left"
                              >
                                <ChevronLeft size={16} />
                              </button>
                              <button
                                onClick={() => handleScroll(section.key, 'right')}
                                disabled={!trendingScrollState.canRight}
                                className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-slate-700 text-slate-300 enabled:hover:text-sky-400 enabled:hover:border-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                aria-label="Scroll trending recipes to the right"
                              >
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          )}
                          {section.key === 'surprise' && (
                            <button
                              onClick={() => setRefreshKey((prev) => prev + 1)}
                              className="text-slate-500 hover:text-slate-200 transition-colors text-sm"
                            >
                              Refresh
                            </button>
                          )}
                          <Link
                            href={section.href}
                            className="text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-1 text-sm"
                          >
                            View All <ChevronRight size={16} />
                          </Link>
                        </div>
                      </div>
                      <div
                        onScroll={section.key === 'trending' ? updateTrendingScrollState : undefined}
                        ref={(el) => {
                          sectionScrollRefs.current[section.key] = el;
                        }}
                        className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-hide"
                      >
                        {section.recipes.length > 0 ? (
                          section.recipes.map((recipe) => (
                            <RecipeCard key={recipe.id} recipe={recipe} onClick={handleRecipeClick} />
                          ))
                        ) : (
                          <div className="text-slate-500 py-4">No recipes available</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
          )}
        </div>
      </section>

      {/* Recipe Modal */}
      <RecipeModal
        recipe={selectedRecipe}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
