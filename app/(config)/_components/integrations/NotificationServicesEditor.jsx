import React from 'react';
import PropTypes from 'prop-types';
import { Box, VStack, HStack, Text, Button, Field, Input, IconButton, Flex } from '@chakra-ui/react';
import { MdAdd, MdDelete, MdNotifications, MdInfo } from 'react-icons/md';
import { Tooltip } from '../../../_components/ui/Tooltip';

/**
 * NotificationServicesEditor - Manages notification service URLs
 */
const NotificationServicesEditor = ({ services = [], onChange, errors = {} }) => {
  const handleAdd = () => {
    onChange([...services, '']);
  };

  const handleRemove = (index) => {
    onChange(services.filter((_, i) => i !== index));
  };

  const handleUpdate = (index, value) => {
    const updated = [...services];
    updated[index] = value;
    onChange(updated);
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
        <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
          <Box flex="1" minW={{ base: "100%", sm: "auto" }}>
            <HStack gap={2}>
              <Box as={MdNotifications} color="primary" boxSize="20px" />
              <Text fontSize={{ base: "md", sm: "lg" }} fontWeight="semibold" color="text">
                Notifications
              </Text>
            </HStack>
            <Text fontSize={{ base: "xs", sm: "sm" }} color="textMuted">
              {services.length} service{services.length === 1 ? '' : 's'} configured
            </Text>
          </Box>
          <Button
            onClick={handleAdd}
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

        {services.length === 0 ? (
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
              onClick={handleAdd}
              colorPalette="blue"
              size="sm"
              leftIcon={<MdAdd />}
            >
              Add Your First Service
            </Button>
          </Box>
        ) : (
          <VStack align="stretch" gap={3}>
            {services.map((service, index) => (
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
                      fontSize: 'xs',
                      maxW: '300px',
                      wordBreak: 'break-all'
                    }}
                  >
                    <Input
                      value={service}
                      onChange={(e) => handleUpdate(index, e.target.value)}
                      placeholder="discord://token@id or ntfy://ntfy.sh/topic"
                      bg="inputBg"
                      size={{ base: "sm", sm: "md" }}
                      flex={1}
                    />
                  </Tooltip>
                  <IconButton
                    onClick={() => handleRemove(index)}
                    colorPalette="red"
                    variant="outline"
                    size={{ base: "sm", sm: "md" }}
                    title="Remove service"
                    aria-label="Remove service"
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
                  Use Shoutrrr format (discord://, slack://, telegram://, ntfy://, etc.)
                </Field.HelperText>
              </Field.Root>
            ))}
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

NotificationServicesEditor.propTypes = {
  services: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.object
};

export default NotificationServicesEditor;
