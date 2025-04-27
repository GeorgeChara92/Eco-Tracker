import { createClient } from '@supabase/supabase-js';
import { Asset } from '../types/asset';

// Get environment variables - try both public and private versions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// Detailed logging of environment variables
console.log('Supabase Admin Environment Variables Debug:', {
  url: {
    value: supabaseUrl,
    length: supabaseUrl?.length,
    startsWith: supabaseUrl?.substring(0, 10)
  },
  serviceKey: {
    value: supabaseServiceKey ? '***' + supabaseServiceKey.slice(-4) : undefined,
    length: supabaseServiceKey?.length,
    source: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'private' : 
           process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? 'public' : 'missing'
  }
});

// Create the admin client only if both URL and key are present
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseServiceKey) {
  try {
    console.log('Attempting to create Supabase admin client...');
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Supabase admin client created successfully');
    
    // Test the connection
    void (async () => {
      try {
        console.log('Testing Supabase admin connection...');
        const { error } = await supabaseAdmin!
          .from('assets')
          .select('count')
          .single();
        
        if (error) {
          console.error('Supabase admin connection test failed:', error);
        } else {
          console.log('Supabase admin connection successful');
        }
      } catch (error) {
        console.error('Supabase admin connection test error:', error);
      }
    })();
  } catch (error) {
    console.error('Failed to create Supabase admin client:', error);
  }
} else {
  console.error('Cannot initialize Supabase admin client: Missing required environment variables');
  if (!supabaseUrl) console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) {
    console.error('Missing service role key. Tried:');
    console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.error('- NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);
  }
}

export { supabaseAdmin }; 