-- Add 'type' column if it doesn't exist
ALTER TABLE assets
ADD COLUMN IF NOT EXISTS type TEXT;

-- Backfill 'type' as 'commodities' for canonical commodity symbols
UPDATE assets
SET type = 'commodities'
WHERE symbol IN ('GC=F', 'SI=F', 'CL=F', 'NG=F', 'HG=F', 'ZC=F', 'ZW=F', 'ZS=F', 'PA=F', 'PL=F', 'KC=F', 'CC=F', 'CT=F', 'LBS=F', 'SB=F'); 