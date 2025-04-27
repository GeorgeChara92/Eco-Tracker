-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS normalize_asset_symbol_trigger ON assets;
DROP FUNCTION IF EXISTS normalize_asset_symbol();

-- Create the updated function to normalize symbols
CREATE OR REPLACE FUNCTION normalize_asset_symbol()
RETURNS TRIGGER AS $$
DECLARE
  clean_symbol TEXT;
BEGIN
  -- Remove any existing suffixes first
  clean_symbol := REGEXP_REPLACE(NEW.symbol, '[-=].*$', '');
  
  -- Format the symbol based on asset type
  IF NEW.symbol LIKE '%=F' THEN
    -- Already in commodity format
    NULL;
  ELSIF NEW.symbol LIKE '%=X' THEN
    -- Already in forex format
    NULL;
  ELSIF NEW.symbol LIKE '%-USD' THEN
    -- Already in crypto format
    NULL;
  ELSIF NEW.symbol LIKE '^%' THEN
    -- Already in index format
    NULL;
  ELSE
    -- Determine the type based on the symbol
    IF clean_symbol IN ('GC', 'SI', 'CL', 'NG', 'HG', 'PA', 'PL', 'ZC', 'ZW', 'ZS', 'KC', 'CC', 'CT', 'LBS', 'SB') THEN
      NEW.symbol := clean_symbol || '=F';
    ELSIF clean_symbol IN ('EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'NZD', 'INR', 'SGD', 'HKD', 'MXN', 'BRL', 'ZAR', 'RUB') THEN
      NEW.symbol := clean_symbol || '=X';
    ELSIF clean_symbol IN ('BTC', 'ETH', 'USDT', 'BNB', 'XRP', 'ADA', 'DOGE', 'SOL', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'SHIB', 'TRX', 'WBTC', 'LTC', 'ATOM', 'XLM') THEN
      NEW.symbol := clean_symbol || '-USD';
    ELSIF clean_symbol IN ('GSPC', 'DJI', 'IXIC', 'FTSE', 'N225', 'HSI', 'STOXX50E', 'AXJO', 'BSESN', 'RUT', 'VIX', 'TNX', 'TYX', 'FCHI', 'GDAXI') THEN
      NEW.symbol := '^' || clean_symbol;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER normalize_asset_symbol_trigger
  BEFORE INSERT OR UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION normalize_asset_symbol();

-- Update existing unformatted symbols
UPDATE assets
SET symbol = CASE
  WHEN symbol IN ('GC', 'SI', 'CL', 'NG', 'HG', 'PA', 'PL', 'ZC', 'ZW', 'ZS', 'KC', 'CC', 'CT', 'LBS', 'SB') THEN symbol || '=F'
  WHEN symbol IN ('EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'NZD', 'INR', 'SGD', 'HKD', 'MXN', 'BRL', 'ZAR', 'RUB') THEN symbol || '=X'
  WHEN symbol IN ('BTC', 'ETH', 'USDT', 'BNB', 'XRP', 'ADA', 'DOGE', 'SOL', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'SHIB', 'TRX', 'WBTC', 'LTC', 'ATOM', 'XLM') THEN symbol || '-USD'
  WHEN symbol IN ('GSPC', 'DJI', 'IXIC', 'FTSE', 'N225', 'HSI', 'STOXX50E', 'AXJO', 'BSESN', 'RUT', 'VIX', 'TNX', 'TYX', 'FCHI', 'GDAXI') THEN '^' || symbol
  ELSE symbol
END
WHERE symbol NOT LIKE '%=F'
  AND symbol NOT LIKE '%=X'
  AND symbol NOT LIKE '%-USD'
  AND symbol NOT LIKE '^%'; 