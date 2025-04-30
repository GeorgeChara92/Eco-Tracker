const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure the types directory exists
const typesDir = path.join(process.cwd(), 'types');
if (!fs.existsSync(typesDir)) {
  fs.mkdirSync(typesDir, { recursive: true });
}

// Get project ID from Supabase URL
const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) {
  console.log('SUPABASE_URL environment variable is not set, using fallback types');
  // Create a basic types file if it doesn't exist
  if (!fs.existsSync(path.join(typesDir, 'supabase.ts'))) {
    fs.writeFileSync(
      path.join(typesDir, 'supabase.ts'),
      `export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          password: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          password: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          password?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}`
    );
  }
  process.exit(0);
}

const projectId = supabaseUrl.split('.')[0].split('//')[1];

// Generate types using Supabase CLI
try {
  execSync(`npx supabase gen types typescript --project-id ${projectId} > types/supabase.ts`, {
    stdio: 'inherit',
  });
  console.log('Types generated successfully!');
} catch (error) {
  console.error('Error generating types:', error);
  // Don't exit with error if types generation fails, as we have a fallback type definition
  console.log('Using fallback type definitions');
} 