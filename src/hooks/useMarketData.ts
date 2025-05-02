import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MarketDataResponse } from '@/lib/yahoo-finance';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

// Cache configuration
const CACHE_DURATION = 5 * 1000; // 5 seconds
const REFETCH_INTERVAL = 5 * 1000; // 5 seconds
const STALE_TIME = 0; // Consider data stale immediately
const GC_TIME = 30 * 1000; // 30 seconds
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

  console.log('Fetching fresh market data from Supabase');
  const response = await fetch('/api/market/supabase');
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

// Custom hook for fetching market data
export function useAllMarketData() {
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('assets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assets'
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          // Invalidate the query to trigger a refetch
          queryClient.invalidateQueries({ queryKey: ['marketData'] });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return useQuery<MarketDataResponse>({
    queryKey: ['marketData'],
    queryFn: fetchMarketData,
    // Keep these settings for initial load and fallback
    refetchInterval: 30000, // 30 seconds as fallback
    refetchIntervalInBackground: true,
    staleTime: 0,
    gcTime: 30000,
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });
}

// Hook to fetch single market data
export const useMarketData = (symbol: string) => {
  const queryClient = useQueryClient();

  // Set up real-time subscription for specific symbol
  useEffect(() => {
    const subscription = supabase
      .channel(`asset-${symbol}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assets',
          filter: `symbol=eq.${symbol}`
        },
        (payload) => {
          console.log(`Received real-time update for ${symbol}:`, payload);
          queryClient.invalidateQueries({ queryKey: ['marketData', symbol] });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [symbol, queryClient]);

  return useQuery<any, Error>({
    queryKey: ['marketData', symbol],
    queryFn: async () => {
      const response = await fetch(`/api/market/data?symbol=${symbol}`);
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      return response.json();
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    staleTime: 0,
    gcTime: 30000,
    retry: 3
  });
}; 