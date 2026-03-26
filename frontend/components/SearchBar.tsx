'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { getSuggestions } from '@/lib/api';

type SuggestionItem = {
  Name: string;
  HighlightedName?: string;
};

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear?: () => void;
}

export default function SearchBar({ onSearch, onClear }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSuggestionLocked, setIsSuggestionLocked] = useState(false);
  const [correctionSuggestion, setCorrectionSuggestion] = useState<string | null>(null);
  const [showCorrectionPrompt, setShowCorrectionPrompt] = useState(false);
  const [dismissedCorrectionFor, setDismissedCorrectionFor] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionItemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const formatSuggestionHtml = (value: string) => ({
    __html: value.replace(/className=/g, 'class='),
  });

  const getSuggestionText = (item: SuggestionItem) =>
    (item.Name || '').replace(/<[^>]+>/g, '').trim();

  const getSuggestionHtml = (item: SuggestionItem) => item.HighlightedName || item.Name;

  const closeSearchOverlay = () => {
    setIsSearchFocused(false);
    setShowSuggestions(false);
    setShowCorrectionPrompt(false);
    setHighlightedSuggestionIndex(-1);
    inputRef.current?.blur();
  };

  useEffect(() => {
    if (query.trim().length < 1 || isSuggestionLocked) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const { suggestions: nextSuggestions, isTypo } = await getSuggestions(query);
        setSuggestions(nextSuggestions);
        setHighlightedSuggestionIndex(-1);
        setShowSuggestions(nextSuggestions.length > 0 && isSearchFocused);

        const normalizedQuery = query.trim().toLowerCase();
        const bestSuggestion = nextSuggestions[0]?.Name;
        const isLikelyPrefixTyping = Boolean(
          bestSuggestion && bestSuggestion.toLowerCase().startsWith(normalizedQuery)
        );
        const shouldShowPrompt = Boolean(
          isTypo &&
          bestSuggestion &&
          bestSuggestion.toLowerCase() !== normalizedQuery &&
          !isLikelyPrefixTyping &&
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
  }, [query, dismissedCorrectionFor, isSearchFocused, isSuggestionLocked]);

  useEffect(() => {
    if (highlightedSuggestionIndex < 0) return;

    const target = suggestionItemRefs.current[highlightedSuggestionIndex];
    target?.scrollIntoView({ block: 'nearest' });
  }, [highlightedSuggestionIndex]);

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      onSearch(finalQuery);
      setIsSuggestionLocked(true);
      setShowSuggestions(false);
      setShowCorrectionPrompt(false);
      setHighlightedSuggestionIndex(-1);
      setIsSearchFocused(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedSuggestionIndex(-1);
    setIsSuggestionLocked(false);
    setCorrectionSuggestion(null);
    setShowCorrectionPrompt(false);
    setDismissedCorrectionFor(null);
    onClear?.();
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setHighlightedSuggestionIndex(-1);
    setCorrectionSuggestion(null);
    setShowCorrectionPrompt(false);
    handleSearch(suggestion);
  };

  const handleInputChange = (nextQuery: string) => {
    if (nextQuery !== query) {
      setIsSuggestionLocked(false);
    }

    setQuery(nextQuery);
    setHighlightedSuggestionIndex(-1);

    if (nextQuery.trim().length < 1) {
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

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSearchOverlay();
      return;
    }

    if (e.key === 'ArrowDown') {
      if (!suggestions.length) return;
      e.preventDefault();
      setShowSuggestions(true);
      setHighlightedSuggestionIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      if (!suggestions.length) return;
      e.preventDefault();
      setShowSuggestions(true);
      setHighlightedSuggestionIndex((prev) => {
        if (prev <= 0) return suggestions.length - 1;
        return prev - 1;
      });
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedSuggestionIndex >= 0 && suggestions[highlightedSuggestionIndex]) {
        handleSuggestionClick(getSuggestionText(suggestions[highlightedSuggestionIndex]));
        return;
      }
      handleSearch();
    }
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
      {isSearchFocused && (
        <button
          aria-label="Close search suggestions"
          onClick={closeSearchOverlay}
          className="fixed inset-0 bg-black/40 z-[9998]"
        />
      )}

      <div className="relative isolate z-[9999]">
        {/* Search Input */}
        <div className="relative z-[10000]">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-slate-500" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onFocus={() => {
              setIsSearchFocused(true);
              if (!isSuggestionLocked && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Search for dishes, cuisines, ingredients..."
            className="w-full h-16 pl-16 pr-28 text-lg bg-slate-900 border-2 border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all shadow-lg"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
            {query && (
              <button
                onClick={handleClear}
                className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="Clear search"
              >
                <X size={20} />
              </button>
            )}
            <button
              onClick={() => handleSearch()}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-slate-950 font-semibold rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Auto-Suggestions Overlay */}
        {isSearchFocused && !isSuggestionLocked && ((showCorrectionPrompt && correctionSuggestion) || (showSuggestions && suggestions.length > 0)) ? (
          <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-md shadow-xl z-[10001] border border-slate-700 overflow-hidden pointer-events-auto">
            {showCorrectionPrompt && correctionSuggestion && (
              <div className="w-full p-4 border-b border-slate-700 bg-slate-900">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-400" />
                  <div className="flex-1">
                    <p className="text-slate-100 font-semibold">Possible typo detected</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Did you mean{' '}
                      <span className="text-sky-400 font-medium">&quot;{correctionSuggestion}&quot;</span>?
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleApplyCorrection}
                        className="px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-slate-950 text-sm font-semibold rounded-lg transition-colors"
                      >
                        Use correction
                      </button>
                      <button
                        onClick={handleDismissCorrection}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
                      >
                        Keep my text
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showSuggestions && suggestions.length > 0 && (
              <div className="w-full max-h-64 overflow-y-auto bg-slate-900">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    ref={(el) => {
                      suggestionItemRefs.current[index] = el;
                    }}
                    onClick={() => handleSuggestionClick(getSuggestionText(suggestion))}
                    className={`w-full px-6 py-3 text-left transition-colors border-b border-slate-200 last:border-b-0 ${
                      highlightedSuggestionIndex === index
                        ? 'bg-slate-800 text-sky-400'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-sky-400'
                    }`}
                    aria-selected={highlightedSuggestionIndex === index}
                  >
                    <div className="flex items-center gap-3">
                      <Search size={16} className="text-slate-500" />
                      <span dangerouslySetInnerHTML={formatSuggestionHtml(getSuggestionHtml(suggestion))} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
