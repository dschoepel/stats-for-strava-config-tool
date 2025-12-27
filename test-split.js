// Test split-config endpoint
const BASE_URL = 'http://localhost:3000';

async function testSplitConfig() {
  console.log('Testing /api/split-config...');
  try {
    const response = await fetch(`${BASE_URL}/api/split-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        configPath: 'E:\\Strava-Project\\stats-for-strava-config-tool\\public\\config.yaml',
        outputDirectory: 'E:\\Strava-Project\\stats-for-strava-config-tool\\public\\split-test',
        createBackup: false
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('HTTP Error:', response.status, response.statusText);
      console.error('Response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Success!');
    console.log('Created files:', data.fileCount);
    data.createdFiles.forEach(file => {
      console.log(`  - ${file.fileName} (sections: ${file.sections.join(', ')})`);
    });
    if (data.warnings && data.warnings.length > 0) {
      console.log('Warnings:', data.warnings);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSplitConfig();
