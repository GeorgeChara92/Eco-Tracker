import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../src/lib/supabase-admin';
import yahooFinance from 'yahoo-finance2';

// Define types for our data
interface Asset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  market_cap: number | null;
  market_cap_rank: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  last_updated: string;
  type: string;
}

// Helper function to safely get number values with defaults
function getNumberValue(value: number | undefined, defaultValue: number = 0): number {
  return value ?? defaultValue;
}

// Helper function to get the proper symbol format
function getProperSymbolFormat(symbol: string): string {
  // For commodities, preserve the =F suffix
  if (symbol.endsWith('=F')) {
    return symbol;
  }
  // For forex, preserve the =X suffix
  if (symbol.endsWith('=X')) {
    return symbol;
  }
  // For crypto, preserve the -USD suffix
  if (symbol.endsWith('-USD')) {
    return symbol;
  }
  // For indices, preserve the ^ prefix
  if (symbol.startsWith('^')) {
    return symbol;
  }
  // For everything else, clean the symbol
  return symbol.replace(/[-=].*$/, '');
}

// List of all market symbols by category
const symbols = {
  stocks: [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'WMT',
    'JNJ', 'MA', 'PG', 'HD', 'BAC', 'DIS', 'NFLX', 'ADBE', 'PYPL', 'INTC',
    'CSCO', 'PFE', 'PEP', 'TMO', 'ABT'
  ],
  indices: [
    '^GSPC', '^DJI', '^IXIC', '^FTSE', '^N225', '^HSI', '^STOXX50E', '^AXJO',
    '^BSESN', '^RUT', '^VIX', '^TNX', '^TYX', '^FCHI', '^GDAXI'
  ],
  commodities: [
    'GC=F', 'SI=F', 'CL=F', 'NG=F', 'HG=F', 'ZC=F', 'ZW=F', 'ZS=F', 'PA=F',
    'PL=F', 'KC=F', 'CC=F', 'CT=F', 'LBS=F', 'SB=F'
  ],
  crypto: [
    'BTC-USD', 'ETH-USD', 'BNB-USD', 'SOL-USD', 'XRP-USD', 'USDC-USD', 'USDT-USD',
    'ADA-USD', 'AVAX-USD', 'DOGE-USD', 'DOT-USD', 'LINK-USD', 'MATIC-USD', 'SHIB-USD',
    'TRX-USD', 'UNI-USD', 'WBTC-USD', 'LTC-USD', 'ATOM-USD', 'XLM-USD'
  ],
  forex: [
    'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'AUDUSD=X', 'USDCAD=X', 'USDCHF=X',
    'NZDUSD=X', 'EURGBP=X', 'EURJPY=X', 'GBPJPY=X', 'EURCAD=X', 'AUDJPY=X',
    'AUDNZD=X', 'CADJPY=X', 'EURAUD=X'
  ],
  funds: [
    'SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'VOO', 'VEA', 'VWO', 'BND', 'GLD',
    'SLV', 'USO', 'UNG', 'ARKK', 'ARKW'
  ]
};

// Static mapping for commodity names
const COMMODITY_NAMES: { [key: string]: string } = {
  'GC=F': 'Gold',
  'SI=F': 'Silver',
  'CL=F': 'Crude Oil',
  'NG=F': 'Natural Gas',
  'HG=F': 'Copper',
  'ZC=F': 'Corn',
  'ZW=F': 'Wheat',
  'ZS=F': 'Soybeans',
  'PA=F': 'Palladium',
  'PL=F': 'Platinum',
  'KC=F': 'Coffee',
  'CC=F': 'Cocoa',
  'CT=F': 'Cotton',
  'LBS=F': 'Lumber',
  'SB=F': 'Sugar'
};

