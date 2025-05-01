import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import yahooFinance from 'yahoo-finance2';
import { MarketData, MarketSegmentData } from '@/lib/yahoo-finance';

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

// Helper function to extract price from quote data
function extractPrice(quote: any, category: string): number {
  if (!quote) return 0;

  // Log all available price-related fields
  const priceFields = {
    regularMarketPrice: quote.regularMarketPrice,
    currentPrice: quote.currentPrice,
    regularMarketOpen: quote.regularMarketOpen,
    ask: quote.ask,
    bid: quote.bid,
    postMarketPrice: quote.postMarketPrice,
    preMarketPrice: quote.preMarketPrice,
  };
  
  console.log(`Available price fields for ${quote.symbol}:`, priceFields);

  // Try different price fields based on category
  if (category === 'crypto' || category === 'commodities') {
    // For crypto and commodities, try currentPrice first
    if (typeof quote.currentPrice === 'number' && quote.currentPrice > 0) {
      console.log(`Using currentPrice for ${quote.symbol}: ${quote.currentPrice}`);
      return quote.currentPrice;
    }
    // Then try regularMarketPrice
    if (typeof quote.regularMarketPrice === 'number' && quote.regularMarketPrice > 0) {
      console.log(`Using regularMarketPrice for ${quote.symbol}: ${quote.regularMarketPrice}`);
      return quote.regularMarketPrice;
    }
    // Finally try ask/bid
    if (typeof quote.ask === 'number' && quote.ask > 0) {
      console.log(`Using ask price for ${quote.symbol}: ${quote.ask}`);
      return quote.ask;
    }
    if (typeof quote.bid === 'number' && quote.bid > 0) {
      console.log(`Using bid price for ${quote.symbol}: ${quote.bid}`);
      return quote.bid;
    }
  }

  // Default to regularMarketPrice for other categories
  if (typeof quote.regularMarketPrice === 'number' && quote.regularMarketPrice > 0) {
    console.log(`Using regularMarketPrice for ${quote.symbol}: ${quote.regularMarketPrice}`);
    return quote.regularMarketPrice;
  }

  console.log(`No valid price found for ${quote.symbol}, returning 0`);
  return 0;
}

export async function GET(request: Request) {
  try {
    // Verify the request is from our cron job
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Initialize empty market data structure
    const marketData: MarketSegmentData = {
      stocks: [],
      indices: [],
      commodities: [],
      crypto: [],
      forex: [],
      funds: []
    };

    // Process each category
    const categories = Object.keys(MARKET_SYMBOLS) as Array<keyof typeof MARKET_SYMBOLS>;
    
    for (const category of categories) {
      const type = getMarketType(category);
      const symbols = MARKET_SYMBOLS[category];
      
      // Process symbols one at a time for better error tracking
      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        
        try {
          console.log(`Fetching quote for ${category} symbol: ${symbol}`);
          
          // Get all available fields for the quote
          const quote = await yahooFinance.quote(symbol);
          console.log(`Raw quote data for ${symbol}:`, JSON.stringify(quote, null, 2));

          const price = extractPrice(quote, category);
          
          const processedQuote: MarketData = {
            symbol: quote.symbol,
            name: category === 'commodities' ? COMMODITY_NAMES[symbol] || quote.shortName || quote.longName || symbol : quote.shortName || quote.longName || symbol,
            price: price,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            volume: quote.regularMarketVolume || 0,
            marketCap: quote.marketCap || 0,
            dayHigh: quote.regularMarketDayHigh || 0,
            dayLow: quote.regularMarketDayLow || 0,
            type
          };

          console.log(`Processed quote for ${symbol}:`, processedQuote);
          marketData[category].push(processedQuote);

        } catch (error) {
          console.error(`Error fetching quote for ${symbol}:`, error);
          // Add placeholder data for failed symbol
          marketData[category].push({
            symbol,
            name: category === 'commodities' ? COMMODITY_NAMES[symbol] || symbol : symbol,
            price: 0,
            change: 0,
            changePercent: 0,
            volume: 0,
            marketCap: 0,
            dayHigh: 0,
            dayLow: 0,
            type,
            error: true
          });
        }
      }
    }

    // Store the updated data in Supabase
    const { error } = await supabase
      .from('market_data')
      .upsert({
        id: 1,
        data: marketData,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing market data:', error);
      return NextResponse.json({ error: 'Failed to store market data' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Market data updated successfully',
      count: Object.values(marketData).flat().length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in market data update:', error);
    return NextResponse.json(
      { error: 'Failed to update market data' },
      { status: 500 }
    );
  }
}