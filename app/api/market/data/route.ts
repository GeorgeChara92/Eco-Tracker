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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const type = searchParams.get('type');

    if (!symbol || !type) {
      return NextResponse.json(
        { error: 'Symbol and type parameters are required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not initialized' },
        { status: 500 }
      );
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
      return NextResponse.json(
        { error: 'Failed to fetch market data' },
        { status: 500 }
      );
    }

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
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

    return NextResponse.json(marketData);
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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