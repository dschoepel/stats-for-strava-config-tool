// Quick test of split functionality
import { splitConfigFile } from './src/utils/configSplitter.js';
import fs from 'fs';

async function testSplitUI() {
  console.log('Testing Split Config Functionality...\n');
  
  try {
    // Read the sample config file
    const configPath = './public/config.yaml';
    const content = fs.readFileSync(configPath, 'utf8');
    
    console.log('✓ Loaded config file:', configPath);
    console.log('  File size:', content.length, 'bytes\n');
    
    // Test split functionality
    const result = await splitConfigFile(content);
    
    if (!result.success) {
      console.error('✗ Split failed:', result.error);
      return;
    }
    
    console.log('✓ Split successful!');
    console.log('  Files created:', result.files.length);
    console.log('');
    
    // Display created files
    result.files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.fileName}`);
      console.log(`   Sections: ${file.sections.join(', ')}`);
      console.log(`   Size: ${file.content.length} bytes`);
      console.log(`   Lines: ${file.content.split('\n').length}`);
      console.log('');
    });
    
    console.log('✓ All tests passed!');
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error(error.stack);
  }
}

testSplitUI();
