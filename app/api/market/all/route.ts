import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
import { MarketData, MarketSegmentData, getAssetType, getSegmentKey } from '@/lib/yahoo-finance';
import { supabaseAdmin } from '@/src/lib/supabase-admin';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
  high_24h: number;
  low_24h: number;
}

interface CategorizedAsset extends Asset {
  type: MarketData['type'];
  formattedSymbol: string;
}

const BATCH_SIZE = 10; // Process symbols in batches of 10

// Add a retry mechanism for failed assets
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// List of problematic symbols that need special handling
const PROBLEMATIC_SYMBOLS = new Set([
  'XLM', 'WBTC', 'USDC', 'USDJPY', 'USDCAD', 'USDCHF', 'ZW',
  'GC=F', 'SI=F', 'ZC=F'
]);

// Whitelist of valid Yahoo Finance commodity symbols
const VALID_COMMODITY_SYMBOLS = [
  'GC=F', 'SI=F', 'CL=F', 'NG=F', 'HG=F', 'ZC=F', 'ZW=F', 'ZS=F', 'PA=F',
  'PL=F', 'KC=F', 'CC=F', 'CT=F', 'LBS=F', 'SB=F'
];

// Helper function to format symbol for Yahoo Finance API
function formatSymbolForYahoo(symbol: string, type: string): string {
  // Remove any existing suffixes first
  const cleanSymbol = symbol.replace(/[-=].*$/, '');
  
  switch (type) {
    case 'commodity':
      // If the symbol already has =F suffix, keep it
      if (symbol.endsWith('=F')) {
        return symbol;
      }
      return `${cleanSymbol}=F`;
    case 'forex':
      return `${cleanSymbol}=X`;
    case 'crypto':
      return `${cleanSymbol}-USD`;
    case 'index':
      return symbol.startsWith('^') ? symbol : `^${cleanSymbol}`;
    case 'fund':
      return cleanSymbol;
    default:
      return cleanSymbol;
  }
}

// Helper function to get possible symbol formats
function getSymbolFormats(symbol: string, type: string): string[] {
  const cleanSymbol = symbol.replace(/[-=].*$/, '');
  
  // Always return the properly formatted symbol based on type
  switch (type) {
    case 'forex':
      return [`${cleanSymbol}=X`];
    case 'crypto':
      return [`${cleanSymbol}-USD`];
    case 'commodity':
      return [`${cleanSymbol}=F`];
    case 'index':
      return [symbol.startsWith('^') ? symbol : `^${cleanSymbol}`];
    default:
      return [cleanSymbol]; // For stocks and funds, use clean symbol
  }
}

// Update the fetchQuoteWithRetry function
async function fetchQuoteWithRetry(symbol: string, type: string, retries = MAX_RETRIES): Promise<any> {
  try {
    const formattedSymbol = getSymbolFormats(symbol, type)[0]; // Always use properly formatted symbol
    const quote = await yahooFinance.quote(formattedSymbol);
    
    if (!quote || typeof quote !== 'object') {
      throw new Error(`Invalid quote structure for ${symbol}`);
    }
    return quote;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying ${symbol} (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchQuoteWithRetry(symbol, type, retries - 1);
    } else {
      if (error instanceof Error) {
        if (error.message.includes('Yahoo Schema validation')) {
          console.warn(`Yahoo Finance validation error for ${symbol}:`, error.message);
        } else {
          console.error(`Failed to fetch quote for ${symbol} after ${MAX_RETRIES} retries:`, error);
        }
      }
      throw error;
    }
  }
}

