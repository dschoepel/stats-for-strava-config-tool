import { Box, VStack, HStack, Flex, Text, IconButton, Collapsible } from '@chakra-ui/react';
import { ChevronRightIcon, ChevronLeftIcon, ChevronDownIcon } from '@chakra-ui/icons';
import {
  MdBuild, MdPerson, MdPalette, MdFileDownload,
  MdBarChart, MdDirectionsBike, MdLink, MdSchedule,
  MdDescription, MdHelp, MdConstruction, MdTerminal
} from 'react-icons/md';
import { FcDataConfiguration } from 'react-icons/fc';
import { SiYaml } from 'react-icons/si';
import { TbBrandZwift } from 'react-icons/tb';
import { PiGithubLogo } from 'react-icons/pi';
import packageJson from '../../../package.json';
import { pages, getChildren } from '../../_config/pages';
import { useSettings } from '../../../src/state/SettingsProvider';

// Icon map - string to component
const iconMap = {
  'FcDataConfiguration': FcDataConfiguration,
  'MdBuild': MdBuild,
  'MdPerson': MdPerson,
  'MdPalette': MdPalette,
  'MdFileDownload': MdFileDownload,
  'MdBarChart': MdBarChart,
  'MdDirectionsBike': MdDirectionsBike,
  'TbBrandZwift': TbBrandZwift,
  'MdLink': MdLink,
  'MdSchedule': MdSchedule,
  'MdConstruction': MdConstruction,
  'SiYaml': SiYaml,
  'MdHelp': MdHelp,
  'MdTerminal': MdTerminal
};

const MenuItem = ({ page, onClick, isCollapsed, isSubmenu = false, onToggleSidebar }) => {
  const Icon = page.icon ? iconMap[page.icon] : null;

  return (
    <Flex
      as="button"
      align="center"
      w="full"
      px={isSubmenu ? 6 : 4}
      py={3}
      color="text"
      bg="transparent"
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ bg: "cardBg", color: "primary" }}
      onClick={(e) => {
        onClick(e);
        // Close sidebar on mobile after selecting an item
        if (window.innerWidth < 768 && onToggleSidebar) {
          onToggleSidebar();
        }
      }}
      title={page.fullLabel || (isCollapsed ? page.label : undefined)}
      position="relative"
      justify={isCollapsed ? "center" : "flex-start"}
    >
      {Icon && (
        <Box as={Icon} color="sidebarIcon" fontSize={isSubmenu ? "16px" : "20px"} flexShrink={0} />
      )}
      {!isCollapsed && (
        <Text ml={3} fontSize={isSubmenu ? "sm" : "md"} fontWeight="medium">
          {page.label}
        </Text>
      )}
    </Flex>
  );
};

const MenuItemWithSubmenu = ({
  page,
  onClick,
  isExpanded,
  onToggle,
  isCollapsed,
  children,
  onToggleSidebar
}) => {
  const Icon = page.icon ? iconMap[page.icon] : null;

  return (
    <Box>
      <Flex align="center" position="relative">
        <Flex
          as="button"
          align="center"
          flex={1}
          px={4}
          py={3}
          color="text"
          bg="transparent"
          cursor="pointer"
          transition="all 0.2s"
          _hover={{ bg: "cardBg", color: "primary" }}
          onClick={onClick}
          title={page.fullLabel || (isCollapsed ? page.label : undefined)}
          justify={isCollapsed ? "center" : "flex-start"}
        >
          {Icon && (
            <Box as={Icon} color="sidebarIcon" fontSize="20px" flexShrink={0} />
          )}
          {!isCollapsed && (
            <Text ml={3} fontSize="md" fontWeight="medium">
              {page.label}
            </Text>
          )}
        </Flex>
        {!isCollapsed && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            aria-label="Toggle submenu"
            size="sm"
            variant="ghost"
            colorPalette="gray"
            _hover={{ bg: "bg" }}
            mr={2}
          >
            {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </IconButton>
        )}
      </Flex>
      {!isCollapsed && (
        <Collapsible.Root open={isExpanded} id={`submenu-${page.id}`}>
          <Collapsible.Content>
            <VStack gap={0} bg="cardBg" align="stretch">
              {children}
            </VStack>
          </Collapsible.Content>
        </Collapsible.Root>
      )}
    </Box>
  );
};

