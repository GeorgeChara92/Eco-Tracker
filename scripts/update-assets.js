const https = require('https');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Ensure API URL ends with a slash
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const UPDATE_INTERVAL = 15 * 1000; // 15 seconds in milliseconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 30000; // 30 seconds
const CRON_SECRET = process.env.CRON_SECRET;

// Helper function to log with timestamp
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Helper function to log errors
function error(message, error) {
  console.error(`[${new Date().toISOString()}] ${message}`, error);
}

// Test API connection
async function testConnection() {
  try {
    log('Testing API connection...');
    const response = await fetch(`${API_URL}/api/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EcoTracker-Asset-Update/1.0'
      },
      timeout: 10000 // 10 second timeout
    });
    
    const data = await response.json();
    log('API Test Response:', data);
    
    if (!response.ok) {
      throw new Error(`API test failed: ${response.status} ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    error('API Connection Test Failed:', error);
    return false;
  }
}

async function updateAssets(retryCount = 0) {
  log(`Starting assets update... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
  
  try {
    if (!CRON_SECRET) {
      throw new Error('CRON_SECRET environment variable is not set');
    }

    if (!API_URL) {
      throw new Error('API_URL environment variable is not set');
    }

    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to API');
    }

    const endpoint = `${API_URL}/api/cron/update-assets`;
    log(`Making API request to ${endpoint}`);
    
    // Log environment variables (without sensitive data)
    log(`Environment check:
      API_URL: ${API_URL}
      CRON_SECRET length: ${CRON_SECRET ? CRON_SECRET.length : 'not set'}
      NODE_ENV: ${process.env.NODE_ENV || 'not set'}
    `);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
        'User-Agent': 'EcoTracker-Asset-Update/1.0'
      },
      timeout: 30000 // 30 second timeout
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
        url: endpoint
      });
      throw new Error(`API Error: ${data.error || 'Unknown error'} - ${data.details || 'No details provided'}`);
    }
    
    if (!data.success || data.count === 0) {
      log(`Update completed but no assets were updated:
        success: ${data.success}
        message: ${data.message}
        count: ${data.count}
        timestamp: ${data.timestamp}
      `);
    } else {
      log(`Update successful:
        success: ${data.success}
        message: ${data.message}
        count: ${data.count}
        timestamp: ${data.timestamp}
      `);
    }

    // Schedule next update
    setTimeout(() => updateAssets(0), UPDATE_INTERVAL);
    
  } catch (error) {
    error('Update failed:', error);
    
    if (retryCount < MAX_RETRIES - 1) {
      log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
      setTimeout(() => updateAssets(retryCount + 1), RETRY_DELAY);
    } else {
      error(`Max retries reached. Scheduling next update in ${UPDATE_INTERVAL/1000} seconds.`);
      setTimeout(() => updateAssets(0), UPDATE_INTERVAL);
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('Graceful shutdown: Stopping asset update service...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Graceful shutdown: Stopping asset update service...');
  process.exit(0);
});

// Start the update service
log('Starting asset update service...');
updateAssets(); 