import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// Create a client with the service role key for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    // Validate role value
    const validRoles = ['admin', 'user'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role value' },
        { status: 400 }
      );
    }

    // Update the user's role in the profiles table
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (updateError) {
      console.error('Role update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User role updated to "${role}" successfully`
    });
  } catch (error) {
    console.error('User role update error:', error);
    return NextResponse.json(
      { error: 'An error occurred during role update' },
      { status: 500 }
    );
  }
} 