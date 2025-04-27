import { supabase } from './supabase';
import { Asset } from '../types/asset';

export async function getAssets(): Promise<Asset[]> {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('market_cap_rank', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching assets:', error);
    return [];
  }
}

export async function updateAssets(assets: Asset[]): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase.rpc('update_asset_prices', {
      p_assets: assets
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

export async function createAlert(userId: string, assetId: string, alertType: 'price' | 'percentage', condition: 'above' | 'below', value: number) {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .insert({
        user_id: userId,
        asset_id: assetId,
        alert_type: alertType,
        condition: condition,
        value: value,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating alert:', error);
    return { success: false, error };
  }
}

export async function getUserAlerts(userId: string) {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select(`
        *,
        assets (
          id,
          name,
          symbol,
          current_price,
          price_change_percentage_24h
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user alerts:', error);
    return [];
  }
} 