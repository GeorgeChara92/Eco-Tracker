import { NewsItem, NewsFilters, RSSFeeds } from './types/news';

// RSS Feed URLs with expanded sources and categories
const RSS_FEEDS: RSSFeeds = {
  yahooFinance: {
    markets: 'https://finance.yahoo.com/news/rss/markets',
    economy: 'https://finance.yahoo.com/news/rss/economy',
    technology: 'https://finance.yahoo.com/news/rss/technology',
    crypto: 'https://finance.yahoo.com/news/rss/crypto',
    stocks: 'https://finance.yahoo.com/news/rss/stocks',
    forex: 'https://finance.yahoo.com/news/rss/forex',
    commodities: 'https://finance.yahoo.com/news/rss/commodities',
    energy: 'https://finance.yahoo.com/news/rss/energy',
    realestate: 'https://finance.yahoo.com/news/rss/realestate',
    healthcare: 'https://finance.yahoo.com/news/rss/healthcare',
    automotive: 'https://finance.yahoo.com/news/rss/automotive',
    retail: 'https://finance.yahoo.com/news/rss/retail',
    telecom: 'https://finance.yahoo.com/news/rss/telecom',
    media: 'https://finance.yahoo.com/news/rss/media',
    transportation: 'https://finance.yahoo.com/news/rss/transportation',
    industrial: 'https://finance.yahoo.com/news/rss/industrial',
    financial: 'https://finance.yahoo.com/news/rss/financial',
    agriculture: 'https://finance.yahoo.com/news/rss/agriculture',
    metals: 'https://finance.yahoo.com/news/rss/metals',
    currencies: 'https://finance.yahoo.com/news/rss/currencies',
    bonds: 'https://finance.yahoo.com/news/rss/bonds',
    equities: 'https://finance.yahoo.com/news/rss/equities',
    indices: 'https://finance.yahoo.com/news/rss/indices',
    futures: 'https://finance.yahoo.com/news/rss/futures',
    options: 'https://finance.yahoo.com/news/rss/options',
    etfs: 'https://finance.yahoo.com/news/rss/etfs',
    mutualfunds: 'https://finance.yahoo.com/news/rss/mutualfunds',
    reits: 'https://finance.yahoo.com/news/rss/reits',
    derivatives: 'https://finance.yahoo.com/news/rss/derivatives'
  },
  marketWatch: {
    markets: 'https://www.marketwatch.com/rss/markets',
    economy: 'https://www.marketwatch.com/rss/economy',
    technology: 'https://www.marketwatch.com/rss/technology',
    crypto: 'https://www.marketwatch.com/rss/crypto',
    stocks: 'https://www.marketwatch.com/rss/stocks',
    forex: 'https://www.marketwatch.com/rss/forex',
    commodities: 'https://www.marketwatch.com/rss/commodities',
    energy: 'https://www.marketwatch.com/rss/energy',
    realestate: 'https://www.marketwatch.com/rss/realestate',
    healthcare: 'https://www.marketwatch.com/rss/healthcare',
    automotive: 'https://www.marketwatch.com/rss/automotive',
    retail: 'https://www.marketwatch.com/rss/retail',
    telecom: 'https://www.marketwatch.com/rss/telecom',
    media: 'https://www.marketwatch.com/rss/media',
    transportation: 'https://www.marketwatch.com/rss/transportation',
    industrial: 'https://www.marketwatch.com/rss/industrial',
    financial: 'https://www.marketwatch.com/rss/financial',
    agriculture: 'https://www.marketwatch.com/rss/agriculture',
    metals: 'https://www.marketwatch.com/rss/metals',
    currencies: 'https://www.marketwatch.com/rss/currencies',
    bonds: 'https://www.marketwatch.com/rss/bonds',
    equities: 'https://www.marketwatch.com/rss/equities',
    indices: 'https://www.marketwatch.com/rss/indices',
    futures: 'https://www.marketwatch.com/rss/futures',
    options: 'https://www.marketwatch.com/rss/options',
    etfs: 'https://www.marketwatch.com/rss/etfs',
    mutualfunds: 'https://www.marketwatch.com/rss/mutualfunds',
    reits: 'https://www.marketwatch.com/rss/reits',
    derivatives: 'https://www.marketwatch.com/rss/derivatives'
  },
  reuters: {
    markets: 'https://www.reuters.com/rssFeed/markets',
    economy: 'https://www.reuters.com/rssFeed/economy',
    technology: 'https://www.reuters.com/rssFeed/technology',
    crypto: 'https://www.reuters.com/rssFeed/crypto',
    stocks: 'https://www.reuters.com/rssFeed/stocks',
    forex: 'https://www.reuters.com/rssFeed/forex',
    commodities: 'https://www.reuters.com/rssFeed/commodities',
    energy: 'https://www.reuters.com/rssFeed/energy',
    realestate: 'https://www.reuters.com/rssFeed/realestate',
    healthcare: 'https://www.reuters.com/rssFeed/healthcare',
    automotive: 'https://www.reuters.com/rssFeed/automotive',
    retail: 'https://www.reuters.com/rssFeed/retail',
    telecom: 'https://www.reuters.com/rssFeed/telecom',
    media: 'https://www.reuters.com/rssFeed/media',
    transportation: 'https://www.reuters.com/rssFeed/transportation',
    industrial: 'https://www.reuters.com/rssFeed/industrial',
    financial: 'https://www.reuters.com/rssFeed/financial',
    agriculture: 'https://www.reuters.com/rssFeed/agriculture',
    metals: 'https://www.reuters.com/rssFeed/metals',
    currencies: 'https://www.reuters.com/rssFeed/currencies',
    bonds: 'https://www.reuters.com/rssFeed/bonds',
    equities: 'https://www.reuters.com/rssFeed/equities',
    indices: 'https://www.reuters.com/rssFeed/indices',
    futures: 'https://www.reuters.com/rssFeed/futures',
    options: 'https://www.reuters.com/rssFeed/options',
    etfs: 'https://www.reuters.com/rssFeed/etfs',
    mutualfunds: 'https://www.reuters.com/rssFeed/mutualfunds',
    reits: 'https://www.reuters.com/rssFeed/reits',
    derivatives: 'https://www.reuters.com/rssFeed/derivatives'
  },
  investing: {
    markets: 'https://www.investing.com/rss/news.rss',
    economy: 'https://www.investing.com/rss/economic.rss',
    technology: 'https://www.investing.com/rss/technology.rss',
    crypto: 'https://www.investing.com/rss/crypto.rss',
    stocks: 'https://www.investing.com/rss/stock.rss',
    forex: 'https://www.investing.com/rss/forex.rss',
    commodities: 'https://www.investing.com/rss/commodities.rss',
    energy: 'https://www.investing.com/rss/energy.rss',
    realestate: 'https://www.investing.com/rss/real-estate.rss',
    healthcare: 'https://www.investing.com/rss/healthcare.rss',
    automotive: 'https://www.investing.com/rss/automotive.rss',
    retail: 'https://www.investing.com/rss/retail.rss',
    telecom: 'https://www.investing.com/rss/telecom.rss',
    media: 'https://www.investing.com/rss/media.rss',
    transportation: 'https://www.investing.com/rss/transportation.rss',
    industrial: 'https://www.investing.com/rss/industrial.rss',
    financial: 'https://www.investing.com/rss/financial.rss',
    agriculture: 'https://www.investing.com/rss/agriculture.rss',
    metals: 'https://www.investing.com/rss/metals.rss',
    currencies: 'https://www.investing.com/rss/currencies.rss',
    bonds: 'https://www.investing.com/rss/bonds.rss',
    equities: 'https://www.investing.com/rss/equities.rss',
    indices: 'https://www.investing.com/rss/indices.rss',
    futures: 'https://www.investing.com/rss/futures.rss',
    options: 'https://www.investing.com/rss/options.rss',
    etfs: 'https://www.investing.com/rss/etfs.rss',
    mutualfunds: 'https://www.investing.com/rss/mutual-funds.rss',
    reits: 'https://www.investing.com/rss/reits.rss',
    derivatives: 'https://www.investing.com/rss/derivatives.rss'
  }
};

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const newsCache = new Map<string, { data: NewsItem[], timestamp: number }>();

