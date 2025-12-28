/* eslint-env node */
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import * as YAML from 'yaml';

// Configure runtime to use Node.js
export const runtime = 'nodejs';

// Expected sections from schemas
const EXPECTED_SECTIONS = [
  'general',
  'appearance',
  'import',
  'metrics',
  'gear',
  'zwift',
  'integrations',
  'daemon'
];

export async function POST(request) {
  try {
    const { files, sectionMapping } = await request.json();
    
    if (!files && !sectionMapping) {
      return NextResponse.json({
        success: false,
        error: 'Either files array or sectionMapping is required'
      }, { status: 400 });
    }
    
    let foundSections = new Set();
    
    // If sectionMapping provided, use it directly
    if (sectionMapping) {
      if (typeof sectionMapping === 'object') {
        foundSections = new Set(Object.keys(sectionMapping));
      }
    }
    // Otherwise parse files to find sections
    else if (files && Array.isArray(files)) {
      for (const file of files) {
        try {
          let content;
          if (file.path) {
            content = await fs.readFile(file.path, 'utf8');
          } else if (file.content) {
            content = file.content;
          } else {
            continue;
          }
          
          const parsedData = YAML.parse(content);
          if (parsedData && typeof parsedData === 'object') {
            Object.keys(parsedData).forEach(key => foundSections.add(key));
          }
        } catch (error) {
          console.warn(`Failed to parse ${file.name || file.path}:`, error.message);
        }
      }
    }
    
    // Find missing sections
    const missingSections = EXPECTED_SECTIONS.filter(section => !foundSections.has(section));
    
    // Find extra sections (not in expected list)
    const extraSections = Array.from(foundSections).filter(section => !EXPECTED_SECTIONS.includes(section));
    
    const isComplete = missingSections.length === 0;
    const hasIssues = missingSections.length > 0 || extraSections.length > 0;
    
    return NextResponse.json({
      success: true,
      isComplete,
      hasIssues,
      expectedSections: EXPECTED_SECTIONS,
      foundSections: Array.from(foundSections),
      missingSections,
      extraSections,
      summary: {
        total: EXPECTED_SECTIONS.length,
        found: foundSections.size,
        missing: missingSections.length,
        extra: extraSections.length
      }
    });
    
  } catch (error) {
    console.error('Validate sections API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// GET endpoint to just return expected sections
export async function GET() {
  return NextResponse.json({
    success: true,
    expectedSections: EXPECTED_SECTIONS
  });
}
