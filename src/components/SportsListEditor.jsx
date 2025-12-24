import React, { useEffect, useState } from 'react';
import { Box, VStack, HStack, Flex, Heading, Text, Button, Input, Icon, IconButton } from '@chakra-ui/react';
import { MdExpandMore, MdChevronRight, MdAdd, MdDelete, MdEdit, MdSave } from 'react-icons/md';
import { readSportsList, writeSportsList, initialSportsList } from '../utils/sportsListManager';
import { ConfirmDialog } from './ConfirmDialog';

export default function SportsListEditor({ settings, onDirtyChange }) {
  const [sportsList, setSportsList] = useState(initialSportsList);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });
  
  // Modal states
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddSportModal, setShowAddSportModal] = useState(false);
  const [showEditSportModal, setShowEditSportModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    async function load() {
      const list = await readSportsList(settings);
      setSportsList(list);
      setIsDirty(false);
      if (onDirtyChange) onDirtyChange(false);
      // Collapse all categories by default
      const expanded = {};
      Object.keys(list).forEach(cat => expanded[cat] = false);
      setExpandedCategories(expanded);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const collapseAll = () => {
    const collapsed = {};
    Object.keys(sportsList).forEach(cat => collapsed[cat] = false);
    setExpandedCategories(collapsed);
  };

  const expandAll = () => {
    const expanded = {};
    Object.keys(sportsList).forEach(cat => expanded[cat] = true);
    setExpandedCategories(expanded);
  };

  // Add category
  const handleAddCategory = () => {
    if (!inputValue.trim()) {
      setModalError('Category name cannot be empty');
      return;
    }
    const exists = Object.keys(sportsList).some(
      cat => cat.toLowerCase() === inputValue.trim().toLowerCase()
    );
    if (exists) {
      setModalError('Category already exists (case-insensitive)');
      return;
    }
    const categoryName = inputValue.trim();
    setSportsList({ ...sportsList, [categoryName]: [] });
    setExpandedCategories(prev => ({ ...prev, [categoryName]: true }));
    setIsDirty(true);
    if (onDirtyChange) onDirtyChange(true);
    setShowAddCategoryModal(false);
    setInputValue('');
    setModalError('');
    showMessage(`Category "${categoryName}" added`, 'success');
  };

  // Add sport
  const handleAddSport = () => {
    if (!inputValue.trim()) {
      setModalError('Sport name cannot be empty');
      return;
    }
    const sports = sportsList[selectedCategory] || [];
    const exists = sports.some(
      s => s.toLowerCase() === inputValue.trim().toLowerCase()
    );
    if (exists) {
      setModalError('Sport already exists in this category (case-insensitive)');
      return;
    }
    const sportName = inputValue.trim();
    setSportsList({
      ...sportsList,
      [selectedCategory]: [...sports, sportName]
    });
    setIsDirty(true);
    if (onDirtyChange) onDirtyChange(true);
    setShowAddSportModal(false);
    setInputValue('');
    setModalError('');
    showMessage(`Sport "${sportName}" added to ${selectedCategory}`, 'success');
  };

  // Edit sport
  const handleEditSport = () => {
    if (!inputValue.trim()) {
      setModalError('Sport name cannot be empty');
      return;
    }
    const sports = sportsList[selectedCategory] || [];
    const exists = sports.some(
      s => s.toLowerCase() === inputValue.trim().toLowerCase() && s !== selectedSport
    );
    if (exists) {
      setModalError('Sport name already exists in this category (case-insensitive)');
      return;
    }
    setSportsList({
      ...sportsList,
      [selectedCategory]: sports.map(s => s === selectedSport ? inputValue.trim() : s)
    });
    setIsDirty(true);
    if (onDirtyChange) onDirtyChange(true);
    setShowEditSportModal(false);
    setInputValue('');
    setModalError('');
    showMessage('Sport updated', 'success');
  };

  // Delete sport
  const handleDeleteSport = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Sport',
      message: `Are you sure you want to delete sport "${selectedSport}"?`,
      onConfirm: () => {
        setSportsList({
          ...sportsList,
          [selectedCategory]: sportsList[selectedCategory].filter(s => s !== selectedSport)
        });
        setIsDirty(true);
        if (onDirtyChange) onDirtyChange(true);
        setShowEditSportModal(false);
        showMessage(`Sport "${selectedSport}" deleted from ${selectedCategory}`, 'success');
        setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' });
      }
    });
  };

  // Delete category
  const handleDeleteCategory = (cat) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete category "${cat}" and all its sports?`,
      onConfirm: () => {
        const { [cat]: _, ...rest } = sportsList;
        setSportsList(rest);
        setIsDirty(true);
        if (onDirtyChange) onDirtyChange(true);
        showMessage(`Category "${cat}" deleted`, 'success');
        setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' });
      }
    });
  };

  // Save
  const handleSave = async () => {
    try {
      await writeSportsList(settings, sportsList);
      setIsDirty(false);
      if (onDirtyChange) onDirtyChange(false);
      showMessage('✅ Saved successfully!', 'success');
    } catch (err) {
      showMessage(`❌ Error saving: ${err.message}`, 'error');
    }
  };

  return (
    <Box 
      p={5}
      bg="cardBg"
      border="1px solid"
      borderColor="border"
      borderRadius="md"
      w="100%"
      h="100%"
    >
      <Flex
        justify="space-between"
        align="center"
        mb={5}
        pb={4}
        borderBottom="2px solid"
        borderColor="border"
      >
        <Heading as="h3" size="lg" color="text">
          Sports List
        </Heading>
        <HStack gap={3}>
          <Button
            onClick={collapseAll}
            title="Collapse all categories"
            size="sm"
            variant="outline"
            colorPalette="gray"
            borderColor="border"
            leftIcon={<Icon><MdChevronRight /></Icon>}
          >
            Collapse All
          </Button>
          <Button
            onClick={expandAll}
            title="Expand all categories"
            size="sm"
            variant="outline"
            colorPalette="gray"
            borderColor="border"
            leftIcon={<Icon><MdExpandMore /></Icon>}
          >
            Expand All
          </Button>
          <Button
            onClick={() => {
              setInputValue('');
              setShowAddCategoryModal(true);
            }}
            variant="outline"
            colorPalette="gray"
            borderColor="border"
          >
            <Icon><MdAdd /></Icon>
            Category
          </Button>
          <Button
            onClick={handleSave}
            isDisabled={!isDirty}
            title={isDirty ? 'Save changes to sports list' : 'No changes to save'}
            bg="primary"
            color="white"
            _hover={{ bg: "primaryHover" }}
            border={isDirty ? "3px solid" : "none"}
            borderColor="primaryHover"
            boxShadow={isDirty ? { base: "0 0 8px rgba(252, 82, 0, 0.5)", _dark: "0 0 12px rgba(255, 127, 63, 0.8)" } : "none"}
            leftIcon={<Icon><MdSave /></Icon>}
          >
            Save Changes{isDirty ? ' *' : ''}
          </Button>
        </HStack>
      </Flex>

      {message && (
        <Box
          p={3}
          mb={4}
          borderRadius="md"
          fontWeight="medium"
          bg={messageType === 'success' ? { base: "#d4edda", _dark: "#1e4620" } : { base: "#f8d7da", _dark: "#5a1a1a" }}
          color={messageType === 'success' ? { base: "#155724", _dark: "#86efac" } : { base: "#721c24", _dark: "#fca5a5" }}
          border="1px solid"
          borderColor={messageType === 'success' ? { base: "#c3e6cb", _dark: "#166534" } : { base: "#f5c6cb", _dark: "#991b1b" }}
        >
          {message}
        </Box>
      )}

      <VStack gap={2} align="stretch">
        {Object.keys(sportsList).map(category => (
          <Box
            key={category}
            border="1px solid"
            borderColor="border"
            borderRadius="md"
            overflow="hidden"
            bg="cardBg"
          >
            <Flex
              justify="space-between"
              align="center"
              bg="panelBg"
            >
              <Button
                onClick={() => toggleCategory(category)}
                variant="ghost"
                flex={1}
                justifyContent="flex-start"
                px={4}
                py={3}
                borderRadius={0}
                _hover={{ bg: { base: "#e9ecef", _dark: "#334155" } }}
              >
                <HStack gap={3} flex={1}>
                  <Icon fontSize="xl">
                    {expandedCategories[category] ? <MdExpandMore /> : <MdChevronRight />}
                  </Icon>
                  <Text fontWeight="semibold" fontSize="md" color="text">
                    {category}
                  </Text>
                  <Text color="textMuted" fontSize="sm">
                    ({sportsList[category].length})
                  </Text>
                </HStack>
              </Button>
              <HStack gap={1} px={2}>
                <IconButton
                  onClick={() => {
                    setSelectedCategory(category);
                    setInputValue('');
                    setShowAddSportModal(true);
                  }}
                  title="Add sport to this category"
                  aria-label="Add sport"
                  size="sm"
                  variant="ghost"
                  colorPalette="gray"
                >
                  <Icon><MdAdd /></Icon>
                </IconButton>
                <IconButton
                  onClick={() => handleDeleteCategory(category)}
                  title="Delete category"
                  aria-label="Delete category"
                  size="sm"
                  variant="ghost"
                  colorPalette="red"
                >
                  <Icon><MdDelete /></Icon>
                </IconButton>
              </HStack>
            </Flex>

            {expandedCategories[category] && (
              <Box px={4} py={3} bg={{ base: "#f8f9fa", _dark: "#0f172a" }}>
                {sportsList[category].length === 0 ? (
                  <Text textAlign="center" color="textMuted" fontStyle="italic" py={4}>
                    No sports in this category
                  </Text>
                ) : (
                  <VStack gap={1} align="stretch">
                    {sportsList[category].map(sport => (
                      <Flex
                        key={sport}
                        justify="space-between"
                        align="center"
                        px={3}
                        py={2}
                        borderRadius="md"
                        bg="cardBg"
                        _hover={{ bg: { base: "#f1f3f5", _dark: "#1e293b" } }}
                        transition="background-color 0.2s"
                      >
                        <Text fontSize="sm" color="text" flex={1}>
                          - {sport}
                        </Text>
                        <IconButton
                          onClick={() => {
                            setSelectedCategory(category);
                            setSelectedSport(sport);
                            setInputValue(sport);
                            setShowEditSportModal(true);
                          }}
                          title="Edit sport"
                          aria-label="Edit sport"
                          size="xs"
                          variant="ghost"
                          colorPalette="gray"
                        >
                          <Icon><MdEdit /></Icon>
                        </IconButton>
                      </Flex>
                    ))}
                  </VStack>
                )}
              </Box>
            )}
          </Box>
        ))}
      </VStack>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <Flex
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.7)"
          justify="center"
          align="center"
          zIndex={10000}
          onClick={() => { setShowAddCategoryModal(false); setModalError(''); }}
        >
          <Box
            bg="modalBg"
            p={6}
            borderRadius="lg"
            minW="400px"
            maxW="500px"
            border="1px solid"
            borderColor="border"
            boxShadow="0 4px 20px rgba(0, 0, 0, 0.5)"
            onClick={e => e.stopPropagation()}
          >
            <Heading as="h4" size="md" mb={5} color="text">
              Add New Category
            </Heading>
            {modalError && (
              <Box
                p={3}
                mb={4}
                bg={{ base: "#f8d7da", _dark: "#5a1a1a" }}
                color={{ base: "#721c24", _dark: "#fca5a5" }}
                border="1px solid"
                borderColor={{ base: "#f5c6cb", _dark: "#991b1b" }}
                borderRadius="md"
                fontSize="sm"
              >
                {modalError}
              </Box>
            )}
            <Input
              placeholder="Category name"
              value={inputValue}
              onChange={e => { setInputValue(e.target.value); setModalError(''); }}
              onKeyPress={e => e.key === 'Enter' && handleAddCategory()}
              autoFocus
              mb={5}
              bg="inputBg"
              border="1px solid"
              borderColor="border"
              color="text"
              _focus={{
                borderColor: "primary",
                boxShadow: "0 0 0 2px rgba(252, 82, 0, 0.25)"
              }}
            />
            <HStack justify="flex-end" gap={3}>
              <Button
                onClick={() => { setShowAddCategoryModal(false); setModalError(''); }}
                variant="outline"
                colorPalette="gray"
                borderColor="border"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCategory}
                bg="primary"
                color="white"
                _hover={{ bg: "primaryHover" }}
              >
                Add
              </Button>
            </HStack>
          </Box>
        </Flex>
      )}

      {/* Add Sport Modal */}
      {showAddSportModal && (
        <Flex
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.7)"
          justify="center"
          align="center"
          zIndex={10000}
          onClick={() => { setShowAddSportModal(false); setModalError(''); }}
        >
          <Box
            bg="modalBg"
            p={6}
            borderRadius="lg"
            minW="400px"
            maxW="500px"
            border="1px solid"
            borderColor="border"
            boxShadow="0 4px 20px rgba(0, 0, 0, 0.5)"
            onClick={e => e.stopPropagation()}
          >
            <Heading as="h4" size="md" mb={5} color="text">
              Add Sport to {selectedCategory}
            </Heading>
            {modalError && (
              <Box
                p={3}
                mb={4}
                bg={{ base: "#f8d7da", _dark: "#5a1a1a" }}
                color={{ base: "#721c24", _dark: "#fca5a5" }}
                border="1px solid"
                borderColor={{ base: "#f5c6cb", _dark: "#991b1b" }}
                borderRadius="md"
                fontSize="sm"
              >
                {modalError}
              </Box>
            )}
            <Input
              placeholder="Sport name"
              value={inputValue}
              onChange={e => { setInputValue(e.target.value); setModalError(''); }}
              onKeyPress={e => e.key === 'Enter' && handleAddSport()}
              autoFocus
              mb={5}
              bg="inputBg"
              border="1px solid"
              borderColor="border"
              color="text"
              _focus={{
                borderColor: "primary",
                boxShadow: "0 0 0 2px rgba(252, 82, 0, 0.25)"
              }}
            />
            <HStack justify="flex-end" gap={3}>
              <Button
                onClick={() => { setShowAddSportModal(false); setModalError(''); }}
                variant="outline"
                colorPalette="gray"
                borderColor="border"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSport}
                bg="primary"
                color="white"
                _hover={{ bg: "primaryHover" }}
              >
                Add
              </Button>
            </HStack>
          </Box>
        </Flex>
      )}

      {/* Edit Sport Modal */}
      {showEditSportModal && (
        <Flex
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.7)"
          justify="center"
          align="center"
          zIndex={10000}
          onClick={() => { setShowEditSportModal(false); setModalError(''); }}
        >
          <Box
            bg="modalBg"
            p={6}
            borderRadius="lg"
            minW="400px"
            maxW="500px"
            border="1px solid"
            borderColor="border"
            boxShadow="0 4px 20px rgba(0, 0, 0, 0.5)"
            onClick={e => e.stopPropagation()}
          >
            <Heading as="h4" size="md" mb={5} color="text">
              Edit Sport
            </Heading>
            {modalError && (
              <Box
                p={3}
                mb={4}
                bg={{ base: "#f8d7da", _dark: "#5a1a1a" }}
                color={{ base: "#721c24", _dark: "#fca5a5" }}
                border="1px solid"
                borderColor={{ base: "#f5c6cb", _dark: "#991b1b" }}
                borderRadius="md"
                fontSize="sm"
              >
                {modalError}
              </Box>
            )}
            <Input
              placeholder="Sport name"
              value={inputValue}
              onChange={e => { setInputValue(e.target.value); setModalError(''); }}
              onKeyPress={e => e.key === 'Enter' && handleEditSport()}
              autoFocus
              mb={5}
              bg="inputBg"
              border="1px solid"
              borderColor="border"
              color="text"
              _focus={{
                borderColor: "primary",
                boxShadow: "0 0 0 2px rgba(252, 82, 0, 0.25)"
              }}
            />
            <HStack justify="space-between" gap={3}>
              <Button
                onClick={handleDeleteSport}
                colorPalette="red"
                variant="outline"
                borderColor={{ base: "#dc3545", _dark: "#991b1b" }}
                _hover={{ bg: { base: "#dc3545", _dark: "#991b1b" }, color: "white" }}
              >
                Delete
              </Button>
              <HStack gap={3}>
                <Button
                  onClick={() => { setShowEditSportModal(false); setModalError(''); }}
                  variant="outline"
                  colorPalette="gray"
                  borderColor="border"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditSport}
                  bg="primary"
                  color="white"
                  _hover={{ bg: "primaryHover" }}
                >
                  Save
                </Button>
              </HStack>
            </HStack>
          </Box>
        </Flex>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        confirmColorPalette="red"
        onConfirm={confirmDialog.onConfirm || (() => {})}
        onClose={() => setConfirmDialog({ isOpen: false, onConfirm: null, title: '', message: '' })}
      />
    </Box>
  );
}
