export interface EconomicEvent {
  time: string;
  currency: string;
  impact: 'low' | 'medium' | 'high';
  event: string;
  actual: string;
  forecast: string;
  previous: string;
  source: string;
}

export interface EconomicCalendarFilters {
  currency?: string;
  impact?: 'low' | 'medium' | 'high';
  timeframe?: 'today' | 'week' | 'month';
} 