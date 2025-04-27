-- Cleanup duplicate assets by normalized symbol, keeping only the correct Yahoo Finance commodity symbols

WITH ranked_assets AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY REGEXP_REPLACE(symbol, '[-=].*$', '')
      ORDER BY 
        -- Prefer the correct Yahoo symbol format for commodities
        CASE WHEN symbol ~ '^[A-Z]+=F$' THEN 1 ELSE 2 END,
        id
    ) AS rn
  FROM assets
)
DELETE FROM assets
WHERE id IN (
  SELECT id FROM ranked_assets WHERE rn > 1
);

-- Optionally, you can VACUUM the table after cleanup (for Postgres maintenance)
-- VACUUM assets; 