import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test authentication
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    // Test database connection
    const { data: dbData, error: dbError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    return NextResponse.json({
      success: true,
      auth: {
        hasSession: !!authData.session,
        error: authError?.message
      },
      database: {
        connected: !dbError,
        error: dbError?.message,
        data: dbData
      },
      config: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    });
  } catch (error) {
    console.error('Connection test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 