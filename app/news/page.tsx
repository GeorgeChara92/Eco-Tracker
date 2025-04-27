'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import NewsFeed from '@/components/ui/NewsFeed';
import EconomicCalendar from '@/components/ui/EconomicCalendar';
import { Tab } from '@headlessui/react';
import { FaNewspaper, FaCalendarAlt } from 'react-icons/fa';

// Create a client with default settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 300000, // Refresh every 5 minutes
      refetchIntervalInBackground: true,
      staleTime: 150000, // Consider data stale after 2.5 minutes
    },
  },
});

export default function NewsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <NewsPageContent />
    </QueryClientProvider>
  );
}

function NewsPageContent() {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <AppLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Market News & Events</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Stay informed with latest market news and economic events
            </p>
          </div>
        </div>
      </div>

      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-8">
          <Tab
            className={({ selected }) =>
              `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
              ${selected
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
              }`
            }
          >
            <FaNewspaper />
            Market News
          </Tab>
          <Tab
            className={({ selected }) =>
              `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
              ${selected
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
              }`
            }
          >
            <FaCalendarAlt />
            Economic Calendar
          </Tab>
        </Tab.List>

        <Tab.Panels>
          <Tab.Panel>
            <NewsFeed />
          </Tab.Panel>
          <Tab.Panel>
            <EconomicCalendar />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </AppLayout>
  );
} 