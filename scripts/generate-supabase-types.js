const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Generating Supabase types...');

try {
  // Ensure the types directory exists
  const typesDir = path.join(process.cwd(), 'types');
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir);
  }

  // Generate types using Supabase CLI
  execSync('npx supabase gen types typescript --project-id djxkwfaezfgvkfkngsny > types/supabase.ts', {
    stdio: 'inherit',
  });
  
  console.log('Supabase types generated successfully!');
} catch (error) {
  console.error('Error generating Supabase types:', error);
  process.exit(1);
} 