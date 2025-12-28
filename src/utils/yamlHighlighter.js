/**
 * YAML Syntax Highlighter
 * Provides syntax highlighting for YAML content
 */

/**
 * Tokenizes YAML content for syntax highlighting
 * @param {string} content - Raw YAML content
 * @returns {string} - HTML with syntax highlighting classes
 */
export const highlightYaml = (content) => {
  if (!content) return '';
  
  const lines = content.split('\n');
  const highlightedLines = lines.map(line => highlightYamlLine(line));
  
  return highlightedLines.join('\n');
};

/**
 * Highlights a single line of YAML
 * @param {string} line - Single line of YAML
 * @returns {string} - HTML with highlighting classes
 */
const highlightYamlLine = (line) => {
  let result = line;
  
  // Skip empty lines
  if (!result.trim()) {
    return result;
  }
  
  // Check if line is a comment
  const commentMatch = result.match(/^(\s*)(#.*)$/);
  if (commentMatch) {
    return `${commentMatch[1]}<span class="yaml-comment">${commentMatch[2]}</span>`;
  }
  
  // Check if line is a document separator
  if (result.match(/^(---|\.\.\.)\s*$/)) {
    return `<span class="yaml-separator">${result}</span>`;
  }
  
  // Check if line starts with a list marker
  const listMatch = result.match(/^(\s*)(-\s+)(.*)$/);
  if (listMatch) {
    const [, indent, marker, rest] = listMatch;
    return `${indent}<span class="yaml-list-marker">${marker}</span>${highlightValue(rest)}`;
  }
  
  // Check if line has a key-value pair
  const keyValueMatch = result.match(/^(\s*)([^:\s][^:]*?)(\s*:\s*)(.*)$/);
  if (keyValueMatch) {
    const [, indent, key, colon, value] = keyValueMatch;
    return `${indent}<span class="yaml-key">${key}</span><span class="yaml-colon">${colon}</span>${highlightValue(value)}`;
  }
  
  // If no special pattern matches, just highlight as a value
  return highlightValue(result);
};

/**
 * Highlights YAML values (strings, numbers, booleans, etc.)
 * @param {string} value - The value part to highlight
 * @returns {string} - Highlighted value
 */
const highlightValue = (value) => {
  if (!value.trim()) {
    return value;
  }
  
  // Quoted strings (single or double quotes)
  if (value.match(/^['"].*['"]$/)) {
    return `<span class="yaml-string">${value}</span>`;
  }
  
  // Numbers
  if (value.match(/^\s*-?\d+(\.\d+)?\s*$/)) {
    return `<span class="yaml-number">${value}</span>`;
  }
  
  // Booleans
  if (value.match(/^\s*(true|false|yes|no|on|off)\s*$/i)) {
    return `<span class="yaml-boolean">${value}</span>`;
  }
  
  // Null values
  if (value.match(/^\s*(null|~)\s*$/i)) {
    return `<span class="yaml-null">${value}</span>`;
  }
  
  // Default: return as-is
  return value;
};



/**
 * Removes syntax highlighting from content
 * @param {string} highlightedContent - Content with HTML highlighting
 * @returns {string} - Plain text content
 */
export const stripHighlighting = (highlightedContent) => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = highlightedContent;
  return tempDiv.textContent || tempDiv.innerText || '';
};