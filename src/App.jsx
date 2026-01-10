import React, { useState, useRef } from 'react';
import { Box, Flex, Heading, IconButton, Icon, HStack, Breadcrumb } from '@chakra-ui/react';
import { MdClose, MdSportsBasketball, MdWidgets, MdHome } from 'react-icons/md';
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import SettingsDialog from './components/SettingsDialog'
import SportsListEditor from './components/SportsListEditor'
import WidgetDefinitionsEditor from './components/WidgetDefinitionsEditor'
import AppRouter from './components/AppRouter'
import { ToastContainer } from './components/Toast'
import { ConfirmDialog } from './components/ConfirmDialog'
import { useToast } from './contexts/ToastContext'
import { useSettings } from './state/SettingsProvider'
import { useDialog } from './state/DialogProvider'
import { useDirtyState } from './state/DirtyStateProvider'
import { useNavigation } from './state/NavigationProvider'

function App() {
  const { toasts, removeToast } = useToast();
  const { theme, toggleTheme, toggleSidebar, isSidebarCollapsed, settings } = useSettings();
  const { confirmDialog, closeDialog } = useDialog();
  const { setSportsListDirty, setWidgetDefinitionsDirty, checkAndConfirmModalClose } = useDirtyState();
  const { currentPage, breadcrumbs, navigateTo, hasHydrated } = useNavigation();

  // Keep local UI state only
  const [activeSettingsModal, setActiveSettingsModal] = useState(null)
  const [isMainConfigExpanded, setIsMainConfigExpanded] = useState(false)
  const [isHelpExpanded, setIsHelpExpanded] = useState(false)
  const configListRef = useRef(null)

  const handleCloseModal = (modalName) => {
    checkAndConfirmModalClose(modalName, () => {
      setActiveSettingsModal(null);
    });
  };

  // Navigation handler - now just directly uses navigateTo from context
  const handleNavClick = (page, parentPage = null, skipUnsavedCheck = false) => {
    navigateTo(page, parentPage, skipUnsavedCheck);
  }

  // Breadcrumb handler - now uses navigateToBreadcrumb from context
  const handleBreadcrumbClick = (index) => {
    // NavigationProvider handles unsaved changes check internally
    navigateTo(breadcrumbs[index]);
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
          <Box p={8} color="text">
            <AppRouter
              configListRef={configListRef}
              onNavigate={handleNavClick}
            />
          </Box>
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
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
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

export default App
