import yahooFinance from 'yahoo-finance2';
import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['description', 'description'],
    ],
  },
});

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
  description?: string;
  imageUrl?: string;
}

export type NewsCategory = 'markets' | 'economy' | 'crypto' | 'forex' | 'commodities' | 'stocks' | 'general';

// Cache for storing fetched news items
let newsCache: NewsItem[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// List of topics to fetch news for
const NEWS_TOPICS = [
  { query: '^GSPC', category: 'markets' }, // S&P 500
  { query: 'BTC-USD', category: 'crypto' }, // Bitcoin
  { query: 'GC=F', category: 'commodities' }, // Gold
  { query: 'EUR=X', category: 'forex' }, // EUR/USD
  { query: 'AAPL', category: 'stocks' }, // Apple
  { query: '^DJI', category: 'markets' }, // Dow Jones
  { query: 'ETH-USD', category: 'crypto' }, // Ethereum
  { query: 'CL=F', category: 'commodities' }, // Crude Oil
  { query: 'JPY=X', category: 'forex' }, // USD/JPY
  { query: 'MSFT', category: 'stocks' }, // Microsoft
];

// RSS Feed sources
const RSS_FEEDS = [
  {
    url: 'https://www.investing.com/rss/news.rss',
    source: 'Investing.com',
    category: 'general',
  },
  {
    url: 'https://www.investing.com/rss/market_overview.rss',
    source: 'Investing.com',
    category: 'markets',
  },
  {
    url: 'https://www.investing.com/rss/stock_news.rss',
    source: 'Investing.com',
    category: 'stocks',
  },
  {
    url: 'https://www.investing.com/rss/forex_news.rss',
    source: 'Investing.com',
    category: 'forex',
  },
  {
    url: 'https://www.investing.com/rss/crypto_news.rss',
    source: 'Investing.com',
    category: 'crypto',
  },
  {
    url: 'https://www.investing.com/rss/commodities_news.rss',
    source: 'Investing.com',
    category: 'commodities',
  },
  {
    url: 'https://seekingalpha.com/market_currents.xml',
    source: 'Seeking Alpha',
    category: 'markets',
  },
  {
    url: 'https://seekingalpha.com/tag/forex.xml',
    source: 'Seeking Alpha',
    category: 'forex',
  },
  {
    url: 'https://cointelegraph.com/rss',
    source: 'CoinTelegraph',
    category: 'crypto',
  },
  {
    url: 'https://www.marketwatch.com/rss/topstories',
    source: 'MarketWatch',
    category: 'general',
  },
  {
    url: 'https://www.marketwatch.com/rss/marketpulse',
    source: 'MarketWatch',
    category: 'markets',
  },
];

async function fetchYahooNews(): Promise<NewsItem[]> {
  try {
    const newsPromises = NEWS_TOPICS.map(async ({ query, category }) => {
      try {
        const result = await yahooFinance.search(query, {
          lang: 'en-US',
          region: 'US',
          newsCount: 5
        });
        
        if (!result.news || result.news.length === 0) {
          console.log(`No news found for ${query}`);
          return [];
        }

        return result.news.map(item => ({
          title: item.title,
          link: item.link,
          pubDate: new Date(item.providerPublishTime).toISOString(),
          source: item.publisher,
          category: determineCategory(item.title) || category,
          description: '', // Yahoo Finance search doesn't provide article summaries
          imageUrl: item.thumbnail?.resolutions?.[0]?.url,
        }));
      } catch (error) {
        console.error(`Error fetching news for ${query}:`, error);
        return [];
      }
    });

    const results = await Promise.all(newsPromises);
    return results.flat();
  } catch (error) {
    console.error('Error fetching Yahoo Finance news:', error);
    return [];
  }
}

async function fetchRSSFeeds(): Promise<NewsItem[]> {
  const newsPromises = RSS_FEEDS.map(async ({ url, source, category }) => {
    try {
      const feed = await parser.parseURL(url);
      return feed.items.map(item => ({
        title: item.title || '',
        link: item.link || '',
        pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        source,
        category,
        description: item.description || item.contentSnippet || '',
        imageUrl: extractImageUrl(item),
      }));
    } catch (error) {
      console.error(`Error fetching RSS feed from ${source}: ${url}`, error);
      return [];
    }
  });

  try {
    const results = await Promise.all(newsPromises);
    return results.flat();
  } catch (error) {
    console.error('Error fetching RSS feeds:', error);
    return [];
  }
}

function extractImageUrl(item: any): string | undefined {
  try {
    // Try to get image from media:content
    if (item.mediaContent?.$?.url) {
      return item.mediaContent.$.url;
    }

    // Try to extract image from description HTML
    if (item.description) {
      const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch) {
        return imgMatch[1];
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}

function determineCategory(title: string, description: string = ''): NewsCategory | null {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('crypto') || text.includes('bitcoin') || text.includes('ethereum')) {
    return 'crypto';
  }
  if (text.includes('forex') || text.includes('currency') || text.includes('exchange rate')) {
    return 'forex';
  }
  if (text.includes('commodity') || text.includes('gold') || text.includes('oil')) {
    return 'commodities';
  }
  if (text.includes('stock') || text.includes('shares') || text.includes('nasdaq')) {
    return 'stocks';
  }
  if (text.includes('market') || text.includes('trading')) {
    return 'markets';
  }
  if (text.includes('economy') || text.includes('gdp') || text.includes('inflation')) {
    return 'economy';
  }
  
  return null;
}

export interface NewsFilters {
  categories?: NewsCategory[];
  sources?: string[];
  timeframe?: 'today' | 'week' | 'month' | 'all';
  searchTerm?: string;
}

export async function fetchAllNews(filters?: NewsFilters): Promise<NewsItem[]> {
  const currentTime = Date.now();
  
  // Return cached results if they're still fresh
  if (currentTime - lastFetchTime < CACHE_DURATION && newsCache.length > 0) {
    return applyFilters(newsCache, filters);
  }

  // Fetch new data from all sources
  const [yahooNews, rssNews] = await Promise.all([
    fetchYahooNews(),
    fetchRSSFeeds(),
  ]);

  newsCache = [...yahooNews, ...rssNews];
  lastFetchTime = currentTime;

  // Remove duplicates based on title
  newsCache = newsCache.filter((item, index, self) =>
    index === self.findIndex((t) => t.title === item.title)
  );

  return applyFilters(newsCache, filters);
}

function applyFilters(news: NewsItem[], filters?: NewsFilters): NewsItem[] {
  let filteredNews = [...news];

  if (filters) {
    if (filters.categories?.length) {
      filteredNews = filteredNews.filter(item => 
        filters.categories?.includes(item.category as NewsCategory)
      );
    }

    if (filters.sources?.length) {
      filteredNews = filteredNews.filter(item => 
        filters.sources?.includes(item.source)
      );
    }

    if (filters.timeframe && filters.timeframe !== 'all') {
      const now = new Date();
      const timeFrames: Record<string, number> = {
        today: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
      };

      filteredNews = filteredNews.filter(item => {
        const pubDate = new Date(item.pubDate);
        return now.getTime() - pubDate.getTime() <= timeFrames[filters.timeframe!];
      });
    }

    if (filters.searchTerm) {
      const searchRegex = new RegExp(filters.searchTerm, 'i');
      filteredNews = filteredNews.filter(item =>
        searchRegex.test(item.title) || searchRegex.test(item.description || '')
      );
    }
  }

  // Sort by publication date (newest first)
  return filteredNews.sort((a, b) => 
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
} 