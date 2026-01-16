import { NextResponse } from 'next/server';
import yaml from 'yaml';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';

// Configuration for each file type
const CONFIG_SOURCES = {
  config: {
    // Fetch from GitHub repository for always up-to-date content
    url: 'https://raw.githubusercontent.com/robiningelbrecht/statistics-for-strava/master/docs/configuration/config-yaml-example.md',
    fileName: 'config.yaml'
  },
  'gear-maintenance': {
    url: 'https://raw.githubusercontent.com/robiningelbrecht/statistics-for-strava/master/docs/configuration/gear-maintenance.md',
    fileName: 'gear-maintenance.yaml'
  }
};

/**
 * Decode HTML entities in text
 */
function decodeHTMLEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };
  
  return text.replace(/&[a-z]+;|&#\d+;/g, match => {
    return entities[match] || match;
  });
}

/**
 * Clean YAML content (decode entities, normalize line endings)
 */
function cleanYamlContent(text) {
  // Decode HTML entities
  text = decodeHTMLEntities(text);
  
  // Normalize line endings
  text = text.replace(/\r\n/g, '\n');
  
  // Trim whitespace
  return text.trim();
}

/**
 * Extract YAML content from GitHub markdown file
 */
function extractYamlFromMarkdown(markdown) {
  console.log(`[fetch-default-config] Markdown content length: ${markdown.length}`);
  
  // Find YAML code blocks in markdown (```yaml or ```yml)
  const yamlBlockRegex = /```(?:yaml|yml)\s*\n([\s\S]*?)\n```/g;
  const matches = [];
  let match;
  
  while ((match = yamlBlockRegex.exec(markdown)) !== null) {
    matches.push(match[1]);
  }
  
  console.log(`[fetch-default-config] Found ${matches.length} YAML code blocks`);
  
  if (matches.length === 0) {
    throw new Error('No YAML code blocks found in markdown');
  }
  
  // Get the largest code block (most likely the main config)
  const largestBlock = matches.reduce((prev, current) => 
    current.length > prev.length ? current : prev
  );
  
  console.log(`[fetch-default-config] Using largest YAML block (${largestBlock.length} chars)`);
  
  if (!largestBlock || largestBlock.trim().length === 0) {
    throw new Error('Extracted YAML content is empty');
  }
  
  return cleanYamlContent(largestBlock);
}

/**
 * Validate YAML content has minimum required structure
 */
function validateConfigYaml(yamlContent, fileType) {
  try {
    const parsed = yaml.parse(yamlContent);
    
    if (!parsed || typeof parsed !== 'object') {
      return {
        valid: false,
        error: 'YAML does not parse to an object'
      };
    }
    
    // For config.yaml, check for required top-level keys
    if (fileType === 'config') {
      const requiredKeys = ['general', 'athlete'];
      const missingKeys = requiredKeys.filter(key => !(key in parsed));
      
      if (missingKeys.length > 0) {
        return {
          valid: false,
          warning: `Config may be incomplete (missing: ${missingKeys.join(', ')})`
        };
      }
    }
    
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `YAML validation failed: ${error.message}`
    };
  }
}

/**
 * Check if YAML contains placeholder values
 */
