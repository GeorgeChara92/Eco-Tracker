-- First, drop the foreign key constraint from alerts
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_asset_id_fkey;

-- Drop existing columns we don't need
ALTER TABLE assets DROP COLUMN IF EXISTS image;
ALTER TABLE assets DROP COLUMN IF EXISTS market_cap_rank;

-- Rename columns to match our new structure
ALTER TABLE assets RENAME COLUMN current_price TO price;
ALTER TABLE assets RENAME COLUMN price_change_24h TO change;
ALTER TABLE assets RENAME COLUMN price_change_percentage_24h TO change_percent;
ALTER TABLE assets RENAME COLUMN total_volume TO volume;
ALTER TABLE assets RENAME COLUMN high_24h TO day_high;
ALTER TABLE assets RENAME COLUMN low_24h TO day_low;

-- Create a temporary table to store alerts data
CREATE TEMP TABLE alerts_backup AS SELECT * FROM alerts;

-- Add symbol column to alerts table
ALTER TABLE alerts ADD COLUMN asset_symbol TEXT;

-- Update asset_symbol in alerts based on assets table
UPDATE alerts a
SET asset_symbol = (SELECT symbol FROM assets WHERE id = a.asset_id);

-- Now we can safely modify the assets table
ALTER TABLE assets DROP CONSTRAINT assets_pkey CASCADE;
ALTER TABLE assets DROP COLUMN IF EXISTS id;
ALTER TABLE assets ADD PRIMARY KEY (symbol);

-- Add type column if it doesn't exist
ALTER TABLE assets ADD COLUMN IF NOT EXISTS type TEXT;

-- Create index on type
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);

-- Drop the old asset_id column from alerts
ALTER TABLE alerts DROP COLUMN asset_id;

-- Add the foreign key constraint back
ALTER TABLE alerts ADD CONSTRAINT alerts_asset_symbol_fkey 
  FOREIGN KEY (asset_symbol) REFERENCES assets(symbol) ON DELETE CASCADE;

-- Clean up
DROP TABLE alerts_backup; 