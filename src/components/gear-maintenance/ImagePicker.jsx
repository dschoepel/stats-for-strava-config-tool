import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Text,
  VStack,
  Input,
  HStack,
  Spinner
} from '@chakra-ui/react';
import { MdClose, MdSearch, MdRefresh } from 'react-icons/md';
import { DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogCloseTrigger, DialogBackdrop } from '@chakra-ui/react';
import ImageThumbnail from './ImageThumbnail';
import ImageUploader from './ImageUploader';
import { useToast } from '../../hooks/useToast';

/**
 * ImagePicker - Modal to select from uploaded images or upload new ones
 */
const ImagePicker = ({ isOpen, onClose, onSelect, customPath = null }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const toast = useToast();

  const loadImages = async () => {
    setLoading(true);
    try {
      const url = customPath 
        ? `/api/gear-maintenance-images?path=${encodeURIComponent(customPath)}`
        : '/api/gear-maintenance-images';
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setImages(data.images);
      } else {
        throw new Error(data.error || 'Failed to load images');
      }
    } catch (error) {
      toast({
        title: 'Error loading images',
        description: error.message,
        status: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleDelete = async (filename) => {
    if (!confirm(`Delete ${filename}?`)) return;

    try {
      const url = customPath
        ? `/api/gear-maintenance-images?filename=${encodeURIComponent(filename)}&path=${encodeURIComponent(customPath)}`
        : `/api/gear-maintenance-images?filename=${encodeURIComponent(filename)}`;

      const response = await fetch(url, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Image deleted',
          description: `${filename} deleted successfully`,
          status: 'success'
        });
        loadImages();
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error.message,
        status: 'error'
      });
    }
  };

  const handleSelect = () => {
    if (selectedImage) {
      onSelect(selectedImage.name);
      onClose();
    }
  };

  const filteredImages = images.filter(img =>
    img.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="xl">
      <DialogBackdrop />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select or Upload Image</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>

        <DialogBody>
          <VStack gap={4} align="stretch">
            {/* Upload Section */}
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
                        onDelete={() => handleDelete(image.name)}
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

        <DialogFooter>
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
    </DialogRoot>
  );
};

export default ImagePicker;
