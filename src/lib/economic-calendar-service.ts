import { EconomicEvent } from '../lib/types/economic-calendar';

// Cache configuration
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const calendarCache = new Map<string, { data: EconomicEvent[], timestamp: number }>();

const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';
const FRED_SERIES = [
  { id: 'CPIAUCSL', name: 'Consumer Price Index', frequency: 'Monthly' },
  { id: 'UNRATE', name: 'Unemployment Rate', frequency: 'Monthly' },
  { id: 'GDP', name: 'Gross Domestic Product', frequency: 'Quarterly' },
  { id: 'FEDFUNDS', name: 'Federal Funds Rate', frequency: 'Monthly' },
  { id: 'INDPRO', name: 'Industrial Production', frequency: 'Monthly' },
  { id: 'RETAILIMSA', name: 'Retail Sales', frequency: 'Monthly' },
  { id: 'HOUST', name: 'Housing Starts', frequency: 'Monthly' },
  { id: 'PPIFIS', name: 'Producer Price Index', frequency: 'Monthly' }
];

export const fetchEconomicCalendar = async (): Promise<EconomicEvent[]> => {
  try {
    // Check cache first
    const cacheKey = 'economicCalendar';
    const cachedData = calendarCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return cachedData.data;
    }

    const events: EconomicEvent[] = [];
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Fetch data for each economic indicator
    for (const series of FRED_SERIES) {
      const response = await fetch(
        `${FRED_BASE_URL}/series/observations?series_id=${series.id}&realtime_start=${today.toISOString().split('T')[0]}&realtime_end=${nextMonth.toISOString().split('T')[0]}&file_type=json`
      );

      if (!response.ok) {
        console.error(`Failed to fetch ${series.name} data:`, response.statusText);
        continue;
      }

      const data = await response.json();
      
      if (data.observations && data.observations.length > 0) {
        const latestObservation = data.observations[data.observations.length - 1];
        const nextRelease = new Date(latestObservation.date);
        nextRelease.setDate(nextRelease.getDate() + (series.frequency === 'Monthly' ? 30 : 90));

        events.push({
          time: nextRelease.toISOString(),
          currency: 'USD',
          impact: 'high',
          event: series.name,
          actual: latestObservation.value,
          forecast: 'N/A',
          previous: data.observations.length > 1 ? data.observations[data.observations.length - 2].value : 'N/A',
          source: 'FRED'
        });
      }
    }

    // Sort events by time
    events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    // Update cache
    calendarCache.set(cacheKey, {
      data: events,
      timestamp: Date.now()
    });

    return events;
  } catch (error) {
    console.error('Error fetching economic calendar:', error);
    return [];
  }
}; 