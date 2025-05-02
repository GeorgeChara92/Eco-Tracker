import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to create profile with retries
async function createProfileWithRetry(userId: string, email: string, name: string, maxRetries = 3) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized');
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .insert([
          {
            id: userId,
            email: email,
            full_name: name,
          }
        ]);

      if (!error) {
        return { success: true };
      }

      if (attempt < maxRetries) {
        console.log(`Profile creation attempt ${attempt} failed, retrying in 1 second...`);
        await wait(1000); // Wait 1 second before retrying
      } else {
        return { success: false, error };
      }
    } catch (error) {
      if (attempt === maxRetries) {
        return { success: false, error };
      }
      await wait(1000);
    }
  }
  return { success: false, error: new Error('Max retries exceeded') };
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    console.log('Starting signup process...');
    console.log('Supabase client initialized:', !!supabase);
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Attempting to sign up user:', { email, name });

    // First check if user exists in profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking profile:', profileError);
      return NextResponse.json(
        { error: 'Error checking user existence' },
        { status: 500 }
      );
    }

    if (profile) {
      console.log('User already exists in profiles:', profile);
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    console.log('No existing user found, proceeding with signup');

    // Create user using admin client
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Don't auto-confirm, let them verify via email
      user_metadata: {
        full_name: name
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    if (!userData.user) {
      console.error('No user data returned from Supabase');
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    console.log('User created successfully:', {
      id: userData.user.id,
      email: userData.user.email,
      metadata: userData.user.user_metadata
    });

    // Send verification email using regular client
    const { error: verifyError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    });

    if (verifyError) {
      console.error('Error sending verification email:', verifyError);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify the profile was created by the trigger
    const { data: createdProfile, error: verifyProfileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userData.user.id)
      .single();

    if (verifyProfileError || !createdProfile) {
      console.error('Error verifying profile creation:', verifyProfileError);
      // Clean up the auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    console.log('Profile created successfully by trigger');

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      redirectTo: '/auth/verify-email'
    });
  } catch (error) {
    console.error('Sign up error:', error);
    return NextResponse.json(
      { error: 'An error occurred during sign up: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
} 