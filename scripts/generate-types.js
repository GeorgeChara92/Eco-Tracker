const { execSync } = require('child_process');
const path = require('path');

console.log('Generating Prisma types...');

try {
  // Run prisma generate to create types
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('Types generated successfully!');
} catch (error) {
  console.error('Error generating types:', error);
  process.exit(1);
} 