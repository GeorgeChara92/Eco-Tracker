import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaNewspaper, FaExternalLinkAlt } from 'react-icons/fa';
import { NewsItem, NewsCategory } from '@/lib/news-service';
import { analyzeNewsImpact, ImpactLevel } from '@/lib/news-impact';
import NewsFilters from './NewsFilters';

const IMPACT_COLORS: Record<ImpactLevel, { bg: string; text: string; border: string }> = {
  high: { 
    bg: 'bg-red-100 dark:bg-red-900/20', 
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800'
  },
  medium: { 
    bg: 'bg-yellow-100 dark:bg-yellow-900/20', 
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800'
  },
  low: { 
    bg: 'bg-blue-100 dark:bg-blue-900/20', 
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800'
  },
};

function ImpactBadge({ impact }: { impact: ImpactLevel }) {
  const colors = IMPACT_COLORS[impact];
  return (
    <span className={`
      px-2 py-1 rounded-full text-xs font-medium
      ${colors.bg} ${colors.text} ${colors.border}
      border
    `}>
      {impact.toUpperCase()} IMPACT
    </span>
  );
}

export default function NewsFeed() {
  const [selectedCategories, setSelectedCategories] = React.useState<NewsCategory[]>([]);
  const [selectedImpacts, setSelectedImpacts] = React.useState<ImpactLevel[]>([]);

  const { data, isLoading, error } = useQuery<{ success: boolean; data: NewsItem[] }>({
    queryKey: ['news', selectedCategories],
    queryFn: async () => {
      console.log('Fetching news...');
      const params = new URLSearchParams();
      if (selectedCategories.length > 0) {
        params.set('categories', selectedCategories.join(','));
      }
      
      const response = await fetch(`/api/news?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status} ${response.statusText}`);
      }
      const jsonData = await response.json();
      console.log('News data received:', jsonData);
      return jsonData;
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Debug logging
  React.useEffect(() => {
    if (data) {
      console.log('Query data:', data);
    }
    if (error) {
      console.error('Query error:', error);
    }
  }, [data, error]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <NewsFilters
          selectedCategories={selectedCategories}
          selectedImpacts={selectedImpacts}
          onCategoryChange={setSelectedCategories}
          onImpactChange={setSelectedImpacts}
        />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <NewsFilters
          selectedCategories={selectedCategories}
          selectedImpacts={selectedImpacts}
          onCategoryChange={setSelectedCategories}
          onImpactChange={setSelectedImpacts}
        />
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-600 dark:text-red-300">
            Failed to load news: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <NewsFilters
          selectedCategories={selectedCategories}
          selectedImpacts={selectedImpacts}
          onCategoryChange={setSelectedCategories}
          onImpactChange={setSelectedImpacts}
        />
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <p className="text-yellow-600 dark:text-yellow-300">No data received from the server</p>
        </div>
      </div>
    );
  }

  if (!data.success || !Array.isArray(data.data)) {
    return (
      <div>
        <NewsFilters
          selectedCategories={selectedCategories}
          selectedImpacts={selectedImpacts}
          onCategoryChange={setSelectedCategories}
          onImpactChange={setSelectedImpacts}
        />
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <p className="text-yellow-600 dark:text-yellow-300">
            {data.success === false ? 'Server reported an error' : 'Invalid news data format'}
          </p>
        </div>
      </div>
    );
  }

  const news = data.data;

  // Filter news by impact level if any impacts are selected
  const filteredNews = selectedImpacts.length > 0
    ? news.filter(item => selectedImpacts.includes(analyzeNewsImpact(item)))
    : news;

  if (filteredNews.length === 0) {
    return (
      <div>
        <NewsFilters
          selectedCategories={selectedCategories}
          selectedImpacts={selectedImpacts}
          onCategoryChange={setSelectedCategories}
          onImpactChange={setSelectedImpacts}
        />
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <p className="text-yellow-600 dark:text-yellow-300">No news articles match your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NewsFilters
        selectedCategories={selectedCategories}
        selectedImpacts={selectedImpacts}
        onCategoryChange={setSelectedCategories}
        onImpactChange={setSelectedImpacts}
      />
      <div className="space-y-6">
        {filteredNews.map((item, index) => {
          const impact = analyzeNewsImpact(item);
          return (
            <article
              key={`${item.link}-${index}`}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <FaNewspaper className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-4">
                      {item.title}
                    </h3>
                    <ImpactBadge impact={impact} />
                  </div>
                  {item.description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center space-x-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.source}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(item.pubDate).toLocaleDateString()}
                    </span>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center space-x-1"
                    >
                      <span className="text-sm">Read more</span>
                      <FaExternalLinkAlt className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
} 