'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { ThemeProvider } from 'next-themes';
import { system } from '../theme';
import { ToastProvider } from '../contexts/ToastContext';
import { SettingsProvider } from '../state/SettingsProvider';
import { DialogProvider } from '../state/DialogProvider';
import { NotificationProvider } from '../state/NotificationProvider';
import { DirtyStateProvider } from '../state/DirtyStateProvider';
import { NavigationProvider } from '../state/NavigationProvider';
import { ConfigProvider } from '../state/ConfigProvider';
import { SportsListProvider } from '../contexts/SportsListContext';

export function Providers({ children }) {
  return (
    <ChakraProvider value={system} suppressHydrationWarning>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
        suppressHydrationWarning
      >
        <ToastProvider>
          <SettingsProvider>
            <DialogProvider>
              <NotificationProvider>
                <DirtyStateProvider>
                  <NavigationProvider>
                    <ConfigProvider>
                      <SportsListProvider>
                        {children}
                      </SportsListProvider>
                    </ConfigProvider>
                  </NavigationProvider>
                </DirtyStateProvider>
              </NotificationProvider>
            </DialogProvider>
          </SettingsProvider>
        </ToastProvider>
      </ThemeProvider>
    </ChakraProvider>
  );
}
