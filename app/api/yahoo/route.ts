import yahooFinance from 'yahoo-finance2';
import { NextResponse } from 'next/server';

// Commodity name mappings (duplicate from lib/yahoo-finance.ts for API use)
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

type AssetType = 'stock' | 'index' | 'commodity' | 'crypto' | 'forex' | 'fund';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const assetType = searchParams.get('type') as AssetType;
  
  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }
  
  try {
    console.log(`Fetching data for symbol: ${symbol}, type: ${assetType}`);
    const quote = await yahooFinance.quote(symbol);
    console.log('Quote data received:', JSON.stringify(quote, null, 2));
    
    const data = {
      symbol: quote.symbol || symbol,
      name: (assetType === 'commodity' && COMMODITY_NAMES[quote.symbol || symbol])
        ? COMMODITY_NAMES[quote.symbol || symbol]
        : (quote.longName || quote.shortName || symbol),
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      marketCap: quote.marketCap,
      volume: quote.regularMarketVolume,
      dayHigh: quote.regularMarketDayHigh,
      dayLow: quote.regularMarketDayLow,
      assetType: assetType || 'stock'
    };
    
    console.log('Processed data:', JSON.stringify(data, null, 2));
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    console.error('Error details:', error instanceof Error ? error.stack : 'Unknown error');
    return NextResponse.json(
      { 
        error: 'Failed to fetch data',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : 'No stack trace available'
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const symbols = body.symbols;
    
    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json({ error: 'Valid symbols array is required' }, { status: 400 });
    }
    
    console.log('Processing batch request for symbols:', JSON.stringify(symbols, null, 2));
    
    const promises = symbols.map(async (item: {symbol: string, type: AssetType}) => {
      try {
        console.log(`Fetching data for symbol: ${item.symbol}, type: ${item.type}`);
        const quote = await yahooFinance.quote(item.symbol);
        console.log(`Quote data received for ${item.symbol}:`, JSON.stringify(quote, null, 2));
        
        return {
          symbol: quote.symbol || item.symbol,
          name: (item.type === 'commodity' && COMMODITY_NAMES[quote.symbol || item.symbol])
            ? COMMODITY_NAMES[quote.symbol || item.symbol]
            : (quote.longName || quote.shortName || item.symbol),
          price: quote.regularMarketPrice || 0,
          change: quote.regularMarketChange || 0,
          changePercent: quote.regularMarketChangePercent || 0,
          marketCap: quote.marketCap,
          volume: quote.regularMarketVolume,
          dayHigh: quote.regularMarketDayHigh,
          dayLow: quote.regularMarketDayLow,
          assetType: item.type
        };
      } catch (error) {
        console.error(`Error fetching data for ${item.symbol}:`, error);
        console.error('Error details:', error instanceof Error ? error.stack : 'Unknown error');
        return {
          symbol: item.symbol,
          name: item.symbol,
          price: 0,
          change: 0,
          changePercent: 0,
          assetType: item.type,
          error: true
        };
      }
    });
    
    const results = await Promise.all(promises);
    console.log('Batch processing complete. Results:', JSON.stringify(results, null, 2));
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error processing request:', error);
    console.error('Error details:', error instanceof Error ? error.stack : 'Unknown error');
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : 'No stack trace available'
      }, 
      { status: 500 }
    );
  }
} 