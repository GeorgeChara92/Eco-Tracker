import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import yahooFinance from 'yahoo-finance2';
import { MarketData } from '@/lib/yahoo-finance';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Define market symbols with proper Yahoo Finance formatting
const MARKET_SYMBOLS = {
  stocks: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'WMT',
           'JNJ', 'MA', 'PG', 'HD', 'BAC', 'DIS', 'NFLX', 'ADBE', 'PYPL', 'INTC',
           'CSCO', 'PFE', 'PEP', 'TMO', 'ABT'],
  indices: ['^GSPC', '^DJI', '^IXIC', '^FTSE', '^N225', '^HSI', '^STOXX50E', '^AXJO',
            '^BSESN', '^RUT', '^VIX', '^TNX', '^TYX', '^FCHI', '^GDAXI'],
  commodities: ['GC=F', 'SI=F', 'CL=F', 'NG=F', 'HG=F', 'ZC=F', 'ZW=F', 'ZS=F', 'PA=F',
                'PL=F', 'KC=F', 'CC=F', 'CT=F', 'LBS=F', 'SB=F'],
  crypto: ['BTC-USD', 'ETH-USD', 'BNB-USD', 'SOL-USD', 'XRP-USD', 'USDC-USD', 'USDT-USD',
           'ADA-USD', 'AVAX-USD', 'DOGE-USD', 'DOT-USD', 'LINK-USD', 'MATIC-USD', 'SHIB-USD',
           'TRX-USD', 'UNI-USD', 'WBTC-USD', 'LTC-USD', 'ATOM-USD', 'XLM-USD'],
  forex: ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'AUDUSD=X', 'USDCAD=X', 'USDCHF=X',
          'NZDUSD=X', 'EURGBP=X', 'EURJPY=X', 'GBPJPY=X', 'EURCAD=X', 'AUDJPY=X',
          'AUDNZD=X', 'CADJPY=X', 'EURAUD=X'],
  funds: ['SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'VOO', 'VEA', 'VWO', 'BND', 'GLD',
          'SLV', 'USO', 'UNG', 'ARKK', 'ARKW']
} as const;

// Commodity name mappings
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

// Helper function to get the correct type for the market data
function getMarketType(category: keyof typeof MARKET_SYMBOLS): MarketData['type'] {
  switch (category) {
    case 'stocks':
      return 'stock';
    case 'indices':
      return 'index';
    case 'commodities':
      return 'commodity';
    case 'crypto':
      return 'crypto';
    case 'forex':
      return 'forex';
    case 'funds':
      return 'fund';
    default:
      return 'stock';
  }
}

export async function GET(request: Request) {
  try {
    // Verify the request is from our cron job
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Unauthorized request: No auth header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (token !== process.env.CRON_SECRET) {
      console.error('Unauthorized request: Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('Starting market data update process...');
    let updatedCount = 0;
    const timestamp = new Date().toISOString();

    // Process each category
    const categories = Object.keys(MARKET_SYMBOLS) as Array<keyof typeof MARKET_SYMBOLS>;
    
    for (const category of categories) {
      console.log(`Processing category: ${category}`);
      const type = getMarketType(category);
      const symbols = MARKET_SYMBOLS[category];
      
      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        console.log(`Processing symbol ${i + 1}/${symbols.length}: ${symbol}`);
        
        try {
          const quote = await yahooFinance.quote(symbol);
          
          const asset = {
            symbol: quote.symbol,
            name: category === 'commodities' ? COMMODITY_NAMES[symbol] || quote.shortName || quote.longName || symbol : quote.shortName || quote.longName || symbol,
            type,
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            change_percent: quote.regularMarketChangePercent || 0,
            volume: quote.regularMarketVolume || 0,
            market_cap: quote.marketCap || 0,
            day_high: quote.regularMarketDayHigh || 0,
            day_low: quote.regularMarketDayLow || 0,
            last_updated: timestamp
          };

          console.log(`Updating Supabase for ${symbol}:`, {
            price: asset.price,
            change: asset.change,
            volume: asset.volume
          });

          // Update or insert the asset in Supabase
          const { error } = await supabase
            .from('assets')
            .upsert(asset, {
              onConflict: 'symbol'
            });

          if (error) {
            console.error(`Error updating ${symbol} in Supabase:`, error);
          } else {
            updatedCount++;
            console.log(`Successfully updated ${symbol} in Supabase`);
          }

        } catch (error) {
          console.error(`Error processing ${symbol}:`, error);
        }
      }
    }

    console.log(`Update process completed. Updated ${updatedCount} assets.`);
    return NextResponse.json({
      success: true,
      message: 'Assets updated successfully',
      count: updatedCount,
      timestamp
    });

  } catch (error) {
    console.error('Error in market data update:', error);
    return NextResponse.json(
      { error: 'Failed to update market data' },
      { status: 500 }
    );
  }
}