import React, { useState } from 'react';
import { MarketData } from '@/lib/yahoo-finance';
import MarketCard from './MarketCard';
import { FaFilter, FaArrowUp, FaArrowDown, FaChartLine, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

type FilterType = 'all' | 'trending' | 'gainers' | 'losers';

interface MarketSegmentProps {
  title: string;
  data: MarketData[];
  onAssetSelect: (asset: MarketData) => void;
}

const getTypeColor = (type: MarketData['type']) => {
  switch (type) {
    case 'stock':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'index':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'commodity':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'crypto':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'forex':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'fund':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export default function MarketSegment({ title, data, onAssetSelect }: MarketSegmentProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expanded, setExpanded] = useState(false);
  const ITEMS_PER_PAGE = 5;

  if (!data || data.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow text-center">
          <p className="text-gray-500 dark:text-gray-400">Loading market data...</p>
        </div>
      </div>
    );
  }

  const filteredData = React.useMemo(() => {
    let filtered = [...data];
    
    switch (filter) {
      case 'trending':
        filtered.sort((a, b) => Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0));
        break;
      case 'gainers':
        filtered.sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));
        break;
      case 'losers':
        filtered.sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0));
        break;
    }
    
    return filtered;
  }, [data, filter]);

  const initialItems = filteredData.slice(0, ITEMS_PER_PAGE);
  const expandedItems = filteredData.slice(ITEMS_PER_PAGE);

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                filter === 'all' 
                  ? 'bg-emerald-500 dark:bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('trending')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                filter === 'trending' 
                  ? 'bg-emerald-500 dark:bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <FaChartLine className="text-xs" />
              Trending
            </button>
            <button
              onClick={() => setFilter('gainers')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                filter === 'gainers' 
                  ? 'bg-emerald-500 dark:bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <FaArrowUp className="text-xs" />
              Gainers
            </button>
            <button
              onClick={() => setFilter('losers')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                filter === 'losers' 
                  ? 'bg-emerald-500 dark:bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <FaArrowDown className="text-xs" />
              Losers
            </button>
          </div>
          {data.length > 5 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={`
                flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm font-medium
                transition-all duration-200 border border-gray-200 dark:border-gray-700
                ${expanded 
                  ? 'bg-emerald-500 dark:bg-blue-500 text-white border-transparent' 
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              {expanded ? (
                <>
                  <FaChevronUp className="text-xs" />
                  Show Less
                </>
              ) : (
                <>
                  <FaChevronDown className="text-xs" />
                  View More
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {initialItems.map((asset) => (
            <MarketCard
              key={asset.symbol}
              data={asset}
              onClick={() => onAssetSelect(asset)}
            />
          ))}
        </div>

        <AnimatePresence>
          {expanded && expandedItems.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pt-4">
                {expandedItems.map((asset) => (
                  <motion.div
                    key={asset.symbol}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MarketCard
                      data={asset}
                      onClick={() => onAssetSelect(asset)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 