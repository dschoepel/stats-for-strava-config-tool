// Test backup-config endpoint
const BASE_URL = 'http://localhost:3000';

async function testBackupConfig() {
  console.log('Testing /api/backup-config (POST)...');
  try {
    const response = await fetch(`${BASE_URL}/api/backup-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filePath: 'E:\\Strava-Project\\stats-for-strava-config-tool\\public\\config.yaml'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('HTTP Error:', response.status, response.statusText);
      console.error('Response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Backup created successfully!');
    console.log('Backup file:', data.backupFileName);
    console.log('Backup path:', data.backupPath);
    console.log('Size:', data.size, 'bytes');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBackupConfig();