function detectPlaceholders(yamlContent) {
  const placeholderPatterns = [
    /\/path\/to\//,
    /your-/i,
    /replace-this/i,
    /<[^>]+>/,
    /\[YOUR_/i
  ];
  
  return placeholderPatterns.some(pattern => pattern.test(yamlContent));
}

/**
 * Load fallback YAML from local file
 */
function loadFallbackYaml(fileName) {
  try {
    const fallbackPath = join(process.cwd(), 'app', 'api', 'fetch-default-config', 'fallbacks', fileName);
    console.log(`[fetch-default-config] Loading fallback from: ${fallbackPath}`);
    const content = readFileSync(fallbackPath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`[fetch-default-config] Error loading fallback file:`, error);
    throw new Error(`Failed to load fallback configuration: ${error.message}`);
  }
}

/**
 * POST /api/fetch-default-config
 * Fetch default configuration YAML from Statistics for Strava docs
 */
export async function POST(request) {
  try {
    const { fileType } = await request.json();
    
    // Validate fileType parameter
    if (!fileType) {
      return NextResponse.json({
        success: false,
        error: 'fileType parameter is required'
      }, { status: 400 });
    }
    
    if (!CONFIG_SOURCES[fileType]) {
      return NextResponse.json({
        success: false,
        error: `Invalid fileType: ${fileType}. Must be 'config' or 'gear-maintenance'`
      }, { status: 400 });
    }
    
    const config = CONFIG_SOURCES[fileType];
    
    console.log(`[fetch-default-config] Fetching ${fileType} from GitHub: ${config.url}`);
    
    // Fetch markdown from GitHub with timeout
    let markdown;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(config.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Stats-for-Strava-Config-Tool/1.0',
          'Accept': 'text/plain'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      markdown = await response.text();
      console.log(`[fetch-default-config] Fetched markdown, length: ${markdown.length}`);
      
    } catch (error) {
      console.error('[fetch-default-config] Fetch error:', error);
      
      if (error.name === 'AbortError') {
        console.log('[fetch-default-config] GitHub fetch timed out, using bundled fallback');
      } else {
        console.log('[fetch-default-config] GitHub fetch failed, using bundled fallback');
      }
      
      // Use bundled fallback only if GitHub is unreachable
      try {
        const fallbackContent = loadFallbackYaml(config.fileName);
        console.log('[fetch-default-config] Successfully loaded bundled fallback');
        return NextResponse.json({
          success: true,
          yamlContent: fallbackContent,
          fileName: config.fileName,
          source: 'bundled-fallback',
          warning: 'GitHub was unreachable. Using bundled fallback which may be outdated.'
        });
      } catch (fallbackError) {
        console.error('[fetch-default-config] Bundled fallback also failed:', fallbackError);
        return NextResponse.json({
          success: false,
          error: `Unable to fetch from GitHub and fallback failed: ${error.message}`
        }, { status: 502 });
      }
    }
    
    // Extract YAML from markdown
    let yamlContent;
    try {
      yamlContent = extractYamlFromMarkdown(markdown);
      console.log(`[fetch-default-config] Successfully extracted YAML from GitHub`);
    } catch (error) {
      console.error('[fetch-default-config] Extraction error:', error);
      console.log('[fetch-default-config] Falling back to bundled default configuration');
      
      // Use bundled fallback if extraction fails
      try {
        yamlContent = loadFallbackYaml(config.fileName);
        console.log('[fetch-default-config] Successfully loaded bundled fallback');
        return NextResponse.json({
          success: true,
          yamlContent,
          fileName: config.fileName,
          source: 'bundled-fallback',
          warning: 'GitHub markdown extraction failed. Using bundled fallback which may be outdated.'
        });
      } catch (fallbackError) {
        console.error('[fetch-default-config] Bundled fallback also failed:', fallbackError);
        return NextResponse.json({
          success: false,
          error: `Failed to extract YAML from GitHub and fallback failed: ${error.message}`
        }, { status: 500 });
      }
    }
    
    // Validate YAML
    const validation = validateConfigYaml(yamlContent, fileType);
    if (!validation.valid && validation.error) {
      console.error('[fetch-default-config] Validation error:', validation.error);
      return NextResponse.json({
        success: false,
        error: validation.error,
        fallbackAvailable: true
      }, { status: 500 });
    }
    
    // Check for placeholders
    const hasPlaceholders = detectPlaceholders(yamlContent);
    
    // Success!
    return NextResponse.json({
      success: true,
      content: yamlContent,
      source: config.url,
      fileName: config.fileName,
      extractedAt: new Date().toISOString(),
      hasPlaceholders,
      warning: validation.warning || null
    });
    
  } catch (error) {
    console.error('[fetch-default-config] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: `Unexpected error: ${error.message}`
    }, { status: 500 });
  }
}
