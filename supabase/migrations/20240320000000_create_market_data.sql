-- Create market_data table
CREATE TABLE IF NOT EXISTS market_data (
  id INTEGER PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on updated_at for faster queries
CREATE INDEX IF NOT EXISTS market_data_updated_at_idx ON market_data(updated_at);

-- Insert initial row
INSERT INTO market_data (id, data)
VALUES (1, '{"stocks":[],"indices":[],"commodities":[],"crypto":[],"forex":[],"funds":[]}'::jsonb)
ON CONFLICT (id) DO NOTHING; 