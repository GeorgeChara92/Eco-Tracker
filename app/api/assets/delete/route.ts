import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase-admin';

export async function DELETE(request: Request) {
  try {
    const { symbol } = await request.json();

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client not initialized' },
        { status: 500 }
      );
    }

    // Delete the asset
    const { error } = await supabaseAdmin
      .from('assets')
      .delete()
      .eq('symbol', symbol);

    if (error) {
      console.error('Error deleting asset:', error);
      return NextResponse.json(
        { error: 'Failed to delete asset', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Asset ${symbol} deleted successfully`
    });
  } catch (error) {
    console.error('Error in delete asset:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 