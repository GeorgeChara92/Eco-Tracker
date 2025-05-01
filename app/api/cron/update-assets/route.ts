import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import yahooFinance from 'yahoo-finance2';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Market symbols configuration
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

// Helper functions
function getMarketType(category: keyof typeof MARKET_SYMBOLS) {
  switch (category) {
    case 'stocks': return 'stock';
    case 'indices': return 'index';
    case 'commodities': return 'commodity';
    case 'crypto': return 'crypto';
    case 'forex': return 'forex';
    case 'funds': return 'fund';
    default: return 'stock';
  }
}

// Verify the cron secret
function isAuthorized(req: Request) {
  const headersList = headers();
  const authHeader = headersList.get('authorization');
  if (!authHeader) return false;
  
  const token = authHeader.split(' ')[1];
  return token === process.env.CRON_SECRET;
}

// Helper function to get base URL
function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
}

export async function GET(req: Request) {
  console.log('Starting assets update...');
  
  // Verify authorization
  if (!isAuthorized(req)) {
    console.error('Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const baseUrl = getBaseUrl();
    console.log('Using base URL:', baseUrl);

    const timestamp = new Date().toISOString();
    let updatedCount = 0;

    // Process each category
    for (const [category, symbols] of Object.entries(MARKET_SYMBOLS)) {
      const type = getMarketType(category as keyof typeof MARKET_SYMBOLS);
      
      // Process symbols one at a time
      for (const symbol of symbols) {
        try {
          console.log(`Fetching quote for ${category} symbol: ${symbol}`);
          
          const quote = await yahooFinance.quote(symbol);
          
          if (!quote) {
            console.error(`No quote data received for ${symbol}`);
            continue;
          }

          // Extract price from available fields
          let price = quote.regularMarketPrice || 0;
          if ((category === 'crypto' || category === 'commodities') && !price) {
            price = quote.ask || quote.bid || 0;
          }

          const asset = {
            symbol: quote.symbol,
            name: quote.shortName || quote.longName || symbol,
            type,
            price,
            change: quote.regularMarketChange || 0,
            change_percent: quote.regularMarketChangePercent || 0,
            volume: quote.regularMarketVolume || 0,
            market_cap: quote.marketCap || 0,
            day_high: quote.regularMarketDayHigh || 0,
            day_low: quote.regularMarketDayLow || 0,
            last_updated: timestamp
          };

          // Update or insert the asset in Supabase
          const { error } = await supabase
            .from('assets')
            .upsert(asset, {
              onConflict: 'symbol'
            });

          if (error) {
            console.error(`Error updating ${symbol}:`, error);
          } else {
            updatedCount++;
            console.log(`Successfully updated ${symbol}`);
          }
        } catch (error) {
          console.error(`Error processing ${symbol}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Assets updated successfully',
      count: updatedCount,
      timestamp
    });

  } catch (error) {
    console.error('Error updating assets:', error);
    return NextResponse.json({
      error: 'Failed to update assets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}