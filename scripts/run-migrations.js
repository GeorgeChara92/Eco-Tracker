const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  try {
    // Read and execute each migration file in order
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const migration = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      const { error } = await supabase.rpc('exec_sql', { sql: migration });
      
      if (error) {
        console.error(`Error running migration ${file}:`, error);
        process.exit(1);
      }
      
      console.log(`Successfully ran migration: ${file}`);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations(); 