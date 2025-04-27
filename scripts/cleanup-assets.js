const fetch = require('node-fetch');

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function cleanupAssets() {
  console.log(`[${new Date().toISOString()}] Starting asset cleanup...`);
  try {
    const response = await fetch(`${API_URL}/api/assets/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${data.error || 'Unknown error'} - ${data.details || 'No details provided'}`);
    }
    
    console.log(`[${new Date().toISOString()}] Cleanup successful:`, {
      remainingAssets: data.remainingAssets,
      symbols: data.symbols
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cleanup failed:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the cleanup
cleanupAssets(); 