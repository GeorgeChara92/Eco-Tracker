import { useState, useEffect } from 'react';
import { NewsItem, NewsCategory } from '@/lib/news-service';

interface UseNewsFilters {
  categories?: NewsCategory[];
  sources?: string[];
  timeframe?: 'today' | 'week' | 'month' | 'all';
  searchTerm?: string;
}

interface UseNewsReturn {
  news: NewsItem[];
  isLoading: boolean;
  error: string | null;
  refreshNews: () => Promise<void>;
}

export function useNews(filters: UseNewsFilters = {}): UseNewsReturn {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.categories?.length) {
        params.set('categories', filters.categories.join(','));
      }
      if (filters.sources?.length) {
        params.set('sources', filters.sources.join(','));
      }
      if (filters.timeframe) {
        params.set('timeframe', filters.timeframe);
      }
      if (filters.searchTerm) {
        params.set('searchTerm', filters.searchTerm);
      }

      const response = await fetch(`/api/news?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch news');
      }

      setNews(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [
    filters.categories?.join(','),
    filters.sources?.join(','),
    filters.timeframe,
    filters.searchTerm,
  ]);

  return {
    news,
    isLoading,
    error,
    refreshNews: fetchNews,
  };
} 