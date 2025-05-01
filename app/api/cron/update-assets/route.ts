import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import yahooFinance from 'yahoo-finance2';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify the cron secret
function isAuthorized(req: Request) {
  const headersList = headers();
  const authHeader = headersList.get('authorization');
  if (!authHeader) return false;
  
  const token = authHeader.split(' ')[1];
  return token === process.env.CRON_SECRET;
}

export async function GET(req: Request) {
  console.log('Starting assets update...');
  
  // Verify authorization
  if (!isAuthorized(req)) {
    console.error('Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch market data from our API endpoint
    const marketDataResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/market/all`);
    if (!marketDataResponse.ok) {
      throw new Error('Failed to fetch market data');
    }
    
    const marketData = await marketDataResponse.json();
    const timestamp = new Date().toISOString();
    let updatedCount = 0;

    // Process each category
    for (const [category, assets] of Object.entries(marketData)) {
      if (!Array.isArray(assets)) continue;

      for (const asset of assets) {
        try {
          // Update or insert the asset in Supabase
          const { error } = await supabase
            .from('assets')
            .upsert({
              symbol: asset.symbol,
              name: asset.name,
              type: asset.type,
              price: asset.price,
              change: asset.change,
              change_percent: asset.changePercent,
              volume: asset.volume,
              market_cap: asset.marketCap,
              day_high: asset.dayHigh,
              day_low: asset.dayLow,
              last_updated: timestamp
            }, {
              onConflict: 'symbol'
            });

          if (error) {
            console.error(`Error updating ${asset.symbol}:`, error);
          } else {
            updatedCount++;
          }
        } catch (error) {
          console.error(`Error processing ${asset.symbol}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Assets updated successfully',
      count: updatedCount,
      timestamp
    });

  } catch (error) {
    console.error('Error updating assets:', error);
    return NextResponse.json({
      error: 'Failed to update assets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}