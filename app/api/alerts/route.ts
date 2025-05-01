import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);
    console.log('GET Session:', session);

    if (!session?.user?.id) {
      console.log('GET Unauthorized - No user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: alerts, error } = await supabaseAdmin
      .from('alerts')
      .select(`
        *,
        assets (
          symbol,
          name,
          price,
          change_percent
        )
      `)
      .eq('user_id', session.user.id)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching alerts:', error);
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }

    console.log('Fetched alerts:', alerts);
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error in alerts route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);
    console.log('POST Session:', session);

    if (!session?.user?.id) {
      console.log('POST Unauthorized - No user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('POST Request Body:', body);

    const { asset_symbol, alert_type, condition, value } = body;

    if (!asset_symbol || !alert_type || !condition || value === undefined) {
      console.log('POST Missing fields:', { asset_symbol, alert_type, condition, value });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First, check if the asset exists
    const { data: asset, error: assetError } = await supabaseAdmin
      .from('assets')
      .select('symbol')
      .eq('symbol', asset_symbol)
      .single();

    if (assetError) {
      console.error('Error checking asset:', assetError);
      return NextResponse.json(
        { error: 'Error checking asset' },
        { status: 500 }
      );
    }

    if (!asset) {
      console.log('POST Asset not found:', asset_symbol);
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    const alertData = {
      user_id: session.user.id,
      asset_symbol,
      alert_type,
      condition,
      value: parseFloat(value),
      is_active: true
    };
    console.log('POST Creating alert with data:', alertData);

    const { data: alert, error } = await supabaseAdmin
      .from('alerts')
      .insert(alertData)
      .select(`
        *,
        assets (
          symbol,
          name,
          price,
          change_percent
        )
      `)
      .single();

    if (error) {
      console.error('Error creating alert:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create alert' },
        { status: 500 }
      );
    }

    console.log('Alert created successfully:', alert);
    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error in alerts route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);
    console.log('DELETE Session:', session);

    if (!session?.user?.id) {
      console.log('DELETE Unauthorized - No user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');
    const assetSymbol = searchParams.get('asset_symbol');

    if (!alertId && !assetSymbol) {
      console.log('DELETE Missing ID or asset_symbol');
      return NextResponse.json(
        { error: 'Alert ID or asset symbol is required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('alerts')
      .delete()
      .eq('user_id', session.user.id);

    if (alertId) {
      query = query.eq('id', alertId);
    } else if (assetSymbol) {
      query = query.eq('asset_symbol', assetSymbol);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting alert:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete alert' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in alerts route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 