import { useCallback, useMemo, memo } from 'react';
import { VStack } from '@chakra-ui/react';
import BaseConfigEditor from './BaseConfigEditor';
import NotificationServicesEditor from './integrations/NotificationServicesEditor';
import AIConfigSection from './integrations/AIConfigSection';
import AICommandsList from './integrations/AICommandsList';

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
  // Pass data as-is - let YAML serializer handle quoting naturally
  const handleSaveWithTransform = useCallback((formData) => {
    onSave(formData);
  }, [onSave]);

  // Custom validation for integrations fields
  const validateIntegrationsFields = useCallback((formData, getNestedValue) => {
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
  }, []);

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
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const notificationServices = useMemo(() =>
          (getNestedValue(formData, 'notifications.services') || [])
            .map(url => {
              if (typeof url === 'string') {
                // Remove surrounding quotes (single or double)
                return url.replace(/^['"]|['"]$/g, '');
              }
              return url;
            }),
          [formData, getNestedValue]
        );

        const aiConfig = getNestedValue(formData, 'ai') || {
          enabled: false,
          enableUI: false,
          provider: '',
          configuration: { key: '', model: '', url: null }
        };

        const aiCommands = getNestedValue(formData, 'ai.agent.commands') || [];

        // Handler for notification services
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const handleNotificationsChange = useCallback((updatedServices) => {
          handleFieldChange('notifications.services', updatedServices);
        }, [handleFieldChange]);

        // Handler for AI configuration
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const handleAIConfigChange = useCallback((updatedConfig) => {
          handleFieldChange('ai', updatedConfig);
        }, [handleFieldChange]);

        // Handler for AI commands
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const handleCommandsChange = useCallback((updatedCommands) => {
          handleFieldChange('ai.agent.commands', updatedCommands);
        }, [handleFieldChange]);

        return (
          <VStack align="stretch" gap={6}>
            {/* Notifications Section */}
            <NotificationServicesEditor
              services={notificationServices}
              onChange={handleNotificationsChange}
              errors={errors}
            />

            {/* AI Configuration Section */}
            <AIConfigSection
              config={aiConfig}
              onChange={handleAIConfigChange}
              errors={errors}
            />

            {/* AI Commands Section (only show if AI is enabled) */}
            {aiConfig.enabled && (
              <AICommandsList
                commands={aiCommands}
                onChange={handleCommandsChange}
                errors={errors}
              />
            )}
          </VStack>
        );
      }}
    </BaseConfigEditor>
  );
};

// Wrap with memo to prevent unnecessary re-renders
export default memo(IntegrationsConfigEditor);
