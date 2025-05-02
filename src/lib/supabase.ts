import { createClient } from '@supabase/supabase-js';

// Define the Asset type locally since we can't import it
interface Asset {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  image?: string;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    anonKey: !!supabaseAnonKey
  });
  throw new Error('Missing required Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function updateAssets(assets: Asset[]) {
  try {
    // Convert assets to the format expected by our update_asset_prices function
    const formattedAssets = assets.map(asset => ({
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      current_price: asset.current_price,
      price_change_percentage_24h: asset.price_change_percentage_24h,
      image: asset.image,
      market_cap: asset.market_cap,
      market_cap_rank: asset.market_cap_rank,
      total_volume: asset.total_volume,
      high_24h: asset.high_24h,
      low_24h: asset.low_24h,
      price_change_24h: asset.price_change_24h
    }));

    // Call the update_asset_prices function we created in the migration
    const { error } = await supabase.rpc('update_asset_prices', {
      p_assets: formattedAssets
    });

    if (error) {
      console.error('Error updating assets:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateAssets:', error);
    return { success: false, error };
  }
}

export async function getAssets() {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('market_cap_rank', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching assets:', error);
    return [];
  }
} 