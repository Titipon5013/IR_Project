'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { getSuggestions } from '@/lib/api';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear?: () => void;
}

export default function SearchBar({ onSearch, onClear }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [correctionSuggestion, setCorrectionSuggestion] = useState<string | null>(null);
  const [showCorrectionPrompt, setShowCorrectionPrompt] = useState(false);
  const [dismissedCorrectionFor, setDismissedCorrectionFor] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length <= 2) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const { suggestions: nextSuggestions, isTypo } = await getSuggestions(query);
        setSuggestions(nextSuggestions);
        setShowSuggestions(nextSuggestions.length > 0);

        const normalizedQuery = query.trim().toLowerCase();
        const bestSuggestion = nextSuggestions[0];
        const shouldShowPrompt = Boolean(
          isTypo &&
          bestSuggestion &&
          bestSuggestion.toLowerCase() !== normalizedQuery &&
          dismissedCorrectionFor !== normalizedQuery
        );

        setCorrectionSuggestion(shouldShowPrompt ? bestSuggestion : null);
        setShowCorrectionPrompt(shouldShowPrompt);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
        setCorrectionSuggestion(null);
        setShowCorrectionPrompt(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [query, dismissedCorrectionFor]);

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      onSearch(finalQuery);
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setCorrectionSuggestion(null);
    setShowCorrectionPrompt(false);
    setDismissedCorrectionFor(null);
    onClear?.();
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setCorrectionSuggestion(null);
    setShowCorrectionPrompt(false);
    handleSearch(suggestion);
  };

  const handleInputChange = (nextQuery: string) => {
    setQuery(nextQuery);

    if (nextQuery.length <= 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setCorrectionSuggestion(null);
      setShowCorrectionPrompt(false);
    }
  };

  const handleApplyCorrection = () => {
    if (!correctionSuggestion) return;

    setQuery(correctionSuggestion);
    setShowCorrectionPrompt(false);
    setDismissedCorrectionFor(null);
    handleSearch(correctionSuggestion);
  };

  const handleDismissCorrection = () => {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery) {
      setDismissedCorrectionFor(normalizedQuery);
    }
    setShowCorrectionPrompt(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="relative">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-zinc-500" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search for dishes, cuisines, ingredients..."
            className="w-full h-16 pl-16 pr-28 text-lg bg-zinc-900 border-2 border-zinc-800 rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all shadow-lg"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
            {query && (
              <button
                onClick={handleClear}
                className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Clear search"
              >
                <X size={20} />
              </button>
            )}
            <button
              onClick={() => handleSearch()}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Auto-Suggestions Dropdown */}
        {showCorrectionPrompt && correctionSuggestion && (
          <div className="absolute w-full mt-2 bg-zinc-900/95 backdrop-blur border border-emerald-500/40 rounded-xl shadow-2xl z-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <div className="flex-1">
                <p className="text-zinc-100 font-semibold">Possible typo detected</p>
                <p className="text-sm text-zinc-400 mt-1">
                  Did you mean{' '}
                  <span className="text-emerald-400 font-medium">&quot;{correctionSuggestion}&quot;</span>?
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleApplyCorrection}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-sm font-semibold rounded-lg transition-colors"
                  >
                    Use correction
                  </button>
                  <button
                    onClick={handleDismissCorrection}
                    className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg transition-colors"
                  >
                    Keep my text
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div
            className={`absolute w-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-40 ${
              showCorrectionPrompt ? 'mt-[8.75rem]' : 'mt-2'
            }`}
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-6 py-3 text-left text-zinc-200 hover:bg-zinc-800 hover:text-emerald-400 transition-colors border-b border-zinc-800 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <Search size={16} className="text-zinc-500" />
                  <span>{suggestion}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
