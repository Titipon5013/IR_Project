'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import RecipeCard, { Recipe } from '@/components/RecipeCard';
import RecipeModal from '@/components/RecipeModal';
import { useAuth } from '@/components/AuthProvider';
import {
  getAllRecipesPaginated,
  getPersonalizedRecommendations,
  getRandomRecipes,
  getTrendingRecipes,
  searchRecipes,
  toUiRecipe,
} from '@/lib/api';

function RowSkeleton() {
  return (
    <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="w-72 h-80 rounded-xl border border-slate-800 bg-slate-900/70 animate-pulse flex-shrink-0"
        />
      ))}
    </div>
  );
}

export default function Home() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [pickedRecipes, setPickedRecipes] = useState<Recipe[]>([]);
  const [trendingRecipes, setTrendingRecipes] = useState<Recipe[]>([]);
  const [randomRecipes, setRandomRecipes] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);

  const [isPickedLoading, setIsPickedLoading] = useState(false);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);
  const [isRandomLoading, setIsRandomLoading] = useState(true);
  const [isAllLoading, setIsAllLoading] = useState(true);
  const [isPickedPersonalized, setIsPickedPersonalized] = useState<boolean | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const trendingRowRef = useRef<HTMLDivElement>(null);
  const [trendingScrollState, setTrendingScrollState] = useState({ canLeft: false, canRight: false });

  const updateTrendingScrollState = () => {
    const container = trendingRowRef.current;
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

  const handleTrendingScroll = (direction: 'left' | 'right') => {
    const container = trendingRowRef.current;
    if (!container) return;

    const distance = Math.max(280, Math.floor(container.clientWidth * 0.8));
    container.scrollBy({
      left: direction === 'right' ? distance : -distance,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const loadPublicSections = async () => {
      setIsTrendingLoading(true);
      setIsRandomLoading(true);
      setIsAllLoading(true);

      const [trendingResult, randomResult, allResult] = await Promise.allSettled([
        getTrendingRecipes(8),
        getRandomRecipes(8),
        getAllRecipesPaginated(1, 8),
      ]);

      if (trendingResult.status === 'fulfilled') {
        setTrendingRecipes(trendingResult.value.map(toUiRecipe));
      } else {
        setTrendingRecipes([]);
      }
      setIsTrendingLoading(false);

      if (randomResult.status === 'fulfilled') {
        setRandomRecipes(randomResult.value.slice(0, 8).map(toUiRecipe));
      } else {
        setRandomRecipes([]);
      }
      setIsRandomLoading(false);

      if (allResult.status === 'fulfilled') {
        setAllRecipes(allResult.value.results.slice(0, 8).map(toUiRecipe));
      } else {
        setAllRecipes([]);
      }
      setIsAllLoading(false);
    };

    loadPublicSections();
  }, [refreshKey]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      updateTrendingScrollState();
    });

    const onResize = () => updateTrendingScrollState();
    window.addEventListener('resize', onResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
    };
  }, [trendingRecipes.length, isTrendingLoading]);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      Promise.resolve().then(() => {
        setPickedRecipes([]);
        setIsPickedPersonalized(null);
        setIsPickedLoading(false);
      });
      return;
    }

    let isMounted = true;

    const loadPickedSection = async () => {
      setIsPickedLoading(true);
      try {
        const response = await getPersonalizedRecommendations(user.id, 8);
        if (!isMounted) return;
        setPickedRecipes(response.results.map(toUiRecipe));
        setIsPickedPersonalized(response.isPersonalized);
      } catch {
        if (!isMounted) return;
        setPickedRecipes([]);
        setIsPickedPersonalized(null);
      } finally {
        if (!isMounted) return;
        setIsPickedLoading(false);
      }
    };

    void loadPickedSection();

    return () => {
      isMounted = false;
    };
  }, [isAuthLoading, user]);

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

  return (
    <div className="min-h-screen bg-slate-950">
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

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {isSearching ? (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-100">
                  Search Results <span className="text-sky-400">({searchResults.length})</span>
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
            <div className="space-y-12">
              <div data-aos="fade-up">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-100">Picked For You</h2>
                  {user && (
                    <Link
                      href="/recipes?section=picked"
                      className="text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-1 text-sm"
                    >
                      View All <ChevronRight size={16} />
                    </Link>
                  )}
                </div>

                {!isAuthLoading && !user ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center">
                    <p className="text-slate-300">Sign in to see your personalized recommendations</p>
                    <Link
                      href="/auth"
                      className="inline-flex mt-4 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-slate-950 font-semibold transition-colors"
                    >
                      Sign In
                    </Link>
                  </div>
                ) : isPickedLoading ? (
                  <RowSkeleton />
                ) : pickedRecipes.length > 0 ? (
                  <>
                    <div className="mb-3 text-sm text-slate-400">
                      {isPickedPersonalized
                        ? 'Tailored by your taste profile'
                        : 'Showing trending fallback while we learn your taste'}
                    </div>
                    <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-hide">
                      {pickedRecipes.map((recipe) => (
                        <RecipeCard key={recipe.id} recipe={recipe} onClick={handleRecipeClick} />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500 py-4">No personalized recommendations yet</div>
                )}
              </div>

              <div data-aos="fade-up" data-aos-delay="100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-100">Trending Now</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTrendingScroll('left')}
                      disabled={!trendingScrollState.canLeft}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-slate-700 text-slate-300 enabled:hover:text-sky-400 enabled:hover:border-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Scroll trending recipes to the left"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => handleTrendingScroll('right')}
                      disabled={!trendingScrollState.canRight}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-slate-700 text-slate-300 enabled:hover:text-sky-400 enabled:hover:border-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Scroll trending recipes to the right"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <Link
                      href="/recipes?section=trending"
                      className="text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-1 text-sm ml-2"
                    >
                      View All <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>

                {isTrendingLoading ? (
                  <RowSkeleton />
                ) : trendingRecipes.length > 0 ? (
                  <div
                    ref={trendingRowRef}
                    onScroll={updateTrendingScrollState}
                    className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-hide"
                  >
                    {trendingRecipes.map((recipe) => (
                      <RecipeCard key={recipe.id} recipe={recipe} onClick={handleRecipeClick} />
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 py-4">No trending recipes available</div>
                )}
              </div>

              <div data-aos="fade-up" data-aos-delay="200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-100">Surprise Me</h2>
                  <button
                    onClick={() => setRefreshKey((prev) => prev + 1)}
                    className="text-slate-500 hover:text-slate-200 transition-colors text-sm"
                  >
                    Refresh
                  </button>
                </div>
                {isRandomLoading ? (
                  <RowSkeleton />
                ) : randomRecipes.length > 0 ? (
                  <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-hide">
                    {randomRecipes.map((recipe) => (
                      <RecipeCard key={recipe.id} recipe={recipe} onClick={handleRecipeClick} />
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 py-4">No recipes available</div>
                )}
              </div>

              <div data-aos="fade-up" data-aos-delay="300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-100">All Recipes</h2>
                  <Link
                    href="/recipes?section=all"
                    className="text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-1 text-sm"
                  >
                    View All <ChevronRight size={16} />
                  </Link>
                </div>
                {isAllLoading ? (
                  <RowSkeleton />
                ) : allRecipes.length > 0 ? (
                  <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-hide">
                    {allRecipes.map((recipe) => (
                      <RecipeCard key={recipe.id} recipe={recipe} onClick={handleRecipeClick} />
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 py-4">No recipes available</div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

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
