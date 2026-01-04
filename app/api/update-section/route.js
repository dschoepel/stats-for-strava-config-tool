/* eslint-env node */
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import * as YAML from 'yaml';

// Configure runtime to use Node.js
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { filePath, sectionName, sectionData, isAthlete, preserveNestedKeys = [] } = await request.json();
    
    if (!filePath || !sectionName || sectionData === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: filePath, sectionName, sectionData'
      }, { status: 400 });
    }
    
    console.log('Updating section:', sectionName);
    if (preserveNestedKeys.length > 0) {
      console.log('Will preserve nested keys:', preserveNestedKeys);
    }

    // Check if this is a nested section (e.g., "appearance.dashboard")
    const isNestedSection = sectionName.includes('.');
    let topLevelKey, secondLevelKey;
    
    if (isNestedSection) {
      [topLevelKey, secondLevelKey] = sectionName.split('.');
    }

    // Read the existing YAML file
    const content = await fs.readFile(filePath, 'utf8');
    
    // Validate file is not empty
    if (!content || content.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Configuration file is empty. Please restore from backup before saving.'
      }, { status: 400 });
    }
    
    console.log('Original file has comments:', content.includes('#'));
    console.log('Original content preview:', content.substring(0, 200) + '...');
    
    // Try to parse YAML for validation, but don't fail if it's invalid
    // (we'll fix it during text replacement)
    try {
      const yamlData = YAML.parse(content);
      if (!yamlData || typeof yamlData !== 'object') {
        console.warn('YAML file format seems invalid, but will attempt to update via text replacement');
      }
    } catch (parseError) {
      console.warn('YAML parse error (will be fixed during update):', parseError.message);
      // Continue anyway - we'll fix invalid YAML during text replacement
    }

    // Use custom text replacement approach to preserve comments and fix quoting
    console.log('Using custom text replacement with proper quoting...');
    let updatedYaml;
    
    // Custom text replacement that handles proper quoting
    const lines = content.split('\n');
    const result = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (isAthlete) {
        // Handle athlete section (nested under general)
        if (trimmedLine === 'general:') {
          result.push(line);
          i++;
          let foundAthlete = false;
          let generalIndent = line.length - line.trimStart().length;
          
          // Look for athlete subsection
          while (i < lines.length) {
            const subLine = lines[i];
            const subTrimmed = subLine.trim();
            const subIndent = subLine.length - subLine.trimStart().length;
            
            // If we hit another top-level section, we need to insert athlete before it
            if (subTrimmed && subIndent <= generalIndent && !subTrimmed.startsWith('#')) {
              if (!foundAthlete) {
                // Insert athlete section before this top-level section
                const athleteIndent = ' '.repeat(generalIndent + 2);
                result.push(`${athleteIndent}athlete:`);
                const baseIndent = ' '.repeat(generalIndent + 4);
                Object.entries(sectionData).forEach(([key, value]) => {
                  let valueStr;
                  if (value === null) {
                    valueStr = 'null';
                  } else if (typeof value === 'string') {
                    // Always quote birthday field and date-like values (YYYY-MM-DD format)
                    const isDateValue = /^\d{4}-\d{2}-\d{2}$/.test(value);
                    const needsQuoting = key === 'birthday' || isDateValue || /[:#[\]{}*&!|>'"@`%]|^\s|\s$|^-\s/.test(value);
                    if (needsQuoting) {
                      valueStr = `'${value.replace(/'/g, "''")}'`;
                    } else {
                      valueStr = value;
                    }
                  } else if (typeof value === 'object' && value !== null) {
                    let complexYaml = YAML.stringify({ [key]: value }, {
                      indent: 2,
                      lineWidth: 0,
                      minContentWidth: 0,
                      singleQuote: true
                    }).trim();
                    // Quote both date keys and date values
                    complexYaml = complexYaml.replace(/(\s+)(\d{4}-\d{2}-\d{2}):/g, "$1'$2':");
                    complexYaml = complexYaml.replace(/: (\d{4}-\d{2}-\d{2})$/gm, ": '$1'");
                    const complexLines = complexYaml.split('\n');
                    complexLines.forEach((complexLine, index) => {
                      if (index === 0) {
                        result.push(baseIndent + complexLine.trimStart());
                      } else {
                        result.push(baseIndent + complexLine);
                      }
                    });
                    return;
                  } else {
                    valueStr = String(value);
                  }
                  result.push(`${baseIndent}${key}: ${valueStr}`);
                });
              }
              break;
            }
            
            if (subTrimmed === 'athlete:') {
              foundAthlete = true;
              result.push(subLine);
              const athleteIndent = subLine.length - subLine.trimStart().length;
              
              // Add new athlete data with proper quoting
              const baseIndent = ' '.repeat(athleteIndent + 2);
              Object.entries(sectionData).forEach(([key, value]) => {
                let valueStr;
                if (value === null) {
                  valueStr = 'null';
                } else if (typeof value === 'string') {
                  // Always quote birthday field and date-like values (YYYY-MM-DD format)
                  const isDateValue = /^\d{4}-\d{2}-\d{2}$/.test(value);
                  const needsQuoting = key === 'birthday' || isDateValue || /[:#[\]{}*&!|>'"@`%]|^\s|\s$|^-\s/.test(value);
                  if (needsQuoting) {
                    valueStr = `'${value.replace(/'/g, "''")}'`;
                  } else {
                    valueStr = value;
                  }
                } else if (typeof value === 'object' && value !== null) {
                  let complexYaml = YAML.stringify({ [key]: value }, {
                    indent: 2,
                    lineWidth: 0,
                    minContentWidth: 0,
                    singleQuote: true
                  }).trim();
                  // Quote both date keys and date values
                  complexYaml = complexYaml.replace(/(\s+)(\d{4}-\d{2}-\d{2}):/g, "$1'$2':");
                  complexYaml = complexYaml.replace(/: (\d{4}-\d{2}-\d{2})$/gm, ": '$1'");
                  const complexLines = complexYaml.split('\n');
                  complexLines.forEach((complexLine, index) => {
                    if (index === 0) {
                      result.push(baseIndent + complexLine.trimStart());
                    } else {
                      result.push(baseIndent + complexLine);
                    }
                  });
                  return;
                } else {
                  valueStr = String(value);
                }
                result.push(`${baseIndent}${key}: ${valueStr}`);
              });
              
              // Skip original athlete section content
              i++;
              while (i < lines.length) {
                const nextLine = lines[i];
                const nextTrimmed = nextLine.trim();
                const nextIndent = nextLine.length - nextLine.trimStart().length;
                
                // Stop if we find a section at the same level as athlete or higher
                if (nextTrimmed && nextIndent <= athleteIndent && !nextTrimmed.startsWith('#')) {
                  break;
                }
                i++;
              }
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
        // Handle top-level sections or nested sections
        const targetKey = isNestedSection ? topLevelKey : sectionName;
        
        if (trimmedLine === `${targetKey}:`) {
          result.push(line);
          const sectionIndent = line.length - line.trimStart().length;
          
          if (isNestedSection) {
            // For nested sections, we need to find and update the second-level key
            i++;
            let foundSecondLevel = false;
            
            while (i < lines.length) {
              const subLine = lines[i];
              const subTrimmed = subLine.trim();
              const subIndent = subLine.length - subLine.trimStart().length;
              
              // Stop if we hit another top-level section
              if (subTrimmed && subIndent <= sectionIndent && !subTrimmed.startsWith('#')) {
                // If we didn't find the second-level key, add it before this line
                if (!foundSecondLevel) {
                  const secondLevelIndent = ' '.repeat(sectionIndent + 2);
                  result.push(`${secondLevelIndent}${secondLevelKey}:`);
                  const baseIndent = ' '.repeat(sectionIndent + 4);
                  Object.entries(sectionData).forEach(([key, value]) => {
                    addYamlField(result, baseIndent, key, value);
                  });
                }
                break;
              }
              
              if (subTrimmed === `${secondLevelKey}:`) {
                foundSecondLevel = true;
                result.push(subLine);
                const secondLevelIndent = subLine.length - subLine.trimStart().length;
                
                // Add new data for the second-level key
                const baseIndent = ' '.repeat(secondLevelIndent + 2);
                Object.entries(sectionData).forEach(([key, value]) => {
                  addYamlField(result, baseIndent, key, value);
                });
                
                // Skip original second-level section content
                i++;
                while (i < lines.length) {
                  const nextLine = lines[i];
                  const nextTrimmed = nextLine.trim();
                  const nextIndent = nextLine.length - nextLine.trimStart().length;
                  
                  // Stop if we find a section at the same level as secondLevelKey or higher
                  if (nextTrimmed && nextIndent <= secondLevelIndent && !nextTrimmed.startsWith('#')) {
                    break;
                  }
                  i++;
                }
                break;
              } else {
                result.push(subLine);
                i++;
              }
            }
            
            // If we reached the end without finding second-level key, add it
            if (!foundSecondLevel) {
              const secondLevelIndent = ' '.repeat(sectionIndent + 2);
              result.push(`${secondLevelIndent}${secondLevelKey}:`);
              const baseIndent = ' '.repeat(sectionIndent + 4);
              Object.entries(sectionData).forEach(([key, value]) => {
                addYamlField(result, baseIndent, key, value);
              });
            }
          } else {
            // Handle top-level sections (original logic)
            const baseIndent = ' '.repeat(sectionIndent + 2);
            
            // First, add the data fields we're updating
            Object.entries(sectionData).forEach(([key, value]) => {
              addYamlField(result, baseIndent, key, value);
            });
            
            // Skip original section content, BUT preserve nested keys that we should keep
            i++;
            while (i < lines.length) {
              const nextLine = lines[i];
              const nextTrimmed = nextLine.trim();
              const nextIndent = nextLine.length - nextLine.trimStart().length;
              
              // Stop if we find a top-level section
              if (nextTrimmed && nextIndent <= sectionIndent && !nextTrimmed.startsWith('#')) {
                break;
              }
              
              // Check if this is a nested key we should preserve
              if (preserveNestedKeys.length > 0 && nextIndent === sectionIndent + 2) {
                const match = nextTrimmed.match(/^(\w+):/);
                if (match && preserveNestedKeys.includes(match[1])) {
                  // This is a nested key we need to preserve - copy it and its content
                  result.push(nextLine);
                  const nestedKeyIndent = nextIndent;
                  i++;
                  
                  // Copy all content under this nested key
                  while (i < lines.length) {
                    const nestedLine = lines[i];
                    const nestedTrimmed = nestedLine.trim();
                    const nestedLineIndent = nestedLine.length - nestedLine.trimStart().length;
                    
                    // Stop if we hit same-level or higher
                    if (nestedTrimmed && nestedLineIndent <= nestedKeyIndent && !nestedTrimmed.startsWith('#')) {
                      break;
                    }
                    
                    result.push(nestedLine);
                    i++;
                  }
                  continue;
                }
              }
              
              i++;
            }
          }
        } else {
          result.push(line);
          i++;
        }
      }
    }
    
    // Helper function to add a YAML field with proper formatting
    function addYamlField(result, baseIndent, key, value) {
      let valueStr;
      if (value === null) {
        valueStr = 'null';
      } else if (typeof value === 'string') {
        // Always quote birthday field and date-like values (YYYY-MM-DD format)
        const isDateValue = /^\d{4}-\d{2}-\d{2}$/.test(value);
        const needsQuoting = key === 'birthday' || isDateValue || /[:#[\]{}*&!|>'"@`%]|^\s|\s$|^-\s/.test(value);
        if (needsQuoting) {
          valueStr = `'${value.replace(/'/g, "''")}'`;
        } else {
          valueStr = value;
        }
      } else if (typeof value === 'object' && value !== null) {
        let complexYaml = YAML.stringify({ [key]: value }, {
          indent: 2,
          lineWidth: 0,
          minContentWidth: 0,
          singleQuote: true
        }).trim();
        // Quote both date keys and date values
        complexYaml = complexYaml.replace(/(\s+)(\d{4}-\d{2}-\d{2}):/g, "$1'$2':");
        complexYaml = complexYaml.replace(/: (\d{4}-\d{2}-\d{2})$/gm, ": '$1'");
        const complexLines = complexYaml.split('\n');
        complexLines.forEach((complexLine, index) => {
          if (index === 0) {
            result.push(baseIndent + complexLine.trimStart());
          } else {
            result.push(baseIndent + complexLine);
          }
        });
        return;
      } else {
        valueStr = String(value);
      }
      result.push(`${baseIndent}${key}: ${valueStr}`);
    }
    
    updatedYaml = result.join('\n');
    
    // Safety check: don't save if result is empty or too short
    if (!updatedYaml || updatedYaml.trim().length < 10) {
      console.error('Generated YAML is empty or too short, aborting save');
      console.error('Result array length:', result.length);
      console.error('Result preview:', result.slice(0, 10));
      return NextResponse.json({
        success: false,
        error: 'Generated YAML is invalid (too short). This is a bug - please report it.'
      }, { status: 500 });
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