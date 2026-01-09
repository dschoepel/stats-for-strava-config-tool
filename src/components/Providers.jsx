'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { ThemeProvider } from 'next-themes';
import { system } from '../theme';
import { ToastProvider } from '../contexts/ToastContext';
import { SettingsProvider } from '../state/SettingsProvider';
import { DialogProvider } from '../state/DialogProvider';
import { DirtyStateProvider } from '../state/DirtyStateProvider';
import { NavigationProvider } from '../state/NavigationProvider';
import { ConfigProvider } from '../state/ConfigProvider';
import { SportsListProvider } from '../contexts/SportsListContext';

export function Providers({ children }) {
  return (
    <ChakraProvider value={system}>
      <ThemeProvider attribute="class" disableTransitionOnChange suppressHydrationWarning>
        <ToastProvider>
          <SettingsProvider>
            <DialogProvider>
              <DirtyStateProvider>
                <NavigationProvider>
                  <ConfigProvider>
                    <SportsListProvider>
                      {children}
                    </SportsListProvider>
                  </ConfigProvider>
                </NavigationProvider>
              </DirtyStateProvider>
            </DialogProvider>
          </SettingsProvider>
        </ToastProvider>
      </ThemeProvider>
    </ChakraProvider>
  );
}
