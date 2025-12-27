/* eslint-env node */
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import * as YAML from 'yaml';

// Configure runtime to use Node.js
export const runtime = 'nodejs';

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
                    const needsQuoting = /[:#[\]{}*&!|>'"@`%]|^\s|\s$|^-\s/.test(value);
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
                    complexYaml = complexYaml.replace(/(\s+)(\d{4}-\d{2}-\d{2}):/g, "$1'$2':");
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
                  const needsQuoting = /[:#[\]{}*&!|>'"@`%]|^\s|\s$|^-\s/.test(value);
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
                  complexYaml = complexYaml.replace(/(\s+)(\d{4}-\d{2}-\d{2}):/g, "$1'$2':");
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
        // Handle top-level sections
        if (trimmedLine === `${sectionName}:`) {
          result.push(line);
          const sectionIndent = line.length - line.trimStart().length;
          
          // Add new section data with proper quoting
          const baseIndent = ' '.repeat(sectionIndent + 2);
          Object.entries(sectionData).forEach(([key, value]) => {
            let valueStr;
            if (value === null) {
              valueStr = 'null';
            } else if (typeof value === 'string') {
              // Check if string needs quoting for YAML special characters
              const needsQuoting = /[:#[\]{}*&!|>'"@`%]|^\s|\s$|^-\s/.test(value);
              if (needsQuoting) {
                // Escape single quotes by doubling them
                valueStr = `'${value.replace(/'/g, "''")}'`;
              } else {
                valueStr = value;
              }
            } else if (typeof value === 'object' && value !== null) {
              // Handle complex objects like heartRateZones
              let complexYaml = YAML.stringify({ [key]: value }, {
                indent: 2,
                lineWidth: 0,
                minContentWidth: 0,
                singleQuote: true
              }).trim();
              
              // Post-process to ensure date keys (YYYY-MM-DD format) are quoted
              complexYaml = complexYaml.replace(/(\s+)(\d{4}-\d{2}-\d{2}):/g, "$1'$2':");
              
              const complexLines = complexYaml.split('\n');
              complexLines.forEach((complexLine, index) => {
                if (index === 0) {
                  result.push(baseIndent + complexLine.trimStart());
                } else {
                  result.push(baseIndent + complexLine);
                }
              });
              return; // Skip the simple field handling below
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
    
    updatedYaml = result.join('\n');

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