export async function GET() {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    // Fetch all assets from Supabase
    const { data: assets, error } = await supabaseAdmin
      .from('assets')
      .select('id, symbol, name, current_price, price_change_percentage_24h, market_cap, total_volume, high_24h, low_24h')
      .returns<Asset[]>();

    if (error) {
      console.error('Error fetching assets from Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assets from database' },
        { status: 500 }
      );
    }

    if (!assets || assets.length === 0) {
      return NextResponse.json(
        { error: 'No assets found in database' },
        { status: 404 }
      );
    }

    // Group assets by type
    const marketData: MarketSegmentData = {
      stocks: [],
      indices: [],
      commodities: [],
      crypto: [],
      forex: [],
      funds: []
    };

    // Process symbols in batches
    const failedSymbols: { symbol: string; error: string }[] = [];
    const quotesMap = new Map();

    // First, categorize all assets and ensure proper formatting
    const categorizedAssets = assets.map(asset => {
      const type = getAssetType(asset.symbol);
      const formattedSymbol = getSymbolFormats(asset.symbol, type)[0]; // Always use properly formatted symbol
      return { ...asset, type, formattedSymbol };
    });

    // Group assets by type for batch processing
    const assetsByType = {
      stocks: categorizedAssets.filter(a => a.type === 'stock'),
      indices: categorizedAssets.filter(a => a.type === 'index'),
      commodities: categorizedAssets.filter(a => a.type === 'commodity'),
      crypto: categorizedAssets.filter(a => a.type === 'crypto'),
      forex: categorizedAssets.filter(a => a.type === 'forex'),
      funds: categorizedAssets.filter(a => a.type === 'fund')
    };

    // Use the original asset object for commodities
    const dbCommodities = assets.filter(a => getAssetType(a.symbol) === 'commodity');
    marketData.commodities = dbCommodities.map(asset => ({
      symbol: asset.symbol,
      name: asset.name,
      price: asset.current_price,
      change: asset.price_change_24h,
      changePercent: asset.price_change_percentage_24h,
      volume: asset.total_volume,
      marketCap: asset.market_cap,
      type: 'commodity',
      dayHigh: asset.high_24h,
      dayLow: asset.low_24h,
    }));

    // Process each type separately (skip commodities)
    for (const [type, typeAssets] of Object.entries(assetsByType)) {
      if (type === 'commodities' || typeAssets.length === 0) continue;

      console.log(`Processing ${type} with ${typeAssets.length} symbols`);
      const batchSize = 10;
      for (let i = 0; i < typeAssets.length; i += batchSize) {
        const batch = typeAssets.slice(i, i + batchSize);
        console.log(`Processing batch ${i / batchSize + 1} for ${type}:`, batch);
        
        try {
          const quotes = await Promise.all(
            batch.map(async asset => {
              let symbolForYahoo = asset.formattedSymbol;
              try {
                if (asset.type === 'commodity') {
                  // Use the DB symbol directly for Yahoo Finance
                  symbolForYahoo = asset.symbol;
                }
                const quote = await fetchQuoteWithRetry(symbolForYahoo, type);
                if (!quote || !quote.symbol) {
                  console.warn(`Invalid quote structure for ${symbolForYahoo}:`, quote);
                  failedSymbols.push({
                    symbol: symbolForYahoo,
                    error: 'Invalid quote structure'
                  });
                  return null;
                }
                return { quote, asset };
              } catch (error) {
                if (error instanceof Error) {
                  if (error.message.includes('Yahoo Schema validation')) {
                    console.warn(`Skipping ${symbolForYahoo} due to Yahoo Finance validation error`);
                    failedSymbols.push({
                      symbol: symbolForYahoo,
                      error: 'Yahoo Finance validation error'
                    });
                  } else {
                    console.error(`Error fetching quote for ${symbolForYahoo}:`, error);
                    failedSymbols.push({
                      symbol: symbolForYahoo,
                      error: error.message
                    });
                  }
                }
                return null;
              }
            })
          );

          const validQuotes = quotes.filter((q): q is { quote: any; asset: CategorizedAsset } => q !== null);
          
          validQuotes.forEach(({ quote, asset }) => {
            if (quote.regularMarketPrice) {
              const assetData: MarketData = {
                symbol: asset.formattedSymbol, // Use the properly formatted symbol
                name: asset.type === 'commodity' ? asset.name : (quote.longName || quote.shortName || asset.formattedSymbol),
                price: quote.regularMarketPrice,
                change: quote.regularMarketChange,
                changePercent: quote.regularMarketChangePercent,
                volume: quote.regularMarketVolume,
                marketCap: quote.marketCap,
                type: asset.type,
                dayHigh: quote.regularMarketDayHigh,
                dayLow: quote.regularMarketDayLow,
              };
              const segmentKey = getSegmentKey(asset.type);
              marketData[segmentKey].push(assetData);
              quotesMap.set(asset.formattedSymbol, quote);
              console.log(`Successfully processed ${asset.formattedSymbol}`);
            } else {
              console.log(`Failed to process ${asset.formattedSymbol}: Missing regularMarketPrice`);
              failedSymbols.push({
                symbol: asset.formattedSymbol,
                error: 'Missing regularMarketPrice'
              });
            }
          });
        } catch (error) {
          console.error(`Error processing batch for ${type}:`, error);
          batch.forEach(asset => {
            failedSymbols.push({
              symbol: asset.formattedSymbol,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          });
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return NextResponse.json({
      ...marketData,
      failedSymbols: failedSymbols.length > 0 ? failedSymbols : undefined
    });
  } catch (error: any) {
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}