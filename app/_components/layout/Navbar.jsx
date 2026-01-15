import { Flex, HStack, Heading, Image, IconButton, Link, Icon } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HiMenuAlt2 } from 'react-icons/hi';
import { MdLightMode, MdDarkMode } from 'react-icons/md';
import SettingsDropdown from './SettingsDropdown';
import UserMenu from './UserMenu';

export default function Navbar({
  isDarkMode,
  toggleTheme,
  toggleSidebar,
  handleNavClick,
  onSelectSetting
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Flex
      as="nav"
      bg="primary"
      color="white"
      justify="space-between"
      align="center"
      px={6}
      h="64px"
      boxShadow="md"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1000}
    >
      <HStack gap={4}>
        <IconButton
          onClick={toggleSidebar}
          aria-label="Toggle menu"
          bg="whiteAlpha.200"
          color="white"
          fontSize="2xl"
          size="md"
          _hover={{ bg: "whiteAlpha.300" }}
          display={{ base: "flex", md: "none" }}
        >
          <Icon as={HiMenuAlt2} />
        </IconButton>
        <Image 
          src="/logo.svg" 
          alt="Stats for Strava" 
          boxSize="32px"
          flexShrink={0}
        />
        <Heading 
          as="h1" 
          size="md" 
          fontWeight="bold" 
          color="white"
          display={{ base: "none", sm: "block" }}
        >
          Stats for Strava Config Tool
        </Heading>
      </HStack>

      <HStack gap={6} display={{ base: "none", md: "flex" }}>
        <Link 
          onClick={(e) => { e.preventDefault(); handleNavClick('Configuration'); }}
          color="white"
          fontWeight="medium"
          _hover={{ opacity: 0.8 }}
          textDecoration="none"
        >
          Home
        </Link>
        <SettingsDropdown onSelectSetting={onSelectSetting} />
        <UserMenu />
        <IconButton
          onClick={toggleTheme}
          aria-label="Toggle theme"
          bg="whiteAlpha.200"
          color="white"
          borderRadius="full"
          border="2px solid white"
          w="40px"
          h="40px"
          _hover={{ bg: "whiteAlpha.300", transform: "scale(1.1)" }}
          transition="all 0.3s ease"
        >
          {mounted && <Icon as={isDarkMode ? MdDarkMode : MdLightMode} boxSize={5} />}
        </IconButton>
      </HStack>

      {/* Mobile menu - show only theme toggle and settings */}
      <HStack gap={2} display={{ base: "flex", md: "none" }}>
        <UserMenu />
        <SettingsDropdown onSelectSetting={onSelectSetting} />
        <IconButton
          onClick={toggleTheme}
          aria-label="Toggle theme"
          bg="whiteAlpha.200"
          color="white"
          borderRadius="full"
          border="2px solid white"
          w="36px"
          h="36px"
          _hover={{ bg: "whiteAlpha.300" }}
        >
          {mounted && <Icon as={isDarkMode ? MdDarkMode : MdLightMode} boxSize={4} />}
        </IconButton>
      </HStack>
    </Flex>
  );
}
