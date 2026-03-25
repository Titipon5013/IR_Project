'use client';

import Image from 'next/image';
import { Clock, Star } from 'lucide-react';

export interface Recipe {
  id: number;
  name: string;
  description: string;
  image: string;
  cookTime?: string;
  rating?: number;
  category?: string;
  ingredients?: string;
  instructions?: string;
}

interface RecipeCardProps {
  recipe: Recipe;
  onClick: (recipe: Recipe) => void;
}

export default function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <div
      onClick={() => onClick(recipe)}
      data-aos="fade-up"
      className="group cursor-pointer bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 flex-shrink-0 w-72"
    >
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden bg-zinc-800">
        <Image
          src={recipe.image}
          alt={recipe.name}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {recipe.category && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-zinc-950/80 backdrop-blur-sm text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30">
            {recipe.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-zinc-100 mb-2 line-clamp-1 group-hover:text-emerald-400 transition-colors">
          {recipe.name}
        </h3>
        <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
          {recipe.description}
        </p>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{recipe.cookTime || 'N/A'}</span>
          </div>
          {recipe.rating && (
            <div className="flex items-center gap-1 text-amber-400">
              <Star size={14} fill="currentColor" />
              <span className="text-zinc-400">{recipe.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
