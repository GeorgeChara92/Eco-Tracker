import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MarketDataResponse } from '@/lib/yahoo-finance';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

// Cache configuration
const CACHE_DURATION = 5 * 1000; // 5 seconds
const REFETCH_INTERVAL = 5 * 1000; // 5 seconds
const STALE_TIME = 0; // Consider data stale immediately
const GC_TIME = 30 * 1000; // 30 seconds
const RETRY_COUNT = 3;

const marketDataCache = new Map<string, { data: MarketDataResponse, timestamp: number }>();

// Helper function to fetch market data
async function fetchMarketData() {
  console.log('Fetching fresh market data from Supabase');
  const response = await fetch('/api/market/supabase');
  if (!response.ok) {
    throw new Error('Failed to fetch market data');
  }
  return response.json();
}

// Custom hook for fetching market data
export function useAllMarketData() {
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');

  // Set up real-time subscription
  useEffect(() => {
    console.log('Setting up Supabase real-time subscription');
    
    const channel = supabase
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
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence sync');
      })
      .on('broadcast', { event: 'test' }, ({ payload }) => {
        console.log('Broadcast received:', payload);
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates');
        } else {
          console.error('Failed to subscribe to real-time updates:', status);
        }
      });

    // Test the connection
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .limit(1);
        
        if (error) {
          console.error('Supabase connection test failed:', error);
        } else {
          console.log('Supabase connection test successful');
        }
      } catch (error) {
        console.error('Error testing Supabase connection:', error);
      }
    };

    testConnection();

    return () => {
      console.log('Cleaning up Supabase subscription');
      channel.unsubscribe();
    };
  }, [queryClient]);

  const query = useQuery<MarketDataResponse>({
    queryKey: ['marketData'],
    queryFn: fetchMarketData,
    // Keep these settings for initial load and fallback
    refetchInterval: 15000, // 15 seconds as fallback
    refetchIntervalInBackground: true,
    staleTime: 0,
    gcTime: 30000,
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });

  // Log connection status changes
  useEffect(() => {
    console.log('Connection status changed:', connectionStatus);
  }, [connectionStatus]);

  return {
    ...query,
    connectionStatus
  };
}

// Hook to fetch single market data
export const useMarketData = (symbol: string) => {
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');

  // Set up real-time subscription for specific symbol
  useEffect(() => {
    console.log(`Setting up Supabase real-time subscription for ${symbol}`);
    
    const channel = supabase
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
      .subscribe((status) => {
        console.log(`Subscription status for ${symbol}:`, status);
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
      });

    return () => {
      console.log(`Cleaning up Supabase subscription for ${symbol}`);
      channel.unsubscribe();
    };
  }, [symbol, queryClient]);

  const query = useQuery<any, Error>({
    queryKey: ['marketData', symbol],
    queryFn: async () => {
      const response = await fetch(`/api/market/data?symbol=${symbol}`);
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      return response.json();
    },
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    staleTime: 0,
    gcTime: 30000,
    retry: 3
  });

  return {
    ...query,
    connectionStatus
  };
}; 