export default function Sidebar({
  isCollapsed,
  onToggle,
  isMainConfigExpanded,
  setIsMainConfigExpanded,
  isUtilitiesExpanded,
  setIsUtilitiesExpanded,
  isHelpExpanded,
  setIsHelpExpanded,
  handleNavClick
}) {
  const { settings } = useSettings();

  // Get pages from config
  const configPage = pages['Configuration'];
  const configChildren = getChildren('Configuration');
  const utilitiesPage = pages['Utilities'];

  // Filter utilities children based on settings
  const utilitiesChildren = getChildren('Utilities').filter(child => {
    // Hide SFS Console if feature is disabled
    if (child.id === 'SFS Console' && !settings?.features?.enableSfsConsole) {
      return false;
    }
    return true;
  });

  const documentationPage = pages['Documentation'];
  const documentationChildren = getChildren('Documentation');

  return (
    <>
      {/* Mobile backdrop overlay */}
      {!isCollapsed && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          zIndex={998}
          display={{ base: "block", md: "none" }}
          onClick={onToggle}
        />
      )}

      <Box
        as="aside"
        w={{ base: "250px", md: isCollapsed ? "60px" : "250px" }}
        bg="cardBg"
        color="text"
        boxShadow="md"
        overflowY="auto"
        overflowX="hidden"
        transition="transform 0.3s ease, width 0.3s ease"
        position={{ base: "fixed", md: "relative" }}
        top={{ base: "64px", md: "auto" }}
        left={{ base: 0, md: "auto" }}
        h={{ base: "calc(100vh - 64px)", md: "auto" }}
        zIndex={999}
        borderRight="1px solid"
        borderColor="border"
        transform={{
          base: isCollapsed ? "translateX(-100%)" : "translateX(0)",
          md: "translateX(0)"
        }}
        display="flex"
        flexDirection="column"
      >
        <Flex
          justify={isCollapsed ? "center" : "space-between"}
          align="center"
          px={isCollapsed ? 2 : 4}
          py={4}
          borderBottom="1px solid"
          borderColor="border"
        >
          {!isCollapsed && (
            <Text fontSize="lg" fontWeight="bold" color="text">
              Navigation
            </Text>
          )}
          <IconButton
            onClick={onToggle}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            size="sm"
            variant="ghost"
            colorPalette="orange"
            _hover={{ bg: "bg" }}
            display={{ base: isCollapsed ? "none" : "flex", md: "flex" }}
          >
            {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Flex>

        <VStack gap={0} align="stretch" py={2} flex="1" overflowY="auto">
          {/* Configuration with submenu */}
          <MenuItemWithSubmenu
            page={configPage}
            isExpanded={isMainConfigExpanded}
            isCollapsed={isCollapsed}
            onToggleSidebar={onToggle}
            onClick={(e) => {
              e.preventDefault();
              // Only toggle submenu, don't navigate
              if (isCollapsed) {
                onToggle();
                setIsMainConfigExpanded(true);
              } else {
                setIsMainConfigExpanded(!isMainConfigExpanded);
              }
            }}
            onToggle={() => setIsMainConfigExpanded(!isMainConfigExpanded)}
          >
            {configChildren.map(child => (
              <MenuItem
                key={child.id}
                page={child}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(child.id, child.parent);
                }}
                isSubmenu
                isCollapsed={isCollapsed}
                onToggleSidebar={onToggle}
              />
            ))}
          </MenuItemWithSubmenu>

          {/* Utilities with submenu */}
          <MenuItemWithSubmenu
            page={utilitiesPage}
            isExpanded={isUtilitiesExpanded}
            isCollapsed={isCollapsed}
            onToggleSidebar={onToggle}
            onClick={(e) => {
              e.preventDefault();
              if (isCollapsed) {
                onToggle();
                setIsUtilitiesExpanded(true);
              } else {
                setIsUtilitiesExpanded(!isUtilitiesExpanded);
              }
            }}
            onToggle={() => setIsUtilitiesExpanded(!isUtilitiesExpanded)}
          >
            {utilitiesChildren.map(child => (
              <MenuItem
                key={child.id}
                page={child}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(child.id);
                }}
                isSubmenu
                isCollapsed={isCollapsed}
                onToggleSidebar={onToggle}
              />
            ))}
          </MenuItemWithSubmenu>

          {/* Documentation with submenu */}
          <MenuItemWithSubmenu
            page={documentationPage}
            isExpanded={isHelpExpanded}
            isCollapsed={isCollapsed}
            onToggleSidebar={onToggle}
            onClick={(e) => {
              e.preventDefault();
              if (isCollapsed) {
                onToggle();
                setIsHelpExpanded(true);
              } else {
                setIsHelpExpanded(!isHelpExpanded);
              }
            }}
            onToggle={() => setIsHelpExpanded(!isHelpExpanded)}
          >
            {documentationChildren.map(child => (
              <MenuItem
                key={child.id}
                page={child}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(child.id, child.parent);
                }}
                isSubmenu
                isCollapsed={isCollapsed}
                onToggleSidebar={onToggle}
              />
            ))}
          </MenuItemWithSubmenu>
        </VStack>

        {/* Version Footer */}
        <Box
          pt={4}
          pb={2}
          px={4}
          borderTop="1px solid"
          borderColor="border"
          flexShrink={0}
        >
          {!isCollapsed ? (
            <VStack gap={1} align="flex-start">
              <HStack gap={2}>
                <Box as={PiGithubLogo} fontSize="16px" color="fg.muted" />
                <Text
                  as="a"
                  href="https://github.com/dschoepel/stats-for-strava-config-tool?tab=readme-ov-file"
                  target="_blank"
                  rel="noopener noreferrer"
                  fontSize="xs"
                  color="fg.muted"
                  _hover={{ color: "primary", textDecoration: "underline" }}
                  cursor="pointer"
                >
                  Stats for Strava Config Tool
                </Text>
              </HStack>
              <Text fontSize="xs" color="fg.subtle" fontFamily="mono">
                v{packageJson.version}
              </Text>
            </VStack>
          ) : (
            <Text fontSize="xs" color="fg.muted" textAlign="center" title={`Version ${packageJson.version}`}>
              v{packageJson.version}
            </Text>
          )}
        </Box>
      </Box>
    </>
  );
}
