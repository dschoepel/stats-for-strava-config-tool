'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, Flex, Heading, IconButton, Icon, HStack, Breadcrumb } from '@chakra-ui/react';
import { getBreadcrumbsFromPath } from '../../_utils/breadcrumbs';
import { MdClose, MdSportsBasketball, MdWidgets, MdHome } from 'react-icons/md';
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import SettingsDialog from '../../../src/components/SettingsDialog'
import SportsListEditor from '../../../src/components/SportsListEditor'
import WidgetDefinitionsEditor from '../../../src/components/WidgetDefinitionsEditor'
import { Toaster } from '../../../src/components/ui/toaster'
import { ConfirmDialog } from '../../../src/components/ConfirmDialog'
import { useSettings } from '../../../src/state/SettingsProvider'
import { useDialog } from '../../../src/state/DialogProvider'
import { useDirtyState } from '../../../src/state/DirtyStateProvider'
import { useNavigation } from '../../../src/state/NavigationProvider'
import { useConfig } from '../../../src/state/ConfigProvider'
import { scanConfigFiles, parseSections as parseSectionsService, validateSections as validateSectionsService } from '../../../src/services'

export default function AppShell({ section = 'config', children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme, toggleSidebar, isSidebarCollapsed, settings } = useSettings();
  const { confirmDialog, closeDialog } = useDialog();
  const { setSportsListDirty, setWidgetDefinitionsDirty, checkAndConfirmModalClose, checkAndConfirmNavigation } = useDirtyState();
  const { currentPage, navigateTo, hasHydrated } = useNavigation();
  const { hasConfigInitialized, updateHasConfigInitialized, updateFileCache, updateSectionToFileMap } = useConfig();

  // Derive breadcrumbs from URL pathname
  const breadcrumbs = getBreadcrumbsFromPath(pathname);

  // Suppress known third-party library warnings (react-js-cron with deprecated antd props)
  useEffect(() => {
    const originalError = console.error;

    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      // Suppress known react-js-cron/antd warnings about deprecated props
      if (
        message.includes('dropdownAlign') ||
        message.includes('popupClassName')
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  // Initialize config files if not already loaded (only for config section)
  useEffect(() => {
    if (section !== 'config') return;

    const initializeConfig = async () => {
      if (hasConfigInitialized || !settings.files?.defaultPath) return;

      try {
        const dirPath = settings.files.defaultPath;
        const result = await scanConfigFiles(dirPath);

        if (result.success && result.files.length > 0) {
          // Create hash map for quick lookup
          const fileHashes = new Map();
          result.files.forEach(file => {
            if (file.hash) {
              fileHashes.set(file.name, file.hash);
            }
          });

          updateFileCache({
            files: result.files,
            fileHashes: fileHashes,
            directory: result.directory
          });

          // Parse sections to build mapping
          const parseResult = await parseSectionsService(result.files);
          if (parseResult.success) {
            const mappingToUse = parseResult.detailedMapping || parseResult.sectionMapping;
            const newMapping = new Map(Object.entries(mappingToUse));
            updateSectionToFileMap(newMapping);

            // Validate sections
            await validateSectionsService(Object.fromEntries(newMapping));

            updateHasConfigInitialized(true);
            console.log('✅ Config initialized in layout:', result.files.length, 'files');
          }
        }
      } catch (error) {
        console.error('Failed to initialize config:', error);
      }
    };

    initializeConfig();
  }, [section, hasConfigInitialized, settings.files?.defaultPath, updateFileCache, updateSectionToFileMap, updateHasConfigInitialized]);

  // Keep local UI state only
  const [activeSettingsModal, setActiveSettingsModal] = useState(null)
  // isMainConfigExpanded: true for config section, false for utilities/docs
  const [isMainConfigExpanded, setIsMainConfigExpanded] = useState(section === 'config')
  // isHelpExpanded: true for docs section, false for config/utilities
  const [isHelpExpanded, setIsHelpExpanded] = useState(section === 'docs')

  const handleCloseModal = (modalName) => {
    checkAndConfirmModalClose(modalName, () => {
      setActiveSettingsModal(null);
    });
  };

  // Navigation handler - uses router for URL navigation
  const handleNavClick = (page, parentPage = null, skipUnsavedCheck = false) => {
    // Map page to route
    const pageToRoute = {
      'General': '/general',
      'Athlete': '/athlete',
      'Appearance': '/appearance',
      'Gear': '/gear',
      'Scheduling Daemon': '/daemon',
      'Integrations': '/integrations',
      'Metrics': '/metrics',
      'Zwift': '/zwift',
      'Import': '/import',
      'Configuration': '/',
      'YAML Utility': '/utilities/yaml',
      'Gear Maintenance': '/utilities/gear-maintenance',
      'Documentation': '/docs/overview',
      'Overview': '/docs/overview',
      'Dashboard Editor Help': '/docs/dashboard-editor',
      'Sports List Editor Help': '/docs/sports-list-editor',
      'Widget Definitions Help': '/docs/widget-definitions',
      'Settings Management Help': '/docs/settings-management',
      'Configuration Examples Help': '/docs/configuration-examples'
    };

    const route = pageToRoute[page];
    if (route) {
      if (skipUnsavedCheck) {
        router.push(route);
      } else {
        checkAndConfirmNavigation(() => {
          router.push(route);
        });
      }
    } else {
      // Fallback for unknown pages (should not happen)
      console.warn(`No route found for page: ${page}`);
      navigateTo(page, parentPage, skipUnsavedCheck);
    }
  }

  // Breadcrumb handler - uses router for URL navigation
  const handleBreadcrumbClick = (index) => {
    const targetPage = breadcrumbs[index];
    handleNavClick(targetPage);
  }

  return (
    <Flex direction="column" h="100vh" w="full" bg="bg" color="text">
      <Navbar
        isDarkMode={theme === 'dark'}
        toggleTheme={toggleTheme}
        toggleSidebar={toggleSidebar}
        handleNavClick={handleNavClick}
        onSelectSetting={setActiveSettingsModal}
      />

      <Flex mt="64px" h="calc(100vh - 64px)">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={toggleSidebar}
          isMainConfigExpanded={isMainConfigExpanded}
          setIsMainConfigExpanded={setIsMainConfigExpanded}
          isHelpExpanded={isHelpExpanded}
          setIsHelpExpanded={setIsHelpExpanded}
          handleNavClick={handleNavClick}
        />

        <Box as="main" flex={1} bg="bg" overflowY="auto">
          <Breadcrumb.Root size="lg" p={6} borderBottom="1px solid" borderColor="border" color="text">
            <Breadcrumb.List>
              <Breadcrumb.Item>
                <Breadcrumb.Link
                  onClick={(e) => { e.preventDefault(); handleNavClick('Configuration') }}
                  cursor="pointer"
                  title="Go to Configuration"
                  color="text"
                  _hover={{ color: "primary" }}
                >
                  <Icon fontSize="1.5em"><MdHome /></Icon>
                </Breadcrumb.Link>
              </Breadcrumb.Item>
              <Breadcrumb.Separator color="text" />

              {hasHydrated && breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  <Breadcrumb.Item>
                    {index === breadcrumbs.length - 1 ? (
                      <Breadcrumb.CurrentLink color="primary" fontWeight="semibold">{crumb}</Breadcrumb.CurrentLink>
                    ) : (
                      <Breadcrumb.Link
                        onClick={(e) => { e.preventDefault(); handleBreadcrumbClick(index) }}
                        cursor="pointer"
                        color="text"
                        _hover={{ color: "primary" }}
                      >
                        {crumb}
                      </Breadcrumb.Link>
                    )}
                  </Breadcrumb.Item>
                  {index < breadcrumbs.length - 1 && <Breadcrumb.Separator color="text" />}
                </React.Fragment>
              ))}
            </Breadcrumb.List>
          </Breadcrumb.Root>
          {/* Config section has padding, utilities/docs don't */}
          {section === 'config' ? (
            <Box p={8} color="text">
              {children}
            </Box>
          ) : (
            children
          )}
        </Box>
      </Flex>

      {/* Unified Settings Dialog */}
      <SettingsDialog
        isOpen={['ui', 'files', 'editor', 'validation', 'importExport'].includes(activeSettingsModal)}
        onClose={() => setActiveSettingsModal(null)}
        initialTab={activeSettingsModal || 'ui'}
      />

      {/* Sports List and Widget Definitions as full-screen modals */}
      {activeSettingsModal === 'sportsList' && (
        <Flex
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.7)"
          justify="center"
          align="center"
          zIndex={10000}
          onClick={() => handleCloseModal('sportsList')}
        >
          <Flex
            bg="cardBg"
            borderRadius="xl"
            boxShadow="0 20px 60px rgba(0, 0, 0, 0.3)"
            w="90%"
            maxW="1000px"
            maxH="90vh"
            flexDirection="column"
            border="1px solid"
            borderColor="border"
            onClick={(e) => e.stopPropagation()}
          >
            <Flex
              justify="space-between"
              align="center"
              p={4}
              borderBottom="1px solid"
              borderColor="border"
              bg="panelBg"
              borderTopRadius="xl"
            >
              <HStack gap={2}>
                <Icon fontSize="2xl" color="primary"><MdSportsBasketball /></Icon>
                <Heading as="h2" size="lg" color="text" fontWeight="semibold">
                  Sports List
                </Heading>
              </HStack>
              <IconButton
                onClick={() => handleCloseModal('sportsList')}
                aria-label="Close"
                size="sm"
                variant="ghost"
                colorPalette="gray"
              >
                <Icon><MdClose /></Icon>
              </IconButton>
            </Flex>
            <Box flex={1} p={8} overflowY="auto" bg="cardBg">
              <SportsListEditor settings={settings} onDirtyChange={setSportsListDirty} />
            </Box>
          </Flex>
        </Flex>
      )}

      {activeSettingsModal === 'widgetDefinitions' && (
        <Flex
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.7)"
          justify="center"
          align="center"
          zIndex={10000}
          onClick={() => handleCloseModal('widgetDefinitions')}
        >
          <Flex
            bg="cardBg"
            borderRadius="xl"
            boxShadow="0 20px 60px rgba(0, 0, 0, 0.3)"
            w="90%"
            maxW="1200px"
            maxH="90vh"
            flexDirection="column"
            border="1px solid"
            borderColor="border"
            onClick={(e) => e.stopPropagation()}
          >
            <Flex
              justify="space-between"
              align="center"
              p={4}
              borderBottom="1px solid"
              borderColor="border"
              bg="panelBg"
              borderTopRadius="xl"
            >
              <HStack gap={2}>
                <Icon fontSize="2xl" color="primary"><MdWidgets /></Icon>
                <Heading as="h2" size="lg" color="text" fontWeight="semibold">
                  Widget Definitions
                </Heading>
              </HStack>
              <IconButton
                onClick={() => handleCloseModal('widgetDefinitions')}
                aria-label="Close"
                size="sm"
                variant="ghost"
                colorPalette="gray"
              >
                <Icon><MdClose /></Icon>
              </IconButton>
            </Flex>
            <Box flex={1} p={8} overflowY="auto" bg="cardBg">
              <WidgetDefinitionsEditor settings={settings} onDirtyChange={setWidgetDefinitionsDirty} />
            </Box>
          </Flex>
        </Flex>
      )}

      {/* Toast notifications */}
      <Toaster />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Leave Anyway"
        confirmColorPalette="orange"
        onConfirm={confirmDialog.onConfirm || (() => {})}
        onClose={closeDialog}
      />
    </Flex>
  )
}
