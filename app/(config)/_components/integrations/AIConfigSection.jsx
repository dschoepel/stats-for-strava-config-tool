import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, VStack, HStack, Text, Flex, Checkbox, Field, Input, NativeSelect, IconButton } from '@chakra-ui/react';
import { MdSmartToy, MdWarning, MdVisibility, MdVisibilityOff } from 'react-icons/md';

const AI_PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'azureOpenAI', label: 'Azure OpenAI' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'ollama', label: 'Ollama (Local)' },
  { value: 'openAI', label: 'OpenAI (ChatGPT)' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'mistral', label: 'Mistral AI' }
];

/**
 * AIConfigSection - Manages AI provider configuration
 */
const AIConfigSection = ({ config = {}, onChange, errors = {} }) => {
  const [showApiKey, setShowApiKey] = useState(false);

  const handleToggleEnabled = (enabled) => {
    onChange({
      ...config,
      enabled,
      configuration: config.configuration || { key: '', model: '', url: null }
    });
  };

  const handleToggleUI = (enableUI) => {
    onChange({ ...config, enableUI });
  };

  const handleUpdateProvider = (e) => {
    onChange({ ...config, provider: e.target.value });
  };

  const handleUpdateConfig = (field, value) => {
    onChange({
      ...config,
      configuration: {
        ...config.configuration,
        [field]: value
      }
    });
  };

  return (
    <Box 
      p={4} 
      bg="cardBg" 
      borderRadius="md" 
      border="1px solid" 
      borderColor="border"
      boxShadow="sm"
    >
      <VStack align="stretch" gap={4}>
        {/* Header */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
          <Box flex="1" minW={{ base: "100%", sm: "auto" }}>
            <HStack gap={2}>
              <Box as={MdSmartToy} color="primary" boxSize="20px" />
              <Text fontSize={{ base: "md", sm: "lg" }} fontWeight="semibold" color="text">
                AI Integration
              </Text>
            </HStack>
            <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted">
              Provider: {config.provider || 'Not configured'}
            </Text>
          </Box>
          <VStack gap={2} width={{ base: "100%", sm: "auto" }} align={{ base: "stretch", sm: "flex-end" }}>
            <Checkbox.Root
              checked={config.enabled}
              onCheckedChange={(e) => handleToggleEnabled(e.checked)}
              colorPalette="blue"
              size={{ base: "sm", sm: "md" }}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label fontSize={{ base: "xs", sm: "sm" }}>
                Enable AI Features
              </Checkbox.Label>
            </Checkbox.Root>
            
            {config.enabled && (
              <Checkbox.Root
                checked={config.enableUI}
                onCheckedChange={(e) => handleToggleUI(e.checked)}
                colorPalette="blue"
                size={{ base: "sm", sm: "md" }}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Label fontSize={{ base: "xs", sm: "sm" }}>
                  Enable AI in UI
                </Checkbox.Label>
              </Checkbox.Root>
            )}
          </VStack>
        </Flex>

        {/* Warning Box */}
        <Box 
          p={3} 
          bg="warningBg"
          _dark={{ bg: "warningBg" }}
          borderRadius="md" 
          border="1px solid" 
          borderColor="warningBorder"
        >
          <HStack gap={2} align="flex-start">
            <Box as={MdWarning} color="warningText" boxSize="16px" flexShrink={0} mt={0.5} />
            <VStack align="stretch" gap={1} flex={1}>
              <Text fontSize={{ base: "xs", sm: "sm" }} fontWeight="medium" color="text">
                Security Warning
              </Text>
              <Text fontSize={{ base: "xs", sm: "sm" }} color="text" opacity={0.9}>
                Use caution when enabling AI features if your app is publicly accessible. 
                By default, AI features are only accessible via CLI commands.
              </Text>
            </VStack>
          </HStack>
        </Box>

        {config.enabled && (
          <VStack align="stretch" gap={4}>
            {/* Provider Selection */}
            <Field.Root invalid={!!errors['ai.provider']}>
              <Field.Label fontSize={{ base: "xs", sm: "sm" }}>AI Provider</Field.Label>
              <NativeSelect.Root size={{ base: "sm", sm: "md" }}>
                <NativeSelect.Field 
                  placeholder="Select a provider"
                  value={config.provider || ''}
                  onChange={(e) => handleUpdateProvider(e)}
                >
                  <option value="">Select a provider</option>
                  {AI_PROVIDERS.map((provider) => (
                    <option key={provider.value} value={provider.value}>
                      {provider.label}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
              {errors['ai.provider'] && (
                <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                  {errors['ai.provider']}
                </Field.ErrorText>
              )}
              <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                Statistics for Strava uses Neuron AI library - only supported providers are compatible
              </Field.HelperText>
            </Field.Root>

            {/* Configuration */}
            <Box 
              p={4} 
              bg="panelBg" 
              borderRadius="md"
              border="1px solid"
              borderColor="border"
            >
              <VStack align="stretch" gap={4}>
                <Text fontSize={{ base: "xs", sm: "sm" }} fontWeight="medium" color="text">
                  Provider Configuration
                </Text>

                {/* API Key */}
                <Field.Root invalid={!!errors['ai.configuration.key']}>
                  <Field.Label fontSize={{ base: "xs", sm: "sm" }}>API Key</Field.Label>
                  <HStack gap={2}>
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={config.configuration?.key || ''}
                      onChange={(e) => handleUpdateConfig('key', e.target.value)}
                      placeholder="YOUR-API-KEY"
                      bg="inputBg"
                      size={{ base: "sm", sm: "md" }}
                      flex={1}
                    />
                    <IconButton
                      aria-label={showApiKey ? "Hide API key" : "Show API key"}
                      onClick={() => setShowApiKey(!showApiKey)}
                      size={{ base: "sm", sm: "md" }}
                      variant="ghost"
                    >
                      {showApiKey ? <MdVisibilityOff /> : <MdVisibility />}
                    </IconButton>
                  </HStack>
                  {errors['ai.configuration.key'] && (
                    <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                      {errors['ai.configuration.key']}
                    </Field.ErrorText>
                  )}
                  <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                    Your API key for the selected provider
                  </Field.HelperText>
                </Field.Root>

                {/* Model */}
                <Field.Root invalid={!!errors['ai.configuration.model']}>
                  <Field.Label fontSize={{ base: "xs", sm: "sm" }}>Model Name</Field.Label>
                  <Input
                    value={config.configuration?.model || ''}
                    onChange={(e) => handleUpdateConfig('model', e.target.value)}
                    placeholder="gpt-4, claude-3-opus, etc."
                    bg="inputBg"
                    size={{ base: "sm", sm: "md" }}
                  />
                  {errors['ai.configuration.model'] && (
                    <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                      {errors['ai.configuration.model']}
                    </Field.ErrorText>
                  )}
                  <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                    The model identifier to use
                  </Field.HelperText>
                </Field.Root>

                {/* Service URL (Ollama only) */}
                {config.provider === 'ollama' && (
                  <Field.Root invalid={!!errors['ai.configuration.url']}>
                    <Field.Label fontSize={{ base: "xs", sm: "sm" }}>Service URL</Field.Label>
                    <Input
                      value={config.configuration?.url || ''}
                      onChange={(e) => handleUpdateConfig('url', e.target.value)}
                      placeholder="http://localhost:11434"
                      bg="inputBg"
                      size={{ base: "sm", sm: "md" }}
                    />
                    {errors['ai.configuration.url'] && (
                      <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                        {errors['ai.configuration.url']}
                      </Field.ErrorText>
                    )}
                    <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                      URL of your Ollama server
                    </Field.HelperText>
                  </Field.Root>
                )}
              </VStack>
            </Box>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

AIConfigSection.propTypes = {
  config: PropTypes.shape({
    enabled: PropTypes.bool,
    enableUI: PropTypes.bool,
    provider: PropTypes.string,
    configuration: PropTypes.shape({
      key: PropTypes.string,
      model: PropTypes.string,
      url: PropTypes.string
    })
  }),
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.object
};

export default AIConfigSection;
