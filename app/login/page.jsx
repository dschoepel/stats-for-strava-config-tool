'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  VStack, 
  Heading, 
  Text, 
  Input, 
  Button, 
  Link,
  Field
} from '@chakra-ui/react';
import { toaster } from '../../src/components/ui/toaster';
import { PasswordInput } from '../../src/components/ui/password-input';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous errors

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        toaster.create({
          title: 'Login successful',
          type: 'success',
        });
        router.push('/');
        router.refresh();
      } else {
        if (data.requiresRegistration) {
          toaster.create({
            title: 'Registration required',
            description: data.error,
            type: 'info',
          });
          router.push('/register');
        } else {
          // Show inline error instead of toast
          setError(data.error || 'Invalid username or password');
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

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
              Sign In
            </Heading>
            <Text color="textMuted" textAlign="center" fontSize={{ base: "sm", sm: "md" }}>
              Enter your credentials to access the application
            </Text>
          </VStack>

          <Box as="form" onSubmit={handleSubmit}>
            <VStack gap={4} align="stretch">
              {/* Error message */}
              {error && (
                <Box
                  bg="red.500/10"
                  color="red.600"
                  _dark={{ bg: "red.500/20", color: "red.400" }}
                  p={3}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="red.500/30"
                  fontSize="sm"
                >
                  {error}
                </Box>
              )}

              <Field.Root required>
                <Field.Label>Username</Field.Label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                  color="text"
                  bg="inputBg"
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label>Password</Field.Label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  color="text"
                  bg="inputBg"
                />
              </Field.Root>

              <Button
                type="submit"
                bg="primary"
                color="white"
                w="full"
                loading={loading}
                _hover={{ bg: 'primaryHover' }}
              >
                Sign In
              </Button>
            </VStack>
          </Box>

          <VStack gap={2} pt={2}>
            <Link href="/register" color="primary" fontSize="sm">
              Need to register?
            </Link>
            <Link href="/reset-password" color="textMuted" fontSize="sm">
              Forgot password?
            </Link>
          </VStack>
        </VStack>
      </Box>
    </Box>
  );
}
