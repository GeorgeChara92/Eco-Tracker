import React, { useEffect, useRef, useState } from 'react';
import { MarketData } from '@/lib/yahoo-finance';
import { FaArrowUp, FaArrowDown, FaBell } from 'react-icons/fa';

interface MarketCardProps {
  data: MarketData;
  onClick: () => void;
  hasActiveAlerts?: boolean;
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
      return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const formatNumber = (value: number | undefined, options: Intl.NumberFormatOptions = {}) => {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
};

const formatPrice = (value: number | undefined) => {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatChange = (value: number | undefined) => {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    signDisplay: 'always',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const AnimatedPrice = ({ value, duration = 500 }: { value: number | undefined, duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const countRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (value === undefined) return;

    // Clear any existing interval
    if (countRef.current) {
      clearInterval(countRef.current);
    }

    const start = displayValue;
    const end = value;
    const steps = 20; // Number of steps in the animation
    const stepValue = (end - start) / steps;
    const stepDuration = duration / steps;

    countRef.current = setInterval(() => {
      setDisplayValue(prev => {
        const next = prev + stepValue;
        if ((stepValue >= 0 && next >= end) || (stepValue < 0 && next <= end)) {
          clearInterval(countRef.current);
          return end;
        }
        return next;
      });
    }, stepDuration);

    return () => {
      if (countRef.current) {
        clearInterval(countRef.current);
      }
    };
  }, [value, duration]);

  return <span className="tabular-nums">{formatPrice(displayValue)}</span>;
};

export default function MarketCard({ data, onClick, hasActiveAlerts = false }: MarketCardProps) {
  const isPositive = (data.change || 0) >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const bgColor = isPositive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20';

  // Debugging: Log the change values and data object
  console.log('MarketCard:', data.symbol, 'change:', data.change, 'changePercent:', data.changePercent, data);

  return (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {data.symbol}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{data.name}</p>
        </div>
        {hasActiveAlerts && (
          <div className="text-blue-500">
            <FaBell className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-3">
        <div className="text-xl font-bold text-gray-900 dark:text-white">
          <AnimatedPrice value={data.price} />
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${getTypeColor(data.type)}`}>
          {data.type === 'commodity' ? 'COM' : 
           data.type === 'crypto' ? 'CRYPT' : 
           data.type}
        </span>
      </div>

      <div className={`flex items-center justify-between p-2 rounded-lg ${bgColor}`}>
        <div className="flex items-center">
          {isPositive ? (
            <FaArrowUp className="w-4 h-4 text-green-500 mr-1" />
          ) : (
            <FaArrowDown className="w-4 h-4 text-red-500 mr-1" />
          )}
          <span className={`text-sm font-medium ${changeColor}`}>
            {formatChange(data.change)} ({formatChange(data.changePercent)}%)
          </span>
        </div>
      </div>
    </div>
  );
} 