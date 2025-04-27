-- Create assets table
CREATE TABLE IF NOT EXISTS public.assets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    current_price DECIMAL NOT NULL,
    price_change_percentage_24h DECIMAL NOT NULL,
    image TEXT,
    market_cap DECIMAL,
    market_cap_rank INTEGER,
    total_volume DECIMAL,
    high_24h DECIMAL,
    low_24h DECIMAL,
    price_change_24h DECIMAL,
    last_updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_id TEXT NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('price', 'percentage')),
    condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
    value DECIMAL NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assets_symbol ON public.assets(symbol);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_asset_id ON public.alerts(asset_id);

-- Enable Row Level Security
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for assets
CREATE POLICY "Enable read access for all users" ON public.assets
    FOR SELECT USING (true);

-- Create policies for alerts
CREATE POLICY "Enable read access for authenticated users" ON public.alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON public.alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for authenticated users" ON public.alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for authenticated users" ON public.alerts
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON public.assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at
    BEFORE UPDATE ON public.alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to check alerts when price changes
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
        WHERE asset_id = NEW.id 
        AND is_active = true
    LOOP
        -- Calculate the value to compare based on alert type
        IF alert_record.alert_type = 'price' THEN
            current_value := NEW.current_price;
            alert_value := alert_record.value;
        ELSE -- percentage
            current_value := NEW.price_change_percentage_24h;
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
                    'asset_id', NEW.id,
                    'asset_name', NEW.name,
                    'current_price', NEW.current_price,
                    'price_change', NEW.price_change_percentage_24h,
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

-- Trigger to check alerts on price update
CREATE TRIGGER check_alerts_after_price_update
    AFTER UPDATE OF current_price, price_change_percentage_24h
    ON assets
    FOR EACH ROW
    EXECUTE FUNCTION check_alerts_on_price_change();

-- Function to update asset prices
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
            current_price = (asset->>'current_price')::decimal,
            price_change_percentage_24h = (asset->>'price_change_percentage_24h')::decimal,
            market_cap = (asset->>'market_cap')::decimal,
            market_cap_rank = (asset->>'market_cap_rank')::integer,
            total_volume = (asset->>'total_volume')::decimal,
            high_24h = (asset->>'high_24h')::decimal,
            low_24h = (asset->>'low_24h')::decimal,
            price_change_24h = (asset->>'price_change_24h')::decimal,
            last_updated = NOW()
        WHERE id = asset->>'id';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Enable read access for authenticated users" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for authenticated users" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for authenticated users" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id); 