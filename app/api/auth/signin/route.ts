import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Attempting to sign in user:', { email });

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase auth error:', error);
      // Check if the error is due to email not being verified
      if (error.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: 'Please verify your email before signing in' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (!data.user) {
      console.error('No user data returned from Supabase');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('User signed in successfully:', data.user.id);

    // Get user role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Error fetching user profile' },
        { status: 500 }
      );
    }

    console.log('User profile fetched:', profile);

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name,
        role: profile?.role || 'user',
      },
      redirect: '/dashboard'
    });
  } catch (error) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: 'An error occurred during sign in: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
} 