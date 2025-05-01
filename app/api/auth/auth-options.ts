import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';

// Check for required environment variables
const requiredEnvVars = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  authSecret: process.env.NEXTAUTH_SECRET
};

// Log environment variable status (without exposing sensitive data)
console.log('Environment Variables Status:', {
  NEXT_PUBLIC_SUPABASE_URL: requiredEnvVars.url ? 'set' : 'missing',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredEnvVars.anonKey ? 'set' : 'missing',
  SUPABASE_SERVICE_ROLE_KEY: requiredEnvVars.serviceKey ? 'set' : 'missing',
  NEXTAUTH_SECRET: requiredEnvVars.authSecret ? 'set' : 'missing'
});

// Validate environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

if (!requiredEnvVars.url || !requiredEnvVars.anonKey || !requiredEnvVars.serviceKey || !requiredEnvVars.authSecret) {
  throw new Error('Required environment variables are not set');
}

// Create a client with the anon key for auth operations
const supabase = createClient(
  requiredEnvVars.url,
  requiredEnvVars.anonKey
);

// Create a client with the service role key for database operations
const supabaseAdmin = createClient(
  requiredEnvVars.url,
  requiredEnvVars.serviceKey
);

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}

export const authOptions: NextAuthOptions = {
  secret: requiredEnvVars.authSecret,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password');
        }

        try {
          // Sign in with Supabase
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error) {
            console.error('Supabase auth error:', error);
            throw new Error(error.message);
          }

          if (!data.user) {
            throw new Error('No user found');
          }

          // Get user role from profiles table using admin client
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role, full_name')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
            throw new Error('Error fetching user profile');
          }

          return {
            id: data.user.id,
            email: data.user.email,
            name: profile?.full_name || data.user.user_metadata?.full_name,
            role: profile?.role || 'user',
          };
        } catch (error) {
          console.error('Authorization error:', error);
          throw new Error('Invalid email or password');
        }
      }
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
}; 