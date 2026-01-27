import { useState, useCallback, useMemo, memo } from 'react';
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
import { Tooltip } from '../../_components/ui/Tooltip';
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
import CronExpressionDialog from '../../_components/fields/CronExpressionDialog';

const CRON_ACTIONS = [
  { value: 'importDataAndBuildApp', label: 'Import Data and Build App' },
  { value: 'gearMaintenanceNotification', label: 'Gear Maintenance Notification' },
  { value: 'appUpdateAvailableNotification', label: 'App Update Available Notification' }
];

/**
 * Convert cron expression to human-readable text
 * @param {string} expression - Cron expression (e.g., "0 14 * * *")
 * @returns {string} - Human-readable description
 */
const cronToHumanReadable = (expression) => {
  if (!expression) return 'Invalid expression';
  
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return 'Invalid expression format';
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  // Helper to convert 24-hour to 12-hour format
  const formatHour = (h) => {
    const hourNum = parseInt(h);
    if (isNaN(hourNum)) return h;
    if (hourNum === 0) return '12 AM';
    if (hourNum < 12) return `${hourNum} AM`;
    if (hourNum === 12) return '12 PM';
    return `${hourNum - 12} PM`;
  };
  
  // Build human-readable string
  let readable = 'Runs ';
  
  // Frequency (day of week and day of month)
  if (dayOfWeek !== '*' && dayOfMonth === '*') {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayNums = dayOfWeek.split(',');
    if (dayNums.length === 1) {
      readable += `every ${days[parseInt(dayNums[0])]} `;
    } else {
      readable += `on ${dayNums.map(d => days[parseInt(d)]).join(', ')} `;
    }
  } else if (dayOfMonth !== '*') {
    readable += `on day ${dayOfMonth} of each month `;
  } else {
    readable += 'every day ';
  }
  
  // Time
  if (hour === '*' && minute === '*') {
    readable += 'every minute';
  } else if (hour === '*') {
    readable += minute === '0' ? 'every hour' : `at ${minute} minutes past every hour`;
  } else if (minute === '0') {
    readable += `at ${formatHour(hour)}`;
  } else {
    readable += `at ${formatHour(hour)}:${minute.padStart(2, '0')}`;
  }
  
  // Month (if specified)
  if (month !== '*') {
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    readable += ` in ${months[parseInt(month)]}`;
  }
  
  return readable;
};

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
  const validateDaemonFields = useCallback((formData, getNestedValue) => {
    const errors = {};
    
    const cronJobs = getNestedValue(formData, 'cron') || [];
    
    // Validate cron jobs
    cronJobs.forEach((job, index) => {
      if (!job.action || job.action.trim() === '') {
        errors[`cron[${index}].action`] = 'Action is required';
      }
      
      if (!job.expression || job.expression.trim() === '') {
        errors[`cron[${index}].expression`] = 'Cron expression is required';
      } else {
        // Basic cron validation (5 parts separated by spaces)
        const parts = job.expression.trim().split(/\s+/);
        if (parts.length !== 5) {
          errors[`cron[${index}].expression`] = 'Must be a valid cron expression (5 parts)';
        }
      }
      
      if (job.enabled === undefined || job.enabled === null) {
        errors[`cron[${index}].enabled`] = 'Enabled status is required';
      }
    });

    return errors;
  }, []);

  const actionCollection = useMemo(() => createListCollection({
    items: CRON_ACTIONS,
  }), []);

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
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const cronJobs = useMemo(() => getNestedValue(formData, 'cron') || [], [formData, getNestedValue]);

        // Memoize list of used and available actions
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const usedActions = useMemo(() => cronJobs.map(job => job.action), [cronJobs]);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const availableActions = useMemo(() =>
          CRON_ACTIONS.filter(action => !usedActions.includes(action.value)),
          [usedActions]
        );

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const allActionsUsed = useMemo(() => availableActions.length === 0, [availableActions]);

        // Cron Job Handlers
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const handleAddCronJob = useCallback(() => {
          // Find first available action not already in use
          if (availableActions.length === 0) return;
          
          handleFieldChange('cron', [
            ...cronJobs,
            { 
              action: availableActions[0].value, 
              expression: '0 14 * * *', 
              enabled: true
            }
          ]);
        }, [availableActions, cronJobs, handleFieldChange]);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const handleRemoveCronJob = useCallback((index) => {
          const updated = cronJobs.filter((_, i) => i !== index);
          handleFieldChange('cron', updated);
          
          setExpandedJobs(prev => {
            const newExpanded = { ...prev };
            delete newExpanded[index];
            return newExpanded;
          });
        }, [cronJobs, handleFieldChange]);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const handleMoveCronJob = useCallback((index, direction) => {
          const newIndex = direction === 'up' ? index - 1 : index + 1;
          if (newIndex < 0 || newIndex >= cronJobs.length) return;
          
          const updated = [...cronJobs];
          [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
          handleFieldChange('cron', updated);
        }, [cronJobs, handleFieldChange]);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const handleUpdateCronJob = useCallback((index, field, value) => {
          const updated = [...cronJobs];
          updated[index] = { ...updated[index], [field]: value };
          handleFieldChange('cron', updated);
        }, [cronJobs, handleFieldChange]);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const handleSaveCronExpression = useCallback((newExpression) => {
          if (cronDialogState.jobIndex !== null) {
            handleUpdateCronJob(cronDialogState.jobIndex, 'expression', newExpression);
          }
        }, [handleUpdateCronJob]);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const toggleExpanded = useCallback((index) => {
          setExpandedJobs(prev => ({
            ...prev,
            [index]: !prev[index]
          }));
        }, []);

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
                  <Box as="ul" listStyleType="disc" listStylePosition="inside" fontSize={{ base: "xs", sm: "sm" }} color="text" opacity={0.9} sx={{ "& li": { marginBottom: "4px" } }} >
                    <li>
                      Be sure to restart the daemon container after making schedule changes.
                    </li>

                    <li>
                      This configuration only applies if you have set up the daemon
                      container. See{" "}
                      <Link href="https://statistics-for-strava-docs.robiningelbrecht.be/#/getting-started/installation?id=docker-composeyml" isExternal color="blue.500" textDecoration="underline" >
                        installation docs{" "}
                        <Box as={MdOpenInNew} display="inline" boxSize="12px" />
                      </Link>
                    </li>
                 </Box>
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
                      {allActionsUsed && ' • All tasks scheduled'}
                    </Text>
                  </Box>
                  <Tooltip content={allActionsUsed ? "All available tasks have been scheduled" : "Add a new scheduled task"}>
                    <Button
                      onClick={handleAddCronJob}
                      colorPalette="blue"
                      size={{ base: "sm", sm: "sm" }}
                      width={{ base: "100%", sm: "auto" }}
                      leftIcon={<MdAdd />}
                      disabled={allActionsUsed}
                      opacity={allActionsUsed ? 0.5 : 1}
                      cursor={allActionsUsed ? "not-allowed" : "pointer"}
                    >
                      {allActionsUsed ? 'All Tasks Scheduled' : 'Add Task'}
                    </Button>
                  </Tooltip>
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
                          <Box>
                            {/* Main content row */}
                            <Flex gap={2} align="center" mb={{ base: 2, sm: 0 }}>
                              <IconButton
                                size="xs"
                                variant="ghost"
                                onClick={() => toggleExpanded(index)}
                                aria-label={isExpanded ? "Collapse" : "Expand"}
                                flexShrink={0}
                              >
                                {isExpanded ? <MdExpandMore /> : <MdChevronRight />}
                              </IconButton>
                              <VStack align="start" gap={0} flex={1} minW={0}>
                                <Text fontSize={{ base: "xs", sm: "sm" }} fontWeight="medium" color="text" noOfLines={1}>
                                  {actionLabel}
                                </Text>
                                <HStack gap={2} fontSize={{ base: "2xs", sm: "xs" }} color="textMuted" flexWrap="wrap">
                                  <HStack gap={1}>
                                    <Box as={MdSchedule} boxSize="12px" />
                                    <Text noOfLines={1}>{cronToHumanReadable(job.expression)}</Text>
                                  </HStack>
                                  <Text display={{ base: "none", sm: "block" }}>•</Text>
                                  <Text color={job.enabled ? "green.500" : "red.500"}>
                                    {job.enabled ? 'Enabled' : 'Disabled'}
                                  </Text>
                                </HStack>
                              </VStack>
                              {/* Action buttons - show on larger screens only */}
                              <HStack gap={1} flexShrink={0} display={{ base: "none", sm: "flex" }}>
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
                            
                            {/* Action buttons - show on mobile screens only, below content */}
                            <Flex 
                              gap={1} 
                              justify="flex-end" 
                              display={{ base: "flex", sm: "none" }}
                              pt={1}
                              borderTop={{ base: "1px solid", sm: "none" }}
                              borderColor={{ base: "border", sm: "transparent" }}
                              mt={1}
                            >
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
                            </Flex>
                          </Box>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <VStack align="stretch" gap={3} pl={{ base: 0, sm: 6 }} mt={3}>
                              {/* Action Selection */}
                              <Field.Root invalid={!!errors[`cron[${index}].action`]}>
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
                                {errors[`cron[${index}].action`] && (
                                  <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                                    {errors[`cron[${index}].action`]}
                                  </Field.ErrorText>
                                )}
                                <Field.HelperText fontSize={{ base: "xs", sm: "sm" }}>
                                  {job.action === 'importDataAndBuildApp' && 'Imports new Strava data and rebuilds the app'}
                                  {job.action === 'gearMaintenanceNotification' && 'Sends notifications for gear maintenance (requires notifications setup)'}
                                  {job.action === 'appUpdateAvailableNotification' && 'Notifies when app updates are available (requires notifications setup)'}
                                </Field.HelperText>
                              </Field.Root>

                              {/* Cron Expression */}
                              <Field.Root invalid={!!errors[`cron[${index}].expression`]}>
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
                                {errors[`cron[${index}].expression`] && (
                                  <Field.ErrorText fontSize={{ base: "xs", sm: "sm" }}>
                                    {errors[`cron[${index}].expression`]}
                                  </Field.ErrorText>
                                )}
                                {/* Human-readable schedule */}
                                <Box 
                                  p={2} 
                                  bg="infoBg" 
                                  borderRadius="md" 
                                  border="1px solid" 
                                  borderColor="border"
                                  mt={1}
                                >
                                  <HStack gap={2}>
                                    <Box as={MdSchedule} color="blue.500" boxSize="14px" flexShrink={0} />
                                    <Text fontSize={{ base: "xs", sm: "sm" }} color="text" fontWeight="medium">
                                      {cronToHumanReadable(job.expression)}
                                    </Text>
                                  </HStack>
                                </Box>
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

// Wrap with memo to prevent unnecessary re-renders
export default memo(DaemonConfigEditor);
