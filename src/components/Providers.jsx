'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { ThemeProvider } from 'next-themes';
import { system } from '../theme';
import { SportsListProvider } from '../contexts/SportsListContext';

export function Providers({ children }) {
  return (
    <ChakraProvider value={system}>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        <SportsListProvider>
          {children}
        </SportsListProvider>
      </ThemeProvider>
    </ChakraProvider>
  );
}
