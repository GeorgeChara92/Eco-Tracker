import axios from 'axios';

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'stock' | 'index' | 'commodity' | 'crypto' | 'forex' | 'fund';
  volume?: number;
  marketCap?: number;
  dayHigh?: number;
  dayLow?: number;
  error?: boolean;
}

export interface MarketDataResponse {
  stocks: MarketData[];
  indices: MarketData[];
  commodities: MarketData[];
  crypto: MarketData[];
  forex: MarketData[];
  funds: MarketData[];
}

export const marketSymbols = {
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

export interface MarketSegmentData {
  stocks: MarketData[];
  indices: MarketData[];
  commodities: MarketData[];
  crypto: MarketData[];
  forex: MarketData[];
  funds: MarketData[];
}

export interface YahooFinanceQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  marketCap: number;
}

// TradingView symbol mappings
type SymbolMappings = {
  [key: string]: string;
};

type TradingViewSymbols = {
  indices: SymbolMappings;
  commodities: SymbolMappings;
  forex: SymbolMappings;
  crypto: SymbolMappings;
  funds: SymbolMappings;
};

const TRADINGVIEW_SYMBOLS: TradingViewSymbols = {
  indices: {
    '^GSPC': 'SPX',
    '^DJI': 'DJI',
    '^IXIC': 'IXIC',
    '^FTSE': 'UKX',
    '^N225': 'JP225',
    '^GDAXI': 'DEU40',
    '^FCHI': 'FRA40',
    '^HSI': 'HSI',
    '^AXJO': 'AUS200'
  },
  commodities: {
    'GC=F': 'XAUUSD',
    'SI=F': 'XAGUSD',
    'CL=F': 'USOIL',
    'NG=F': 'NATURALGAS',
    'ZC=F': 'CORN',
    'HG=F': 'COPPER',
    'PA=F': 'XPDUSD',
    'PL=F': 'XPTUSD',
    'ZS=F': 'SOYBEAN',
    'KC=F': 'COFFEE'
  },
  forex: {
    'EUR=X': 'EURUSD',
    'GBP=X': 'GBPUSD',
    'JPY=X': 'USDJPY',
    'AUD=X': 'AUDUSD',
    'CAD=X': 'USDCAD',
    'CHF=X': 'USDCHF',
    'CNY=X': 'USDCNH',
    'NZD=X': 'USDNZD',
    'INR=X': 'USDINR'
  },
  crypto: {
    'BTC-USD': 'BTCUSD',
    'ETH-USD': 'ETHUSD',
    'USDT-USD': 'USDTUSD',
    'BNB-USD': 'BNBUSD',
    'XRP-USD': 'XRPUSD',
    'ADA-USD': 'ADAUSD',
    'DOGE-USD': 'DOGEUSD',
    'SOL-USD': 'SOLUSD'
  },
  funds: {
    'SPY': 'SPY',
    'QQQ': 'QQQ',
    'IWM': 'IWM',
    'EFA': 'EFA',
    'VTI': 'VTI',
    'AGG': 'AGG',
    'VWO': 'VWO',
    'BND': 'BND',
    'VEA': 'VEA',
    'GLD': 'GLD'
  }
};

export const getTradingViewSymbol = (symbol: string, type: MarketData['type']): string => {
  // For commodities, we want to keep the =F suffix for mapping
  const cleanSymbol = type === 'commodity' ? symbol : symbol.replace(/[=F]$/, '');

  // Get the appropriate mapping based on asset type
  const mapping = type === 'stock' ? null : 
                 type === 'commodity' ? TRADINGVIEW_SYMBOLS.commodities :
                 type === 'fund' ? TRADINGVIEW_SYMBOLS.funds :
                 TRADINGVIEW_SYMBOLS[type === 'index' ? 'indices' : type];
  
  if (mapping && mapping[cleanSymbol]) {
    return mapping[cleanSymbol];
  }

  // Default handling for unknown symbols
  switch (type) {
    case 'forex':
      return cleanSymbol.replace('=X', '');
    case 'crypto':
      return `BINANCE:${cleanSymbol.replace('-USD', '')}USDT`;
    case 'stock':
      return cleanSymbol;
    default:
      return cleanSymbol;
  }
};

