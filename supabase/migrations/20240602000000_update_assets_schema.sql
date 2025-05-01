-- First, drop the foreign key constraint from alerts
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_asset_id_fkey;

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS check_alerts_after_price_update ON assets;
DROP FUNCTION IF EXISTS check_alerts_on_price_change();
DROP FUNCTION IF EXISTS update_asset_prices();

-- Drop existing columns we don't need
ALTER TABLE assets DROP COLUMN IF EXISTS image;
ALTER TABLE assets DROP COLUMN IF EXISTS market_cap_rank;

-- Rename columns to match our new structure if they exist
DO $$ 
BEGIN
  -- Check and rename current_price to price
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'current_price') THEN
    ALTER TABLE assets RENAME COLUMN current_price TO price;
  END IF;

  -- Check and rename price_change_24h to change
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'price_change_24h') THEN
    ALTER TABLE assets RENAME COLUMN price_change_24h TO change;
  END IF;

  -- Check and rename price_change_percentage_24h to change_percent
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'price_change_percentage_24h') THEN
    ALTER TABLE assets RENAME COLUMN price_change_percentage_24h TO change_percent;
  END IF;

  -- Check and rename total_volume to volume
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'total_volume') THEN
    ALTER TABLE assets RENAME COLUMN total_volume TO volume;
  END IF;

  -- Check and rename high_24h to day_high
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'high_24h') THEN
    ALTER TABLE assets RENAME COLUMN high_24h TO day_high;
  END IF;

  -- Check and rename low_24h to day_low
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'low_24h') THEN
    ALTER TABLE assets RENAME COLUMN low_24h TO day_low;
  END IF;
END $$;

-- Add symbol column to alerts table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'asset_symbol') THEN
    ALTER TABLE alerts ADD COLUMN asset_symbol TEXT;
  END IF;
END $$;

-- Create assets table if it doesn't exist with new schema
CREATE TABLE IF NOT EXISTS assets (
    symbol TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    price DECIMAL NOT NULL DEFAULT 0,
    change DECIMAL DEFAULT 0,
    change_percent DECIMAL DEFAULT 0,
    volume DECIMAL DEFAULT 0,
    market_cap DECIMAL DEFAULT 0,
    day_high DECIMAL DEFAULT 0,
    day_low DECIMAL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on type
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);

-- Add the foreign key constraint
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_asset_symbol_fkey;
ALTER TABLE alerts ADD CONSTRAINT alerts_asset_symbol_fkey 
  FOREIGN KEY (asset_symbol) REFERENCES assets(symbol) ON DELETE CASCADE;

-- Create new function to check alerts when price changes
CREATE OR REPLACE FUNCTION check_alerts_on_price_change()
RETURNS TRIGGER AS $$
DECLARE
    alert_record RECORD;
    alert_value DECIMAL;
    current_value DECIMAL;
    should_trigger BOOLEAN;
BEGIN
    -- For each alert on this asset
    FOR alert_record IN 
        SELECT * FROM alerts 
        WHERE asset_symbol = NEW.symbol 
        AND is_active = true
    LOOP
        -- Calculate the value to compare based on alert type
        IF alert_record.alert_type = 'price' THEN
            current_value := NEW.price;
            alert_value := alert_record.value;
        ELSE -- percentage
            current_value := NEW.change_percent;
            alert_value := alert_record.value;
        END IF;

        -- Check if alert should trigger based on condition
        IF alert_record.condition = 'above' THEN
            should_trigger := current_value > alert_value;
        ELSE -- below
            should_trigger := current_value < alert_value;
        END IF;

        -- If alert should trigger, create notification and deactivate alert
        IF should_trigger THEN
            -- Insert notification
            INSERT INTO notifications (
                user_id,
                title,
                message,
                type,
                metadata
            ) VALUES (
                alert_record.user_id,
                'Price Alert Triggered',
                CASE 
                    WHEN alert_record.alert_type = 'price' THEN
                        NEW.name || ' price is now ' || 
                        CASE alert_record.condition 
                            WHEN 'above' THEN 'above' 
                            ELSE 'below' 
                        END || 
                        ' ' || alert_value
                    ELSE
                        NEW.name || ' price change is now ' || 
                        CASE alert_record.condition 
                            WHEN 'above' THEN 'above' 
                            ELSE 'below' 
                        END || 
                        ' ' || alert_value || '%'
                END,
                'alert',
                jsonb_build_object(
                    'asset_symbol', NEW.symbol,
                    'asset_name', NEW.name,
                    'price', NEW.price,
                    'change_percent', NEW.change_percent,
                    'alert_id', alert_record.id
                )
            );

            -- Deactivate the alert
            UPDATE alerts 
            SET is_active = false 
            WHERE id = alert_record.id;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger to check alerts on price update
CREATE TRIGGER check_alerts_after_price_update
    AFTER UPDATE OF price, change_percent
    ON assets
    FOR EACH ROW
    EXECUTE FUNCTION check_alerts_on_price_change();

-- Create new function to update asset prices
CREATE OR REPLACE FUNCTION update_asset_prices(
    p_assets jsonb[]
)
RETURNS void AS $$
DECLARE
    asset jsonb;
BEGIN
    FOREACH asset IN ARRAY p_assets
    LOOP
        UPDATE assets
        SET 
            price = (asset->>'price')::decimal,
            change = (asset->>'change')::decimal,
            change_percent = (asset->>'change_percent')::decimal,
            volume = (asset->>'volume')::decimal,
            market_cap = (asset->>'market_cap')::decimal,
            day_high = (asset->>'day_high')::decimal,
            day_low = (asset->>'day_low')::decimal,
            last_updated = NOW()
        WHERE symbol = asset->>'symbol';
    END LOOP;
END;
$$ LANGUAGE plpgsql; 