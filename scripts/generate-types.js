const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure the types directory exists
const typesDir = path.join(process.cwd(), 'types');
if (!fs.existsSync(typesDir)) {
  fs.mkdirSync(typesDir, { recursive: true });
}

// Generate types using Supabase CLI
try {
  execSync('npx supabase gen types typescript --project-id your-project-id > types/supabase.ts', {
    stdio: 'inherit',
  });
  console.log('Types generated successfully!');
} catch (error) {
  console.error('Error generating types:', error);
  process.exit(1);
} 