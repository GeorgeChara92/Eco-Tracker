-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.assets;

-- Create new policies with insert permissions
CREATE POLICY "Enable read access for all users" ON public.assets
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.assets
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.assets
    FOR UPDATE USING (true);

-- Verify the policies
SELECT * FROM pg_policies WHERE tablename = 'assets'; 