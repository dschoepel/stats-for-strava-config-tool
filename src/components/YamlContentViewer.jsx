import React, { useState } from 'react';
import { formatFileSize, validateYamlContent } from '../utils/yamlFileHandler';
import './YamlContentViewer.css';

const YamlContentViewer = ({ 
  fileName, 
  fileContent, 
  fileSize = null, 
  lastModified = null,
  showFileInfo = true,
  showActions = true,
  showSearch = true,
  onDownload = null,
  onCopy = null,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  // Escape HTML to prevent XSS
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // YAML syntax highlighting function
  const highlightYamlSyntax = (line) => {
    let result = '';
    let i = 0;
    const len = line.length;
    
    while (i < len) {
      const char = line[i];
      
      // Handle comments (# to end of line)
      if (char === '#') {
        const comment = line.substring(i);
        result += `<span class="token-comment">${escapeHtml(comment)}</span>`;
        break;
      }
      
      // Handle strings in quotes
      if (char === '"' || char === "'") {
        const quote = char;
        let j = i + 1;
        while (j < len && line[j] !== quote) {
          j++;
        }
        if (j < len) {
          const stringContent = line.substring(i, j + 1);
          result += `<span class="token-string">${escapeHtml(stringContent)}</span>`;
          i = j + 1;
          continue;
        }
      }
      
      // Handle keys (word followed by colon)
      if (/[a-zA-Z_]/.test(char) && (i === 0 || /\s/.test(line[i-1]))) {
        let j = i;
        while (j < len && /[a-zA-Z0-9_-]/.test(line[j])) {
          j++;
        }
        while (j < len && /\s/.test(line[j])) {
          j++;
        }
        if (j < len && line[j] === ':') {
          const beforeColon = line.substring(i, j);
          const keyMatch = beforeColon.match(/^(\s*)([a-zA-Z_][a-zA-Z0-9_-]*)(\s*)$/);
          if (keyMatch) {
            result += keyMatch[1] + `<span class="token-key">${keyMatch[2]}</span>` + keyMatch[3];
            result += `<span class="token-punctuation">:</span>`;
            i = j + 1;
            continue;
          }
        }
      }
      
      // Handle numbers
      if (/\d/.test(char)) {
        let j = i;
        while (j < len && /[\d.]/.test(line[j])) {
          j++;
        }
        const numberStr = line.substring(i, j);
        if (/^\d+\.?\d*$/.test(numberStr)) {
          result += `<span class="token-number">${numberStr}</span>`;
          i = j;
          continue;
        }
      }
      
      // Handle booleans
      const remaining = line.substring(i);
      const boolMatch = remaining.match(/^(true|false|null|yes|no|on|off)\b/i);
      if (boolMatch) {
        result += `<span class="token-boolean">${boolMatch[1]}</span>`;
        i += boolMatch[1].length;
        continue;
      }
      
      // Handle array indicators
      if (char === '-' && (i === 0 || /\s/.test(line[i-1])) && (i + 1 < len && line[i + 1] === ' ')) {
        result += `<span class="token-punctuation">-</span>`;
        i++;
        continue;
      }
      
      // Handle YAML document separators
      const docSeparatorMatch = remaining.match(/^(---|\.\.\.)/);
      if (docSeparatorMatch) {
        result += `<span class="token-doctype">${docSeparatorMatch[1]}</span>`;
        i += docSeparatorMatch[1].length;
        continue;
      }
      
      // Default: add character as-is (escaped)
      result += escapeHtml(char);
      i++;
    }
    
    return result;
  };

  const applySearchHighlight = (yamlHighlightedLine, originalLine, lineNumber) => {
    if (!searchTerm) return yamlHighlightedLine;
    
    const lowerLine = originalLine.toLowerCase();
    const lowerTerm = searchTerm.toLowerCase();
    const index = lowerLine.indexOf(lowerTerm);
    
    if (index === -1) return yamlHighlightedLine;
    
    // Determine if this is the current match
    const matches = findAllMatches(fileContent, searchTerm);
    const currentMatch = matches[currentMatchIndex];
    const isCurrentMatch = currentMatch && currentMatch.lineNumber === lineNumber;
    const highlightClass = isCurrentMatch ? 'search-highlight-current' : 'search-highlight';
    
    // Find the search term in the original line and highlight it in the processed line
    const searchTermEscaped = escapeHtml(searchTerm);
    const searchRegex = new RegExp(`(${searchTermEscaped.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi');
    
    return yamlHighlightedLine.replace(searchRegex, `<span class="${highlightClass}">$1</span>`);
  };

  const getFilteredContent = (content) => {
    if (!content) return '';
    
    const lines = content.split('\n');
    
    const processedLines = lines.map((line, index) => {
      const lineNumber = index + 1;
      
      // First apply YAML syntax highlighting
      let highlightedLine = highlightYamlSyntax(line);
      
      // Then apply search highlighting if there's a search term
      if (searchTerm) {
        highlightedLine = applySearchHighlight(highlightedLine, line, lineNumber);
      }
      
      return `<div class="code-line" data-line="${lineNumber}"><span class="line-num">${lineNumber}</span><code class="line-text">${highlightedLine}</code></div>`;
    });
    
    return processedLines.join('');
  };

  const findAllMatches = (content, term) => {
    if (!term || !content) return [];
    const lines = content.split('\n');
    const matches = [];
    const lowerTerm = term.toLowerCase();
    
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(lowerTerm)) {
        matches.push({
          lineNumber: index + 1,
          line: line,
          startIndex: line.toLowerCase().indexOf(lowerTerm)
        });
      }
    });
    
    return matches;
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term) {
      const matches = findAllMatches(fileContent, term);
      setTotalMatches(matches.length);
      setCurrentMatchIndex(matches.length > 0 ? 0 : -1);
      
      // Auto-scroll to first match when search changes
      if (matches.length > 0) {
        setTimeout(() => {
          scrollToMatch(matches[0].lineNumber);
        }, 100);
      }
    } else {
      setTotalMatches(0);
      setCurrentMatchIndex(0);
    }
  };

  const scrollToMatch = (lineNumber) => {
    setTimeout(() => {
      const lineElement = document.querySelector(`.code-line[data-line="${lineNumber}"]`);
      if (lineElement) {
        // Get the container to check viewport
        const container = lineElement.closest('.yaml-content-area');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const elementRect = lineElement.getBoundingClientRect();
          
          // Check if element is outside viewport
          const isAbove = elementRect.top < containerRect.top + 100;
          const isBelow = elementRect.bottom > containerRect.bottom - 100;
          
          if (isAbove || isBelow) {
            lineElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
          }
        }
      }
    }, 50);
  };

  const navigateToMatch = (direction) => {
    if (totalMatches === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = currentMatchIndex + 1 >= totalMatches ? 0 : currentMatchIndex + 1;
    } else {
      newIndex = currentMatchIndex - 1 < 0 ? totalMatches - 1 : currentMatchIndex - 1;
    }
    
    setCurrentMatchIndex(newIndex);
    
    // Scroll to the match
    const matches = findAllMatches(fileContent, searchTerm);
    if (matches[newIndex]) {
      scrollToMatch(matches[newIndex].lineNumber);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      const blob = new Blob([fileContent], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleCopy = async () => {
    if (onCopy) {
      onCopy();
    } else {
      try {
        await navigator.clipboard.writeText(fileContent);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  };

  return (
    <div className={`yaml-content-viewer ${className}`}>
      {showFileInfo && (
        <div className="file-info-bar">
          <div className="file-details">
            <span className="file-name">📁 {fileName}</span>
            {fileSize && lastModified && (
              <span className="file-meta">
                {formatFileSize(fileSize)} • 
                Modified: {(() => {
                  const date = new Date(lastModified);
                  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                })()}
              </span>
            )}
            <span className={`validation-status ${validateYamlContent(fileContent) ? 'valid' : 'invalid'}`}>
              {validateYamlContent(fileContent) ? '✓ Valid YAML' : '⚠️ Invalid YAML'}
            </span>
          </div>
          {showActions && (
            <div className="file-actions">
              <button onClick={handleCopy} className="btn-action">
                📋 Copy
              </button>
              <button onClick={handleDownload} className="btn-action">
                💾 Download
              </button>
            </div>
          )}
        </div>
      )}

      {showSearch && (
        <div className="content-controls">
          <div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search in file content..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="clear-search">
                  ✕
                </button>
              )}
            </div>
            {searchTerm && totalMatches > 0 && (
              <div className="search-navigation">
                <span className="search-counter">
                  {currentMatchIndex + 1} of {totalMatches}
                </span>
                <div className="nav-buttons">
                  <button 
                    onClick={() => navigateToMatch('prev')}
                    className="search-nav-btn"
                    title="Previous match (Shift+Enter)"
                  >
                    ↑
                  </button>
                  <button 
                    onClick={() => navigateToMatch('next')}
                    className="search-nav-btn"
                    title="Next match (Enter)"
                  >
                    ↓
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="yaml-content-area">
        <div 
          className="yaml-code"
          dangerouslySetInnerHTML={{
            __html: getFilteredContent(fileContent)
          }}
        />
      </div>
    </div>
  );
};

export default YamlContentViewer;