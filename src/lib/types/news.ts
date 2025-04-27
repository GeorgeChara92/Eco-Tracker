export interface NewsItem {
  title: string;
  description: string;
  url: string;
  pubDate: string;
  source: string;
  category: string;
}

export interface NewsFilters {
  category?: string;
  source?: string;
  timeframe?: number; // in hours
}

export interface RSSFeed {
  [key: string]: string;
}

export interface RSSFeeds {
  yahooFinance: RSSFeed;
  marketWatch: RSSFeed;
  reuters: RSSFeed;
  investing: RSSFeed;
} 