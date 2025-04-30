import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Debug environment variables (without exposing sensitive data)
console.log('Supabase Admin Environment Variables Debug:', {
  url: process.env.SUPABASE_URL ? {
    value: process.env.SUPABASE_URL,
    length: process.env.SUPABASE_URL.length,
    startsWith: process.env.SUPABASE_URL.substring(0, 10)
  } : 'not set',
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? {
    value: '***' + process.env.SUPABASE_SERVICE_ROLE_KEY.slice(-4),
    length: process.env.SUPABASE_SERVICE_ROLE_KEY.length,
    source: 'private'
  } : 'not set'
});

let supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null;

try {
  console.log('Attempting to create Supabase admin client...');
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required Supabase environment variables');
  }

  supabaseAdmin = createClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
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