-- Create a temporary table to store the assets we want to keep
CREATE TEMP TABLE assets_to_keep AS
WITH ranked_assets AS (
  SELECT 
    id,
    symbol,
    name,
    ROW_NUMBER() OVER (
      PARTITION BY REGEXP_REPLACE(symbol, '[-=].*$', '')
      ORDER BY 
        CASE 
          WHEN symbol LIKE '%=F' THEN 1  -- Keep commodity format
          WHEN symbol LIKE '%=X' THEN 1  -- Keep forex format
          WHEN symbol LIKE '%-USD' THEN 1 -- Keep crypto format
          WHEN symbol LIKE '^%' THEN 1   -- Keep index format
          ELSE 2                         -- Lower priority for other formats
        END,
        created_at DESC                  -- If same priority, keep the newest
    ) as rn
  FROM assets
)
SELECT id
FROM ranked_assets
WHERE rn = 1;

-- Delete all assets that are not in our keep list
DELETE FROM assets
WHERE id NOT IN (SELECT id FROM assets_to_keep);

-- Drop the temporary table
DROP TABLE assets_to_keep;

-- Add a unique constraint on the normalized symbol to prevent future duplicates
ALTER TABLE assets ADD CONSTRAINT unique_normalized_symbol 
  UNIQUE (REGEXP_REPLACE(symbol, '[-=].*$', ''));

-- Create a function to normalize symbols before insert/update
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

-- Create a trigger to normalize symbols before insert/update
CREATE TRIGGER normalize_asset_symbol_trigger
  BEFORE INSERT OR UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION normalize_asset_symbol(); 