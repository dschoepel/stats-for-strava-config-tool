// Test script for config API endpoints
// Run with: node test-config-api.js

const BASE_URL = 'http://localhost:3000';

async function testValidateSections() {
  console.log('\n=== Testing /api/validate-sections (GET) ===');
  try {
    const response = await fetch(`${BASE_URL}/api/validate-sections`);
    const data = await response.json();
    console.log('Expected sections:', data.expectedSections);
    console.log('Success:', data.success);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testValidateSectionsPost() {
  console.log('\n=== Testing /api/validate-sections (POST) ===');
  try {
    // Test with a sample section mapping
    const response = await fetch(`${BASE_URL}/api/validate-sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sectionMapping: {
          general: 'config.yaml',
          appearance: 'config-appearance.yaml',
          import: 'config-import.yaml'
          // Missing: metrics, gear, zwift, integrations, daemon
        }
      })
    });
    const data = await response.json();
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testBackupList() {
  console.log('\n=== Testing /api/backup-config (GET) ===');
  try {
    // Using a test directory - adjust to your actual config path
    const testDir = 'E:\\Strava-Project\\stats-for-strava-config-tool\\public';
    const response = await fetch(`${BASE_URL}/api/backup-config?directory=${encodeURIComponent(testDir)}`);
    const data = await response.json();
    console.log('Backups found:', data.count);
    console.log('Backup directory:', data.backupDirectory);
    if (data.backups && data.backups.length > 0) {
      console.log('Latest backup:', data.backups[0].fileName);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testMergeConfig() {
  console.log('\n=== Testing /api/merge-config ===');
  try {
    // Test with public/config.yaml
    const response = await fetch(`${BASE_URL}/api/merge-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: [
          {
            name: 'config.yaml',
            path: 'E:\\Strava-Project\\stats-for-strava-config-tool\\public\\config.yaml'
          }
        ],
        outputPath: 'E:\\Strava-Project\\stats-for-strava-config-tool\\public\\config-merged.yaml',
        createBackup: false
      })
    });
    const data = await response.json();
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runTests() {
  console.log('Starting API endpoint tests...');
  console.log('Make sure the dev server is running on port 3000');
  
  await testValidateSections();
  await testValidateSectionsPost();
  await testBackupList();
  await testMergeConfig();
  
  console.log('\n=== All tests completed ===');
}

runTests();
