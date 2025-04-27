import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { NewsItem, NewsFilters } from '../../lib/types/news';
import { fetchAllNews } from '../../lib/news-service';

type NewsFiltersType = NewsFilters;

const NewsFeed: React.FC = () => {
  const [filters, setFilters] = React.useState<NewsFiltersType>({});
  const [displayedNews, setDisplayedNews] = React.useState<NewsItem[]>([]);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  const { data: news, isLoading, error } = useQuery<NewsItem[]>({
    queryKey: ['marketNews', filters],
    queryFn: () => fetchAllNews(filters),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Progressive loading effect
  React.useEffect(() => {
    if (news && news.length > 0) {
      setDisplayedNews([]);
      let currentIndex = 0;
      const batchSize = 6; // Load 6 items at a time
      
      const loadNextBatch = () => {
        if (currentIndex < news.length) {
          const nextBatch = news.slice(currentIndex, currentIndex + batchSize);
          setDisplayedNews(prev => [...prev, ...nextBatch]);
          currentIndex += batchSize;
          setIsLoadingMore(true);
          setTimeout(loadNextBatch, 100); // Small delay between batches
        } else {
          setIsLoadingMore(false);
        }
      };

      loadNextBatch();
    }
  }, [news]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  if (isLoading && displayedNews.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 h-48">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">
          Error loading news. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedNews.map((item) => (
          <div key={`${item.url}-${item.title}`} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{item.source}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(item.pubDate)}</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{item.description}</p>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Read more →
            </a>
          </div>
        ))}
      </div>
      {isLoadingMore && (
        <div className="mt-4 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
};

export default NewsFeed; 