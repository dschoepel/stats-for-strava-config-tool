/* eslint-env node */
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import * as YAML from 'yaml';

// Configure runtime to use Node.js
export const runtime = 'nodejs';

// Fallback function to preserve comments using text replacement
async function preserveCommentsWithTextReplacement(originalContent, sectionName, sectionData, isAthlete) {
  try {
    console.log(`Using text replacement fallback for section: ${sectionName}, isAthlete: ${isAthlete}`);
    const lines = originalContent.split('\n');
    const result = [];
    let inTargetSection = false;
    let sectionIndent = 0;
    let i = 0;
    
    // Generate the new YAML content for the section
    const newSectionYaml = YAML.stringify(sectionData, {
      indent: 2,
      lineWidth: 0,
      minContentWidth: 0,
      singleQuote: false
    }).trim();
    
    console.log('New section YAML:', newSectionYaml);
    
    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (isAthlete) {
        // Handle athlete section (nested under general)
        if (trimmedLine === 'general:') {
          result.push(line);
          i++;
          // Look for athlete subsection
          while (i < lines.length) {
            const subLine = lines[i];
            const subTrimmed = subLine.trim();
            
            if (subTrimmed === 'athlete:') {
              result.push(subLine);
              const athleteIndent = subLine.length - subLine.trimStart().length;
              
              // Parse the athlete section to preserve comments in their proper positions
              const commentMap = new Map(); // key -> array of comments that precede it
              let commentParseIndex = i + 1;
              let currentComments = [];
              
              // First pass: collect comments and associate them with the immediately following key
              while (commentParseIndex < lines.length) {
                const nextLine = lines[commentParseIndex];
                const nextTrimmed = nextLine.trim();
                const nextIndent = nextLine.length - nextLine.trimStart().length;
                
                // Stop if we reach a section at the same level as athlete or higher
                if (nextTrimmed && nextIndent <= athleteIndent && !nextTrimmed.startsWith('#')) {
                  break;
                }
                
                if (nextTrimmed.startsWith('#') && nextIndent > athleteIndent) {
                  // This is a comment within athlete section
                  currentComments.push(nextLine);
                } else if (nextTrimmed.includes(':') && nextIndent > athleteIndent) {
                  // This is a key-value pair - but only collect for direct athlete children
                  const key = nextTrimmed.split(':')[0].trim();
                  const keyIndent = nextIndent;
                  
                  // Only collect comments for direct children of athlete (not nested keys)
                  if (keyIndent === athleteIndent + 2) {
                    if (currentComments.length > 0) {
                      // Only associate comments with this key if we haven't processed it yet
                      if (!commentMap.has(key)) {

                        commentMap.set(key, [...currentComments]);
                      }
                      currentComments = []; // Clear comments after associating with a key
                    }
                  }
                } else if (nextTrimmed === '') {
                  // Empty line - don't clear comments, they might belong to next key
                  // Keep currentComments for next key
                }
                
                commentParseIndex++;
              }
              
              // For athlete section, handle both simple fields and specific complex objects like heartRateZones
              // Build a map of what we can safely update
              const simpleFields = {};
              const complexFieldsToUpdate = {}; // For complex objects we want to completely replace
              
              Object.entries(sectionData).forEach(([key, value]) => {
                if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                  simpleFields[key] = value;
                } else if (key === 'heartRateZones' || key === 'ftpHistory') {
                  // These complex objects should be completely replaced
                  complexFieldsToUpdate[key] = value;
                }
                // Other complex objects like weightHistory are preserved from original
              });
              
              // Now go through the original content and update fields
              let updateIndex = i + 1;
              while (updateIndex < lines.length) {
                const nextLine = lines[updateIndex];
                const nextTrimmed = nextLine.trim();
                const nextIndent = nextLine.length - nextLine.trimStart().length;
                
                // Stop if we reach a section at the same level as athlete or higher
                if (nextTrimmed && nextIndent <= athleteIndent && !nextTrimmed.startsWith('#')) {
                  break;
                }
                
                // Check if this line is a field we want to update
                if (nextTrimmed.includes(':') && nextIndent > athleteIndent) {
                  const key = nextTrimmed.split(':')[0].trim();
                  
                  if (simpleFields.hasOwnProperty(key)) {
                    // Handle simple fields
                    // Add any comments that precede this key
                    if (commentMap.has(key)) {

                      commentMap.get(key).forEach(comment => result.push(comment));
                      commentMap.delete(key); // Remove to prevent duplication
                    }
                    
                    // Update this field with new value
                    const baseIndent = ' '.repeat(nextIndent);
                    let valueStr;
                    const value = simpleFields[key];
                    
                    if (value === null) {
                      valueStr = 'null';
                    } else if (typeof value === 'string') {
                      if (value.startsWith('http://') || value.startsWith('https://') || value.includes(' ')) {
                        valueStr = `'${value}'`;
                      } else {
                        valueStr = value;
                      }
                    } else {
                      valueStr = String(value);
                    }
                    
                    result.push(`${baseIndent}${key}: ${valueStr}`);
                    delete simpleFields[key]; // Mark as processed
                  } else if (complexFieldsToUpdate.hasOwnProperty(key)) {
                    // Handle complex fields - replace entirely with new YAML
                    // Add any comments that precede this key
                    if (commentMap.has(key)) {

                      commentMap.get(key).forEach(comment => result.push(comment));
                      commentMap.delete(key); // Remove to prevent duplication
                    }
                    
                    // Generate YAML for the complex object and add proper indentation
                    const baseIndent = ' '.repeat(nextIndent);
                    const complexYaml = YAML.stringify({ [key]: complexFieldsToUpdate[key] }, {
                      indent: 2,
                      lineWidth: 0,
                      minContentWidth: 0,
                      singleQuote: false
                    }).trim();
                    
                    // Add each line with proper indentation
                    const complexLines = complexYaml.split('\n');
                    complexLines.forEach((complexLine, index) => {
                      if (index === 0) {
                        // First line already has the key, just ensure proper indentation
                        result.push(baseIndent + complexLine.trimStart());
                      } else {
                        // Additional lines need base indentation plus their relative indentation
                        result.push(baseIndent + complexLine);
                      }
                    });
                    
                    // Skip all lines of the original complex object
                    let skipIndex = updateIndex + 1;
                    while (skipIndex < lines.length) {
                      const skipLine = lines[skipIndex];
                      const skipTrimmed = skipLine.trim();
                      const skipIndent = skipLine.length - skipLine.trimStart().length;
                      
                      // Stop skipping when we find a line at the same level as our key or higher
                      if (skipTrimmed && skipIndent <= nextIndent && !skipTrimmed.startsWith('#')) {
                        break;
                      }
                      skipIndex++;
                    }
                    updateIndex = skipIndex - 1; // Will be incremented at the end of loop
                    
                    delete complexFieldsToUpdate[key]; // Mark as processed
                  } else {
                    // Preserve original line for fields we don't update
                    result.push(nextLine);
                  }
                } else {
                  // Preserve comments and non-field lines
                  result.push(nextLine);
                }
                
                updateIndex++;
              }
              
              // Add any remaining simple fields that weren't found in the original
              const baseIndent = ' '.repeat(athleteIndent + 2);
              Object.entries(simpleFields).forEach(([key, value]) => {
                if (commentMap.has(key)) {

                  commentMap.get(key).forEach(comment => result.push(comment));
                }
                
                let valueStr;
                if (value === null) {
                  valueStr = 'null';
                } else if (typeof value === 'string') {
                  if (value.startsWith('http://') || value.startsWith('https://') || value.includes(' ')) {
                    valueStr = `'${value}'`;
                  } else {
                    valueStr = value;
                  }
                } else {
                  valueStr = String(value);
                }
                
                result.push(`${baseIndent}${key}: ${valueStr}`);
              });
              
              // Add any remaining complex fields that weren't found in the original
              Object.entries(complexFieldsToUpdate).forEach(([key, value]) => {
                if (commentMap.has(key)) {

                  commentMap.get(key).forEach(comment => result.push(comment));
                }
                
                // Generate YAML for the complex object
                const complexYaml = YAML.stringify({ [key]: value }, {
                  indent: 2,
                  lineWidth: 0,
                  minContentWidth: 0,
                  singleQuote: false
                }).trim();
                
                // Add each line with proper indentation
                const complexLines = complexYaml.split('\n');
                complexLines.forEach((complexLine, index) => {
                  if (index === 0) {
                    result.push(baseIndent + complexLine.trimStart());
                  } else {
                    result.push(baseIndent + complexLine);
                  }
                });
              });
              
              // Set i to where we left off and break out of the general section loop
              i = updateIndex - 1; // Subtract 1 because the outer loop will increment
              break;
            } else {
              result.push(subLine);
              i++;
            }
          }
        } else {
          result.push(line);
          i++;
        }
      } else {
        // Handle top-level sections
        if (trimmedLine === `${sectionName}:`) {
          result.push(line);
          sectionIndent = line.length - line.trimStart().length;
          
          // Parse the original section to preserve comments in their proper positions
          const commentMap = new Map(); // key -> array of comments that precede it
          let generalParseIndex = i + 1;
          let currentComments = [];
          let nextKey = null;
          
          // First pass: collect comments and associate them with the immediately following key
          let lastProcessedKey = null;
          while (generalParseIndex < lines.length) {
            const nextLine = lines[generalParseIndex];
            const nextTrimmed = nextLine.trim();
            const nextIndent = nextLine.length - nextLine.trimStart().length;
            
            // Stop if we reach the next top-level section
            if (nextTrimmed && nextIndent <= sectionIndent && !nextTrimmed.startsWith('#')) {
              break;
            }
            
            if (nextTrimmed.startsWith('#') && nextIndent > sectionIndent) {
              // This is a comment within our section
              currentComments.push(nextLine);
            } else if (nextTrimmed.includes(':') && nextIndent > sectionIndent) {
              // This is a key-value pair
              const key = nextTrimmed.split(':')[0].trim();
              if (currentComments.length > 0 && key !== lastProcessedKey) {
                // Only associate comments with this key if we haven't processed it yet
                if (!commentMap.has(key)) {
                  console.log(`Collecting comments for key '${key}':`, currentComments.map(c => c.trim()));
                  commentMap.set(key, [...currentComments]);
                  lastProcessedKey = key;
                }
                currentComments = []; // Clear comments after associating with a key
              }
            } else if (nextTrimmed === '') {
              // Empty line - don't clear comments, they might belong to next key
              // Keep currentComments for next key
            } else if (nextIndent > sectionIndent) {
              // This might be a continuation of a complex value, reset comment collection
              if (lastProcessedKey) {
                currentComments = []; // Clear orphaned comments
              }
            }
            
            generalParseIndex++;
          }
          
          // Now rebuild the section with comments in proper positions
          const baseIndent = ' '.repeat(sectionIndent + 2);
          
          Object.entries(sectionData).forEach(([key, value]) => {
            // Add any comments that precede this key
            if (commentMap.has(key)) {

              commentMap.get(key).forEach(comment => result.push(comment));
              commentMap.delete(key); // Remove to prevent duplication
            }
            
            // Add the key-value pair
            let valueStr;
            if (value === null) {
              valueStr = 'null';
            } else if (typeof value === 'string') {
              // Always quote URLs and strings with spaces
              if (value.startsWith('http://') || value.startsWith('https://') || value.includes(' ')) {
                valueStr = `'${value}'`;
              } else {
                valueStr = value;
              }
            } else {
              valueStr = String(value);
            }
            
            result.push(`${baseIndent}${key}: ${valueStr}`);
          });
          
          // Skip original section content
          i++;
          while (i < lines.length) {
            const nextLine = lines[i];
            const nextTrimmed = nextLine.trim();
            const nextIndent = nextLine.length - nextLine.trimStart().length;
            
            // Stop if we find a top-level section
            if (nextTrimmed && nextIndent <= sectionIndent && !nextTrimmed.startsWith('#')) {
              break;
            }
            i++;
          }
        } else {
          result.push(line);
          i++;
        }
      }
    }
    
    return result.join('\n');
  } catch (error) {
    console.warn('Text replacement fallback failed:', error.message);
    
    // Final fallback - just recreate the whole file
    const originalData = YAML.parse(originalContent);
    if (isAthlete) {
      if (!originalData.general) originalData.general = {};
      originalData.general.athlete = sectionData;
    } else {
      originalData[sectionName] = sectionData;
    }
    
    return YAML.stringify(originalData, {
      indent: 2,
      lineWidth: 0,
      minContentWidth: 0,
      singleQuote: false
    });
  }
}

