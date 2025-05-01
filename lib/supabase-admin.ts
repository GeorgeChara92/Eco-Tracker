import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Debug environment variables (without exposing sensitive data)
console.log('Supabase Admin Environment Variables Debug:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ? {
    value: process.env.NEXT_PUBLIC_SUPABASE_URL,
    length: process.env.NEXT_PUBLIC_SUPABASE_URL.length,
    startsWith: process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 10)
  } : 'not set',
  serviceKey: (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) ? {
    value: '***' + (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY)?.slice(-4),
    length: (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY)?.length,
    source: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'private' : 'public'
  } : 'not set'
});

let supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null;

try {
  console.log('Attempting to create Supabase admin client...');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables');
  }

  supabaseAdmin = createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public'
      }
    }
  );
  console.log('Supabase admin client created successfully');

  // Test the connection
  console.log('Testing Supabase admin connection...');
} catch (error) {
  console.error('Error initializing Supabase admin client:', error);
}

export { supabaseAdmin }; 