'use client';

import { useState } from 'react';
import { Box, Button, Text, VStack, HStack, Heading, Spinner, Badge, Icon } from '@chakra-ui/react';
import { MdCloudDownload, MdCheckCircle, MdError, MdFolder, MdLightbulb } from 'react-icons/md';
import { defaultConfigService } from '../../../src/services/defaultConfigService';
import { useToast } from '../../../src/contexts/ToastContext';

const FILE_CONFIGS = {
  config: {
    name: 'config.yaml',
    label: 'Main Configuration',
    description: 'Required configuration for Statistics for Strava',
    required: true,
    docsUrl: 'https://statistics-for-strava-docs.robiningelbrecht.be/#/getting-started/installation'
  },
  'gear-maintenance': {
    name: 'gear-maintenance.yaml',
    label: 'Gear Maintenance',
    description: 'Track bike and gear maintenance schedules',
    required: false,
    docsUrl: 'https://statistics-for-strava-docs.robiningelbrecht.be/#/configuration/gear-maintenance'
  }
};

/**
 * Empty state component that allows pulling default configs from docs
 */
export default function EmptyStateWithDefaults({ targetDirectory, onFileCreated }) {
  const { showSuccess, showError, showInfo } = useToast();
  const [loadingStates, setLoadingStates] = useState({
    config: false,
    'gear-maintenance': false
  });
  const [errors, setErrors] = useState({
    config: null,
    'gear-maintenance': null
  });
  const [successStates, setSuccessStates] = useState({
    config: false,
    'gear-maintenance': false
  });
  const [warnings, setWarnings] = useState({
    config: null,
    'gear-maintenance': null
  });

  const handlePullDefault = async (fileType) => {
    // Clear previous errors
    setErrors(prev => ({ ...prev, [fileType]: null }));
    setWarnings(prev => ({ ...prev, [fileType]: null }));
    
    // Set loading state
    setLoadingStates(prev => ({ ...prev, [fileType]: true }));
    
    try {
      // Check if file already exists
      const exists = await defaultConfigService.checkDefaultConfigExists(fileType, targetDirectory);
      
      if (exists) {
        const fileName = FILE_CONFIGS[fileType].name;
        const confirmMessage = `${fileName} already exists. Do you want to overwrite it?`;
        
        if (!window.confirm(confirmMessage)) {
          setLoadingStates(prev => ({ ...prev, [fileType]: false }));
          return;
        }
      }
      
      // Pull and save config
      const result = await defaultConfigService.pullDefaultConfig(fileType, targetDirectory);
      
      if (!result.success) {
        // Handle error
        setErrors(prev => ({ ...prev, [fileType]: result.error }));
        showError(`Failed to pull ${FILE_CONFIGS[fileType].name}`);
        setLoadingStates(prev => ({ ...prev, [fileType]: false }));
        return;
      }
      
      // Success!
      setSuccessStates(prev => ({ ...prev, [fileType]: true }));
      showSuccess(`✅ ${result.fileName} created successfully`);
      
      // Show warning if placeholders detected
      if (result.hasPlaceholders) {
        setWarnings(prev => ({ 
          ...prev, 
          [fileType]: 'Config created! Remember to customize paths and credentials.' 
        }));
      }
      
      // Show validation warning if present
      if (result.warning) {
        setWarnings(prev => ({ ...prev, [fileType]: result.warning }));
      }
      
      setLoadingStates(prev => ({ ...prev, [fileType]: false }));
      
      // Trigger refresh after a brief delay to show success state
      setTimeout(() => {
        onFileCreated();
      }, 1000);
      
    } catch (error) {
      console.error('[EmptyStateWithDefaults] Error:', error);
      setErrors(prev => ({ ...prev, [fileType]: error.message }));
      showError('Unexpected error occurred');
      setLoadingStates(prev => ({ ...prev, [fileType]: false }));
    }
  };

  const handleBrowseDirectory = () => {
    // Trigger the existing directory browse functionality
    // This will be handled by parent component
    showInfo('Use the "Browse Directory" button in the settings');
  };

  return (
    <Box maxW="800px" mx="auto" mt={8} px={4}>
      {/* Header */}
      <VStack gap={4} mb={8} textAlign="center">
        <HStack>
          <Icon as={MdFolder} boxSize={8} color="textMuted" />
          <Heading size="lg" color="text">
            No Configuration Files Found
          </Heading>
        </HStack>
        <Text color="textMuted" fontSize="md">
          Get started by pulling default configurations from the official documentation
        </Text>
        <Badge colorScheme="blue" fontSize="sm" px={3} py={1} fontFamily="mono">
          {targetDirectory}
        </Badge>
      </VStack>

      {/* Config Cards */}
      <VStack gap={4} mb={8}>
        {Object.entries(FILE_CONFIGS).map(([fileType, config]) => {
          const isLoading = loadingStates[fileType];
          const hasError = !!errors[fileType];
          const isSuccess = successStates[fileType];
          const hasWarning = !!warnings[fileType];

          return (
            <Box
              key={fileType}
              p={6}
              bg="cardBg"
              borderRadius="md"
              border="2px"
              borderColor={hasError ? 'red.500' : isSuccess ? 'green.500' : 'border'}
              w="full"
            >
              {/* Card Header */}
              <VStack align="start" gap={3} mb={4}>
                <HStack justify="space-between" w="full">
                  <HStack>
                    <Text fontFamily="mono" fontWeight="bold" fontSize="lg" color="text">
                      {config.name}
                    </Text>
                    <Badge colorScheme={config.required ? 'red' : 'gray'} fontSize="xs">
                      {config.required ? 'Required' : 'Optional'}
                    </Badge>
                    {isSuccess && (
                      <Icon as={MdCheckCircle} color="green.500" boxSize={5} />
                    )}
                  </HStack>
                </HStack>
                
                <Text fontSize="sm" color="textMuted">
                  {config.description}
                </Text>
                
                <Text
                  as="a"
                  href={config.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  fontSize="sm"
                  color="blue.400"
                  _hover={{ textDecoration: 'underline' }}
                >
                  View documentation →
                </Text>
              </VStack>

              {/* Error Display */}
              {hasError && (
                <Box
                  p={3}
                  mb={4}
                  bg="red.500/10"
                  borderRadius="md"
                  border="1px"
                  borderColor="red.500/30"
                >
                  <HStack align="start" gap={2}>
                    <Icon as={MdError} color="red.500" boxSize={5} mt={0.5} />
                    <VStack align="start" gap={1} flex={1}>
                      <Text fontWeight="bold" fontSize="sm" color="red.300">
                        Failed to pull config
                      </Text>
                      <Text fontSize="sm" color="red.200">
                        {errors[fileType]}
                      </Text>
                      {errors[fileType]?.includes('documentation site') && (
                        <Text
                          as="a"
                          href={config.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          fontSize="sm"
                          color="blue.300"
                          _hover={{ textDecoration: 'underline' }}
                          mt={1}
                        >
                          View manual instructions →
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                </Box>
              )}

              {/* Warning Display */}
              {hasWarning && !hasError && (
                <Box
                  p={3}
                  mb={4}
                  bg="orange.500/10"
                  borderRadius="md"
                  border="1px"
                  borderColor="orange.500/30"
                >
                  <HStack align="start" gap={2}>
                    <Icon as={MdLightbulb} color="orange.400" boxSize={5} mt={0.5} />
                    <Text fontSize="sm" color="orange.200">
                      {warnings[fileType]}
                    </Text>
                  </HStack>
                </Box>
              )}

              {/* Action Button */}
              {!isSuccess && (
                <Button
                  colorScheme="blue"
                  leftIcon={isLoading ? <Spinner size="sm" /> : <Icon as={MdCloudDownload} />}
                  onClick={() => handlePullDefault(fileType)}
                  isDisabled={isLoading}
                  w="full"
                  size="lg"
                >
                  {isLoading ? 'Pulling Default Config...' : 'Pull Default Config'}
                </Button>
              )}

              {/* Success State */}
              {isSuccess && (
                <Box
                  p={3}
                  bg="green.500/10"
                  borderRadius="md"
                  border="1px"
                  borderColor="green.500/30"
                >
                  <HStack gap={2}>
                    <Icon as={MdCheckCircle} color="green.500" boxSize={5} />
                    <Text fontSize="sm" color="green.200" fontWeight="medium">
                      File created successfully! The app will refresh shortly...
                    </Text>
                  </HStack>
                </Box>
              )}
            </Box>
          );
        })}
      </VStack>

      {/* Alternative Action */}
      <Box textAlign="center" p={6} bg="panelBg" borderRadius="md">
        <Text fontSize="sm" color="textMuted" mb={3}>
          Already have configuration files elsewhere?
        </Text>
        <Button
          variant="outline"
          colorScheme="gray"
          leftIcon={<Icon as={MdFolder} />}
          onClick={handleBrowseDirectory}
        >
          Browse for Existing Directory
        </Button>
      </Box>
    </Box>
  );
}
