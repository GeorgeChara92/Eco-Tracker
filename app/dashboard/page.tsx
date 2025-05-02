'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import { MarketData } from '@/lib/yahoo-finance';
import { useAllMarketData } from '@/src/hooks/useMarketData';
import { useSession } from 'next-auth/react';
import { FaLock, FaUserPlus, FaSignInAlt, FaBell, FaExclamationTriangle, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import Link from 'next/link';
import { useAlerts } from '@/src/hooks/useAlerts';

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
  const { data: marketData, isLoading: isLoadingMarket } = useAllMarketData();
  const { data: session, status } = useSession();
  const { alerts: initialAlerts, notifications, isLoading: isLoadingAlerts } = useAlerts();
  const [alerts, setAlerts] = useState(initialAlerts || []);

  // Update local alerts when initialAlerts changes
  useEffect(() => {
    setAlerts(initialAlerts || []);
  }, [initialAlerts]);

  // Listen for alert updates
  useEffect(() => {
    const handleAlertUpdate = (event: CustomEvent<{ type: 'create' | 'delete', alert?: any }>) => {
      if (event.detail.type === 'delete') {
        setAlerts(prev => prev.filter(alert => alert.id !== event.detail.alert?.id));
      } else if (event.detail.type === 'create' && event.detail.alert) {
        setAlerts(prev => [...prev, event.detail.alert]);
      }
    };

    window.addEventListener('alertUpdated', handleAlertUpdate as EventListener);

    return () => {
      window.removeEventListener('alertUpdated', handleAlertUpdate as EventListener);
    };
  }, []);

  if (isLoadingMarket || isLoadingAlerts) {
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
        {/* Authentication Overlay */}
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Market Overview</h1>

            {/* Market Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {marketData?.stocks?.slice(0, 4).map((stock: MarketData) => (
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-100 dark:border-gray-700">
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
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-8">
            {/* Active Alerts Section */}
            {session && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center mb-4">
                  <FaBell className="text-blue-500 dark:text-blue-400 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Your Alerts</h2>
                </div>
                {alerts.length > 0 ? (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-lg border ${
                          alert.is_active
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                            : 'bg-gray-50 dark:bg-gray-700/20 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start">
                          {alert.is_active ? (
                            <FaInfoCircle className="text-blue-500 dark:text-blue-400 mt-1 mr-2" />
                          ) : (
                            <FaCheckCircle className="text-gray-400 dark:text-gray-500 mt-1 mr-2" />
                          )}
                          <div>
                            <p className="text-sm text-gray-800 dark:text-gray-200">
                              {alert.asset_symbol} {alert.alert_type === 'price' ? 'price' : 'change'} alert when{' '}
                              {alert.condition === 'above' ? 'above' : 'below'} {alert.value}
                              {alert.alert_type === 'percentage' ? '%' : ''}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {alert.is_active ? 'Active' : 'Triggered'} • Created {new Date(alert.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400">No alerts set up yet</p>
                    <Link 
                      href="/market" 
                      className="mt-2 inline-flex items-center text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                    >
                      Set up alerts
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Notifications Section */}
            {session && notifications.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center mb-4">
                  <FaBell className="text-emerald-500 dark:text-emerald-400 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Recent Notifications</h2>
                </div>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        notification.type === 'alert'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                          : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      <div className="flex items-start">
                        {notification.type === 'alert' ? (
                          <FaExclamationTriangle className="text-yellow-500 dark:text-yellow-400 mt-1 mr-2" />
                        ) : (
                          <FaCheckCircle className="text-emerald-500 dark:text-emerald-400 mt-1 mr-2" />
                        )}
                        <div>
                          <p className="text-sm text-gray-800 dark:text-gray-200">{notification.message}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
        </div>
      </div>
    </AppLayout>
  );
} 