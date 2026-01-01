import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Field,
  Input,
  IconButton,
  Flex,
  Grid,
  Checkbox,
  Textarea,
  createListCollection,
  SelectRoot,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValueText,
} from '@chakra-ui/react';
import { Tooltip } from '../Tooltip';
import { 
  MdAdd, 
  MdDelete, 
  MdArrowUpward, 
  MdArrowDownward, 
  MdExpandMore, 
  MdChevronRight, 
  MdInfo, 
  MdWarning,
  MdNotifications,
  MdSmartToy
} from 'react-icons/md';
import BaseConfigEditor from './BaseConfigEditor';

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
 * IntegrationsConfigEditor - Handles integrations configuration
 * Manages notifications and AI integration settings
 */
const IntegrationsConfigEditor = ({ 
  initialData, 
  onSave, 
  onCancel, 
  isLoading,
  onDirtyChange 
}) => {
  const [expandedCommands, setExpandedCommands] = useState({});

  // Pass data as-is - let YAML serializer handle quoting naturally
  const handleSaveWithTransform = (formData) => {
    onSave(formData);
  };

  // Custom validation for integrations fields
  const validateIntegrationsFields = (formData, getNestedValue) => {
    const errors = {};
    
    const notificationServices = getNestedValue(formData, 'notifications.services') || [];
    
    // Validate notification service URLs
    notificationServices.forEach((service, index) => {
      if (service && service.trim() !== '') {
        try {
          new URL(service);
        } catch {
          errors[`notifications.services[${index}]`] = 'Must be a valid URL';
        }
      }
    });
    
    // Validate AI configuration
    const aiConfig = getNestedValue(formData, 'ai') || {};
    
    if (aiConfig.enabled) {
      if (!aiConfig.provider || aiConfig.provider.trim() === '') {
        errors['ai.provider'] = 'Provider is required when AI is enabled';
      }
      
      if (aiConfig.configuration) {
        if (!aiConfig.configuration.key || aiConfig.configuration.key.trim() === '') {
          errors['ai.configuration.key'] = 'API key is required';
        }
        
        if (!aiConfig.configuration.model || aiConfig.configuration.model.trim() === '') {
          errors['ai.configuration.model'] = 'Model name is required';
        }
        
        // URL is required only for Ollama
        if (aiConfig.provider === 'ollama') {
          if (!aiConfig.configuration.url || aiConfig.configuration.url.trim() === '') {
            errors['ai.configuration.url'] = 'Service URL is required for Ollama';
          } else {
            try {
              new URL(aiConfig.configuration.url);
            } catch {
              errors['ai.configuration.url'] = 'Must be a valid URL';
            }
          }
        }
      } else {
        errors['ai.configuration'] = 'Configuration is required when AI is enabled';
      }
    }
    
    // Validate AI commands
    const aiCommands = getNestedValue(formData, 'ai.agent.commands') || [];
    aiCommands.forEach((cmd, index) => {
      if (!cmd.command || cmd.command.trim() === '') {
        errors[`ai.agent.commands[${index}].command`] = 'Command name is required';
      } else if (!/^[a-z0-9-]+$/i.test(cmd.command)) {
        errors[`ai.agent.commands[${index}].command`] = 'Command should only contain letters, numbers, and hyphens';
      }
      
      if (!cmd.message || cmd.message.trim() === '') {
        errors[`ai.agent.commands[${index}].message`] = 'Message is required';
      }
    });
    
    return errors;
  };

  return (
    <BaseConfigEditor
      sectionName="integrations"
      initialData={initialData}
      onSave={handleSaveWithTransform}
      onCancel={onCancel}
      isLoading={isLoading}
      onDirtyChange={onDirtyChange}
      customValidation={validateIntegrationsFields}
    >
      {({ formData, handleFieldChange, getNestedValue, errors }) => {
        // Remove any surrounding quotes from URLs for display
        const notificationServices = (getNestedValue(formData, 'notifications.services') || [])
          .map(url => {
            if (typeof url === 'string') {
              // Remove surrounding quotes (single or double)
              return url.replace(/^['"]|['"]$/g, '');
            }
            return url;
          });
        const aiConfig = getNestedValue(formData, 'ai') || { 
          enabled: false, 
          enableUI: false, 
          provider: '', 
          configuration: { key: '', model: '', url: null }
        };
        const aiCommands = getNestedValue(formData, 'ai.agent.commands') || [];

        // Notification Handlers
        const handleAddNotificationService = () => {
          handleFieldChange('notifications.services', [...notificationServices, '']);
        };

        const handleRemoveNotificationService = (index) => {
          const updated = notificationServices.filter((_, i) => i !== index);
          handleFieldChange('notifications.services', updated);
        };

        const handleUpdateNotificationService = (index, value) => {
          const updated = [...notificationServices];
          updated[index] = value;
          handleFieldChange('notifications.services', updated);
        };

        // AI Handlers
        const handleToggleAI = (enabled) => {
          handleFieldChange('ai', {
            ...aiConfig,
            enabled,
            configuration: aiConfig.configuration || { key: '', model: '', url: null }
          });
        };

        const handleToggleAIUI = (enableUI) => {
          handleFieldChange('ai', {
            ...aiConfig,
            enableUI
          });
        };

        const handleUpdateAIProvider = (provider) => {
          handleFieldChange('ai', {
            ...aiConfig,
            provider
          });
        };

        const handleUpdateAIConfig = (field, value) => {
          handleFieldChange('ai', {
            ...aiConfig,
            configuration: {
              ...aiConfig.configuration,
              [field]: value
            }
          });
        };

        // AI Commands Handlers
        const handleAddCommand = () => {
          const currentCommands = getNestedValue(formData, 'ai.agent.commands') || [];
          const newCommand = {
            command: '',
            message: ''
          };
          handleFieldChange('ai.agent.commands', [...currentCommands, newCommand]);
          setExpandedCommands(prev => ({ ...prev, [currentCommands.length]: true }));
        };

        const handleRemoveCommand = (index) => {
          const updated = aiCommands.filter((_, i) => i !== index);
          handleFieldChange('ai.agent.commands', updated);
          
          const newExpanded = {};
          Object.keys(expandedCommands).forEach(key => {
            const keyIndex = parseInt(key);
            if (keyIndex < index) {
              newExpanded[keyIndex] = expandedCommands[key];
            } else if (keyIndex > index) {
              newExpanded[keyIndex - 1] = expandedCommands[key];
            }
          });
          setExpandedCommands(newExpanded);
        };

        const handleMoveCommand = (fromIndex, toIndex) => {
          if (toIndex < 0 || toIndex >= aiCommands.length) return;
          
          const updated = [...aiCommands];
          const [moved] = updated.splice(fromIndex, 1);
          updated.splice(toIndex, 0, moved);
          handleFieldChange('ai.agent.commands', updated);
        };

        const toggleCommandExpansion = (index) => {
          setExpandedCommands(prev => ({ ...prev, [index]: !prev[index] }));
        };

        const handleUpdateCommand = (index, field, value) => {
          const updated = [...aiCommands];
          updated[index] = { ...updated[index], [field]: value };
          handleFieldChange('ai.agent.commands', updated);
        };

        const providerCollection = createListCollection({
          items: AI_PROVIDERS
        });

        return (
          <VStack align="stretch" gap={6}>
            {/* Notifications Section */}
            <Box 
              p={4} 
              bg="cardBg" 
              borderRadius="md" 
              border="1px solid" 
              borderColor="border"
              boxShadow="sm"
            >
              <VStack align="stretch" gap={4}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                  <Box flex="1" minW={{ base: "100%", sm: "auto" }}>
                    <HStack gap={2}>
                      <Box as={MdNotifications} color="primary" boxSize="20px" />
                      <Text fontSize={{ base: "md", sm: "lg" }} fontWeight="semibold" color="text">
                        Notifications
                      </Text>
                    </HStack>
                    <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted">
                      {notificationServices.length} service{notificationServices.length === 1 ? '' : 's'} configured
                    </Text>
                  </Box>
                  <Button
                    onClick={handleAddNotificationService}
                    colorPalette="blue"
                    size={{ base: "sm", sm: "sm" }}
                    width={{ base: "100%", sm: "auto" }}
                    leftIcon={<MdAdd />}
                  >
                    Add Service
                  </Button>
                </Flex>

                {/* Info Box */}
                <Box 
                  p={3} 
                  bg="infoBg"
                  _dark={{ bg: "infoBg" }}
                  borderRadius="md" 
                  border="1px solid" 
                  borderColor="border"
                >
                  <HStack gap={2} mb={1}>
                    <Box as={MdInfo} color="infoText" boxSize="16px" />
                    <Text fontSize={{ base: "xs", sm: "sm" }} fontWeight="medium" color="text">
                      About Notifications
                    </Text>
                  </HStack>
                  <Text fontSize={{ base: "xs", sm: "sm" }} color="text" opacity={0.9}>
                    Add notification service URLs in Shoutrrr format. Example: <code>ntfy://ntfy.sh/topic</code>
                  </Text>
                </Box>

                {notificationServices.length === 0 ? (
                  <Box
                    p={8}
                    textAlign="center"
                    bg="panelBg"
                    borderRadius="md"
                    border="2px dashed"
                    borderColor="border"
                  >
                    <Text fontSize="sm" color="textMuted" mb={3}>
                      No notification services configured. Add a service to receive notifications.
                    </Text>
                    <Button
                      onClick={handleAddNotificationService}
                      colorPalette="blue"
                      size="sm"
                      leftIcon={<MdAdd />}
                    >
                      Add Your First Service
                    </Button>
                  </Box>
                ) : (
                  <VStack align="stretch" gap={3}>
                    {notificationServices.map((service, index) => (
                      <Field.Root key={index} invalid={!!errors[`notifications.services[${index}]`]}>
                        <Field.Label fontSize={{ base: "xs", sm: "sm" }}>
                          Service URL #{index + 1}
                        </Field.Label>
                        <HStack gap={2} width="100%">
                          <Tooltip 
                            content={service || 'Enter notification service URL'} 
                            placement="top"
                            contentProps={{
                              bg: 'gray.700',
                              color: 'white',
                              px: 3,
                              py: 2,
                              borderRadius: 'md',
                              fontSize: 'sm',
                              maxW: '500px',
                              wordBreak: 'break-all',
                              _dark: {
                                bg: 'gray.800',
                                color: 'white'
                              }
                            }}
                          >
                            <Input
                              value={service}
                              onChange={(e) => handleUpdateNotificationService(index, e.target.value)}
                              placeholder="ntfy://ntfy.sh/topic"
                              bg="inputBg"
                              size={{ base: "sm", sm: "md" }}
                              flex={1}
                              minW={0}
                              width={{ md: "600px", lg: "700px" }}
                              css={{
                                overflow: 'visible',
                                textOverflow: 'clip',
                                whiteSpace: 'nowrap'
                              }}
                            />
                          </Tooltip>
                          <IconButton
                            size={{ base: "sm", sm: "md" }}
                            variant="ghost"
                            colorPalette="red"
                            flexShrink={0}
                            onClick={() => handleRemoveNotificationService(index)}
                            aria-label="Remove"
                          >
                            <MdDelete />
                          </IconButton>
                        </HStack>
                        {errors[`notifications.services[${index}]`] && (
                          <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                            {errors[`notifications.services[${index}]`]}
                          </Field.ErrorText>
                        )}
                        <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                          Use Shoutrrr format for notification URLs
                        </Field.HelperText>
                      </Field.Root>
                    ))}
                  </VStack>
                )}
              </VStack>
            </Box>

            {/* AI Integration Section */}
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
                      Provider: {aiConfig.provider || 'Not configured'}
                    </Text>
                  </Box>
                  <VStack gap={2} width={{ base: "100%", sm: "auto" }} align={{ base: "stretch", sm: "flex-end" }}>
                    <Checkbox.Root
                      checked={aiConfig.enabled}
                      onCheckedChange={(e) => handleToggleAI(e.checked)}
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
                    
                    {aiConfig.enabled && (
                      <Checkbox.Root
                        checked={aiConfig.enableUI}
                        onCheckedChange={(e) => handleToggleAIUI(e.checked)}
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

                {aiConfig.enabled ? (
                  <VStack align="stretch" gap={4}>
                    {/* Provider Selection */}
                    <Field.Root invalid={!!errors['ai.provider']}>
                      <Field.Label fontSize={{ base: "xs", sm: "sm" }}>AI Provider</Field.Label>
                      <SelectRoot
                        collection={providerCollection}
                        value={aiConfig.provider ? [aiConfig.provider] : []}
                        onValueChange={(e) => handleUpdateAIProvider(e.value[0])}
                        size={{ base: "sm", sm: "md" }}
                      >
                        <SelectTrigger>
                          <SelectValueText placeholder="Select a provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_PROVIDERS.map((provider) => (
                            <SelectItem key={provider.value} item={provider.value}>
                              {provider.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </SelectRoot>
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
                          <Input
                            type="password"
                            value={aiConfig.configuration?.key || ''}
                            onChange={(e) => handleUpdateAIConfig('key', e.target.value)}
                            placeholder="YOUR-API-KEY"
                            bg="inputBg"
                            size={{ base: "sm", sm: "md" }}
                          />
                          {errors['ai.configuration.key'] && (
                            <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                              {errors['ai.configuration.key']}
                            </Field.ErrorText>
                          )}
                          <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                            Your API key for the selected provider
                          </Field.HelperText>
                        </Field.Root>

                        {/* Model Name */}
                        <Field.Root invalid={!!errors['ai.configuration.model']}>
                          <Field.Label fontSize={{ base: "xs", sm: "sm" }}>Model Name</Field.Label>
                          <Input
                            value={aiConfig.configuration?.model || ''}
                            onChange={(e) => handleUpdateAIConfig('model', e.target.value)}
                            placeholder="gpt-4, claude-3-opus, llama3.2, etc."
                            bg="inputBg"
                            size={{ base: "sm", sm: "md" }}
                          />
                          {errors['ai.configuration.model'] && (
                            <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                              {errors['ai.configuration.model']}
                            </Field.ErrorText>
                          )}
                          <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                            The AI model to use (e.g., gpt-4, claude-3-opus)
                          </Field.HelperText>
                        </Field.Root>

                        {/* Service URL (Ollama only) */}
                        {aiConfig.provider === 'ollama' && (
                          <Field.Root invalid={!!errors['ai.configuration.url']}>
                            <Field.Label fontSize={{ base: "xs", sm: "sm" }}>Service URL</Field.Label>
                            <Input
                              value={aiConfig.configuration?.url || ''}
                              onChange={(e) => handleUpdateAIConfig('url', e.target.value)}
                              placeholder="http://host.docker.internal:11434/api"
                              bg="inputBg"
                              size={{ base: "sm", sm: "md" }}
                            />
                            {errors['ai.configuration.url'] && (
                              <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                                {errors['ai.configuration.url']}
                              </Field.ErrorText>
                            )}
                            <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                              URL to your hosted Ollama instance (required for Ollama)
                            </Field.HelperText>
                          </Field.Root>
                        )}
                      </VStack>
                    </Box>

                    {/* Pre-defined Commands */}
                    <Box>
                      <Flex justify="space-between" align="center" mb={3}>
                        <Box>
                          <Text fontSize={{ base: "sm", sm: "md" }} fontWeight="semibold" color="text">
                            Pre-defined Chat Commands
                          </Text>
                          <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted">
                            {aiCommands.length} command{aiCommands.length === 1 ? '' : 's'}
                          </Text>
                        </Box>
                        <Button
                          onClick={handleAddCommand}
                          colorPalette="green"
                          size={{ base: "sm", sm: "sm" }}
                          leftIcon={<MdAdd />}
                        >
                          Add Command
                        </Button>
                      </Flex>

                      {/* Info Box */}
                      <Box 
                        p={3} 
                        mb={3}
                        bg="infoBg"
                        _dark={{ bg: "infoBg" }}
                        borderRadius="md" 
                        border="1px solid" 
                        borderColor="border"
                      >
                        <Text fontSize={{ base: "xs", sm: "sm" }} color="text" opacity={0.9}>
                          Pre-define frequently used questions. For example, a command <code>analyse-last-workout</code> 
                          can be used with <code>/analyse-last-workout</code> in the AI chat.
                        </Text>
                      </Box>

                      {aiCommands.length === 0 ? (
                        <Box
                          p={6}
                          textAlign="center"
                          bg="panelBg"
                          borderRadius="md"
                          border="2px dashed"
                          borderColor="border"
                        >
                          <Text fontSize="sm" color="textMuted" mb={3}>
                            No commands defined yet. Add commands for frequently asked questions.
                          </Text>
                          <Button
                            onClick={handleAddCommand}
                            colorPalette="green"
                            size="sm"
                            leftIcon={<MdAdd />}
                          >
                            Add First Command
                          </Button>
                        </Box>
                      ) : (
                        <VStack align="stretch" gap={3}>
                          {aiCommands.map((cmd, index) => {
                            const isExpanded = expandedCommands[index];
                            const hasErrors = Object.keys(errors).some(key => key.startsWith(`ai.agent.commands[${index}]`));

                            return (
                              <Box
                                key={index}
                                borderWidth="1px"
                                borderColor={hasErrors ? "warningBorder" : "border"}
                                _dark={{ borderColor: hasErrors ? "warningBorder" : "border" }}
                                borderRadius="md"
                                overflow="hidden"
                              >
                                {/* Header */}
                                <Flex
                                  p={{ base: 2, sm: 3 }}
                                  bg={hasErrors ? "warningBg" : "panelBg"}
                                  _dark={{ bg: hasErrors ? "warningBg" : "panelBg" }}
                                  align="center"
                                  gap={{ base: 1, sm: 2 }}
                                  cursor="pointer"
                                  onClick={() => toggleCommandExpansion(index)}
                                  _hover={{ opacity: 0.8 }}
                                  wrap="wrap"
                                >
                                  <Box as={isExpanded ? MdExpandMore : MdChevronRight} boxSize={{ base: "16px", sm: "20px" }} flexShrink={0} />
                                  <Text fontWeight="600" color="text" flex="1" fontSize={{ base: "sm", sm: "md" }} minW="120px" fontFamily="mono">
                                    /{cmd.command || `command-${index + 1}`}
                                  </Text>
                                  <HStack gap={{ base: 0.5, sm: 1 }} flexShrink={0}>
                                    <IconButton
                                      size={{ base: "xs", sm: "sm" }}
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveCommand(index, index - 1);
                                      }}
                                      isDisabled={index === 0}
                                      aria-label="Move up"
                                      minW={{ base: "24px", sm: "32px" }}
                                      h={{ base: "24px", sm: "32px" }}
                                      p={0}
                                    >
                                      <MdArrowUpward />
                                    </IconButton>
                                    <IconButton
                                      size={{ base: "xs", sm: "sm" }}
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveCommand(index, index + 1);
                                      }}
                                      isDisabled={index === aiCommands.length - 1}
                                      aria-label="Move down"
                                      minW={{ base: "24px", sm: "32px" }}
                                      h={{ base: "24px", sm: "32px" }}
                                      p={0}
                                    >
                                      <MdArrowDownward />
                                    </IconButton>
                                    <IconButton
                                      size={{ base: "xs", sm: "sm" }}
                                      variant="ghost"
                                      colorPalette="red"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveCommand(index);
                                      }}
                                      aria-label="Remove"
                                      minW={{ base: "24px", sm: "32px" }}
                                      h={{ base: "24px", sm: "32px" }}
                                      p={0}
                                    >
                                      <MdDelete />
                                    </IconButton>
                                  </HStack>
                                </Flex>

                                {/* Expanded Content */}
                                {isExpanded && (
                                  <Box p={{ base: 3, sm: 4 }} bg="cardBg">
                                    <VStack align="stretch" gap={4}>
                                      {/* Command Name */}
                                      <Field.Root invalid={!!errors[`ai.agent.commands[${index}].command`]}>
                                        <Field.Label fontSize={{ base: "xs", sm: "sm" }}>Command</Field.Label>
                                        <Input
                                          value={cmd.command || ''}
                                          onChange={(e) => handleUpdateCommand(index, 'command', e.target.value)}
                                          placeholder="analyse-last-workout"
                                          bg="inputBg"
                                          size={{ base: "sm", sm: "md" }}
                                          fontFamily="mono"
                                        />
                                        <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                                          Command name (use letters, numbers, hyphens). Will be used as /{cmd.command || 'command'}
                                        </Field.HelperText>
                                        {errors[`ai.agent.commands[${index}].command`] && (
                                          <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                                            {errors[`ai.agent.commands[${index}].command`]}
                                          </Field.ErrorText>
                                        )}
                                      </Field.Root>

                                      {/* Message */}
                                      <Field.Root invalid={!!errors[`ai.agent.commands[${index}].message`]}>
                                        <Field.Label fontSize={{ base: "xs", sm: "sm" }}>Message / Prompt</Field.Label>
                                        <Textarea
                                          value={cmd.message || ''}
                                          onChange={(e) => handleUpdateCommand(index, 'message', e.target.value)}
                                          placeholder="You are my bike trainer. Please analyze my most recent ride..."
                                          bg="inputBg"
                                          size={{ base: "sm", sm: "md" }}
                                          rows={4}
                                        />
                                        <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                                          The prompt/question that will be sent to the AI when this command is used
                                        </Field.HelperText>
                                        {errors[`ai.agent.commands[${index}].message`] && (
                                          <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                                            {errors[`ai.agent.commands[${index}].message`]}
                                          </Field.ErrorText>
                                        )}
                                      </Field.Root>
                                    </VStack>
                                  </Box>
                                )}
                              </Box>
                            );
                          })}
                        </VStack>
                      )}
                    </Box>
                  </VStack>
                ) : (
                  <Box
                    p={8}
                    textAlign="center"
                    bg="panelBg"
                    borderRadius="md"
                    border="2px dashed"
                    borderColor="border"
                  >
                    <Text fontSize="sm" color="textMuted">
                      AI features are currently disabled. Enable them using the checkbox above to configure an AI provider.
                    </Text>
                  </Box>
                )}
              </VStack>
            </Box>
          </VStack>
        );
      }}
    </BaseConfigEditor>
  );
};

export default IntegrationsConfigEditor;
