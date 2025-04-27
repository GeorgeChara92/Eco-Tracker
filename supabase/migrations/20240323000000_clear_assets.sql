-- Clear all data from the assets table
TRUNCATE TABLE public.assets RESTART IDENTITY CASCADE;
 
-- Reset any sequences if needed
ALTER SEQUENCE IF EXISTS public.assets_id_seq RESTART WITH 1; 