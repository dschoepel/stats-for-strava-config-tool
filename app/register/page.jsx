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
  Field
} from '@chakra-ui/react';
import { toaster } from '../../src/components/ui/toaster';
import { PasswordInput, PasswordStrengthMeter } from '../../src/components/ui/password-input';
import { passwordStrength } from 'check-password-strength';

export default function RegisterPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [registrationAllowed, setRegistrationAllowed] = useState(false);
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
    // Check if registration is allowed
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/auth/register');
        const data = await response.json();
        
        if (data.success && data.registrationAllowed) {
          setRegistrationAllowed(true);
        } else {
          toaster.create({
            title: 'Registration not available',
            description: 'Password already set. Please login instead.',
            type: 'info',
          });
          router.push('/login');
        }
      } catch {
        toaster.create({
          title: 'Error',
          description: 'Failed to check registration status',
          type: 'error',
        });
      } finally {
        setCheckingStatus(false);
      }
    };

    checkStatus();
  }, [router]);

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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = await response.json();

      if (data.success) {
        toaster.create({
          title: 'Registration successful',
          description: 'Your account has been created',
          type: 'success',
        });
        router.push('/');
        router.refresh();
      } else {
        toaster.create({
          title: 'Registration failed',
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
        <Text color="text">Checking registration status...</Text>
      </Box>
    );
  }

  if (!registrationAllowed) {
    return null;
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
              Register
            </Heading>
            <Text color="textMuted" textAlign="center" fontSize={{ base: "sm", sm: "md" }}>
              Create your admin password to get started
            </Text>
          </VStack>

          <Box as="form" onSubmit={handleSubmit}>
            <VStack gap={4} align="stretch">
              <Stack gap={3}>
                <Field.Root required invalid={!!errors.password}>
                  <Field.Label>Password</Field.Label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                    placeholder="Enter your password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    readOnly={false}
                    disabled={false}
                    color="text"
                    bg="inputBg"
                  />
                  {!errors.password && <Field.HelperText>Must be at least 8 characters</Field.HelperText>}
                  {errors.password && <Field.ErrorText>{errors.password}</Field.ErrorText>}
                </Field.Root>
                <PasswordStrengthMeter value={strength} />
              </Stack>

              <Field.Root required invalid={!!errors.confirmPassword}>
                <Field.Label>Confirm Password</Field.Label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  readOnly={false}
                  disabled={false}
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
                Register
              </Button>
            </VStack>
          </Box>

          <Box textAlign="center" pt={2}>
            <Link href="/login" color="primary" fontSize="sm">
              Already have an account? Sign in
            </Link>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}
