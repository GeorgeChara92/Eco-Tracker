import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MarketDataResponse } from '@/lib/yahoo-finance';

export async function GET() {
  try {
    // Fetch all assets from Supabase
    const { data: assets, error } = await supabase
      .from('assets')
      .select('*')
      .order('symbol');

    if (error) {
      console.error('Error fetching assets from Supabase:', error);
      return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
    }

    // Transform the data into the expected format
    const marketData: MarketDataResponse = {
      stocks: [],
      indices: [],
      commodities: [],
      crypto: [],
      forex: [],
      funds: []
    };

    // Group assets by type
    assets.forEach(asset => {
      // Ensure numeric values are properly converted
      const marketAsset = {
        symbol: asset.symbol,
        name: asset.name,
        price: Number(asset.price) || 0,
        change: Number(asset.change) || 0,
        changePercent: Number(asset.change_percent) || 0,
        volume: Number(asset.volume) || 0,
        marketCap: Number(asset.market_cap) || 0,
        dayHigh: Number(asset.day_high) || 0,
        dayLow: Number(asset.day_low) || 0,
        type: asset.type
      };

      // Add to the appropriate category based on type
      switch (asset.type) {
        case 'stock':
          marketData.stocks.push(marketAsset);
          break;
        case 'index':
          marketData.indices.push(marketAsset);
          break;
        case 'commodity':
          marketData.commodities.push(marketAsset);
          break;
        case 'crypto':
          marketData.crypto.push(marketAsset);
          break;
        case 'forex':
          marketData.forex.push(marketAsset);
          break;
        case 'fund':
          marketData.funds.push(marketAsset);
          break;
      }
    });

    return NextResponse.json(marketData);
  } catch (error) {
    console.error('Error in market/supabase route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 