export async function GET() {
  try {
    console.log('Starting automatic assets update...');

    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return NextResponse.json(
        { error: 'Supabase admin client not initialized', details: 'Check environment variables and client configuration' },
        { status: 500 }
      );
    }

    // First, fetch existing assets to get their IDs
    const { data: existingAssets, error: fetchError } = await supabaseAdmin
      .from('assets')
      .select('id, symbol');

    if (fetchError) {
      console.error('Error fetching existing assets:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch existing assets', details: fetchError.message },
        { status: 500 }
      );
    }

    // Create a map of symbol to id for existing assets
    const symbolToIdMap = new Map(
      (existingAssets as Asset[])?.map(asset => [asset.symbol.toLowerCase(), asset.id]) || []
    );

    const allAssets: Asset[] = [];
    const failedSymbols: { symbol: string; error: string }[] = [];
    
    // Process each category
    for (const [category, categorySymbols] of Object.entries(symbols)) {
      console.log(`Processing ${category}...`);
      
      for (const symbol of categorySymbols) {
        try {
          console.log(`Fetching data for ${symbol}...`);
          const quote = await yahooFinance.quote(symbol);
          
          if (!quote) {
            throw new Error('No quote data received');
          }

          const properSymbol = getProperSymbolFormat(symbol);
          const cleanSymbol = properSymbol.replace(/[-=].*$/, '');
          let assetId = symbolToIdMap.get(cleanSymbol.toLowerCase()) || cleanSymbol.toLowerCase();
          let assetName = quote.shortName || quote.longName || cleanSymbol;
          // For commodities, use static mapping for name and symbol/id
          if (category === 'commodities') {
            assetName = COMMODITY_NAMES[properSymbol] || assetName;
            assetId = properSymbol;
          }
          const asset: Asset = {
            id: assetId,
            name: assetName,
            symbol: properSymbol,  // Use the properly formatted symbol
            current_price: getNumberValue(quote.regularMarketPrice),
            price_change_percentage_24h: getNumberValue(quote.regularMarketChangePercent),
            image: `https://storage.googleapis.com/iex/api/logos/${cleanSymbol}.png`,
            market_cap: quote.marketCap ?? null,
            market_cap_rank: null,
            total_volume: getNumberValue(quote.regularMarketVolume),
            high_24h: getNumberValue(quote.regularMarketDayHigh),
            low_24h: getNumberValue(quote.regularMarketDayLow),
            price_change_24h: getNumberValue(quote.regularMarketChange),
            last_updated: new Date().toISOString(),
            type: category
          };

          // Validate required fields
          if (!asset.current_price || !asset.symbol) {
            throw new Error('Missing required fields in quote data');
          }

          allAssets.push(asset);
          console.log(`Successfully fetched data for ${symbol}`);
        } catch (error: any) {
          console.error(`Error fetching data for ${symbol}:`, error.message);
          failedSymbols.push({ symbol, error: error.message });
          continue;
        }
        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (allAssets.length === 0) {
      throw new Error('Failed to fetch any asset data');
    }

    console.log(`Successfully fetched data for ${allAssets.length} assets`);
    if (failedSymbols.length > 0) {
      console.log(`Failed to fetch data for ${failedSymbols.length} symbols:`, failedSymbols);
    }

    // Update assets in Supabase
    console.log('Upserting assets to Supabase...');
    const { error: upsertError } = await supabaseAdmin
      .from('assets')
      .upsert(allAssets as unknown as Record<string, unknown>[], { 
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error('Error updating assets:', upsertError);
      return NextResponse.json(
        { 
          error: 'Failed to update assets', 
          details: upsertError.message,
          failedSymbols,
          successfulCount: allAssets.length
        },
        { status: 500 }
      );
    }

    console.log('Assets update completed successfully');

    // Cleanup: Delete non-canonical commodity symbols
    const canonicalCommodities = symbols.commodities;
    const { error: deleteError } = await supabaseAdmin
      .from('assets')
      .delete()
      .neq('symbol', null)
      .eq('type', 'commodity')
      .not('symbol', 'in', `(${canonicalCommodities.map(s => `'${s}'`).join(',')})`);
    if (deleteError) {
      console.error('Error deleting non-canonical commodity assets:', deleteError);
      // Not fatal, but log for review
    }

    return NextResponse.json({
      success: true,
      message: 'Assets table updated successfully',
      totalAssets: allAssets.length,
      failedSymbols,
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error updating assets:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
} 