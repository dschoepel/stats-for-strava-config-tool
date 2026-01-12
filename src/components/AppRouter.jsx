import React, { forwardRef, Suspense } from 'react';
import { Box, Spinner, VStack, Text } from '@chakra-ui/react';
import { useSettings } from '../state/SettingsProvider';
import { useNavigation } from '../state/NavigationProvider';
import { useConfig } from '../state/ConfigProvider';
import { useDirtyState } from '../state/DirtyStateProvider';
import { routes, getConfigEditorProps } from '../navigation/routes';

/**
 * AppRouter component handles page routing and renders the appropriate component
 * based on the current page state using declarative route configuration.
 */
const AppRouter = forwardRef(({ onNavigate }, ref) => {
  const { settings } = useSettings();
  const { currentPage } = useNavigation();
  const { sectionData, isLoadingSectionData, saveSectionData } = useConfig();
  const { setHasUnsavedChanges } = useDirtyState();

  // Helper to navigate back to Configuration page
  const navigateToConfig = () => onNavigate('Configuration');

  // Get route config for current page
  const routeConfig = routes[currentPage];

  if (!routeConfig) {
    // Fallback for unknown pages
    return (
      <Box>
        <h2>{currentPage}</h2>
        {/* Content for {currentPage} will be displayed here */}
      </Box>
    );
  }

  const Component = routeConfig.component;

  // Build props based on route type
  let componentProps = {};

  if (routeConfig.isConfigEditor) {
    // Config editor - standard props
    componentProps = getConfigEditorProps(
      routeConfig.sectionKey,
      sectionData,
      saveSectionData,
      navigateToConfig,
      isLoadingSectionData,
      setHasUnsavedChanges
    );
  } else if (routeConfig.props) {
    // Custom props function
    const context = {
      settings,
      configListRef: ref,
      onNavigate,
      navigateToConfig,
      sectionData,
      saveSectionData,
      isLoadingSectionData,
      setHasUnsavedChanges
    };
    componentProps = routeConfig.props(context);
  }

  // Extract key prop if present (React doesn't allow key in spread)
  const { key: componentKey, ...propsWithoutKey } = componentProps;

  // Suspense fallback for lazy-loaded components
  const suspenseFallback = (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="100vh"
      bg="bg"
      p={6}
    >
      <Box
        bg="cardBg"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border"
        p={8}
        boxShadow="lg"
      >
        <VStack gap={3}>
          <Spinner size="xl" color="primary" />
          <Text fontSize={{ base: "sm", sm: "md" }} color="textMuted">
            Loading page...
          </Text>
        </VStack>
      </Box>
    </Box>
  );

  // Handle special case - ConfigFileList needs ref
  if (routeConfig.requiresRef) {
    const { ref: componentRef, ...otherProps } = propsWithoutKey;
    return (
      <Suspense fallback={suspenseFallback}>
        <Component key={componentKey} ref={componentRef} {...otherProps} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={suspenseFallback}>
      <Component key={componentKey} {...propsWithoutKey} />
    </Suspense>
  );
});

AppRouter.displayName = 'AppRouter';

export default AppRouter;
