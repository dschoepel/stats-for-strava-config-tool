import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  HStack,
  Progress,
  IconButton
} from '@chakra-ui/react';
import { MdUpload, MdClose } from 'react-icons/md';
import { useToast } from '../../hooks/useToast';
import { uploadGearImage } from '../../services';

/**
 * ImageUploader - Upload images to gear maintenance directory
 * Supports drag-drop and click to upload
 */
const ImageUploader = ({ onUploadComplete, customPath = null }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const { showSuccess, showError } = useToast();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    if (files.length === 0) return;

    // Validate file types
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
    const invalidFiles = files.filter(f => !validTypes.includes(f.type));
    
    if (invalidFiles.length > 0) {
      showError('Only PNG, JPG, WEBP, GIF, and SVG images are allowed.');
      return;
    }

    // Validate file sizes (10MB max)
    const maxSize = 10 * 1024 * 1024;
    const oversizedFiles = files.filter(f => f.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      showError('Maximum file size is 10MB per image.');
      return;
    }

    // Upload files
    setUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const result = await uploadGearImage(file, customPath);

        if (result.success) {
          showSuccess(`${file.name} uploaded successfully`);
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        showError(`Failed to upload ${file.name}: ${error.message}`);
      }

      setUploadProgress(((i + 1) / files.length) * 100);
    }

    setUploading(false);
    setUploadProgress(0);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Notify parent component
    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  return (
    <VStack gap={3} align="stretch">
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        borderWidth={2}
        borderStyle="dashed"
        borderColor={isDragging ? 'primary' : 'border'}
        borderRadius="md"
        p={6}
        bg={isDragging ? 'cardBg' : 'bg'}
        textAlign="center"
        cursor="pointer"
        onClick={() => fileInputRef.current?.click()}
        transition="all 0.2s"
        _hover={{ borderColor: 'primary', bg: 'cardBg' }}
      >
        <VStack gap={2}>
          <Box as={MdUpload} fontSize="3xl" color="textMuted" />
          <Text fontSize="sm" fontWeight="medium">
            Drag and drop images here
          </Text>
          <Text fontSize="xs" color="textMuted">
            or click to browse
          </Text>
          <Text fontSize="xs" color="textMuted">
            PNG, JPG, WEBP, GIF, SVG (max 10MB)
          </Text>
        </VStack>
      </Box>

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        multiple
        display="none"
        onChange={handleFileSelect}
      />

      {uploading && (
        <Box>
          <HStack justify="space-between" mb={1}>
            <Text fontSize="sm">Uploading...</Text>
            <Text fontSize="sm" color="textMuted">
              {Math.round(uploadProgress)}%
            </Text>
          </HStack>
          <Progress.Root value={uploadProgress} colorPalette="blue" size="sm">
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        </Box>
      )}
    </VStack>
  );
};

export default ImageUploader;
