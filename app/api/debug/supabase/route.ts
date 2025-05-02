import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Fetch the latest 5 assets to check connection
    const { data: assets, error } = await supabase
      .from('assets')
      .select('symbol, price, change, change_percent, last_updated')
      .order('last_updated', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Debug endpoint: Error fetching assets from Supabase:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        supbaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 10)}...` : 'not set'
      }, { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    // Try to set up a simple test channel
    const testChannel = supabase.channel('test-debug-channel');
    const channelStatus = await new Promise<string>((resolve) => {
      const subscription = testChannel.subscribe((status) => {
        resolve(status);
        testChannel.unsubscribe();
      });
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      assets: assets,
      realtimeStatus: {
        channelStatus
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : String(error)
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
} 