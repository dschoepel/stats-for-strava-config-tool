'use client'

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Stack, Heading, Text, Button, HStack, Flex, Field } from '@chakra-ui/react';
import { PasswordInput, PasswordStrengthMeter } from '../../src/components/ui/password-input';
import { toaster } from '../../src/components/ui/toaster';
import { passwordStrength } from 'check-password-strength';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  // Calculate password strength
  const strength = useMemo(() => {
    if (!newPassword) return 0;
    const result = passwordStrength(newPassword);
    return result.id; // 0 = Too weak, 1 = Weak, 2 = Medium, 3 = Strong
  }, [newPassword]);

  const strengthLabel = useMemo(() => {
    const labels = ['Too weak', 'Weak', 'Medium', 'Strong'];
    return labels[strength] || 'Too weak';
  }, [strength]);

  // Real-time validation
  const errors = useMemo(() => {
    const errs = {};

    if (touched.currentPassword && !currentPassword) {
      errs.currentPassword = 'Current password is required';
    }

    if (touched.newPassword) {
      if (!newPassword) {
        errs.newPassword = 'New password is required';
      } else if (newPassword.length < 8) {
        errs.newPassword = 'Password must be at least 8 characters';
      } else if (currentPassword && newPassword === currentPassword) {
        errs.newPassword = 'New password must be different from current password';
      }
    }

    if (touched.confirmPassword) {
      if (!confirmPassword) {
        errs.confirmPassword = 'Please confirm your new password';
      } else if (confirmPassword !== newPassword) {
        errs.confirmPassword = 'Passwords do not match';
      }
    }

    return errs;
  }, [currentPassword, newPassword, confirmPassword, touched]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all as touched
    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    // Check for validation errors
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        toaster.create({
          title: 'Password changed',
          description: data.message || 'Password changed successfully. Please login with your new password.',
          type: 'success',
        });

        // Redirect to login
        setTimeout(() => {
          router.push('/login');
          router.refresh();
        }, 1000);
      } else {
        toaster.create({
          title: 'Change password failed',
          description: data.error,
          type: 'error',
        });
      }
    } catch {
      toaster.create({
        title: 'Error',
        description: 'An unexpected error occurred',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg="bg"
      p={{ base: 4, sm: 6, md: 8 }}
    >
      <Box
        w="full"
        maxW="md"
        bg="cardBg"
        borderRadius="lg"
        boxShadow="lg"
        p={{ base: 6, sm: 8 }}
        borderWidth="1px"
        borderColor="border"
      >
        <Stack gap={6}>
          <Stack gap={2}>
            <Heading
              size={{ base: "xl", sm: "2xl" }}
              color="text"
              textAlign="center"
            >
              Change Password
            </Heading>
            <Text
              color="textMuted"
              textAlign="center"
            >
              Enter your current password and choose a new one
            </Text>
          </Stack>

          <Stack as="form" onSubmit={handleSubmit} gap={5}>
            {/* Current Password */}
            <Field.Root
              invalid={!!errors.currentPassword && touched.currentPassword}
            >
              <Field.Label color="text">Current Password</Field.Label>
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, currentPassword: true })}
                placeholder="Enter current password"
                color="text"
                bg="inputBg"
                borderColor="border"
                _focus={{ borderColor: "primary" }}
                disabled={loading}
              />
              {errors.currentPassword && touched.currentPassword && (
                <Field.ErrorText>{errors.currentPassword}</Field.ErrorText>
              )}
            </Field.Root>

            {/* New Password */}
            <Stack gap={2}>
              <Field.Root
                invalid={!!errors.newPassword && touched.newPassword}
              >
                <Field.Label color="text">New Password</Field.Label>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onBlur={() => setTouched({ ...touched, newPassword: true })}
                  placeholder="Enter new password (min 8 characters)"
                  color="text"
                  bg="inputBg"
                  borderColor="border"
                  _focus={{ borderColor: "primary" }}
                  disabled={loading}
                />
                {errors.newPassword && touched.newPassword ? (
                  <Field.ErrorText>{errors.newPassword}</Field.ErrorText>
                ) : (
                  <Field.HelperText color="helperText">
                    Choose a strong password with at least 8 characters
                  </Field.HelperText>
                )}
              </Field.Root>

              {/* Password Strength Meter */}
              {newPassword && (
                <Box>
                  <PasswordStrengthMeter value={strength + 1} max={4} />
                  <Text
                    fontSize="sm"
                    color="textMuted"
                    mt={1}
                  >
                    Password strength: {strengthLabel}
                  </Text>
                </Box>
              )}
            </Stack>

            {/* Confirm Password */}
            <Field.Root
              invalid={!!errors.confirmPassword && touched.confirmPassword}
            >
              <Field.Label color="text">Confirm New Password</Field.Label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                placeholder="Re-enter new password"
                color="text"
                bg="inputBg"
                borderColor="border"
                _focus={{ borderColor: "primary" }}
                disabled={loading}
              />
              {errors.confirmPassword && touched.confirmPassword && (
                <Field.ErrorText>{errors.confirmPassword}</Field.ErrorText>
              )}
            </Field.Root>

            {/* Action Buttons */}
            <HStack gap={3} mt={2}>
              <Button
                type="submit"
                flex={1}
                bg="primary"
                color="white"
                _hover={{ bg: "primaryHover" }}
                loading={loading}
                disabled={loading || Object.keys(errors).length > 0}
              >
                Change Password
              </Button>
              <Button
                type="button"
                flex={1}
                variant="outline"
                borderColor="border"
                color="text"
                _hover={{ bg: "panelBg" }}
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            </HStack>
          </Stack>
        </Stack>
      </Box>
    </Flex>
  );
}
