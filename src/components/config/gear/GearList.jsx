import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, VStack, Button, Text } from '@chakra-ui/react';
import { MdAdd } from 'react-icons/md';
import GearItemEditor from './GearItemEditor';

/**
 * GearList - Manages a list of gear items with add/remove/reorder functionality
 */
const GearList = ({
  gears = [],
  onChange,
  errors = {},
  defaultCurrency = 'USD',
  isCustomGear = false,
  title = 'Gear Items',
}) => {
  const [expandedItems, setExpandedItems] = useState({});

  const handleAdd = () => {
    const newGear = isCustomGear
      ? {
          tag: '',
          label: '',
          purchasePrice: {
            amountInCents: 0,
            currency: defaultCurrency,
          },
          retired: false,
        }
      : {
          gearId: '',
          purchasePrice: {
            amountInCents: 0,
            currency: defaultCurrency,
          },
          retired: false,
        };

    onChange([...gears, newGear]);
    setExpandedItems((prev) => ({ ...prev, [gears.length]: true }));
  };

  const handleRemove = (index) => {
    const updated = gears.filter((_, i) => i !== index);
    onChange(updated);

    // Adjust expanded state indices
    const newExpanded = {};
    Object.keys(expandedItems).forEach((key) => {
      const keyIndex = parseInt(key);
      if (keyIndex < index) {
        newExpanded[keyIndex] = expandedItems[key];
      } else if (keyIndex > index) {
        newExpanded[keyIndex - 1] = expandedItems[key];
      }
    });
    setExpandedItems(newExpanded);
  };

  const handleUpdate = (index, updatedGear) => {
    const updated = [...gears];
    updated[index] = updatedGear;
    onChange(updated);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updated = [...gears];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);

    // Swap expanded state
    const newExpanded = { ...expandedItems };
    const temp = newExpanded[index - 1];
    newExpanded[index - 1] = newExpanded[index];
    newExpanded[index] = temp;
    setExpandedItems(newExpanded);
  };

  const handleMoveDown = (index) => {
    if (index >= gears.length - 1) return;
    const updated = [...gears];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);

    // Swap expanded state
    const newExpanded = { ...expandedItems };
    const temp = newExpanded[index + 1];
    newExpanded[index + 1] = newExpanded[index];
    newExpanded[index] = temp;
    setExpandedItems(newExpanded);
  };

  const toggleExpand = (index) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <Box>
      <Text fontSize="sm" fontWeight="500" mb={3}>
        {title}
      </Text>

      {gears.length === 0 ? (
        <Box
          p={4}
          borderWidth="1px"
          borderColor="border"
          borderRadius="md"
          textAlign="center"
        >
          <Text fontSize="sm" color="textMuted">
            No gear items added yet. Click "Add {isCustomGear ? 'Custom' : 'Strava'} Gear" to get started.
          </Text>
        </Box>
      ) : (
        <VStack align="stretch" gap={2}>
          {gears.map((gear, index) => (
            <GearItemEditor
              key={index}
              gear={gear}
              index={index}
              isExpanded={expandedItems[index] || false}
              onToggleExpand={() => toggleExpand(index)}
              onUpdate={handleUpdate}
              onRemove={() => handleRemove(index)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              canMoveUp={index > 0}
              canMoveDown={index < gears.length - 1}
              errors={errors}
              defaultCurrency={defaultCurrency}
              isCustomGear={isCustomGear}
            />
          ))}
        </VStack>
      )}

      <Button
        onClick={handleAdd}
        size="sm"
        variant="outline"
        mt={3}
        width="full"
      >
        <MdAdd /> Add {isCustomGear ? 'Custom' : 'Strava'} Gear
      </Button>
    </Box>
  );
};

GearList.propTypes = {
  gears: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.object,
  defaultCurrency: PropTypes.string,
  isCustomGear: PropTypes.bool,
  title: PropTypes.string
};

export default GearList;
