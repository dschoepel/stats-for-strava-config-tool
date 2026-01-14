'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  VStack,
  Stack,
  Heading, 
  Text, 
  Input, 
  Button, 
  Link,
  Code,
  Field
} from '@chakra-ui/react';
import { toaster } from '../../src/components/ui/toaster';
import { PasswordInput, PasswordStrengthMeter } from '../../src/components/ui/password-input';
import { passwordStrength } from 'check-password-strength';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestingReset, setRequestingReset] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [showRequestReset, setShowRequestReset] = useState(true);
  const [generatedToken, setGeneratedToken] = useState('');
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });

  // Calculate password strength using check-password-strength library
  const strength = useMemo(() => {
    if (!password) return 0;
    return passwordStrength(password).id;
  }, [password]);

  // Validation errors
  const errors = useMemo(() => {
    const errs = {};
    
    if (touched.password && password.length > 0 && password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }
    
    if (touched.confirmPassword && confirmPassword.length > 0 && password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    
    return errs;
  }, [password, confirmPassword, touched]);

  useEffect(() => {
    // Check if reset is allowed
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/auth/reset-password');
        const data = await response.json();
        
        if (data.success && data.resetAllowed) {
          setShowRequestReset(false);
        }
      } catch (error) {
        console.error('Failed to check reset status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkStatus();
  }, []);

  const handleRequestReset = async () => {
    setRequestingReset(true);

    try {
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedToken(data.token);
        setShowRequestReset(false);
        toaster.create({
          title: 'Reset token generated',
          description: 'Use the token below to reset your password',
          type: 'success',
        });
      } else {
        toaster.create({
          title: 'Request failed',
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
      setRequestingReset(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ password: true, confirmPassword: true });
    
    // Don't submit if there are validation errors
    if (Object.keys(errors).length > 0 || password.length < 8 || password !== confirmPassword) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await response.json();

      if (data.success) {
        toaster.create({
          title: 'Password reset successful',
          description: 'You can now sign in with your new password',
          type: 'success',
        });
        router.push('/');
        router.refresh();
      } else {
        toaster.create({
          title: 'Reset failed',
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

  if (checkingStatus) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="bg"
      >
        <Text color="text">Checking reset status...</Text>
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="bg"
      px={{ base: 3, sm: 4 }}
      py={{ base: 4, sm: 0 }}
    >
      <Box
        w="full"
        maxW="md"
        bg="cardBg"
        p={{ base: 4, sm: 6, md: 8 }}
        borderRadius="lg"
        borderWidth="1px"
        borderColor="border"
      >
        <VStack gap={{ base: 4, sm: 6 }} align="stretch">
          <VStack gap={2} align="center">
            <Heading size={{ base: "xl", sm: "2xl" }} color="text">
              Reset Password
            </Heading>
            <Text color="textMuted" textAlign="center" fontSize={{ base: "sm", sm: "md" }}>
              {showRequestReset 
                ? 'Generate a reset token to reset your password'
                : 'Enter the reset token and your new password'}
            </Text>
          </VStack>

          {showRequestReset ? (
            <VStack gap={4} align="stretch">
              <Text color="text" fontSize="sm">
                Click the button below to generate a password reset token. 
                The token will be displayed on this page and saved to your .env file.
              </Text>

              <Button
                onClick={handleRequestReset}
                bg="primary"
                color="white"
                w="full"
                loading={requestingReset}
                _hover={{ bg: 'primaryHover' }}
              >
                Generate Reset Token
              </Button>

              <Box textAlign="center" pt={2}>
                <Link href="/login" color="primary" fontSize="sm">
                  Back to login
                </Link>
              </Box>
            </VStack>
          ) : (
            <>
              {generatedToken && (
                <Box
                  p={4}
                  bg="panelBg"
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="border"
                >
                  <VStack gap={2} align="stretch">
                    <Text color="text" fontSize="sm" fontWeight="semibold">
                      Your Reset Token:
                    </Text>
                    <Code
                      p={2}
                      borderRadius="sm"
                      fontSize="xs"
                      wordBreak="break-all"
                      bg="inputBg"
                      color="text"
                    >
                      {generatedToken}
                    </Code>
                    <Text color="textMuted" fontSize="xs">
                      Copy this token and paste it in the field below
                    </Text>
                  </VStack>
                </Box>
              )}

              <Box as="form" onSubmit={handleSubmit}>
                <VStack gap={4} align="stretch">
                  <Field.Root required>
                    <Field.Label>Reset Token</Field.Label>
                    <Input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Enter your reset token"
                      required
                      color="text"
                      bg="inputBg"
                    />
                  </Field.Root>

                  <Stack gap={3}>
                    <Field.Root required invalid={!!errors.password}>
                      <Field.Label>New Password</Field.Label>
                      <PasswordInput
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                        placeholder="Enter your new password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        color="text"
                        bg="inputBg"
                      />
                      {!errors.password && <Field.HelperText>Must be at least 8 characters</Field.HelperText>}
                      {errors.password && <Field.ErrorText>{errors.password}</Field.ErrorText>}
                    </Field.Root>
                    <PasswordStrengthMeter value={strength} />
                  </Stack>

                  <Field.Root required invalid={!!errors.confirmPassword}>
                    <Field.Label>Confirm New Password</Field.Label>
                    <PasswordInput
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      color="text"
                      bg="inputBg"
                    />
                    {errors.confirmPassword && <Field.ErrorText>{errors.confirmPassword}</Field.ErrorText>}
                  </Field.Root>

                  <Button
                    type="submit"
                    bg="primary"
                    color="white"
                    w="full"
                    loading={loading}
                    _hover={{ bg: 'primaryHover' }}
                  >
                    Reset Password
                  </Button>
                </VStack>
              </Box>

              <Box textAlign="center" pt={2}>
                <Link href="/login" color="primary" fontSize="sm">
                  Back to login
                </Link>
              </Box>
            </>
          )}
        </VStack>
      </Box>
    </Box>
  );
}
