import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { formatSymbol } from '@/utils/format';

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  dayHigh: number;
  dayLow: number;
  type: 'stock' | 'crypto' | 'forex' | 'fund' | 'index' | 'commodity';
}

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const type = searchParams.get('type');

  try {
    if (!symbol || !type) {
      return NextResponse.json(
        { error: 'Symbol and type parameters are required' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    if (!supabaseAdmin) {
      console.error('Supabase client not initialized. Check environment variables.');
      // Return a fallback response instead of error
      return NextResponse.json({
        symbol: symbol,
        name: symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        marketCap: 0,
        dayHigh: 0,
        dayLow: 0,
        type: type as MarketData['type'],
        error: true
      }, { headers: noCacheHeaders });
    }

    const formattedSymbol = formatSymbol(symbol, type);

    const { data: asset, error } = await supabaseAdmin
      .from('assets')
      .select('*')
      .eq('symbol', formattedSymbol)
      .single();

    // Debug: Log the asset fetched from the database
    console.log('Fetched asset from DB:', asset);

    if (error) {
      console.error('Database error:', error);
      // Return a fallback response instead of error
      return NextResponse.json({
        symbol: symbol,
        name: symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        marketCap: 0,
        dayHigh: 0,
        dayLow: 0,
        type: type as MarketData['type'],
        error: true
      }, { headers: noCacheHeaders });
    }

    if (!asset) {
      console.log('Asset not found:', formattedSymbol);
      // Return a fallback response instead of error
      return NextResponse.json({
        symbol: symbol,
        name: symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        marketCap: 0,
        dayHigh: 0,
        dayLow: 0,
        type: type as MarketData['type'],
        error: true
      }, { headers: noCacheHeaders });
    }

    const marketData: MarketData = {
      symbol: asset.symbol as string,
      name: asset.name as string,
      price: asset.current_price as number,
      change: typeof asset.price_change_24h === 'number' ? asset.price_change_24h : 0,
      changePercent: (asset.price_change_percentage_24h as number) || 0,
      volume: (asset.total_volume as number) || 0,
      marketCap: (asset.market_cap as number) || 0,
      dayHigh: (asset.high_24h as number) || 0,
      dayLow: (asset.low_24h as number) || 0,
      type: getAssetType(symbol)
    };

    // Debug: Log the constructed marketData object
    console.log('Constructed marketData:', marketData);

    return NextResponse.json(marketData, { headers: noCacheHeaders });
  } catch (error) {
    console.error('Error fetching market data:', error);
    // Return a fallback response instead of error
    return NextResponse.json({
      symbol: symbol || 'unknown',
      name: symbol || 'unknown',
      price: 0,
      change: 0,
      changePercent: 0,
      volume: 0,
      marketCap: 0,
      dayHigh: 0,
      dayLow: 0,
      type: (type as MarketData['type']) || 'stock',
      error: true
    }, { headers: noCacheHeaders });
  }
}

function getAssetType(symbol: string): MarketData['type'] {
  if (symbol.endsWith('.F')) return 'fund';
  if (symbol.endsWith('=X')) return 'forex';
  if (symbol.endsWith('-USD')) return 'crypto';
  if (symbol.startsWith('^')) return 'index';
  if (symbol.includes('=F')) return 'commodity';
  return 'stock';
} 