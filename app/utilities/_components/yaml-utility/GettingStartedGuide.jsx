import React from 'react';
import PropTypes from 'prop-types';
import { Box, VStack, HStack, Heading, Text, Flex, SimpleGrid, Icon } from '@chakra-ui/react';
import { 
  MdRocket, 
  MdStars, 
  MdSearch, 
  MdEdit, 
  MdDownload, 
  MdContentCopy, 
  MdPalette, 
  MdLock 
} from 'react-icons/md';

/**
 * GettingStartedGuide - Displays getting started steps and features list
 * Pure presentational component for YAML utility onboarding
 */
const GettingStartedGuide = () => {
  const steps = [
    {
      number: 1,
      title: 'Select Files',
      description: 'Choose config YAML files from your local directory'
    },
    {
      number: 2,
      title: 'View Content',
      description: 'Inspect the YAML content with syntax validation'
    },
    {
      number: 3,
      title: 'Search & Export',
      description: 'Search within files and download individual configs'
    }
  ];

  const features = [
    { icon: MdSearch, text: 'Multi-file support with tabbed interface' },
    { icon: MdEdit, text: 'Real-time YAML validation' },
    { icon: MdSearch, text: 'Content search functionality' },
    { icon: MdDownload, text: 'Download individual files' },
    { icon: MdContentCopy, text: 'Copy to clipboard' },
    { icon: MdPalette, text: 'Responsive design' },
    { icon: MdLock, text: 'Secure local processing' }
  ];

  return (
    <VStack align="stretch" gap={6}>
      {/* Getting Started Section */}
      <Box p={6} bg="cardBg" borderRadius="md" border="1px solid" borderColor="border">
        <VStack align="stretch" gap={4}>
          <HStack gap={2}>
            <Icon as={MdRocket} boxSize={5} color="primary" />
            <Heading as="h3" size="md" color="text">
              Getting Started
            </Heading>
          </HStack>
          
          <VStack align="stretch" gap={4}>
            {steps.map((step) => (
              <Flex key={step.number} align="start" gap={4}>
                <Flex
                  minW="40px"
                  h="40px"
                  align="center"
                  justify="center"
                  bg="primary"
                  color="white"
                  borderRadius="full"
                  fontWeight="bold"
                >
                  {step.number}
                </Flex>
                <Box flex={1}>
                  <Heading as="h4" size="sm" color="text" mb={1}>
                    {step.title}
                  </Heading>
                  <Text color="textMuted" fontSize="sm">
                    {step.description}
                  </Text>
                </Box>
              </Flex>
            ))}
          </VStack>
        </VStack>
      </Box>
      
      {/* Features Section */}
      <Box p={6} bg="cardBg" borderRadius="md" border="1px solid" borderColor="border">
        <HStack gap={2} mb={4}>
          <Icon as={MdStars} boxSize={5} color="primary" />
          <Heading as="h4" size="sm" color="text">
            Features
          </Heading>
        </HStack>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          {features.map((feature, index) => (
            <HStack key={index} align="start" gap={2}>
              <Icon as={feature.icon} boxSize={4} color="primary" mt={0.5} />
              <Text color="textMuted" fontSize="sm">
                {feature.text}
              </Text>
            </HStack>
          ))}
        </SimpleGrid>
      </Box>
    </VStack>
  );
};

GettingStartedGuide.propTypes = {};

export default GettingStartedGuide;
