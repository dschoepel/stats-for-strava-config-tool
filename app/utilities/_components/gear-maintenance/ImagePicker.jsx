import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Box,
  Button,
  Grid,
  Text,
  VStack,
  Input,
  HStack,
  Spinner,
  Portal,
  Icon
} from '@chakra-ui/react';
import { MdClose, MdSearch, MdRefresh } from 'react-icons/md';
import { DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogCloseTrigger, DialogBackdrop, DialogPositioner } from '@chakra-ui/react';
import ImageThumbnail from './ImageThumbnail';
import ImageUploader from './ImageUploader';
import { ConfirmDialog } from '../../../_components/ui/ConfirmDialog';
import { useToast } from '../../../../src/hooks/useToast';
import { listGearImages, deleteGearImage } from '../../../../src/services';

/**
 * ImagePicker - Modal to select from uploaded images or upload new ones
 */
const ImagePicker = ({ isOpen, onClose, onSelect, customPath = null }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, filename: null });
  const { showSuccess, showError } = useToast();

  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listGearImages(customPath);

      if (data.success) {
        setImages(data.images);
      } else {
        throw new Error(data.error || 'Failed to load images');
      }
    } catch (error) {
      showError(`Error loading images: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [customPath, showError]);

  useEffect(() => {
    if (isOpen) {
      loadImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleDeleteClick = useCallback((filename) => {
    setDeleteConfirm({ isOpen: true, filename });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const { filename } = deleteConfirm;
    setDeleteConfirm({ isOpen: false, filename: null });

    try {
      const data = await deleteGearImage(filename, customPath);

      if (data.success) {
        showSuccess(`${filename} deleted from gear-maintenance folder`);
        loadImages();
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error) {
      showError(`Delete failed: ${error.message}`);
    }
  }, [deleteConfirm, customPath, showSuccess, showError, loadImages]);

  const handleSelect = useCallback(() => {
    if (selectedImage) {
      onSelect(selectedImage.name);
      onClose();
    }
  }, [selectedImage, onSelect, onClose]);

  // Memoize filtered images to avoid expensive filter operation on every render
  const filteredImages = useMemo(() =>
    images.filter(img =>
      img.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [images, searchQuery]
  );

  return (
    <>
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="xl">
      <Portal>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent
            maxW="800px"
            borderRadius="lg"
            boxShadow="xl"
            bg="cardBg"
          >
            <DialogHeader
              bg="#E2E8F0"
              _dark={{ bg: "#334155" }}
              borderTopRadius="lg"
            >
              <DialogTitle
                fontSize={{ base: "md", sm: "lg" }}
                color="#1a202c"
                _dark={{ color: "#f7fafc" }}
              >
                Select or Upload Image
              </DialogTitle>
              <DialogCloseTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  color="#1a202c"
                  _dark={{ color: "#f7fafc" }}
                >
                  <Icon><MdClose /></Icon>
                </Button>
              </DialogCloseTrigger>
            </DialogHeader>

            <DialogBody
              p={{ base: 4, sm: 6 }}
              bg="cardBg"
            >
              <VStack gap={4} align="stretch">{/* Upload Section */}
            <Box>
              <Text fontWeight="medium" mb={2}>
                Upload New Image
              </Text>
              <ImageUploader
                onUploadComplete={loadImages}
                customPath={customPath}
              />
            </Box>

            {/* Search and Refresh */}
            <HStack>
              <Box flex={1} position="relative">
                <Input
                  placeholder="Search images..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  pl={10}
                />
                <Box
                  as={MdSearch}
                  position="absolute"
                  left={3}
                  top="50%"
                  transform="translateY(-50%)"
                  color="textMuted"
                />
              </Box>
              <Button
                size="sm"
                variant="ghost"
                onClick={loadImages}
                aria-label="Refresh"
              >
                <MdRefresh />
              </Button>
            </HStack>

            {/* Images Grid */}
            <Box>
              <Text fontWeight="medium" mb={2}>
                Available Images ({filteredImages.length})
              </Text>
              
              {loading ? (
                <Box textAlign="center" py={8}>
                  <Spinner size="lg" />
                </Box>
              ) : filteredImages.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Text color="textMuted">
                    {searchQuery ? 'No images match your search' : 'No images uploaded yet'}
                  </Text>
                </Box>
              ) : (
                <Grid
                  templateColumns="repeat(auto-fill, minmax(100px, 1fr))"
                  gap={3}
                  maxH="400px"
                  overflowY="auto"
                  p={2}
                  borderWidth={1}
                  borderColor="border"
                  borderRadius="md"
                >
                  {filteredImages.map((image) => (
                    <VStack
                      key={image.name}
                      gap={1}
                      cursor="pointer"
                      onClick={() => setSelectedImage(image)}
                      p={2}
                      borderRadius="md"
                      borderWidth={2}
                      borderColor={selectedImage?.name === image.name ? 'primary' : 'transparent'}
                      bg={selectedImage?.name === image.name ? 'cardBg' : 'transparent'}
                      _hover={{ bg: 'cardBg' }}
                      transition="all 0.2s"
                    >
                      <ImageThumbnail
                        src={image.url}
                        alt={image.name}
                        onDelete={() => handleDeleteClick(image.name)}
                        size="md"
                      />
                      <Text
                        fontSize="xs"
                        noOfLines={2}
                        textAlign="center"
                        wordBreak="break-all"
                      >
                        {image.name}
                      </Text>
                    </VStack>
                  ))}
                </Grid>
              )}
            </Box>
          </VStack>
        </DialogBody>

        <DialogFooter
          gap={3}
          justify="flex-end"
          p={{ base: 3, sm: 4 }}
          bg="#E2E8F0"
          _dark={{ bg: "#334155" }}
          borderBottomRadius="lg"
        >
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorPalette="blue"
            onClick={handleSelect}
            disabled={!selectedImage}
          >
            Select
          </Button>
        </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </Portal>
    </DialogRoot>

    {/* Confirm Delete Image Dialog */}
    <ConfirmDialog
      isOpen={deleteConfirm.isOpen}
      onClose={() => setDeleteConfirm({ isOpen: false, filename: null })}
      onConfirm={handleConfirmDelete}
      title="Delete Image from Gear Maintenance Folder"
      message={`Are you sure you want to permanently delete "${deleteConfirm.filename}" from the gear-maintenance folder? This action cannot be undone.`}
      confirmText={`Delete "${deleteConfirm.filename}"`}
      cancelText="Keep Image"
      confirmColorPalette="red"
    />
  </>
  );
};

export default memo(ImagePicker);
