// app/_components/layout/UserMenu.jsx
'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HStack, VStack, Text, Avatar, Icon, Portal, Circle, Box, Button, IconButton } from '@chakra-ui/react';
import { MdExpandMore, MdLock, MdLogout, MdNotifications, MdInfo, MdWarning, MdError, MdCheckCircle, MdClose, MdCheck } from 'react-icons/md';
import {
  MenuRoot,
  MenuTrigger,
  MenuPositioner,
  MenuContent,
  MenuItem,
  MenuSeparator,
} from '../../../src/components/ui/menu';
import { toaster } from '../../../src/components/ui/toaster';
import { useDialog } from '../../../src/state/DialogProvider';
import { useNotifications } from '../../../src/hooks/useNotifications';

export default function UserMenu() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const { showConfirmDialog, closeDialog } = useDialog();
  const { notifications, unreadCount, markAsRead, clearNotification, clearAll } = useNotifications();

  // Get notification type icon and color
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error':
        return { icon: MdError, color: 'red.500' };
      case 'warning':
        return { icon: MdWarning, color: 'orange.500' };
      case 'success':
        return { icon: MdCheckCircle, color: 'green.500' };
      case 'info':
      default:
        return { icon: MdInfo, color: 'blue.500' };
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const response = await fetch('/api/auth/user');
        
        // If not authenticated, don't render the menu
        if (!response.ok) {
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          setUsername(data.username);
        }
      } catch (error) {
        console.error('Failed to fetch username:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsername();
  }, []);

  const handleChangePassword = () => {
    router.push('/change-password');
  };

  const handleLogout = () => {
    showConfirmDialog({
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      onConfirm: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
          
          toaster.create({
            title: 'Logged out',
            description: 'You have been logged out successfully',
            type: 'success',
          });

          router.push('/login');
          router.refresh();
        } catch {
          toaster.create({
            title: 'Error',
            description: 'Failed to logout',
            type: 'error',
          });
        } finally {
          closeDialog();
        }
      },
    });
  };

  // Don't render if loading or no username (not authenticated)
  if (loading || !username) {
    return null;
  }

  // Get initials from username (first 2 characters, uppercase)
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <MenuRoot positioning={{ placement: "bottom-end" }}>
      <MenuTrigger asChild>
        <HStack
          gap={2}
          cursor="pointer"
          px={3}
          py={2}
          borderRadius="md"
          bg="whiteAlpha.200"
          color="white"
          _hover={{ bg: "whiteAlpha.300" }}
          transition="all 0.2s"
        >
          <Box position="relative">
            <Avatar.Root
              size="sm"
              bg="whiteAlpha.400"
              color="white"
            >
              <Avatar.Fallback fontWeight="bold">{initials}</Avatar.Fallback>
            </Avatar.Root>
            {unreadCount > 0 && (
              <Circle
                size={5}
                bg="red.500"
                color="white"
                fontSize="xs"
                fontWeight="bold"
                position="absolute"
                top={-1}
                right={-1}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Circle>
            )}
          </Box>
          <Text
            fontWeight="medium"
            display={{ base: "none", sm: "block" }}
          >
            {username}
          </Text>
          <Icon as={MdExpandMore} boxSize={5} />
        </HStack>
      </MenuTrigger>

      <Portal>
        <MenuPositioner>
          <MenuContent
            bg="cardBg"
            borderColor="border"
            borderWidth="1px"
            boxShadow="lg"
            minW="320px"
            maxW="400px"
          >
            {/* Notifications Section */}
            {notifications.length > 0 && (
              <>
                <Box px={3} py={2} borderBottomWidth="1px" borderColor="border">
                  <HStack justify="space-between">
                    <HStack gap={2}>
                      <Icon as={MdNotifications} boxSize={5} color="text" />
                      <Text fontWeight="semibold" color="text">
                        Notifications
                      </Text>
                      {unreadCount > 0 && (
                        <Circle size={5} bg="red.500" color="white" fontSize="xs" fontWeight="bold">
                          {unreadCount}
                        </Circle>
                      )}
                    </HStack>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={clearAll}
                      color="text"
                    >
                      Clear All
                    </Button>
                  </HStack>
                </Box>

                <Box
                  maxH="300px"
                  overflowY="auto"
                  css={{
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'var(--chakra-colors-border)',
                      borderRadius: '4px',
                    },
                  }}
                >
                  {notifications.map((notification) => {
                    const { icon, color } = getNotificationIcon(notification.type);
                    return (
                      <Box
                        key={notification.id}
                        px={3}
                        py={2}
                        borderBottomWidth="1px"
                        borderColor="border"
                        bg={notification.read ? 'transparent' : 'panelBg'}
                        _hover={{ bg: 'panelBg' }}
                        transition="background 0.2s"
                      >
                        <HStack align="start" gap={3}>
                          <Icon as={icon} boxSize={5} color={color} mt={0.5} />
                          <VStack align="start" gap={1} flex={1}>
                            <Text fontSize="sm" color="text">
                              {notification.message}
                            </Text>
                            {notification.action && (
                              <Button
                                size="xs"
                                colorPalette="blue"
                                variant="outline"
                                onClick={() => {
                                  // Mark as read when action is clicked
                                  markAsRead(notification.id);
                                  // Handle action
                                  if (notification.action.type === 'open-backup-manager') {
                                    // Emit custom event to open backup manager
                                    window.dispatchEvent(new CustomEvent('open-backup-manager'));
                                  }
                                }}
                                mt={1}
                              >
                                {notification.action.label}
                              </Button>
                            )}
                            <Text fontSize="xs" color="text" opacity={0.7}>
                              {formatTime(notification.createdAt)}
                            </Text>
                          </VStack>
                          <HStack gap={1}>
                            {!notification.read && (
                              <IconButton
                                size="xs"
                                variant="ghost"
                                onClick={() => markAsRead(notification.id)}
                                aria-label="Mark as read"
                                color="text"
                              >
                                <MdCheck />
                              </IconButton>
                            )}
                            <IconButton
                              size="xs"
                              variant="ghost"
                              onClick={() => clearNotification(notification.id)}
                              aria-label="Clear notification"
                              color="text"
                            >
                              <MdClose />
                            </IconButton>
                          </HStack>
                        </HStack>
                      </Box>
                    );
                  })}
                </Box>

                <MenuSeparator borderColor="border" />
              </>
            )}

            {/* User Menu Items */}
            <MenuItem
              value="change-password"
              onClick={handleChangePassword}
              color="text"
              _hover={{ bg: "panelBg" }}
            >
              <HStack gap={3}>
                <Icon as={MdLock} boxSize={5} />
                <Text>Change Password</Text>
              </HStack>
            </MenuItem>

            <MenuSeparator borderColor="border" />

            <MenuItem
              value="logout"
              onClick={handleLogout}
              color="text"
              _hover={{ bg: "panelBg" }}
            >
              <HStack gap={3}>
                <Icon as={MdLogout} boxSize={5} />
                <Text>Logout</Text>
              </HStack>
            </MenuItem>
          </MenuContent>
        </MenuPositioner>
      </Portal>
    </MenuRoot>
  );
}