export const getAssetType = (symbol: string): MarketData['type'] => {
  // Define fund symbols array
  const fundSymbols = ['SPY', 'QQQ', 'IWM', 'EFA', 'VTI', 'AGG', 'VWO', 'BND', 'VEA', 'GLD', 'IVV', 'VOO', 'DIA', 'XLK', 'XLF', 'XLE', 'XLV', 'XLI', 'XLP', 'XLY', 'XLB', 'XLU'];
  
  // Define forex pairs
  const forexPairs = ['EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'NZD', 'INR', 'SGD', 'HKD', 'MXN', 'BRL', 'ZAR', 'RUB'];
  
  // Define commodity symbols
  const commoditySymbols = ['GC', 'SI', 'CL', 'NG', 'ZC', 'HG', 'PA', 'PL', 'ZS', 'KC', 'CT', 'LBS', 'CC', 'SB'];
  
  // Define crypto symbols
  const cryptoSymbols = ['BTC', 'ETH', 'USDT', 'BNB', 'XRP', 'ADA', 'DOGE', 'SOL', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'SHIB'];

  // Check for funds first
  if (fundSymbols.includes(symbol)) return 'fund';
  
  // Check for forex
  if (symbol.endsWith('=X') || forexPairs.some(pair => symbol.startsWith(pair))) return 'forex';
  
  // Check for crypto
  if (symbol.endsWith('-USD') || cryptoSymbols.some(crypto => symbol.startsWith(crypto))) return 'crypto';
  
  // Check for indices
  if (symbol.startsWith('^')) return 'index';
  
  // Check for commodities
  if (symbol.includes('=F') || commoditySymbols.some(commodity => symbol.startsWith(commodity))) return 'commodity';
  
  // Default to stock
  return 'stock';
};

// Helper function to convert asset type to segment key
export const getSegmentKey = (type: MarketData['type']): keyof MarketSegmentData => {
  switch (type) {
    case 'index': return 'indices';
    case 'stock': return 'stocks';
    case 'commodity': return 'commodities';
    case 'crypto': return 'crypto';
    case 'forex': return 'forex';
    case 'fund': return 'funds';
  }
};

// Format a symbol based on its type
export const formatSymbol = (symbol: string, type: MarketData['type']): string => {
  const cleanSymbol = symbol.replace(/[-=].*$/, '').replace(/^\^/, '');
  
  switch (type) {
    case 'forex':
      return `${cleanSymbol}=X`;
    case 'crypto':
      return `${cleanSymbol}-USD`;
    case 'commodity':
      return `${cleanSymbol}=F`;
    case 'index':
      return `^${cleanSymbol}`;
    default:
      return cleanSymbol; // For stocks and funds
  }
};

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

// Get quote data for a symbol
export const getQuote = async (symbol: string, type: MarketData['type']): Promise<MarketData> => {
  try {
    const formattedSymbol = formatSymbol(symbol, type);
    const response = await axios.get(`/api/yahoo?symbol=${encodeURIComponent(formattedSymbol)}&type=${type}`);
    const data = response.data;
    
    // Override name for commodities using our mapping
    if (type === 'commodity' && COMMODITY_NAMES[formattedSymbol]) {
      data.name = COMMODITY_NAMES[formattedSymbol];
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return {
      symbol,
      name: type === 'commodity' ? COMMODITY_NAMES[symbol] || symbol : symbol,
      price: 0,
      change: 0,
      changePercent: 0,
      type,
      error: true
    };
  }
};

// Get multiple quotes
async function getMultipleQuotes(symbols: string[], type: MarketData['type']): Promise<MarketData[]> {
  try {
    const response = await axios.get(`/api/yahoo/batch?symbols=${encodeURIComponent(symbols.join(','))}&type=${type}`);
    const data = response.data;
    
    // Override names for commodities using our mapping
    if (type === 'commodity') {
      data.forEach((item: MarketData) => {
        if (COMMODITY_NAMES[item.symbol]) {
          item.name = COMMODITY_NAMES[item.symbol];
        }
      });
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching multiple quotes:`, error);
    return symbols.map(symbol => ({
      symbol,
      name: type === 'commodity' ? COMMODITY_NAMES[symbol] || symbol : symbol,
      price: 0,
      change: 0,
      changePercent: 0,
      type,
      error: true
    }));
  }
}

// Get all market data
export const getAllMarketData = async (): Promise<MarketDataResponse> => {
  const categories = Object.keys(marketSymbols) as Array<keyof typeof marketSymbols>;
  
  const results = {
    stocks: [] as MarketData[],
    indices: [] as MarketData[],
    commodities: [] as MarketData[],
    crypto: [] as MarketData[],
    forex: [] as MarketData[],
    funds: [] as MarketData[]
  };
  
  for (const category of categories) {
    const type = category.slice(0, -1) as MarketData['type']; // Remove 's' from category name
    const symbols = marketSymbols[category].map(symbol => formatSymbol(symbol, type));
    results[category] = await getMultipleQuotes(symbols, type);
  }
  
  return results;
}; 