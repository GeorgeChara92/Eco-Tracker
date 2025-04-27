import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a client with the anon key for auth operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Create a client with the service role key for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    console.log('Attempting to sign up user:', { email, name });

    // First, check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
      data: {
          full_name: name,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      console.error('Supabase auth error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data.user) {
      console.error('No user data returned from Supabase');
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    console.log('User created successfully:', data.user.id);

    // Create profile with role using the admin client
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          email: email, // Store email in profiles table as well
          role: 'user',
          full_name: name,
        },
      ]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return NextResponse.json(
        { error: 'Failed to create user profile: ' + profileError.message },
        { status: 500 }
      );
    }

    console.log('Profile created successfully');

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.'
    });
  } catch (error) {
    console.error('Sign up error:', error);
    return NextResponse.json(
      { error: 'An error occurred during sign up: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
} 