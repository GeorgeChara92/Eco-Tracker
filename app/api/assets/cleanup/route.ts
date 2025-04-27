import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase-admin';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap?: number;
  market_cap_rank?: number;
  total_volume?: number;
  high_24h?: number;
  low_24h?: number;
  price_change_24h?: number;
  last_updated?: string;
  created_at?: string;
  updated_at?: string;
}

export async function POST() {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    // Step 1: Get all assets
    const { data: assets, error: fetchError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .returns<Asset[]>();

    if (fetchError) {
      console.error('Error fetching assets:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch assets', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!assets || assets.length === 0) {
      return NextResponse.json(
        { message: 'No assets found to clean up' },
        { status: 200 }
      );
    }

    // Step 2: Group assets by their normalized symbol
    const groupedAssets = assets.reduce((acc, asset) => {
      const normalizedSymbol = asset.symbol.replace(/[-=].*$/, '');
      if (!acc[normalizedSymbol]) {
        acc[normalizedSymbol] = [];
      }
      acc[normalizedSymbol].push(asset);
      return acc;
    }, {} as Record<string, Asset[]>);

    // Step 3: For each group, keep only the properly formatted symbol
    const assetsToDelete: string[] = [];
    const assetsToKeep: Asset[] = [];

    for (const [normalizedSymbol, groupAssets] of Object.entries(groupedAssets)) {
      if (groupAssets.length === 1) {
        assetsToKeep.push(groupAssets[0]);
        continue;
      }

      // Find the properly formatted symbol based on type
      let properAsset = groupAssets.find(asset => {
        if (asset.symbol.includes('=F')) return true; // Commodity
        if (asset.symbol.includes('=X')) return true; // Forex
        if (asset.symbol.includes('-USD')) return true; // Crypto
        if (asset.symbol.startsWith('^')) return true; // Index
        return false;
      });

      // If no properly formatted symbol found, keep the first one
      if (!properAsset) {
        properAsset = groupAssets[0];
      }

      assetsToKeep.push(properAsset);
      assetsToDelete.push(...groupAssets
        .filter(a => a.id !== properAsset!.id)
        .map(a => a.id)
      );
    }

    // Step 4: Delete duplicate assets
    if (assetsToDelete.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('assets')
        .delete()
        .in('id', assetsToDelete);

      if (deleteError) {
        console.error('Error deleting duplicate assets:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete duplicate assets', details: deleteError.message },
          { status: 500 }
        );
      }
    }

    // Step 5: Verify the changes
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('assets')
      .select('symbol')
      .order('symbol');

    if (verifyError) {
      console.error('Error verifying changes:', verifyError);
      return NextResponse.json(
        { error: 'Failed to verify changes', details: verifyError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully cleaned up asset symbols',
      deletedCount: assetsToDelete.length,
      remainingCount: verifyData.length,
      symbols: verifyData.map(a => a.symbol)
    });

  } catch (error: any) {
    console.error('Error in cleanup process:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 