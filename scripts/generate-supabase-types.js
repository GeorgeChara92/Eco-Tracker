const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Generating Supabase types...');

// Check if we're in a CI environment
const isCI = process.env.CI || process.env.VERCEL;

if (isCI) {
  console.log('Running in CI environment. Skipping type generation...');
  process.exit(0);
}

try {
  // Ensure the types directory exists
  const typesDir = path.join(process.cwd(), 'types');
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir);
  }

  // Check if Supabase CLI is installed
  try {
    execSync('supabase --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('Supabase CLI is not installed. Please run:');
    console.error('npm install -g supabase');
    process.exit(1);
  }

  // Check if user is logged in
  try {
    execSync('supabase projects list', { stdio: 'ignore' });
  } catch (error) {
    console.error('Please login to Supabase first:');
    console.error('supabase login');
    process.exit(1);
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