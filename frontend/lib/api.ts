// API Base URL - Update this if your backend runs on a different port
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const FOLDERS_KEY = 'foodvault_folders';
const BOOKMARKS_KEY = 'foodvault_bookmarks';

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

export interface Folder {
  id: string;
  name: string;
  description?: string;
  color: string;
}

export interface BookmarkEntry {
  recipeId: number;
  folderId: string;
  userRating: number;
  createdAt: string;
}

const defaultFolders: Folder[] = [
  { id: 'favorites', name: 'Favorites', description: 'The absolute best recipes', color: 'emerald' },
  { id: 'to-try', name: 'To Try', description: 'Recipes I want to cook soon', color: 'blue' },
  { id: 'weekend', name: 'Weekend Cooking', description: 'Complex recipes for when I have time', color: 'purple' },
  { id: 'quick', name: 'Quick Meals', description: 'Simple dishes under 30 minutes', color: 'amber' },
];

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function ensureBrowser() {
  if (typeof window === 'undefined') {
    throw new Error('Local storage is only available in the browser');
  }
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
export async function getSuggestions(query: string): Promise<string[]> {
  if (query.length < 2) return [];

  const response = await fetch(
    `${API_BASE_URL}/api/suggest?q=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch suggestions');
  }

  const data = await response.json();
  return data.suggestions;
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

export function getFolders(): Folder[] {
  ensureBrowser();
  const stored = parseJson<Folder[]>(window.localStorage.getItem(FOLDERS_KEY), []);
  if (stored.length > 0) return stored;
  window.localStorage.setItem(FOLDERS_KEY, JSON.stringify(defaultFolders));
  return defaultFolders;
}

export function saveFolders(folders: Folder[]): void {
  ensureBrowser();
  window.localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

export function getBookmarks(): BookmarkEntry[] {
  ensureBrowser();
  return parseJson<BookmarkEntry[]>(window.localStorage.getItem(BOOKMARKS_KEY), []);
}

export function saveBookmark(entry: BookmarkEntry): void {
  ensureBrowser();
  const bookmarks = getBookmarks();
  const existingIndex = bookmarks.findIndex(
    (bookmark) => bookmark.recipeId === entry.recipeId && bookmark.folderId === entry.folderId
  );

  if (existingIndex >= 0) {
    bookmarks[existingIndex] = entry;
  } else {
    bookmarks.push(entry);
  }

  window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

export function deleteFolder(folderId: string): void {
  ensureBrowser();
  const folders = getFolders().filter((folder) => folder.id !== folderId);
  saveFolders(folders);

  const bookmarks = getBookmarks().filter((bookmark) => bookmark.folderId !== folderId);
  window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}
