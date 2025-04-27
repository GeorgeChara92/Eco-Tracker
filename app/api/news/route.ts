import { NextResponse } from 'next/server';
import { fetchAllNews, NewsFilters, NewsCategory } from '@/lib/news-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: NewsFilters = {};
    
    // Parse categories
    const categories = searchParams.get('categories');
    if (categories) {
      filters.categories = categories.split(',') as NewsCategory[];
    }
    
    // Parse sources
    const sources = searchParams.get('sources');
    if (sources) {
      filters.sources = sources.split(',');
    }
    
    // Parse timeframe
    const timeframe = searchParams.get('timeframe');
    if (timeframe && ['today', 'week', 'month', 'all'].includes(timeframe)) {
      filters.timeframe = timeframe as 'today' | 'week' | 'month' | 'all';
    }
    
    // Parse search term
    const searchTerm = searchParams.get('searchTerm');
    if (searchTerm) {
      filters.searchTerm = searchTerm;
    }

    const news = await fetchAllNews(filters);
    
    return NextResponse.json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch news data',
      },
      { status: 500 }
    );
  }
} 