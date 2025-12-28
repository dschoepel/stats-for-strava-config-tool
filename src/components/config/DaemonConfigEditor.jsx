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
  Checkbox,
  Link,
  createListCollection,
  SelectRoot,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValueText,
} from '@chakra-ui/react';
import { 
  MdAdd, 
  MdDelete, 
  MdArrowUpward, 
  MdArrowDownward, 
  MdExpandMore, 
  MdChevronRight, 
  MdInfo, 
  MdWarning,
  MdSchedule,
  MdOpenInNew
} from 'react-icons/md';
import BaseConfigEditor from './BaseConfigEditor';
import CronExpressionDialog from '../CronExpressionDialog';

const CRON_ACTIONS = [
  { value: 'importDataAndBuildApp', label: 'Import Data and Build App' },
  { value: 'gearMaintenanceNotification', label: 'Gear Maintenance Notification' },
  { value: 'appUpdateAvailableNotification', label: 'App Update Available Notification' }
];

/**
 * DaemonConfigEditor - Handles daemon cron job configuration
 * Manages scheduled actions and cron expressions
 */
const DaemonConfigEditor = ({ 
  initialData, 
  onSave, 
  onCancel, 
  isLoading,
  onDirtyChange 
}) => {
  const [expandedJobs, setExpandedJobs] = useState({});
  const [cronDialogState, setCronDialogState] = useState({ isOpen: false, jobIndex: null, currentExpression: '' });

  // Custom validation for daemon fields
  const validateDaemonFields = (formData, getNestedValue) => {
    const errors = {};
    
    const cronJobs = getNestedValue(formData, 'daemon.cron') || [];
    
    // Validate cron jobs
    cronJobs.forEach((job, index) => {
      if (!job.action || job.action.trim() === '') {
        errors[`daemon.cron[${index}].action`] = 'Action is required';
      }
      
      if (!job.expression || job.expression.trim() === '') {
        errors[`daemon.cron[${index}].expression`] = 'Cron expression is required';
      } else {
        // Basic cron validation (5 parts separated by spaces)
        const parts = job.expression.trim().split(/\s+/);
        if (parts.length !== 5) {
          errors[`daemon.cron[${index}].expression`] = 'Must be a valid cron expression (5 parts)';
        }
      }
      
      if (job.enabled === undefined || job.enabled === null) {
        errors[`daemon.cron[${index}].enabled`] = 'Enabled status is required';
      }
    });
    
    return errors;
  };

  const actionCollection = createListCollection({
    items: CRON_ACTIONS,
  });

  return (
    <>
    <BaseConfigEditor
      sectionName="daemon"
      initialData={initialData}
      onSave={onSave}
      onCancel={onCancel}
      isLoading={isLoading}
      onDirtyChange={onDirtyChange}
      customValidation={validateDaemonFields}
    >
      {({ formData, handleFieldChange, getNestedValue, errors }) => {
        const cronJobs = getNestedValue(formData, 'daemon.cron') || [];

        // Get list of actions already in use
        const usedActions = cronJobs.map(job => job.action);
        const availableActions = CRON_ACTIONS.filter(action => !usedActions.includes(action.value));
        const allActionsUsed = availableActions.length === 0;

        // Cron Job Handlers
        const handleAddCronJob = () => {
          // Find first available action not already in use
          if (availableActions.length === 0) return;
          
          handleFieldChange('daemon.cron', [
            ...cronJobs,
            { 
              action: availableActions[0].value, 
              expression: '0 14 * * *', 
              enabled: true 
            }
          ]);
        };

        const handleRemoveCronJob = (index) => {
          const updated = cronJobs.filter((_, i) => i !== index);
          handleFieldChange('daemon.cron', updated);
          
          const newExpanded = { ...expandedJobs };
          delete newExpanded[index];
          setExpandedJobs(newExpanded);
        };

        const handleMoveCronJob = (index, direction) => {
          const newIndex = direction === 'up' ? index - 1 : index + 1;
          if (newIndex < 0 || newIndex >= cronJobs.length) return;
          
          const updated = [...cronJobs];
          [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
          handleFieldChange('daemon.cron', updated);
        };

        const handleUpdateCronJob = (index, field, value) => {
          const updated = [...cronJobs];
          updated[index] = { ...updated[index], [field]: value };
          handleFieldChange('daemon.cron', updated);
        };

        const handleSaveCronExpression = (newExpression) => {
          if (cronDialogState.jobIndex !== null) {
            handleUpdateCronJob(cronDialogState.jobIndex, 'expression', newExpression);
          }
        };

        const toggleExpanded = (index) => {
          setExpandedJobs(prev => ({
            ...prev,
            [index]: !prev[index]
          }));
        };

        return (
          <VStack align="stretch" gap={6}>
            {/* Introduction */}
            <Box>
              <Text fontSize={{ base: "sm", sm: "md" }} color="text" mb={2}>
                Configure scheduled tasks that run automatically at specified intervals. This requires the daemon Docker container to be set up.
              </Text>
            </Box>

            {/* Docker Warning Box */}
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
                    Docker Container Required
                  </Text>
                  <Text fontSize={{ base: "xs", sm: "sm" }} color="text" opacity={0.9}>
                    This configuration only applies if you have set up the daemon container. See{' '}
                    <Link 
                      href="https://statistics-for-strava-docs.robiningelbrecht.be/#/getting-started/installation?id=docker-composeyml" 
                      isExternal
                      color="blue.500"
                      textDecoration="underline"
                    >
                      installation docs <Box as={MdOpenInNew} display="inline" boxSize="12px" />
                    </Link>
                  </Text>
                </VStack>
              </HStack>
            </Box>

            {/* Cron Jobs Section */}
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
                      <Box as={MdSchedule} color="primary" boxSize="20px" />
                      <Text fontSize={{ base: "md", sm: "lg" }} fontWeight="semibold" color="text">
                        Scheduled Tasks
                      </Text>
                    </HStack>
                    <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted">
                      {cronJobs.length} task{cronJobs.length === 1 ? '' : 's'} configured
                      {availableActions.length > 0 && ` • ${availableActions.length} action${availableActions.length === 1 ? '' : 's'} available`}
                    </Text>
                  </Box>
                  <Button
                    onClick={handleAddCronJob}
                    colorPalette="blue"
                    size={{ base: "sm", sm: "sm" }}
                    width={{ base: "100%", sm: "auto" }}
                    leftIcon={<MdAdd />}
                    isDisabled={allActionsUsed}
                  >
                    Add Task
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
                      About Cron Expressions
                    </Text>
                  </HStack>
                  <Text fontSize={{ base: "xs", sm: "sm" }} color="text" opacity={0.9}>
                    Format: <code>minute hour day month weekday</code>. Example: <code>0 14 * * *</code> runs daily at 2 PM.{' '}
                    <Link 
                      href="https://crontab.guru/" 
                      isExternal
                      color="blue.500"
                      textDecoration="underline"
                    >
                      Use crontab.guru <Box as={MdOpenInNew} display="inline" boxSize="12px" />
                    </Link>
                    {' '}to test expressions.
                  </Text>
                </Box>

                {cronJobs.length === 0 ? (
                  <Box
                    p={8}
                    textAlign="center"
                    bg="panelBg"
                    borderRadius="md"
                    border="2px dashed"
                    borderColor="border"
                  >
                    <Text fontSize="sm" color="textMuted" mb={3}>
                      No scheduled tasks configured. Add a task to automate actions.
                    </Text>
                    <Button
                      onClick={handleAddCronJob}
                      colorPalette="blue"
                      size="sm"
                      leftIcon={<MdAdd />}
                    >
                      Add Your First Task
                    </Button>
                  </Box>
                ) : (
                  <VStack align="stretch" gap={3}>
                    {cronJobs.map((job, index) => {
                      const isExpanded = expandedJobs[index];
                      const actionLabel = CRON_ACTIONS.find(a => a.value === job.action)?.label || job.action;
                      
                      return (
                        <Box
                          key={index}
                          p={3}
                          bg="panelBg"
                          borderRadius="md"
                          border="1px solid"
                          borderColor="border"
                        >
                          {/* Job Header */}
                          <Flex justify="space-between" align="center" gap={2} mb={isExpanded ? 3 : 0}>
                            <HStack gap={2} flex={1} minW={0}>
                              <IconButton
                                size="xs"
                                variant="ghost"
                                onClick={() => toggleExpanded(index)}
                                aria-label={isExpanded ? "Collapse" : "Expand"}
                              >
                                {isExpanded ? <MdExpandMore /> : <MdChevronRight />}
                              </IconButton>
                              <VStack align="start" gap={0} flex={1} minW={0}>
                                <Text fontSize={{ base: "xs", sm: "sm" }} fontWeight="medium" color="text" noOfLines={1}>
                                  {actionLabel}
                                </Text>
                                <HStack gap={2} fontSize={{ base: "xs", sm: "xs" }} color="textMuted">
                                  <Text>Schedule: {job.expression}</Text>
                                  <Text>•</Text>
                                  <Text color={job.enabled ? "green.500" : "red.500"}>
                                    {job.enabled ? 'Enabled' : 'Disabled'}
                                  </Text>
                                </HStack>
                              </VStack>
                            </HStack>
                            <HStack gap={1}>
                              <IconButton
                                size="xs"
                                variant="ghost"
                                onClick={() => handleMoveCronJob(index, 'up')}
                                isDisabled={index === 0}
                                aria-label="Move up"
                              >
                                <MdArrowUpward />
                              </IconButton>
                              <IconButton
                                size="xs"
                                variant="ghost"
                                onClick={() => handleMoveCronJob(index, 'down')}
                                isDisabled={index === cronJobs.length - 1}
                                aria-label="Move down"
                              >
                                <MdArrowDownward />
                              </IconButton>
                              <IconButton
                                size="xs"
                                variant="ghost"
                                colorPalette="red"
                                onClick={() => handleRemoveCronJob(index)}
                                aria-label="Delete"
                              >
                                <MdDelete />
                              </IconButton>
                            </HStack>
                          </Flex>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <VStack align="stretch" gap={3} pl={{ base: 0, sm: 6 }}>
                              {/* Action Selection */}
                              <Field.Root invalid={!!errors[`daemon.cron[${index}].action`]}>
                                <Field.Label fontSize={{ base: "xs", sm: "sm" }}>Action</Field.Label>
                                <SelectRoot
                                  collection={actionCollection}
                                  value={[job.action]}
                                  onValueChange={(e) => handleUpdateCronJob(index, 'action', e.value[0])}
                                  size={{ base: "sm", sm: "md" }}
                                >
                                  <SelectTrigger>
                                    <SelectValueText placeholder="Select action" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CRON_ACTIONS.map((action) => {
                                      // Show all actions for current job, but mark unavailable ones
                                      const isCurrentAction = action.value === job.action;
                                      const isUsedByOther = usedActions.includes(action.value) && !isCurrentAction;
                                      
                                      return (
                                        <SelectItem 
                                          key={action.value} 
                                          item={action.value}
                                          disabled={isUsedByOther}
                                        >
                                          {action.label}{isUsedByOther ? ' (already configured)' : ''}
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </SelectRoot>
                                {errors[`daemon.cron[${index}].action`] && (
                                  <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                                    {errors[`daemon.cron[${index}].action`]}
                                  </Field.ErrorText>
                                )}
                                <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                                  {job.action === 'importDataAndBuildApp' && 'Imports new Strava data and rebuilds the app'}
                                  {job.action === 'gearMaintenanceNotification' && 'Sends notifications for gear maintenance (requires notifications setup)'}
                                  {job.action === 'appUpdateAvailableNotification' && 'Notifies when app updates are available (requires notifications setup)'}
                                </Field.HelperText>
                              </Field.Root>

                              {/* Cron Expression */}
                              <Field.Root invalid={!!errors[`daemon.cron[${index}].expression`]}>
                                <Field.Label fontSize={{ base: "xs", sm: "sm" }}>Cron Expression</Field.Label>
                                <HStack gap={2}>
                                  <Input
                                    value={job.expression}
                                    onChange={(e) => handleUpdateCronJob(index, 'expression', e.target.value)}
                                    placeholder="0 14 * * *"
                                    bg="inputBg"
                                    size={{ base: "sm", sm: "md" }}
                                    fontFamily="monospace"
                                    flex={1}
                                  />
                                  <Button
                                    size={{ base: "sm", sm: "md" }}
                                    colorPalette="blue"
                                    variant="outline"
                                    onClick={() => setCronDialogState({ isOpen: true, jobIndex: index, currentExpression: job.expression })}
                                  >
                                    Builder
                                  </Button>
                                </HStack>
                                {errors[`daemon.cron[${index}].expression`] && (
                                  <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                                    {errors[`daemon.cron[${index}].expression`]}
                                  </Field.ErrorText>
                                )}
                                <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                                  Format: minute hour day month weekday. Test at{' '}
                                  <Link 
                                    href="https://crontab.guru/" 
                                    isExternal
                                    color="blue.500"
                                    textDecoration="underline"
                                  >
                                    crontab.guru
                                  </Link>
                                </Field.HelperText>
                              </Field.Root>

                              {/* Enabled Toggle */}
                              <Field.Root>
                                <Checkbox.Root
                                  checked={job.enabled}
                                  onCheckedChange={(e) => handleUpdateCronJob(index, 'enabled', e.checked)}
                                  colorPalette="blue"
                                  size={{ base: "sm", sm: "md" }}
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control>
                                    <Checkbox.Indicator />
                                  </Checkbox.Control>
                                  <Checkbox.Label fontSize={{ base: "xs", sm: "sm" }}>
                                    Enable this scheduled task
                                  </Checkbox.Label>
                                </Checkbox.Root>
                                <Field.HelperText fontSize={{ base: "xs", sm: "sm" }} ml={6}>
                                  Disabled tasks will not run even if configured
                                </Field.HelperText>
                              </Field.Root>
                            </VStack>
                          )}
                        </Box>
                      );
                    })}
                  </VStack>
                )}
              </VStack>
            </Box>

            {/* Cron Expression Dialog */}
            <CronExpressionDialog
              key={`cron-dialog-${cronDialogState.jobIndex}-${cronDialogState.currentExpression}`}
              isOpen={cronDialogState.isOpen}
              initialValue={cronDialogState.currentExpression}
              onClose={() => setCronDialogState({ isOpen: false, jobIndex: null, currentExpression: '' })}
              onSave={handleSaveCronExpression}
            />
          </VStack>
        );
      }}
    </BaseConfigEditor>
  </>
  );
};

export default DaemonConfigEditor;
