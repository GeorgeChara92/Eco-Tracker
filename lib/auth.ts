import { NextAuthOptions } from 'next-auth';
import { SupabaseAdapter } from '@next-auth/supabase-adapter';
import { supabase } from './supabase';

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        // Get or create user profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', token.sub)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        }

        // Add profile data to session
        return {
          ...session,
          user: {
            ...session.user,
            id: token.sub,
            profile: profile || null,
          },
        };
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  providers: [
    // Add your providers here
  ],
}; 