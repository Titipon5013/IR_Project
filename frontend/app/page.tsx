'use client';

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import RecipeCard, { Recipe } from '@/components/RecipeCard';
import RecipeModal from '@/components/RecipeModal';
import { ChevronRight } from 'lucide-react';

export default function Home() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data - replace with actual API calls
  const mockRecipes: Recipe[] = [
    {
      id: '1',
      name: 'Chicken Tikka Masala',
      description: 'Creamy tomato-based curry with tender chicken pieces',
      image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',
      cookTime: '45 min',
      rating: 4.8,
      category: 'Indian',
    },
    {
      id: '2',
      name: 'Pad Thai',
      description: 'Classic Thai stir-fried noodles with shrimp and peanuts',
      image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80',
      cookTime: '30 min',
      rating: 4.6,
      category: 'Thai',
    },
    {
      id: '3',
      name: 'Spaghetti Carbonara',
      description: 'Italian pasta with crispy pancetta and creamy egg sauce',
      image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
      cookTime: '25 min',
      rating: 4.7,
      category: 'Italian',
    },
    {
      id: '4',
      name: 'Beef Tacos',
      description: 'Seasoned ground beef in soft tortillas with fresh toppings',
      image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80',
      cookTime: '20 min',
      rating: 4.5,
      category: 'Mexican',
    },
    {
      id: '5',
      name: 'Greek Salad',
      description: 'Fresh vegetables with feta cheese and olives',
      image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
      cookTime: '15 min',
      rating: 4.3,
      category: 'Greek',
    },
    {
      id: '6',
      name: 'Ramen Bowl',
      description: 'Rich broth with noodles, soft-boiled egg, and pork',
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
      cookTime: '60 min',
      rating: 4.9,
      category: 'Japanese',
    },
  ];

  const personalizedRecipes = mockRecipes.slice(0, 4);
  const categoryRecipes = mockRecipes.filter((r) => r.category === 'Italian' || r.category === 'Thai');
  const randomRecipes = mockRecipes.slice(2, 6);

  const handleSearch = (query: string) => {
    setIsSearching(true);
    // Mock search results (replace with actual API call)
    const results = mockRecipes.filter((recipe) =>
      recipe.name.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
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
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="container mx-auto max-w-5xl text-center">
          <h1
            className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-zinc-100 to-emerald-400 bg-clip-text text-transparent"
            data-aos="fade-down"
          >
            Discover Your Next Meal
          </h1>
          <p
            className="text-lg text-zinc-400 mb-8 max-w-2xl mx-auto"
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
                <h2 className="text-2xl font-bold text-zinc-100">
                  Search Results{' '}
                  <span className="text-emerald-400">({searchResults.length})</span>
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
                    <p className="text-zinc-500 text-lg">No recipes found</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Curated Carousels */
            <div className="space-y-12">
              {/* Carousel 1: From Your Folders */}
              <div data-aos="fade-up">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-zinc-100">
                    <span className="text-emerald-400">Picked</span> For You
                  </h2>
                  <button className="text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-1 text-sm">
                    View All <ChevronRight size={16} />
                  </button>
                </div>
                <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-hide">
                  {personalizedRecipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onClick={handleRecipeClick}
                    />
                  ))}
                </div>
              </div>

              {/* Carousel 2: Category Specific */}
              <div data-aos="fade-up" data-aos-delay="100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-zinc-100">
                    <span className="text-emerald-400">Trending</span> in Italian & Thai
                  </h2>
                  <button className="text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-1 text-sm">
                    View All <ChevronRight size={16} />
                  </button>
                </div>
                <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-hide">
                  {categoryRecipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onClick={handleRecipeClick}
                    />
                  ))}
                </div>
              </div>

              {/* Carousel 3: Random Discoveries */}
              <div data-aos="fade-up" data-aos-delay="200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-zinc-100">
                    <span className="text-emerald-400">Surprise</span> Me
                  </h2>
                  <button className="text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-1 text-sm">
                    Refresh <ChevronRight size={16} />
                  </button>
                </div>
                <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-hide">
                  {randomRecipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onClick={handleRecipeClick}
                    />
                  ))}
                </div>
              </div>
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

