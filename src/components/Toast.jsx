import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex, Text, IconButton, Icon } from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { MdInfo, MdCheckCircle, MdWarning, MdError } from 'react-icons/md';

const Toast = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'error': return MdError;
      case 'warning': return MdWarning;
      case 'success': return MdCheckCircle;
      case 'info':
      default: return MdInfo;
    }
  };

  const getColorScheme = () => {
    switch (type) {
      case 'error': return { bg: 'red.500', color: 'white' };
      case 'warning': return { bg: 'orange.500', color: 'white' };
      case 'success': return { bg: 'green.500', color: 'white' };
      case 'info':
      default: return { bg: 'blue.500', color: 'white' };
    }
  };

  const colors = getColorScheme();
  const IconComponent = getIcon();

  return (
    <Box
      minW="300px"
      maxW="500px"
      bg={colors.bg}
      color={colors.color}
      borderRadius="md"
      boxShadow="lg"
      transform={isVisible ? 'translateX(0)' : 'translateX(100%)'}
      opacity={isVisible ? 1 : 0}
      transition="all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)"
      overflow="hidden"
    >
      <Flex align="flex-start" gap={2} p={3}>
        <Icon as={IconComponent} boxSize={4} flexShrink={0} />
        <Text flex={1} fontSize="sm" lineHeight="1.3" wordBreak="break-word">
          {message}
        </Text>
        <IconButton
          size="xs"
          variant="ghost"
          color="white"
          _hover={{ bg: 'whiteAlpha.300' }}
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          aria-label="Close notification"
          flexShrink={0}
        >
          <CloseIcon boxSize={2.5} />
        </IconButton>
      </Flex>
    </Box>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  duration: PropTypes.number,
  onClose: PropTypes.func.isRequired
};

export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <Box
      position="fixed"
      bottom={5}
      right={5}
      zIndex={1000}
      display="flex"
      flexDirection="column"
      gap={2}
      pointerEvents="none"
      w={{ base: 'calc(100% - 40px)', md: 'auto' }}
    >
      {toasts.map(toast => (
        <Box key={toast.id} pointerEvents="auto">
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        </Box>
      ))}
    </Box>
  );
};

ToastContainer.propTypes = {
  toasts: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
    duration: PropTypes.number
  })).isRequired,
  removeToast: PropTypes.func.isRequired
};

export default Toast;