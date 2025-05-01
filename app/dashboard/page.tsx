'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import { MarketData } from '@/lib/yahoo-finance';
import { useAllMarketData } from '@/src/hooks/useMarketData';
import { useSession } from 'next-auth/react';
import { FaLock, FaUserPlus, FaSignInAlt } from 'react-icons/fa';
import Link from 'next/link';

// Create a client with default settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 15000, // Refresh every 15 seconds
      refetchIntervalInBackground: true,
      staleTime: 5000,
    },
  },
});

// Mock data for demonstration
const mockPortfolio = [
  { symbol: 'AAPL', shares: 10, avgPrice: 180 },
  { symbol: 'MSFT', shares: 5, avgPrice: 350 },
  { symbol: 'BTC-USD', amount: 0.5, avgPrice: 45000 },
];

export default function DashboardPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
}

function DashboardContent() {
  const { data: marketData, isLoading } = useAllMarketData();
  const { data: session, status } = useSession();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 relative">
        {status !== 'loading' && !session && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 backdrop-blur-sm bg-white/90 dark:bg-black/50 z-10 flex flex-col items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-md mx-auto border border-gray-200 dark:border-gray-700">
                <div className="bg-emerald-50 dark:bg-blue-500/20 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <FaLock className="text-emerald-600 dark:text-blue-500 h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                  Dashboard Locked
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                  Sign in or create an account to access your personalized dashboard and track your investments in real-time.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link 
                    href="/auth/signin"
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg"
                  >
                    <FaSignInAlt className="w-4 h-4" />
                    <span>Sign In</span>
                  </Link>
                  <Link 
                    href="/auth/signup"
                    className="flex items-center gap-2 px-6 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg border border-gray-200 dark:border-gray-600"
                  >
                    <FaUserPlus className="w-4 h-4" />
                    <span>Sign Up</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-8">Market Overview</h1>

        {/* Market Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {marketData?.stocks?.slice(0, 3).map((stock: MarketData) => (
            <motion.div
              key={stock.symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-100 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">{stock.symbol}</h3>
              <p className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">${stock.price?.toFixed(2) ?? 'N/A'}</p>
              <p className={`text-sm ${(stock.changePercent ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {(stock.changePercent ?? 0) >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2) ?? '0.00'}%
              </p>
            </motion.div>
          ))}
        </div>

        {/* Portfolio Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-6 mb-8 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Portfolio Preview</h2>
          <div className="space-y-4">
            {mockPortfolio.map((item) => {
              const asset = marketData?.stocks?.find((s: MarketData) => s.symbol === item.symbol);
              const currentPrice = asset?.price || 0;
              const totalValue = item.shares !== undefined ? item.shares * currentPrice : (item.amount || 0) * currentPrice;
              const profitLoss = totalValue - (item.shares !== undefined ? item.shares * item.avgPrice : (item.amount || 0) * item.avgPrice);
              const profitLossPercentage = (profitLoss / (item.shares !== undefined ? item.shares * item.avgPrice : (item.amount || 0) * item.avgPrice)) * 100;

              return (
                <div
                  key={item.symbol}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600"
                >
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{item.symbol}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {'shares' in item ? `${item.shares} shares` : `${item.amount} ${item.symbol}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800 dark:text-white">${totalValue.toFixed(2)}</p>
                    <p className={`text-sm ${profitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {profitLoss >= 0 ? '+' : ''}{profitLoss.toFixed(2)} ({profitLossPercentage.toFixed(2)}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Market News */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Market News</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
              <h3 className="font-medium mb-2 text-gray-800 dark:text-white">Market Update</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Stay informed about the latest market trends and developments.
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
              <h3 className="font-medium mb-2 text-gray-800 dark:text-white">Investment Tips</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Discover strategies for building a diversified portfolio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 