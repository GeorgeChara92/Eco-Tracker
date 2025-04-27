const cron = require('node-cron');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Schedule to run every minute
cron.schedule('* * * * *', async () => {
  try {
    const res = await fetch('http://localhost:3000/api/assets/update');
    const data = await res.json();
    console.log(`[${new Date().toISOString()}] Asset update:`, data);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Asset update failed:`, err);
  }
});

console.log('Scheduled asset update every minute. Press Ctrl+C to stop.'); 