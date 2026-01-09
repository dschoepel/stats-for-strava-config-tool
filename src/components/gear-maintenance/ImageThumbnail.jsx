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
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={dimensions.image}
          height={dimensions.image}
          objectFit="cover"
        />
      ) : (
        <VStack
          width="100%"
          height="100%"
          justify="center"
          align="center"
          bg="cardBg"
        >
          <Text fontSize="xs" color="textMuted">
            No image
          </Text>
        </VStack>
      )}

      {onDelete && src && (
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

export default ImageThumbnail;
