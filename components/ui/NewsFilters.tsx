import React from 'react';
import { NewsCategory } from '@/lib/news-service';
import { ImpactLevel } from '@/lib/news-impact';

interface NewsFiltersProps {
  selectedCategories: NewsCategory[];
  selectedImpacts: ImpactLevel[];
  onCategoryChange: (categories: NewsCategory[]) => void;
  onImpactChange: (impacts: ImpactLevel[]) => void;
}

const CATEGORY_COLORS: Record<NewsCategory, { bg: string; text: string; border: string }> = {
  crypto: { bg: 'bg-violet-100 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
  forex: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  commodities: { bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  stocks: { bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  markets: { bg: 'bg-indigo-100 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  economy: { bg: 'bg-rose-100 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
  general: { bg: 'bg-gray-100 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-800' },
};

const IMPACT_COLORS: Record<ImpactLevel, { bg: string; text: string; border: string }> = {
  high: { 
    bg: 'bg-red-100 dark:bg-red-900/20', 
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800'
  },
  medium: { 
    bg: 'bg-yellow-100 dark:bg-yellow-900/20', 
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800'
  },
  low: { 
    bg: 'bg-blue-100 dark:bg-blue-900/20', 
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800'
  },
};

const CATEGORIES: NewsCategory[] = ['markets', 'economy', 'crypto', 'forex', 'commodities', 'stocks', 'general'];
const IMPACTS: ImpactLevel[] = ['high', 'medium', 'low'];

export default function NewsFilters({ 
  selectedCategories, 
  selectedImpacts,
  onCategoryChange, 
  onImpactChange 
}: NewsFiltersProps) {
  const toggleCategory = (category: NewsCategory) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  const toggleImpact = (impact: ImpactLevel) => {
    if (selectedImpacts.includes(impact)) {
      onImpactChange(selectedImpacts.filter(i => i !== impact));
    } else {
      onImpactChange([...selectedImpacts, impact]);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(category => {
            const isSelected = selectedCategories.includes(category);
            const colors = CATEGORY_COLORS[category];
            
            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`
                  px-4 py-2 rounded-lg border transition-all
                  ${isSelected ? colors.bg + ' ' + colors.border + ' ' + colors.text : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}
                  hover:shadow-md
                `}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Impact Level</h3>
        <div className="flex flex-wrap gap-2">
          {IMPACTS.map(impact => {
            const isSelected = selectedImpacts.includes(impact);
            const colors = IMPACT_COLORS[impact];
            
            return (
              <button
                key={impact}
                onClick={() => toggleImpact(impact)}
                className={`
                  px-4 py-2 rounded-lg border transition-all
                  ${isSelected ? colors.bg + ' ' + colors.border + ' ' + colors.text : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}
                  hover:shadow-md
                `}
              >
                {impact.toUpperCase()} IMPACT
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
} 