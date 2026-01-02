import { createShikiAdapter } from '@chakra-ui/react';

export const shikiAdapter = createShikiAdapter({
  async load() {
    const { createHighlighter } = await import('shiki');
    return createHighlighter({
      langs: ['bash', 'shell', 'yaml', 'javascript', 'typescript'],
      themes: ['github-dark'],
    });
  },
  theme: 'github-dark',
});
