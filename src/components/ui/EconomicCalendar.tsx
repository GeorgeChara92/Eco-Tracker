import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EconomicEvent, EconomicCalendarFilters } from '../../lib/types/economic-calendar';
import { fetchEconomicCalendar } from '../../lib/economic-calendar-service';

const EconomicCalendar: React.FC = () => {
  const [filters, setFilters] = useState<EconomicCalendarFilters>({
    timeframe: 'today'
  });

  const { data: events, isLoading, error } = useQuery<EconomicEvent[]>({
    queryKey: ['economicCalendar', filters],
    queryFn: fetchEconomicCalendar,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const filteredEvents = React.useMemo(() => {
    if (!events) return [];
    
    let filtered = [...events];
    
    if (filters.currency) {
      filtered = filtered.filter(event => 
        event.currency.toLowerCase().includes(filters.currency!.toLowerCase())
      );
    }
    
    if (filters.impact) {
      filtered = filtered.filter(event => event.impact === filters.impact);
    }
    
    if (filters.timeframe) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.time);
        switch (filters.timeframe) {
          case 'today':
            return eventDate >= today;
          case 'week':
            return eventDate >= weekAgo;
          case 'month':
            return eventDate >= monthAgo;
          default:
            return true;
        }
      });
    }
    
    return filtered;
  }, [events, filters]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">
          Error loading economic calendar. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <select
          value={filters.timeframe}
          onChange={(e) => setFilters({ ...filters, timeframe: e.target.value as any })}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        
        <select
          value={filters.currency || ''}
          onChange={(e) => setFilters({ ...filters, currency: e.target.value || undefined })}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800"
        >
          <option value="">All Currencies</option>
          {Array.from(new Set(events?.map(event => event.currency) || [])).map(currency => (
            <option key={currency} value={currency}>{currency}</option>
          ))}
        </select>
        
        <select
          value={filters.impact || ''}
          onChange={(e) => setFilters({ ...filters, impact: e.target.value as any || undefined })}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800"
        >
          <option value="">All Impact Levels</option>
          <option value="high">High Impact</option>
          <option value="medium">Medium Impact</option>
          <option value="low">Low Impact</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredEvents.map((event, index) => (
          <div
            key={`${event.time}-${event.event}-${index}`}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{event.time}</span>
              <span className={`text-sm px-2 py-1 rounded-full ${getImpactColor(event.impact)}`}>
                {event.impact.charAt(0).toUpperCase() + event.impact.slice(1)} Impact
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">{event.event}</h3>
              <span className="text-sm font-medium">{event.currency}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Actual:</span>
                <span className="ml-2 font-medium">{event.actual || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Forecast:</span>
                <span className="ml-2 font-medium">{event.forecast || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Previous:</span>
                <span className="ml-2 font-medium">{event.previous || '-'}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Source: {event.source}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EconomicCalendar; 