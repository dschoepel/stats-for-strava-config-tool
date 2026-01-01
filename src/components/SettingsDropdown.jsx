import { useState, useRef, useEffect } from 'react';
import { Box, Button, VStack, HStack, Text, Icon } from '@chakra-ui/react';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { 
  MdSettings, MdPalette, MdFolder, MdEdit, MdVerifiedUser, 
  MdSportsSoccer, MdWidgets, MdImportExport 
} from 'react-icons/md';

const SettingsDropdown = ({ onSelectSetting }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const menuItems = [
    { id: 'ui', label: 'User Interface', icon: MdPalette },
    { id: 'files', label: 'Files', icon: MdFolder },
    { id: 'editor', label: 'Editor', icon: MdEdit },
    { id: 'validation', label: 'Validation', icon: MdVerifiedUser },
    { id: 'sportsList', label: 'Sports List', icon: MdSportsSoccer },
    { id: 'widgetDefinitions', label: 'Widgets', icon: MdWidgets },
    { id: 'importExport', label: 'Import/Export', icon: MdImportExport }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (itemId) => {
    setIsOpen(false);
    onSelectSetting(itemId);
  };

  return (
    <Box position="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        variant="ghost"
        color="white"
        _hover={{ bg: "whiteAlpha.200" }}
        fontWeight="medium"
        gap={2}
      >
        <Icon as={MdSettings} boxSize={5} />
        Settings
        {isOpen ? <ChevronUpIcon boxSize={4} /> : <ChevronDownIcon boxSize={4} />}
      </Button>
      
      {isOpen && (
        <Box
          position="absolute"
          top="100%"
          right={0}
          mt={2}
          bg="cardBg"
          border="1px solid"
          borderColor="border"
          borderRadius="md"
          boxShadow="lg"
          minW="200px"
          zIndex={1000}
          overflow="hidden"
        >
          <VStack gap={0} align="stretch">
            {menuItems.map(item => (
              <Button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                variant="ghost"
                justifyContent="flex-start"
                color="text"
                _hover={{ bg: "primary", color: "white" }}
                fontWeight="medium"
                px={4}
                py={3}
                borderRadius={0}
              >
                <HStack gap={3} w="full">
                  <Icon as={item.icon} boxSize={5} />
                  <Text>{item.label}</Text>
                </HStack>
              </Button>
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default SettingsDropdown;
