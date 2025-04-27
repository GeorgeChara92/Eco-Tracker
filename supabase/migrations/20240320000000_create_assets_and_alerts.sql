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