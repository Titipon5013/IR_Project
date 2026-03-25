'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Bookmark, Star, FolderHeart } from 'lucide-react';
import type { Recipe } from './RecipeCard';
import { getBookmarks, getFolders, saveBookmark } from '@/lib/api';

interface RecipeModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RecipeModal({ recipe, isOpen, onClose }: RecipeModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);

  const ingredients = recipe?.ingredients
    ? recipe.ingredients
        .replace(/[\[\]"]/g, '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const instructions = recipe?.instructions
    ? recipe.instructions
        .split(/\r?\n|(?<=\.)\s+/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !recipe) return;
    const availableFolders = getFolders().map((folder) => ({ id: folder.id, name: folder.name }));
    setFolders(availableFolders);
    if (availableFolders.length > 0) {
      setSelectedFolder((prev) => prev || availableFolders[0].id);
    }

    const existing = getBookmarks().find((bookmark) => bookmark.recipeId === recipe.id);
    if (existing) {
      setRating(existing.userRating);
      setSelectedFolder(existing.folderId);
      setIsBookmarked(true);
    } else {
      setRating(0);
      setIsBookmarked(false);
    }
  }, [isOpen, recipe]);

  if (!isOpen || !recipe) return null;

  const handleBookmark = () => {
    if (!selectedFolder) {
      alert('Please select a folder first');
      return;
    }
    saveBookmark({
      recipeId: recipe.id,
      folderId: selectedFolder,
      userRating: rating || 0,
      createdAt: new Date().toISOString(),
    });
    setIsBookmarked(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-zinc-800 shadow-2xl"
      >
        {/* Header with Close Button */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
          <h2 className="text-2xl font-bold text-zinc-100">{recipe.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="text-zinc-400 hover:text-zinc-100" size={24} />
          </button>
        </div>

        {/* Recipe Image */}
        <div className="relative h-64 w-full bg-zinc-800">
          <Image
            src={recipe.image}
            alt={recipe.name}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover"
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <p className="text-zinc-300 text-base leading-relaxed">{recipe.description}</p>

          {/* Action Buttons Section */}
          <div className="bg-zinc-950 rounded-xl p-5 border border-zinc-800 space-y-4">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-semibold text-zinc-400 mb-2">
                Rate this dish:
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={28}
                      className={
                        star <= (hoveredRating || rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-zinc-700'
                      }
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-zinc-400 text-sm">
                    {rating} {rating === 1 ? 'star' : 'stars'}
                  </span>
                )}
              </div>
            </div>

            {/* Folder Selection */}
            <div>
              <label className="block text-sm font-semibold text-zinc-400 mb-2">
                Save to folder:
              </label>
              <div className="relative">
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Select a folder...</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                <FolderHeart
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                />
              </div>
            </div>

            {/* Bookmark Button */}
            <button
              onClick={handleBookmark}
              disabled={isBookmarked}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg transition-all ${
                isBookmarked
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950'
              }`}
            >
              <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
              {isBookmarked ? 'Bookmarked!' : 'Bookmark Recipe'}
            </button>
          </div>

          {/* Ingredients */}
          <div>
            <h3 className="text-xl font-bold text-zinc-100 mb-3 flex items-center gap-2">
              <span className="h-1 w-1 bg-emerald-500 rounded-full"></span>
              Ingredients
            </h3>
            <ul className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="text-zinc-300 pl-4 border-l-2 border-zinc-800 hover:border-emerald-500 transition-colors"
                >
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-xl font-bold text-zinc-100 mb-3 flex items-center gap-2">
              <span className="h-1 w-1 bg-emerald-500 rounded-full"></span>
              Instructions
            </h3>
            <ol className="space-y-3">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </span>
                  <p className="text-zinc-300 pt-1">{instruction}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
