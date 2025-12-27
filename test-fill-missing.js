import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testFillMissing() {
  console.log('Testing fillMissing functionality...\n');
  
  // Create a test file with only general section
  const testDir = path.join(__dirname, 'test-fill-missing');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const partialConfig = `general:
  athlete:
    firstName: John
    lastName: Doe
`;
  
  const testFile = path.join(testDir, 'config-partial.yaml');
  fs.writeFileSync(testFile, partialConfig, 'utf8');
  console.log('✓ Created partial config with only general section');
  
  // Test merge with fillMissing=false (original behavior)
  console.log('\n1. Testing merge WITHOUT fillMissing...');
  try {
    const response1 = await fetch('http://localhost:3000/api/merge-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: [{ name: 'config-partial.yaml', path: testFile }],
        outputPath: path.join(testDir, 'config-no-fill.yaml'),
        createBackup: false,
        fillMissing: false
      })
    });
    
    const result1 = await response1.json();
    if (result1.success) {
      console.log(`✓ Merged ${result1.sectionsCount} sections (expected: 1)`);
      const content1 = fs.readFileSync(path.join(testDir, 'config-no-fill.yaml'), 'utf8');
      const sectionCount1 = (content1.match(/^[a-z]+:/gm) || []).length;
      console.log(`  File contains ${sectionCount1} top-level sections`);
    } else {
      console.log(`✗ Merge failed: ${result1.error}`);
    }
  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
  }
  
  // Test merge with fillMissing=true (new behavior)
  console.log('\n2. Testing merge WITH fillMissing=true...');
  try {
    const response2 = await fetch('http://localhost:3000/api/merge-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: [{ name: 'config-partial.yaml', path: testFile }],
        outputPath: path.join(testDir, 'config-with-fill.yaml'),
        createBackup: false,
        fillMissing: true
      })
    });
    
    const result2 = await response2.json();
    if (result2.success) {
      console.log(`✓ Merged ${result2.sectionsCount} sections (expected: 8)`);
      
      if (result2.warnings && result2.warnings.length > 0) {
        console.log('\n  Warnings:');
        result2.warnings.forEach(w => console.log(`  - ${w}`));
      }
      
      const content2 = fs.readFileSync(path.join(testDir, 'config-with-fill.yaml'), 'utf8');
      const sectionCount2 = (content2.match(/^[a-z]+:/gm) || []).length;
      console.log(`\n  File contains ${sectionCount2} top-level sections`);
      
      // Check for each expected section
      const expectedSections = ['general', 'appearance', 'import', 'metrics', 'gear', 'zwift', 'integrations', 'daemon'];
      console.log('\n  Section verification:');
      expectedSections.forEach(section => {
        const found = content2.includes(`${section}:`);
        console.log(`  ${found ? '✓' : '✗'} ${section}`);
      });
      
      // Show first 50 lines of output
      console.log('\n  First 50 lines of generated file:');
      const lines = content2.split('\n').slice(0, 50);
      lines.forEach(line => console.log(`  ${line}`));
      
      if (content2.split('\n').length > 50) {
        console.log(`  ... (${content2.split('\n').length - 50} more lines)`);
      }
    } else {
      console.log(`✗ Merge failed: ${result2.error}`);
    }
  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
  }
  
  console.log('\n✓ Test complete!');
  console.log(`\nTest files created in: ${testDir}`);
}

testFillMissing().catch(console.error);
