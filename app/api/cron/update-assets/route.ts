import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAllMarketData, MarketDataResponse } from '@/lib/yahoo-finance';
import { headers } from 'next/headers';

// This is the secret key that will be used to verify the request is coming from Vercel Cron
const CRON_SECRET = process.env.CRON_SECRET;

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set maximum execution time to 60 seconds (Vercel Hobby plan limit)

export async function GET(request: Request) {
  try {
    console.log('Starting cron job execution...');
    
    // Get the authorization header
    const headersList = headers();
    const authHeader = headersList.get('authorization');

    // Log the presence of CRON_SECRET (but not its value)
    console.log('CRON_SECRET present:', !!CRON_SECRET);
    console.log('Auth header present:', !!authHeader);

    // Verify the secret key
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      console.error('Unauthorized cron job attempt:', {
        hasSecret: !!CRON_SECRET,
        hasAuthHeader: !!authHeader,
        authHeaderLength: authHeader?.length
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Authentication successful, proceeding with market data fetch...');

    if (!supabaseAdmin) {
      console.error('Supabase client not initialized');
      throw new Error('Supabase client not initialized');
    }

    console.log('Fetching market data...');
    // Fetch all market data with a timeout
    const marketData = await Promise.race([
      getAllMarketData(),
      new Promise<MarketDataResponse>((_, reject) => 
        setTimeout(() => reject(new Error('Market data fetch timeout')), 30000)
      )
    ]) as MarketDataResponse;
    
    console.log('Market data fetched successfully, processing assets...');
    
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

    console.log('Prepared assets for upsert, performing database operation...');

    // Perform the upsert operation
    const { data, error } = await supabaseAdmin
      .from('assets')
      .upsert(assetsToUpsert, {
        onConflict: 'symbol',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Supabase upsert error:', error);
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
    // Log the full error object for better debugging
    console.error('Full error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}