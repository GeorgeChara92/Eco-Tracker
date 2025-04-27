import fs from 'fs';
import path from 'path';

// Use a more reliable path in the project's .next directory
const LOG_FILE = path.join(process.cwd(), '.next', 'auth-debug.log');

export function logAuth(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;
  
  // Log to console
  console.log(logMessage);
  
  try {
    // Ensure the .next directory exists
    if (!fs.existsSync(path.dirname(LOG_FILE))) {
      fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    }
    
    // Append to file
    fs.appendFileSync(LOG_FILE, logMessage);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
} 