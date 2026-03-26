import { getSupabaseClient } from '@/lib/supabase/client';
import type { BookmarkInsert, BookmarkRow, FolderInsert, FolderRow } from '@/types';

// API Base URL - Update this if your backend runs on a different port
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Recipe {
  RecipeId: number;
  Name: string;
  Description?: string;
  Ingredients: string;
  Instructions: string;
  Category: string;
  Image: string;
  CookTime?: string;
  Score?: number;
  HighlightedName?: string;
  Snippet?: string;
}

export interface SearchResponse {
  query: string;
  total_results: number;
  elapsed_time_ms: number;
  results: Recipe[];
}

export interface Category {
  name: string;
  count: number;
}

export interface SuggestionResponse {
  suggestions: string[];
  isTypo: boolean;
}

export interface RecommendMlResponse {
  results: Recipe[];
  isPersonalized: boolean;
}

export interface PaginatedRecipesResponse {
  results: Recipe[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
}

export interface BookmarkEntry {
  id: string;
  recipeId: number;
  folderId: string;
  userRating: number;
  createdAt: string;
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }
  return supabase;
}

export function toUiRecipe(recipe: Recipe): import('@/components/RecipeCard').Recipe {
  const ingredientsText = (recipe.Ingredients || '').replace(/[\[\]"]/g, '').trim();
  const description = recipe.Snippet || ingredientsText || 'No description available';

  return {
    id: recipe.RecipeId,
    name: recipe.Name,
    description,
    image: recipe.Image,
    cookTime: undefined,
    category: recipe.Category,
    ingredients: recipe.Ingredients,
    instructions: recipe.Instructions,
  };
}

// Search recipes
export async function searchRecipes(query: string, limit: number = 10): Promise<SearchResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to search recipes');
  }

  return response.json();
}

// Get random recipes
export async function getRandomRecipes(limit: number = 20): Promise<Recipe[]> {
  const response = await fetch(`${API_BASE_URL}/api/recipes/random?limit=${limit}`);

  if (!response.ok) {
    throw new Error('Failed to fetch random recipes');
  }

  const data = await response.json();
  return data.results;
}

// Get recipes by category
export async function getRecipesByCategory(category: string, limit: number = 20): Promise<Recipe[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/recipes/category/${encodeURIComponent(category)}?limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch recipes by category');
  }

  const data = await response.json();
  return data.results;
}

export async function getRecipesByCategoryPaginated(
  category: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedRecipesResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/recipes/category/${encodeURIComponent(category)}?page=${page}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch paginated recipes by category');
  }

  return response.json();
}

export async function getAllRecipesPaginated(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedRecipesResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/recipes/all?page=${page}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch all recipes');
  }

  return response.json();
}

// Get all categories
export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/api/categories`);

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  const data = await response.json();
  return data.categories;
}

// Get auto-suggestions
export async function getSuggestions(query: string): Promise<SuggestionResponse> {
  if (query.length < 2) {
    return {
      suggestions: [],
      isTypo: false,
    };
  }

  const response = await fetch(
    `${API_BASE_URL}/api/suggest?q=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch suggestions');
  }

  const data = await response.json();
  return {
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
    isTypo: Boolean(data.is_typo),
  };
}

export async function getTrendingRecipes(limit: number = 8): Promise<Recipe[]> {
  const response = await fetch(`${API_BASE_URL}/api/trending?limit=${limit}`);

  if (!response.ok) {
    throw new Error('Failed to fetch trending recipes');
  }

  const data = await response.json();
  return Array.isArray(data.results) ? data.results : [];
}

export async function getPersonalizedRecommendations(
  userId: string,
  limit: number = 8
): Promise<RecommendMlResponse> {
  const response = await fetch(`${API_BASE_URL}/api/recommend/ml?limit=${limit}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch personalized recommendations');
  }

  const data = await response.json();
  return {
    results: Array.isArray(data.results) ? data.results : [],
    isPersonalized: Boolean(data.is_personalized),
  };
}

// Get recipes by IDs (for bookmarks)
export async function getRecipesByIds(recipeIds: number[]): Promise<Recipe[]> {
  const response = await fetch(`${API_BASE_URL}/api/recipes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recipe_ids: recipeIds }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch recipes by IDs');
  }

  const data = await response.json();
  return data.results;
}

// Classify a recipe
export async function classifyRecipe(name: string, ingredients: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/classify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, ingredients }),
  });

  if (!response.ok) {
    throw new Error('Failed to classify recipe');
  }

  const data = await response.json();
  return data.predicted_category;
}

function mapFolderRow(row: FolderRow): Folder {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

function mapBookmarkRow(row: BookmarkRow): BookmarkEntry {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    folderId: row.folder_id,
    userRating: row.rating,
    createdAt: row.created_at,
  };
}

export async function getFolders(userId: string): Promise<Folder[]> {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from('folders')
    .select('id, name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapFolderRow);
}

export async function createFolder(userId: string, name: string): Promise<Folder> {
  const supabase = getSupabaseOrThrow();
  const payload: FolderInsert = {
    user_id: userId,
    name,
  };
  const { data, error } = await supabase
    .from('folders')
    .insert(payload)
    .select('id, name, created_at')
    .single();

  if (error) throw error;
  return mapFolderRow(data);
}

export async function updateFolder(userId: string, folderId: string, name: string): Promise<void> {
  const supabase = getSupabaseOrThrow();
  const { error } = await supabase
    .from('folders')
    .update({ name })
    .eq('id', folderId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteFolder(userId: string, folderId: string): Promise<void> {
  const supabase = getSupabaseOrThrow();
  const { error: bookmarkDeleteError } = await supabase
    .from('bookmarks')
    .delete()
    .eq('folder_id', folderId)
    .eq('user_id', userId);
  if (bookmarkDeleteError) throw bookmarkDeleteError;

  const { error: folderDeleteError } = await supabase
    .from('folders')
    .delete()
    .eq('id', folderId)
    .eq('user_id', userId);
  if (folderDeleteError) throw folderDeleteError;
}

export async function getBookmarks(userId: string): Promise<BookmarkEntry[]> {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id, recipe_id, folder_id, rating, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapBookmarkRow);
}

export async function saveBookmark(
  userId: string,
  entry: Omit<BookmarkEntry, 'id'>
): Promise<BookmarkEntry> {
  const supabase = getSupabaseOrThrow();
  const { data: existing, error: findError } = await supabase
    .from('bookmarks')
    .select('id, recipe_id, folder_id, rating, created_at')
    .eq('user_id', userId)
    .eq('recipe_id', entry.recipeId)
    .maybeSingle();
  if (findError) throw findError;

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from('bookmarks')
      .update({
        folder_id: entry.folderId,
        rating: entry.userRating,
      })
      .eq('id', existing.id)
      .eq('user_id', userId)
      .select('id, recipe_id, folder_id, rating, created_at')
      .single();
    if (updateError) throw updateError;
    return mapBookmarkRow(updated);
  }

  const payload: BookmarkInsert = {
    user_id: userId,
    folder_id: entry.folderId,
    recipe_id: entry.recipeId,
    rating: entry.userRating,
  };
  const { data, error } = await supabase
    .from('bookmarks')
    .insert(payload)
    .select('id, recipe_id, folder_id, rating, created_at')
    .single();
  if (error) throw error;
  return mapBookmarkRow(data);
}
