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
  try {
    console.log('Fetching fresh market data from Supabase');
    // Use relative URL to avoid protocol issues
    const response = await fetch('/api/market/supabase', {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch market data:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to fetch market data: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched market data');
    return data;
  } catch (error) {
    console.error('Error fetching market data:', error);
    // If it's a certificate error, try with http
    if (error instanceof TypeError && error.message.includes('cert')) {
      console.log('Certificate error detected, trying alternative approach');
      try {
        const response = await fetch('/api/market/supabase', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          mode: 'cors'
        });
        if (!response.ok) throw new Error(`Failed to fetch market data: ${response.statusText}`);
        return response.json();
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
        throw error; // Throw the original error
      }
    }
    throw error;
  }
}

// Custom hook for fetching market data
export function useAllMarketData() {
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  // Set up real-time subscription
  useEffect(() => {
    let channel: any = null;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const setupSubscription = async () => {
      try {
        console.log('Setting up Supabase real-time subscription for all market data', {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 10) + '...' : 'not set',
          env: process.env.NODE_ENV
        });
        
        // First, verify we can connect to Supabase
        const { data, error: supabaseError } = await supabase
          .from('assets')
          .select('*')
          .limit(1);
        
        if (supabaseError) {
          console.error('Supabase connection test failed:', supabaseError);
          setError(supabaseError.message);
          return;
        }

        console.log('Supabase connection test successful, sample data:', data);
        
        // Create and configure the channel
        channel = supabase.channel('public:assets', {
          config: {
            broadcast: { self: true },
            presence: { key: '' }
          }
        });

        // Set up event handlers
        channel
          .on('broadcast', { event: 'test' }, ({ payload }: { payload: { message: string } }) => {
            console.log('Broadcast test received:', payload);
          })
          .on('presence', { event: 'sync' }, () => {
            console.log('Presence sync');
          })
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'assets' 
            }, 
            (payload: any) => {
              console.log('Received real-time update for assets:', {
                eventType: payload.eventType,
                table: payload.table,
                schema: payload.schema,
                timestamp: new Date().toISOString(),
                new: payload.new ? {
                  symbol: payload.new.symbol,
                  price: payload.new.price,
                  change: payload.new.change
                } : 'no new data'
              });
              
              // Manually force refetch in addition to invalidation
              queryClient.invalidateQueries({ queryKey: ['marketData'] });
              queryClient.refetchQueries({ queryKey: ['marketData'] });
            }
          );

        // Subscribe to the channel
        const subscription = channel.subscribe(async (status: string) => {
          console.log('Subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to real-time updates');
            setConnectionStatus('connected');
            setError(null);
            // Send a test broadcast
            channel.send({
              type: 'broadcast',
              event: 'test',
              payload: { message: 'Connection established' }
            });
          } else if (status === 'CLOSED') {
            console.log('Subscription closed');
            setConnectionStatus('disconnected');
            
            // Try to reconnect if we haven't exceeded max retries
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              console.log(`Attempting to reconnect (attempt ${retryCount}/${MAX_RETRIES})`);
              setTimeout(() => {
                if (channel) {
                  channel.unsubscribe();
                  setupSubscription();
                }
              }, 2000 * retryCount); // Exponential backoff
            } else {
              setError('Failed to establish real-time connection after multiple attempts');
              console.error('Max retry attempts reached');
            }
          } else {
            console.log('Subscription in progress:', status);
            setConnectionStatus('disconnected');
          }
        });

        return () => {
          if (channel) {
            console.log('Cleaning up Supabase subscription');
            channel.unsubscribe();
          }
        };
      } catch (error) {
        console.error('Error in setupSubscription:', error);
        setError('Failed to set up real-time subscription');
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        console.log('Cleaning up Supabase subscription on unmount');
        channel.unsubscribe();
      }
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

  return {
    ...query,
    connectionStatus,
    error
  };
}

// Hook to fetch single market data
export const useMarketData = (symbol: string) => {
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: any = null;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const setupSubscription = async () => {
      try {
        console.log(`Setting up Supabase real-time subscription for ${symbol}`);
        
        channel = supabase.channel(`asset-${symbol}`, {
          config: {
            broadcast: { self: true },
            presence: { key: '' }
          }
        });

        channel
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'assets',
              filter: `symbol=eq.${symbol}`
            }, 
            (payload: any) => {
              console.log(`Received real-time update for ${symbol}:`, payload);
              queryClient.invalidateQueries({ queryKey: ['marketData', symbol] });
            }
          )
          .subscribe(async (status: string) => {
            console.log(`Subscription status for ${symbol}:`, status);
            
            if (status === 'SUBSCRIBED') {
              setConnectionStatus('connected');
              setError(null);
            } else if (status === 'CLOSED') {
              console.log(`Subscription closed for ${symbol}`);
              setConnectionStatus('disconnected');
              
              // Try to reconnect if we haven't exceeded max retries
              if (retryCount < MAX_RETRIES) {
                retryCount++;
                console.log(`Attempting to reconnect for ${symbol} (attempt ${retryCount}/${MAX_RETRIES})`);
                setTimeout(() => {
                  if (channel) {
                    channel.unsubscribe();
                    setupSubscription();
                  }
                }, 2000 * retryCount); // Exponential backoff
              } else {
                setError(`Failed to establish real-time connection for ${symbol} after multiple attempts`);
                console.error('Max retry attempts reached');
              }
            } else {
              console.log(`Subscription in progress for ${symbol}:`, status);
              setConnectionStatus('disconnected');
            }
          });

        return () => {
          if (channel) {
            console.log(`Cleaning up Supabase subscription for ${symbol}`);
            channel.unsubscribe();
          }
        };
      } catch (error) {
        console.error(`Error setting up subscription for ${symbol}:`, error);
        setError(`Failed to set up real-time subscription for ${symbol}`);
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        console.log(`Cleaning up Supabase subscription for ${symbol} on unmount`);
        channel.unsubscribe();
      }
    };
  }, [symbol, queryClient]);

  const query = useQuery<any, Error>({
    queryKey: ['marketData', symbol],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/market/data?symbol=${symbol}`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch market data:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          throw new Error(`Failed to fetch market data: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        throw error;
      }
    },
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    staleTime: 0,
    gcTime: 30000,
    retry: 3
  });

  return {
    ...query,
    connectionStatus,
    error
  };
}; 