'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import MarketSegment from '@/components/ui/MarketSegment';
import MarketDetails from '@/components/ui/MarketDetails';
import { useAllMarketData } from '@/src/hooks/useMarketData';
import { MarketData } from '@/lib/yahoo-finance';
import RefreshNotification from '@/components/ui/RefreshNotification';
import { FaSpinner } from 'react-icons/fa';

// Create a client with default settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 10000, // Refresh every 10 seconds by default
      refetchIntervalInBackground: true,
      staleTime: 0, // Consider data stale immediately so it can be refetched
      retry: 3,
      retryDelay: 1000,
    },
  },
});

export default function MarketPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <MarketPageContent />
    </QueryClientProvider>
  );
}

function MarketPageContent() {
  const [selectedAsset, setSelectedAsset] = useState<MarketData | null>(null);
  const { data: marketData, isLoading, error, dataUpdatedAt, refetch } = useAllMarketData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAssetSelect = (asset: MarketData) => {
    setSelectedAsset(asset);
  };

  const handleCloseDetails = () => {
    setSelectedAsset(null);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    // Add small delay to show the refreshing state
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <FaSpinner className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading market data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error loading market data</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Market Overview</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              aria-label="Refresh market data"
            >
              <FaSpinner className={`w-5 h-5 text-blue-600 dark:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <RefreshNotification lastUpdated={new Date(dataUpdatedAt || Date.now())} />
          </div>
        </div>

        <div className="space-y-12">
          {marketData?.stocks && (
            <MarketSegment
              title="Stocks"
              data={marketData.stocks}
              onAssetSelect={handleAssetSelect}
            />
          )}
          {marketData?.indices && (
            <MarketSegment
              title="Indices"
              data={marketData.indices}
              onAssetSelect={handleAssetSelect}
            />
          )}
          {marketData?.commodities && (
            <MarketSegment
              title="Commodities"
              data={marketData.commodities}
              onAssetSelect={handleAssetSelect}
            />
          )}
          {marketData?.crypto && (
            <MarketSegment
              title="Cryptocurrencies"
              data={marketData.crypto}
              onAssetSelect={handleAssetSelect}
            />
          )}
          {marketData?.forex && (
            <MarketSegment
              title="Forex"
              data={marketData.forex}
              onAssetSelect={handleAssetSelect}
            />
          )}
          {marketData?.funds && (
            <MarketSegment
              title="Funds"
              data={marketData.funds}
              onAssetSelect={handleAssetSelect}
            />
          )}
        </div>
      </div>

      {selectedAsset && (
        <MarketDetails data={selectedAsset} onClose={handleCloseDetails} />
      )}
    </AppLayout>
  );
} 