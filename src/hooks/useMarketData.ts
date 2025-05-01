import { useQuery } from '@tanstack/react-query';
import { MarketDataResponse } from '@/lib/yahoo-finance';

// Cache configuration
const CACHE_DURATION = 15 * 1000; // 15 seconds
const marketDataCache = new Map<string, { data: MarketDataResponse, timestamp: number }>();

// Hook to fetch all market data
export const useAllMarketData = () => {
  return useQuery<MarketDataResponse, Error>({
    queryKey: ['allMarketData'],
    queryFn: async () => {
      // Check cache first
      const cacheKey = 'allMarketData';
      const cachedData = marketDataCache.get(cacheKey);
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        return cachedData.data;
      }

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
    },
    refetchInterval: 15000, // Refetch every 15 seconds
    refetchIntervalInBackground: true,
    staleTime: 5000, // Consider data stale after 5 seconds
    gcTime: 60000, // Keep data in cache for 1 minute
    refetchOnWindowFocus: true,
    retry: 3,
    select: (data) => {
      // Add timestamp to force React to recognize the data change
      return {
        ...data,
        _timestamp: Date.now()
      };
    }
  });
}; 