import { useState, memo } from 'react';
import { Box, Image, Text, IconButton, VStack } from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';

/**
 * ImageThumbnail - Display image thumbnail with optional delete
 */
const ImageThumbnail = ({ 
  src, 
  alt = 'Image', 
  onDelete = null,
  size = 'md' 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const sizeMap = {
    sm: { box: '60px', image: '60px' },
    md: { box: '100px', image: '100px' },
    lg: { box: '150px', image: '150px' }
  };

  const dimensions = sizeMap[size] || sizeMap.md;

  return (
    <Box
      position="relative"
      width={dimensions.box}
      height={dimensions.box}
      borderRadius="md"
      overflow="hidden"
      borderWidth={1}
      borderColor="border"
      bg="cardBg"
      _hover={onDelete ? { '& > button': { opacity: 1 } } : {}}
    >
      {src && !imageError ? (
        <>
          <Image
            src={src}
            alt={alt}
            width={dimensions.image}
            height={dimensions.image}
            objectFit="cover"
            onError={() => {
              console.error('Failed to load image:', src);
              setImageError(true);
            }}
            onLoad={() => setImageLoaded(true)}
            display={imageLoaded ? 'block' : 'none'}
          />
          {!imageLoaded && (
            <VStack
              width="100%"
              height="100%"
              justify="center"
              align="center"
              bg="cardBg"
            >
              <Text fontSize="xs" color="textMuted">
                Loading...
              </Text>
            </VStack>
          )}
        </>
      ) : (
        <VStack
          width="100%"
          height="100%"
          justify="center"
          align="center"
          bg="cardBg"
        >
          <Text fontSize="xs" color="textMuted">
            {imageError ? 'Failed to load' : 'No image'}
          </Text>
        </VStack>
      )}

      {onDelete && src && !imageError && (
        <IconButton
          aria-label="Delete image"
          size="xs"
          position="absolute"
          top={1}
          right={1}
          colorPalette="red"
          onClick={onDelete}
          opacity={0}
          transition="opacity 0.2s"
        >
          <MdClose />
        </IconButton>
      )}
    </Box>
  );
};

export default memo(ImageThumbnail);