export async function POST(request) {
  try {
    const { filePath, sectionName, sectionData, isAthlete } = await request.json();
    
    if (!filePath || !sectionName || sectionData === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: filePath, sectionName, sectionData'
      }, { status: 400 });
    }

    // Read the existing YAML file
    const content = await fs.readFile(filePath, 'utf8');
    console.log('Original file has comments:', content.includes('#'));
    console.log('Original content preview:', content.substring(0, 200) + '...');
    
    // Parse YAML to validate and get current data
    const yamlData = YAML.parse(content);
    
    if (!yamlData || typeof yamlData !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Invalid YAML file format'
      }, { status: 400 });
    }

    // Update the data structure
    if (isAthlete) {
      // Athlete section is nested under general.athlete
      if (!yamlData.general) {
        yamlData.general = {};
      }
      yamlData.general.athlete = sectionData;
    } else {
      // Other sections are top-level
      yamlData[sectionName] = sectionData;
    }

    // Try YAML library's built-in comment preservation first
    console.log('Using YAML library comment preservation...');
    let updatedYaml;
    
    try {
      // Parse with comment preservation
      const doc = YAML.parseDocument(content, { keepCstNodes: true });
      
      // Update the data structure
      if (isAthlete) {
        // Athlete section is nested under general.athlete
        if (!doc.contents.get('general')) {
          doc.contents.set('general', doc.createNode({}));
        }
        const general = doc.contents.get('general');
        general.set('athlete', doc.createNode(sectionData));
      } else {
        // Other sections are top-level
        doc.contents.set(sectionName, doc.createNode(sectionData));
      }
      
      // Convert back to string with preserved comments
      updatedYaml = doc.toString();
      console.log('YAML library comment preservation successful');
    } catch (error) {
      console.log('YAML library approach failed, falling back to simple replacement:', error.message);
      
      // Simple fallback - update data structure and re-stringify
      if (isAthlete) {
        if (!yamlData.general) yamlData.general = {};
        yamlData.general.athlete = sectionData;
      } else {
        yamlData[sectionName] = sectionData;
      }
      
      updatedYaml = YAML.stringify(yamlData, {
        indent: 2,
        lineWidth: 0,
        minContentWidth: 0,
        singleQuote: false
      });
    }

    // Write the updated YAML back to the file
    await fs.writeFile(filePath, updatedYaml, 'utf8');

    // Debug: Check if comments were preserved
    const hasComments = updatedYaml.includes('#');
    console.log(`Comments preserved: ${hasComments}`);
    console.log('Updated YAML preview:', updatedYaml.substring(0, 200) + '...');

    return NextResponse.json({
      success: true,
      message: `Section '${sectionName}' updated successfully`,
      filePath: filePath,
      debug: {
        commentsPreserved: hasComments,
        yamlPreview: updatedYaml.substring(0, 200)
      }
    });

  } catch (error) {
    console.error('Update section API error:', error);
    
    // Provide more specific error messages
    if (error.code === 'ENOENT') {
      return NextResponse.json({
        success: false,
        error: 'Configuration file not found'
      }, { status: 404 });
    }
    
    if (error.name === 'YAMLException') {
      return NextResponse.json({
        success: false,
        error: 'Invalid YAML format in file'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}