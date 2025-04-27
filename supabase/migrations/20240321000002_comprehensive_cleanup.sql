-- First, create a temporary table to store properly formatted symbols
CREATE TEMP TABLE formatted_assets AS
WITH cleaned_symbols AS (
  SELECT 
    id,
    CASE
      -- Commodities
      WHEN symbol IN ('GC', 'SI', 'CL', 'NG', 'HG', 'PA', 'PL', 'ZC', 'ZW', 'ZS', 'KC', 'CC', 'CT', 'LBS', 'SB') 
        OR symbol LIKE '%=F' THEN REGEXP_REPLACE(symbol, '=F$', '') || '=F'
      -- Forex
      WHEN symbol IN ('EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'NZD', 'INR', 'SGD', 'HKD', 'MXN', 'BRL', 'ZAR', 'RUB') 
        OR symbol LIKE '%=X' THEN REGEXP_REPLACE(symbol, '=X$', '') || '=X'
      -- Crypto
      WHEN symbol IN ('BTC', 'ETH', 'USDT', 'BNB', 'XRP', 'ADA', 'DOGE', 'SOL', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'SHIB', 'TRX', 'WBTC', 'LTC', 'ATOM', 'XLM') 
        OR symbol LIKE '%-USD' THEN REGEXP_REPLACE(symbol, '-USD$', '') || '-USD'
      -- Indices
      WHEN symbol IN ('GSPC', 'DJI', 'IXIC', 'FTSE', 'N225', 'HSI', 'STOXX50E', 'AXJO', 'BSESN', 'RUT', 'VIX', 'TNX', 'TYX', 'FCHI', 'GDAXI') 
        OR symbol LIKE '^%' THEN '^' || REGEXP_REPLACE(symbol, '^\^', '')
      -- Stocks and funds (keep as is)
      ELSE symbol
    END as formatted_symbol,
    name,
    current_price,
    price_change_percentage_24h,
    market_cap,
    market_cap_rank,
    total_volume,
    high_24h,
    low_24h,
    price_change_24h,
    last_updated,
    created_at,
    updated_at
  FROM assets
),
ranked_assets AS (
  SELECT 
    *,
    ROW_NUMBER() OVER (
      PARTITION BY REGEXP_REPLACE(formatted_symbol, '[-=].*$', '')
      ORDER BY 
        CASE 
          WHEN formatted_symbol LIKE '%=F' THEN 1  -- Commodity format
          WHEN formatted_symbol LIKE '%=X' THEN 1  -- Forex format
          WHEN formatted_symbol LIKE '%-USD' THEN 1 -- Crypto format
          WHEN formatted_symbol LIKE '^%' THEN 1   -- Index format
          ELSE 2                                   -- Other formats
        END,
        created_at DESC                           -- If same format, keep newest
    ) as rn
  FROM cleaned_symbols
)
SELECT 
  id,
  formatted_symbol as symbol,
  name,
  current_price,
  price_change_percentage_24h,
  market_cap,
  market_cap_rank,
  total_volume,
  high_24h,
  low_24h,
  price_change_24h,
  last_updated,
  created_at,
  updated_at
FROM ranked_assets
WHERE rn = 1;

-- Create a mapping table for asset IDs
CREATE TEMP TABLE asset_id_mapping AS
SELECT 
  a.id as old_id,
  f.id as new_id
FROM assets a
JOIN formatted_assets f ON REGEXP_REPLACE(a.symbol, '[-=].*$', '') = REGEXP_REPLACE(f.symbol, '[-=].*$', '');

-- Drop existing constraints and columns
ALTER TABLE assets DROP CONSTRAINT IF EXISTS unique_normalized_symbol;
ALTER TABLE assets DROP COLUMN IF EXISTS normalized_symbol;

-- Create a backup of alerts
CREATE TEMP TABLE alerts_backup AS
SELECT * FROM alerts;

-- Drop foreign key constraints temporarily
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_asset_id_fkey;

-- Clear the assets table
TRUNCATE TABLE assets CASCADE;

-- Add the normalized_symbol column
ALTER TABLE assets ADD COLUMN normalized_symbol TEXT GENERATED ALWAYS AS (REGEXP_REPLACE(symbol, '[-=].*$', '')) STORED;

-- Insert the cleaned and formatted data
INSERT INTO assets (
  id, symbol, name, current_price, price_change_percentage_24h,
  market_cap, market_cap_rank, total_volume, high_24h, low_24h,
  price_change_24h, last_updated, created_at, updated_at
)
SELECT 
  id, symbol, name, current_price, price_change_percentage_24h,
  market_cap, market_cap_rank, total_volume, high_24h, low_24h,
  price_change_24h, last_updated, created_at, updated_at
FROM formatted_assets;

-- Restore alerts with updated asset IDs
INSERT INTO alerts (
  id, user_id, asset_id, alert_type, condition, value, is_active, created_at, updated_at
)
SELECT 
  a.id,
  a.user_id,
  m.new_id as asset_id,
  a.alert_type,
  a.condition,
  a.value,
  a.is_active,
  a.created_at,
  a.updated_at
FROM alerts_backup a
JOIN asset_id_mapping m ON a.asset_id = m.old_id;

-- Drop the temporary tables
DROP TABLE formatted_assets;
DROP TABLE asset_id_mapping;
DROP TABLE alerts_backup;

-- Add unique constraint on the normalized symbol
ALTER TABLE assets ADD CONSTRAINT unique_normalized_symbol UNIQUE (normalized_symbol);

-- Restore foreign key constraint
ALTER TABLE alerts ADD CONSTRAINT alerts_asset_id_fkey 
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE;

-- Create or replace the trigger function
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
DROP TRIGGER IF EXISTS normalize_asset_symbol_trigger ON assets;
CREATE TRIGGER normalize_asset_symbol_trigger
  BEFORE INSERT OR UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION normalize_asset_symbol(); 