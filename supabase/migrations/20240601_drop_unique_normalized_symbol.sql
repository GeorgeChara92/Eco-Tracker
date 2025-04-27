-- Drop the unique constraint on the normalized symbol in the assets table
ALTER TABLE assets DROP CONSTRAINT IF EXISTS unique_normalized_symbol; 