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
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!supabaseUrl || !accessToken) {
  console.log('Missing Supabase credentials, using fallback types');
  process.exit(0);
}

const projectId = supabaseUrl.split('.')[0].split('//')[1];

// Generate types using Supabase CLI
try {
  execSync(`npx supabase gen types typescript --project-id ${projectId} > types/supabase.ts`, {
    stdio: 'inherit',
    env: {
      ...process.env,
      SUPABASE_ACCESS_TOKEN: accessToken
    }
  });
  console.log('Types generated successfully!');
} catch (error) {
  console.error('Error generating types:', error);
  // Don't exit with error if types generation fails, as we have a fallback type definition
  console.log('Using fallback type definitions');
} 