const fetchRSSFeed = async (url: string, source: string, category: string): Promise<NewsItem[]> => {
  try {
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    
    const items = Array.from(doc.querySelectorAll('item')).map(item => ({
      title: item.querySelector('title')?.textContent || '',
      description: item.querySelector('description')?.textContent || '',
      url: item.querySelector('link')?.textContent || '',
      pubDate: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
      source,
      category
    }));

    return items;
  } catch (error) {
    console.error(`Error fetching RSS feed from ${url}:`, error);
    return [];
  }
};

export const fetchAllNews = async (filters?: NewsFilters): Promise<NewsItem[]> => {
  try {
    // Check cache first
    const cacheKey = JSON.stringify(filters || {});
    const cachedData = newsCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return cachedData.data;
    }

    // Fetch news from RSS feeds in parallel with batching
    const batchSize = 2; // Reduced batch size for better performance
    const allFeeds = [
      ...Object.entries(RSS_FEEDS.yahooFinance).map(([category, url]) => 
        fetchRSSFeed(url, 'Yahoo Finance', category)
      ),
      ...Object.entries(RSS_FEEDS.marketWatch).map(([category, url]) => 
        fetchRSSFeed(url, 'MarketWatch', category)
      ),
      ...Object.entries(RSS_FEEDS.reuters).map(([category, url]) => 
        fetchRSSFeed(url, 'Reuters', category)
      ),
      ...Object.entries(RSS_FEEDS.investing).map(([category, url]) => 
        fetchRSSFeed(url, 'Investing.com', category)
      ),
    ];

    const results: NewsItem[] = [];
    
    // Process feeds in smaller batches
    for (let i = 0; i < allFeeds.length; i += batchSize) {
      const batch = allFeeds.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(batch);
      const successfulResults = batchResults
        .filter((result): result is PromiseFulfilledResult<NewsItem[]> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
      results.push(...successfulResults.flat());
    }

    // Deduplicate news items based on URL and title
    const seen = new Set<string>();
    const uniqueResults = results.filter(item => {
      const key = `${item.url}-${item.title}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    // Apply filters if provided
    let filteredNews = uniqueResults;
    if (filters) {
      if (filters.category) {
        filteredNews = filteredNews.filter(item => item.category === filters.category);
      }
      if (filters.source) {
        filteredNews = filteredNews.filter(item => item.source === filters.source);
      }
      if (filters.timeframe) {
        const now = new Date();
        const cutoff = new Date(now.getTime() - filters.timeframe * 60 * 60 * 1000);
        filteredNews = filteredNews.filter(item => new Date(item.pubDate) >= cutoff);
      }
    }

    // Update cache
    newsCache.set(cacheKey, {
      data: filteredNews,
      timestamp: Date.now()
    });

    return filteredNews;
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}; 