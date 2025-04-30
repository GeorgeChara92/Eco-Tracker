import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAllMarketData, MarketDataResponse } from '@/lib/yahoo-finance';
import { headers } from 'next/headers';

// This is the secret key that will be used to verify the request is coming from cron-job.org
const CRON_SECRET = process.env.CRON_SECRET;

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set maximum execution time to 60 seconds (Vercel Hobby plan limit)

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const headersList = headers();
    const authHeader = headersList.get('authorization');

    // Verify the secret key
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      console.error('Unauthorized cron job attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting asset update cron job...');

    if (!supabaseAdmin) {
      throw new Error('Supabase client not initialized');
    }

    // Fetch all market data with a timeout
    const marketData = await Promise.race([
      getAllMarketData(),
      new Promise<MarketDataResponse>((_, reject) => 
        setTimeout(() => reject(new Error('Market data fetch timeout')), 30000)
      )
    ]) as MarketDataResponse;
    
    // Flatten all market data into a single array
    const allAssets = [
      ...marketData.stocks,
      ...marketData.indices,
      ...marketData.commodities,
      ...marketData.crypto,
      ...marketData.forex,
      ...marketData.funds
    ];

    console.log(`Fetched ${allAssets.length} assets. Starting database update...`);

    // Prepare the assets for upsert
    const assetsToUpsert = allAssets.map(asset => ({
      symbol: asset.symbol,
      name: asset.name,
      current_price: asset.price,
      price_change_24h: asset.change,
      price_change_percentage_24h: asset.changePercent,
      market_cap: asset.marketCap || 0,
      total_volume: asset.volume || 0,
      high_24h: asset.dayHigh || 0,
      low_24h: asset.dayLow || 0,
      asset_type: asset.type,
      last_updated: new Date().toISOString()
    }));

    // Perform the upsert operation
    const { data, error } = await supabaseAdmin
      .from('assets')
      .upsert(assetsToUpsert, {
        onConflict: 'symbol',
        ignoreDuplicates: false
      });

    if (error) {
      throw error;
    }

    console.log('Asset update completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Assets updated successfully',
      count: assetsToUpsert.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in asset update cron job:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}