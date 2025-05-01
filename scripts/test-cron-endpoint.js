const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_URL = 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;

async function testCronEndpoint() {
  try {
    console.log('Testing cron endpoint...');
    console.log('Environment check:');
    console.log('- API_URL:', API_URL);
    console.log('- CRON_SECRET:', CRON_SECRET ? '***' + CRON_SECRET.slice(-4) : 'not set');
    
    if (!CRON_SECRET) {
      throw new Error('CRON_SECRET environment variable is not set');
    }

    const response = await fetch(`${API_URL}/api/cron/update-assets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      throw new Error(`API Error: ${data.error || 'Unknown error'}`);
    }

    console.log('Test successful!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

testCronEndpoint(); 