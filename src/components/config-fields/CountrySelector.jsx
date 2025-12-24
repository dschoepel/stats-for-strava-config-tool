import React, { useState, useEffect } from 'react';
import { 
  Box, Flex, Input, Button, Grid, Icon, Heading, Text, VStack, HStack,
  DialogRoot, DialogBackdrop, DialogContent, DialogHeader, DialogBody, DialogCloseTrigger 
} from '@chakra-ui/react';
import { MdClose, MdKeyboardArrowDown, MdKeyboardArrowRight } from 'react-icons/md';

const CountrySelector = ({ value, onChange, onClose }) => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRegions, setExpandedRegions] = useState({});

  useEffect(() => {
    async function fetchCountries() {
      try {
        // Fetch all countries with limit parameter set to maximum
        const response = await fetch('https://api.first.org/data/v1/countries?limit=300');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        console.log('API Response:', result);
        console.log('Total countries available:', result.total);
        console.log('Data keys count:', Object.keys(result.data || {}).length);
        
        // Convert the object to an array
        const countriesArray = Object.entries(result.data || {}).map(([code, info]) => ({
          code: code,
          name: info.country,
          region: info.region || 'Other'
        }));
        
        console.log('Countries array length:', countriesArray.length);
        
        // Sort by country name
        const sorted = countriesArray.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        setCountries(sorted);
        setLoading(false);
        
        // Start with all regions expanded
        const regions = {};
        sorted.forEach(country => {
          if (country.region) {
            regions[country.region] = true;
          }
        });
        console.log('Regions found:', Object.keys(regions));
        setExpandedRegions(regions);
      } catch (error) {
        console.error('Error fetching countries:', error);
        setLoading(false);
      }
    }
    fetchCountries();
  }, []);

  const toggleRegion = (region) => {
    setExpandedRegions(prev => ({
      ...prev,
      [region]: !prev[region]
    }));
  };

  const collapseAll = () => {
    const collapsed = {};
    Object.keys(expandedRegions).forEach(region => {
      collapsed[region] = false;
    });
    setExpandedRegions(collapsed);
  };

  const expandAll = () => {
    const expanded = {};
    Object.keys(expandedRegions).forEach(region => {
      expanded[region] = true;
    });
    setExpandedRegions(expanded);
  };

  const handleCountrySelect = (countryCode) => {
    onChange(countryCode);
    onClose();
  };

  const handleClear = () => {
    onChange(null);
    onClose();
  };

  // Group countries by region
  const countryByRegion = countries.reduce((acc, country) => {
    const region = country.region || 'Other';
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(country);
    return acc;
  }, {});

  // Filter countries based on search term
  const filteredCountryByRegion = {};
  Object.entries(countryByRegion).forEach(([region, regionCountries]) => {
    const filtered = regionCountries.filter(country =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      filteredCountryByRegion[region] = filtered;
    }
  });

  return (
    <DialogRoot open={true} onOpenChange={(e) => { if (!e.open) onClose(); }} size="xl">
      <DialogBackdrop />
      <DialogContent maxH="90vh" bg="cardBg" color="text">
        <DialogHeader borderBottom="1px solid" borderColor="border" pb={4}>
          <Heading as="h3" size="lg" fontWeight="semibold">
            Select Country
          </Heading>
          <DialogCloseTrigger asChild>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Icon><MdClose /></Icon>
            </Button>
          </DialogCloseTrigger>
        </DialogHeader>

        <DialogBody display="flex" flexDirection="column" gap={4} p={6}>
          <VStack gap={3} align="stretch">
            <Input
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="md"
              autoFocus
            />
            <HStack gap={2} flexWrap="wrap">
              <Button size="xs" variant="outline" colorPalette="gray" onClick={expandAll}>
                Expand All
              </Button>
              <Button size="xs" variant="outline" colorPalette="gray" onClick={collapseAll}>
                Collapse All
              </Button>
              <Button size="xs" variant="solid" colorPalette="red" onClick={handleClear}>
                Clear Selection
              </Button>
            </HStack>
          </VStack>

          {value && (
            <Box 
              p={3} 
              bg="green.50" 
              borderRadius="md" 
              border="1px solid" 
              borderColor="green.200" 
              _dark={{ bg: "green.950", borderColor: "green.800" }}
            >
              <Text fontSize="sm" fontWeight="medium" color="green.700" _dark={{ color: "green.300" }}>
                <Text as="strong">Current:</Text> {value}
              </Text>
            </Box>
          )}

          <Box flex={1} overflowY="auto" py={4}>
            {loading ? (
              <Text textAlign="center" py={10} color="text" opacity={0.6} fontStyle="italic">
                Loading countries...
              </Text>
            ) : Object.keys(filteredCountryByRegion).length === 0 ? (
              <Text textAlign="center" py={10} color="text" opacity={0.6} fontStyle="italic">
                No countries found matching "{searchTerm}"
              </Text>
            ) : (
              Object.entries(filteredCountryByRegion)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([region, regionCountries]) => (
                  <Box 
                    key={region} 
                    mb={2} 
                    border="1px solid" 
                    borderColor="border" 
                    borderRadius="md" 
                    overflow="hidden"
                    bg="panelBg"
                  >
                    <Flex
                      align="center"
                      gap={2}
                      p={3}
                      bg="bg"
                      cursor="pointer"
                      userSelect="none"
                      _hover={{ bg: "panelBg" }}
                      onClick={() => toggleRegion(region)}
                    >
                      <Icon fontSize="lg" transition="transform 0.2s" transform={expandedRegions[region] ? "rotate(0deg)" : "rotate(-90deg)"}>
                        <MdKeyboardArrowDown />
                      </Icon>
                      <Text fontWeight="semibold" fontSize="md" color="text">
                        {region} ({regionCountries.length})
                      </Text>
                    </Flex>
                    {expandedRegions[region] && (
                      <Grid 
                        templateColumns="repeat(auto-fill, minmax(250px, 1fr))" 
                        gap={2} 
                        p={4}
                        bg="cardBg"
                      >
                        {regionCountries.map(country => (
                          <Button
                            key={country.code}
                            variant={value === country.code ? "solid" : "outline"}
                            colorPalette={value === country.code ? "blue" : "gray"}
                            onClick={() => handleCountrySelect(country.code)}
                            justifyContent="space-between"
                            size="sm"
                            fontWeight={value === country.code ? "semibold" : "normal"}
                          >
                            <Text flex={1} textAlign="left" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                              {country.name}
                            </Text>
                            <Text 
                              as="code" 
                              fontSize="xs" 
                              px={2} 
                              py={0.5} 
                              borderRadius="sm"
                              bg={value === country.code ? "whiteAlpha.200" : "bg"}
                              color={value === country.code ? "white" : "text"}
                              opacity={value === country.code ? 1 : 0.7}
                              flexShrink={0}
                            >
                              {country.code}
                            </Text>
                          </Button>
                        ))}
                      </Grid>
                    )}
                  </Box>
                ))
            )}
          </Box>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  );
};

export default CountrySelector;
