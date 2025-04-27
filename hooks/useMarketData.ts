import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MarketData, MarketSegmentData } from '@/lib/yahoo-finance';

export function useMarketData(symbol: string) {
  const { data, isLoading, error, refetch } = useQuery<MarketData>({
    queryKey: ['marketData', symbol],
    queryFn: async () => {
      const response = await fetch(`/api/market/data?symbol=${symbol}`);
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

export function useAllMarketData() {
  const { data, isLoading, error, refetch, dataUpdatedAt, isFetching } = useQuery<MarketSegmentData>({
    queryKey: ['allMarketData'],
    queryFn: async () => {
      const response = await fetch('/api/market/all');
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    data,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
    isFetching,
  };
} 