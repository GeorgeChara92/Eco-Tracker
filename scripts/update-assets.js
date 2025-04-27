const https = require('https');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { createClient } = require('@supabase/supabase-js');

const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function updateAssets() {
  console.log(`[${new Date().toISOString()}] Starting assets update...`);
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
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Update failed:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run initial update
console.log(`[${new Date().toISOString()}] Starting asset update service...`);
updateAssets().catch(error => {
  console.error(`[${new Date().toISOString()}] Initial update failed:`, error);
});

// Schedule regular updates
setInterval(updateAssets, UPDATE_INTERVAL);

// Keep the script running
process.stdin.resume(); 