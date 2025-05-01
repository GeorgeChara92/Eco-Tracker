import { useQuery } from '@tanstack/react-query';
import { MarketDataResponse } from '@/lib/yahoo-finance';

// Cache configuration
const CACHE_DURATION = 15 * 1000; // 15 seconds
const REFETCH_INTERVAL = 15 * 1000; // 15 seconds
const STALE_TIME = 5 * 1000; // 5 seconds
const GC_TIME = 60 * 1000; // 1 minute
const RETRY_COUNT = 3;

const marketDataCache = new Map<string, { data: MarketDataResponse, timestamp: number }>();

// Helper function to fetch market data
async function fetchMarketData() {
  const cacheKey = 'allMarketData';
  const cachedData = marketDataCache.get(cacheKey);
  
  // Use cached data if it's fresh enough
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    console.log('Using cached market data');
    return cachedData.data;
  }

  console.log('Fetching fresh market data');
  const response = await fetch('/api/market/all');
  if (!response.ok) {
    throw new Error('Failed to fetch market data');
  }
  
  const data = await response.json();
  
  // Update cache
  marketDataCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });

  return data;
}

// Hook to fetch all market data
export const useAllMarketData = () => {
  return useQuery<MarketDataResponse, Error>({
    queryKey: ['allMarketData'],
    queryFn: fetchMarketData,
    refetchInterval: REFETCH_INTERVAL,
    refetchIntervalInBackground: true,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: true,
    retry: RETRY_COUNT,
    select: (data) => {
      console.log('Market data updated:', {
        timestamp: new Date().toISOString(),
        stocksCount: data.stocks?.length,
        indicesCount: data.indices?.length,
        cryptoCount: data.crypto?.length
      });
      return {
        ...data,
        _timestamp: Date.now() // Force React to recognize data changes
      };
    }
  });
};

// Hook to fetch single market data
export const useMarketData = (symbol: string) => {
  return useQuery<any, Error>({
    queryKey: ['marketData', symbol],
    queryFn: async () => {
      const response = await fetch(`/api/market/data?symbol=${symbol}`);
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      return response.json();
    },
    refetchInterval: REFETCH_INTERVAL,
    refetchIntervalInBackground: true,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: RETRY_COUNT
  });
}; 