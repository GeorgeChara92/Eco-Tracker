-- Keep only the correct Yahoo Finance commodity symbols
DELETE FROM assets
WHERE symbol LIKE '%=F'
  AND symbol NOT IN ('GC=F', 'SI=F', 'CL=F', 'NG=F', 'HG=F', 'ZC=F', 'ZW=F', 'ZS=F', 'PA=F', 'PL=F', 'KC=F', 'CC=F', 'CT=F', 'LBS=F', 'SB=F'); 