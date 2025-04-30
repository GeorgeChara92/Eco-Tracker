const https = require('https');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { createClient } = require('@supabase/supabase-js');

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 30000; // 30 seconds

async function updateAssets(retryCount = 0) {
  console.log(`[${new Date().toISOString()}] Starting assets update... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
  
  try {
    const response = await fetch(`${API_URL}/api/assets/update`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${data.error || 'Unknown error'} - ${data.details || 'No details provided'}`);
    }
    
    console.log(`[${new Date().toISOString()}] Update successful:`, {
      totalAssets: data.totalAssets,
      lastUpdated: data.lastUpdated,
      failedSymbols: data.failedSymbols || []
    });

    // Schedule next update
    setTimeout(() => updateAssets(0), UPDATE_INTERVAL);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Update failed:`, error.message);
    
    if (retryCount < MAX_RETRIES - 1) {
      console.log(`[${new Date().toISOString()}] Retrying in ${RETRY_DELAY/1000} seconds...`);
      setTimeout(() => updateAssets(retryCount + 1), RETRY_DELAY);
    } else {
      console.error(`[${new Date().toISOString()}] Max retries reached. Scheduling next update in ${UPDATE_INTERVAL/1000} seconds.`);
      setTimeout(() => updateAssets(0), UPDATE_INTERVAL);
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n[Graceful shutdown] Stopping asset update service...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Graceful shutdown] Stopping asset update service...');
  process.exit(0);
});

// Start the update service
console.log(`[${new Date().toISOString()}] Starting asset update service...`);
updateAssets(); 