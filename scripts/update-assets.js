const https = require('https');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const UPDATE_INTERVAL = 15 * 1000; // 15 seconds in milliseconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 30000; // 30 seconds
const CRON_SECRET = process.env.CRON_SECRET;

async function updateAssets(retryCount = 0) {
  console.log(`[${new Date().toISOString()}] Starting assets update... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
  
  try {
    if (!CRON_SECRET) {
      throw new Error('CRON_SECRET environment variable is not set');
    }

    console.log(`[${new Date().toISOString()}] Making API request to ${API_URL}/api/cron/update-assets`);
    const response = await fetch(`${API_URL}/api/cron/update-assets`, {
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`[${new Date().toISOString()}] API Error Response:`, {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      throw new Error(`API Error: ${data.error || 'Unknown error'} - ${data.details || 'No details provided'}`);
    }
    
    if (!data.success || data.count === 0) {
      console.warn(`[${new Date().toISOString()}] Update completed but no assets were updated:`, {
        success: data.success,
        message: data.message,
        count: data.count,
        timestamp: data.timestamp
      });
    } else {
      console.log(`[${new Date().toISOString()}] Update successful:`, {
        success: data.success,
        message: data.message,
        count: data.count,
        timestamp: data.timestamp
      });
    }

    // Schedule next update
    setTimeout(() => updateAssets(0), UPDATE_INTERVAL);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Update failed:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
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