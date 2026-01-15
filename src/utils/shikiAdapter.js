import { createShikiAdapter } from '@chakra-ui/react';

export const shikiAdapter = createShikiAdapter({
  async load() {
    const { createHighlighter } = await import('shiki');
    return createHighlighter({
      langs: ['bash', 'shell', 'yaml', 'javascript', 'typescript'],
      themes: ['github-dark', 'github-light'],
    });
  },
  theme: 'github-dark',
});

// Cache the highlighter instance to avoid creating multiple instances
let cachedHighlighter = null;

/**
 * Get or create cached highlighter instance
 * @returns {Promise<Highlighter>}
 */
async function getHighlighter() {
  if (cachedHighlighter) {
    return cachedHighlighter;
  }

  const { createHighlighter } = await import('shiki');
  cachedHighlighter = await createHighlighter({
    langs: ['yaml'],
    themes: ['github-dark', 'github-light'],
  });

  return cachedHighlighter;
}

/**
 * Highlight YAML content using Shiki
 * @param {string} code - YAML code to highlight
 * @returns {Promise<string>} - Highlighted HTML
 */
export async function highlightYaml(code) {
  try {
    const highlighter = await getHighlighter();

    const html = highlighter.codeToHtml(code, {
      lang: 'yaml',
      theme: 'github-dark',
    });

    return html;
  } catch (error) {
    console.error('Failed to highlight YAML:', error);
    throw error;
  }
}
