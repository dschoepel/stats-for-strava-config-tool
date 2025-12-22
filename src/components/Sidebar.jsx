import { Box, VStack, HStack, Flex, Text, IconButton, Collapsible } from '@chakra-ui/react';
import { ChevronRightIcon, ChevronLeftIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { 
  MdBuild, MdPerson, MdPalette, MdFileDownload, 
  MdBarChart, MdDirectionsBike, MdLink, MdSchedule,
  MdDescription, MdHelp 
} from 'react-icons/md';
import { FcDataConfiguration } from 'react-icons/fc';
import { SiYaml } from 'react-icons/si';
import { TbBrandZwift } from 'react-icons/tb';

const MenuItem = ({ icon: Icon, label, onClick, isCollapsed, isSubmenu = false, onToggleSidebar }) => (
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
    title={isCollapsed ? label : undefined}
    position="relative"
    justify={isCollapsed ? "center" : "flex-start"}
  >
    {Icon && (
      <Box as={Icon} color="sidebarIcon" fontSize={isSubmenu ? "16px" : "20px"} flexShrink={0} />
    )}
    {!isCollapsed && (
      <Text ml={3} fontSize={isSubmenu ? "sm" : "md"} fontWeight="medium">
        {label}
      </Text>
    )}
  </Flex>
);

const MenuItemWithSubmenu = ({ 
  icon: Icon,
  label, 
  onClick, 
  isExpanded, 
  onToggle, 
  isCollapsed, 
  children,
  onToggleSidebar
}) => (
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
        title={isCollapsed ? label : undefined}
        justify={isCollapsed ? "center" : "flex-start"}
      >
        {Icon && (
          <Box as={Icon} color="sidebarIcon" fontSize="20px" flexShrink={0} />
        )}
        {!isCollapsed && (
          <Text ml={3} fontSize="md" fontWeight="medium">
            {label}
          </Text>
        )}
      </Flex>
      {!isCollapsed && (
        <IconButton
          onClick={onToggle}
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
      <Collapsible.Root open={isExpanded}>
        <Collapsible.Content>
          <VStack gap={0} bg="cardBg" align="stretch">
            {children}
          </VStack>
        </Collapsible.Content>
      </Collapsible.Root>
    )}
  </Box>
);

export default function Sidebar({ 
  isCollapsed, 
  onToggle, 
  isMainConfigExpanded,
  setIsMainConfigExpanded,
  setIsSidebarCollapsed,
  handleNavClick 
}) {
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
          bg={{ base: "primary", md: "transparent" }}
          color={{ base: "white", md: "inherit" }}
          border={{ base: "1px solid white", md: "none" }}
          _hover={{ 
            bg: { base: "primaryHover", md: "bg" }
          }}
          display={{ base: isCollapsed ? "none" : "flex", md: "flex" }}
        >
          {isCollapsed ? <ChevronRightIcon color="inherit" /> : <ChevronLeftIcon color="white" />}
        </IconButton>
      </Flex>

      <VStack gap={0} align="stretch" py={2}>
        <MenuItemWithSubmenu
          icon={FcDataConfiguration}
          label="Configuration"
          isExpanded={isMainConfigExpanded}
          isCollapsed={isCollapsed}
          onToggleSidebar={onToggle}
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('Configuration');
            if (isCollapsed) {
              setIsSidebarCollapsed(false);
              setIsMainConfigExpanded(true);
            } else {
              setIsMainConfigExpanded(!isMainConfigExpanded);
            }
          }}
          onToggle={() => setIsMainConfigExpanded(!isMainConfigExpanded)}
        >
          <MenuItem 
            icon={MdBuild} 
            label="General" 
            onClick={(e) => { e.preventDefault(); handleNavClick('General', 'Configuration'); }}
            isSubmenu
            onToggleSidebar={onToggle}
          />
          <MenuItem 
            icon={MdPerson} 
            label="Athlete" 
            onClick={(e) => { e.preventDefault(); handleNavClick('Athlete', 'Configuration'); }}
            isSubmenu
            onToggleSidebar={onToggle}
          />
          <MenuItem 
            icon={MdPalette} 
            label="Appearance" 
            onClick={(e) => { e.preventDefault(); handleNavClick('Appearance', 'Configuration'); }}
            isSubmenu
            onToggleSidebar={onToggle}
          />
          <MenuItem 
            icon={MdFileDownload} 
            label="Import" 
            onClick={(e) => { e.preventDefault(); handleNavClick('Import', 'Configuration'); }}
            isSubmenu
            onToggleSidebar={onToggle}
          />
          <MenuItem 
            icon={MdBarChart} 
            label="Metrics" 
            onClick={(e) => { e.preventDefault(); handleNavClick('Metrics', 'Configuration'); }}
            isSubmenu
            onToggleSidebar={onToggle}
          />
          <MenuItem 
            icon={MdDirectionsBike} 
            label="Gear" 
            onClick={(e) => { e.preventDefault(); handleNavClick('Gear', 'Configuration'); }}
            isSubmenu
            onToggleSidebar={onToggle}
          />
          <MenuItem 
            icon={TbBrandZwift} 
            label="Zwift" 
            onClick={(e) => { e.preventDefault(); handleNavClick('Zwift', 'Configuration'); }}
            isSubmenu
            onToggleSidebar={onToggle}
          />
          <MenuItem 
            icon={MdLink} 
            label="Integrations" 
            onClick={(e) => { e.preventDefault(); handleNavClick('Integrations', 'Configuration'); }}
            isSubmenu
            onToggleSidebar={onToggle}
          />
          <MenuItem 
            icon={MdSchedule} 
            label="Scheduling Daemon" 
            onClick={(e) => { e.preventDefault(); handleNavClick('Scheduling Daemon', 'Configuration'); }}
            isSubmenu
            onToggleSidebar={onToggle}
          />
        </MenuItemWithSubmenu>

        <MenuItem 
          icon={SiYaml} 
          label="YAML Utility" 
          onClick={(e) => { e.preventDefault(); handleNavClick('YAML Utility'); }}
          isCollapsed={isCollapsed}
          onToggleSidebar={onToggle}
        />
        <MenuItem 
          icon={MdHelp} 
          label="Help & Documentation" 
          onClick={(e) => { e.preventDefault(); handleNavClick('Help & Documentation'); }}
          isCollapsed={isCollapsed}
          onToggleSidebar={onToggle}
        />
      </VStack>
    </Box>
    </>
  );
}
