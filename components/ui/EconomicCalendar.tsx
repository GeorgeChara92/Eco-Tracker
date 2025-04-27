import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaCalendarAlt, FaClock, FaGlobe } from 'react-icons/fa';

interface EconomicEvent {
  title: string;
  date: string;
  time: string;
  country: string;
  impact: 'high' | 'medium' | 'low';
  forecast?: string;
  previous?: string;
}

export default function EconomicCalendar() {
  const { data: events, isLoading, error } = useQuery<EconomicEvent[]>({
    queryKey: ['economicEvents'],
    queryFn: async () => {
      const response = await fetch('/api/economic-calendar');
      if (!response.ok) {
        throw new Error('Failed to fetch economic events');
      }
      return response.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
        <p className="text-red-600 dark:text-red-300">Failed to load economic calendar</p>
      </div>
    );
  }

  const getImpactColor = (impact: EconomicEvent['impact']) => {
    switch (impact) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {events?.map((event, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className={`rounded-full p-2 ${getImpactColor(event.impact)} bg-opacity-10`}>
                <FaCalendarAlt className="h-5 w-5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium text-gray-900 dark:text-white">
                {event.title}
              </h3>
              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <FaClock className="mr-1 h-4 w-4" />
                  {event.time}
                </div>
                <div className="flex items-center">
                  <FaGlobe className="mr-1 h-4 w-4" />
                  {event.country}
                </div>
              </div>
              {(event.forecast || event.previous) && (
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  {event.forecast && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Forecast:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {event.forecast}
                      </span>
                    </div>
                  )}
                  {event.previous && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Previous:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {event.previous}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className={`flex-shrink-0 ${getImpactColor(event.impact)}`}>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">
                {event.impact} Impact
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 