import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../src/lib/supabase-admin';

export async function POST() {
  try {
    console.log('Starting assets population...');

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client not initialized' },
        { status: 500 }
      );
    }

    // List of top cryptocurrency symbols
    const symbols = [
      'BTC-USD', 'ETH-USD', 'BNB-USD', 'SOL-USD', 'XRP-USD',
      'USDC-USD', 'USDT-USD', 'ADA-USD', 'AVAX-USD', 'DOGE-USD',
      'DOT-USD', 'LINK-USD', 'MATIC-USD', 'SHIB-USD', 'TRX-USD',
      'UNI-USD', 'WBTC-USD', 'LTC-USD', 'ATOM-USD', 'XLM-USD'
    ];

    // Fetch assets from Yahoo Finance API
    console.log('Fetching assets from Yahoo Finance...');
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Received data from Yahoo Finance');

    // Transform the data to match our table structure
    const transformedAssets = data.quoteResponse.result.map((item: any) => ({
      id: item.symbol.toLowerCase().replace('-usd', ''),
      name: item.shortName || item.symbol.replace('-USD', ''),
      symbol: item.symbol.replace('-USD', ''),
      current_price: item.regularMarketPrice,
      price_change_percentage_24h: item.regularMarketChangePercent,
      image: `https://storage.googleapis.com/iex/api/logos/${item.symbol.replace('-USD', '')}.png`,
      market_cap: item.marketCap,
      market_cap_rank: null,
      total_volume: item.regularMarketVolume,
      high_24h: item.regularMarketDayHigh,
      low_24h: item.regularMarketDayLow,
      price_change_24h: item.regularMarketChange,
      last_updated: new Date(item.regularMarketTime * 1000).toISOString()
    }));

    console.log(`Transformed ${transformedAssets.length} assets`);

    // Insert or update assets in Supabase
    console.log('Upserting assets to Supabase...');
    const { error: upsertError } = await supabaseAdmin
      .from('assets')
      .upsert(transformedAssets, { 
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error('Error upserting assets:', upsertError);
      return NextResponse.json(
        { error: 'Failed to upsert assets', details: upsertError.message },
        { status: 500 }
      );
    }

    // Verify the data was inserted
    console.log('Verifying inserted data...');
    const { data: insertedAssets, error: fetchError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .order('market_cap', { ascending: false });

    if (fetchError) {
      console.error('Error fetching inserted assets:', fetchError);
      return NextResponse.json(
        { error: 'Failed to verify inserted assets', details: fetchError.message },
        { status: 500 }
      );
    }

    console.log('Assets population completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Assets table populated successfully',
      totalAssets: insertedAssets?.length || 0,
      sampleAsset: insertedAssets?.[0]
    });
  } catch (error) {
    console.error('Error populating assets:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 