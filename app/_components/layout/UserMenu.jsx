// app/_components/layout/UserMenu.jsx
'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HStack, Text, Avatar, Icon, Portal } from '@chakra-ui/react';
import { MdExpandMore, MdLock, MdLogout } from 'react-icons/md';
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

export default function UserMenu() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const { showConfirmDialog, closeDialog } = useDialog();

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
          <Avatar.Root
            size="sm"
            bg="whiteAlpha.400"
            color="white"
          >
            <Avatar.Fallback fontWeight="bold">{initials}</Avatar.Fallback>
          </Avatar.Root>
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
            minW="200px"
          >
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
