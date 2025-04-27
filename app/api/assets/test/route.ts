import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../src/lib/supabase-admin';

export async function GET() {
  try {
    console.log('Test route: Checking admin client...');
    
    if (!supabaseAdmin) {
      console.error('Test route: Admin client is null');
      return NextResponse.json(
        { 
          error: 'Supabase admin client not initialized', 
          details: 'Missing required environment variables',
          debug: {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing',
            serviceKey: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing'
          }
        },
        { status: 500 }
      );
    }

    console.log('Test route: Admin client exists, testing connection...');

    // Test Supabase connection
    const { data: testData, error: testError } = await supabaseAdmin
      .from('assets')
      .select('count')
      .single();

    if (testError) {
      console.error('Test route: Supabase connection error:', testError);
      return NextResponse.json(
        { error: 'Failed to connect to Supabase', details: testError.message },
        { status: 500 }
      );
    }

    console.log('Test route: Connection successful, testing asset operations...');

    // Test inserting a sample asset
    const sampleAsset = {
      id: 'test-bitcoin',
      name: 'Bitcoin',
      symbol: 'BTC',
      current_price: 50000.00,
      price_change_percentage_24h: 2.5,
      market_cap: 1000000000000,
      market_cap_rank: 1,
      total_volume: 50000000000,
      high_24h: 51000.00,
      low_24h: 49000.00,
      price_change_24h: 1000.00,
      last_updated: new Date().toISOString()
    };

    const { error: insertError } = await supabaseAdmin
      .from('assets')
      .upsert([sampleAsset], { onConflict: 'id' });

    if (insertError) {
      console.error('Test route: Asset insertion error:', insertError);
      return NextResponse.json(
        { error: 'Failed to insert test asset', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('Test route: Asset insertion successful, fetching assets...');

    // Get all assets to verify
    const { data: assets, error: fetchError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .order('market_cap_rank', { ascending: true });

    if (fetchError) {
      console.error('Test route: Asset fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch assets', details: fetchError.message },
        { status: 500 }
      );
    }

    console.log('Test route: All operations successful');

    return NextResponse.json({
      success: true,
      message: 'Supabase connection and asset operations successful',
      assetsCount: assets?.length || 0,
      assets: assets
    });
  } catch (error) {
    console.error('Test route: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 