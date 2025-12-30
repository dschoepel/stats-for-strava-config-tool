import React from 'react';
import { Box, Flex, Grid, Heading, Text, Stack, HStack, Icon, Code } from '@chakra-ui/react';
import { 
  MdEdit, MdWarning, MdSettings, MdBuild, MdPerson, MdPalette, 
  MdGetApp, MdShowChart, MdDirectionsBike, MdComputer, MdLink, 
  MdAccessTime, MdInsertDriveFile, MdWidgets, MdRocket, MdHelpOutline 
} from 'react-icons/md';

const Help = () => {
  return (
    <Box maxW="1000px" mx="auto" p={8} bg="bg">
      <Box textAlign="center" borderBottom="1px solid" borderColor="border" pb={8} mb={8}>
        <Heading as="h2" size="2xl" color="text" fontWeight="semibold" mb={2}>
          Help & Documentation
        </Heading>
        <Text color="text" fontSize="lg" opacity={0.8}>
          Configuration tool guide and important information
        </Text>
      </Box>

      <Stack gap={10}>
        <Box as="section">
          <Heading as="h3" size="lg" color="text" fontWeight="semibold" mb={6} display="flex" alignItems="center" gap={2}>
            <Icon color="primary"><MdEdit /></Icon>
            Using the Configuration Editor
          </Heading>
          <Box p={6} bg="cardBg" border="1px solid" borderColor="border" borderRadius="lg">
            <Heading as="h4" size="md" color="text" fontWeight="semibold" mb={4}>
              Form-Based Configuration
            </Heading>
            <Text color="text" opacity={0.9} mb={4}>
              This tool provides guided forms for editing your Strava configuration files. Each form includes:
            </Text>
            <Box as="ul" pl={6} color="text" opacity={0.9} lineHeight="1.6">
              <li><Text as="strong" color="text">Field descriptions</Text> - Explanations of what each setting does</li>
              <li><Text as="strong" color="text">Input validation</Text> - Prevents invalid values from being saved</li>
              <li><Text as="strong" color="text">Type-specific controls</Text> - Dropdowns for enums, number inputs for numeric values</li>
              <li><Text as="strong" color="text">Required field indicators</Text> - Red asterisks (*) mark mandatory fields</li>
            </Box>
          </Box>

          <Box p={6} bg="bg" border="1px solid" borderColor="border" borderRadius="lg" mt={6}>
            <Heading as="h4" size="md" color="text" fontWeight="semibold" mb={4} display="flex" alignItems="center" gap={2}>
              <Icon color="orange.500"><MdWarning /></Icon>
              Important: Comment Preservation
            </Heading>
            <Text color="text" opacity={0.9} mb={4}>
              When saving configuration changes through this editor:
            </Text>
            <Box as="ul" pl={6} color="text" opacity={0.9} lineHeight="1.6" mb={4}>
              <li><Text as="strong">Section headers are preserved</Text> - Main comments like section titles remain intact</li>
              <li><Text as="strong">Embedded comments may be removed</Text> - Detailed comments within YAML structures might be lost</li>
              <li><Text as="strong">This is by design</Text> - The forms provide all necessary guidance, making embedded comments redundant</li>
            </Box>
            <Text color="text" opacity={0.8} fontStyle="italic">
              If you need to preserve all comments, edit the YAML files manually instead of using this tool.
            </Text>
          </Box>
        </Box>

        <Box as="section">
          <Heading as="h3" size="lg" color="text" fontWeight="semibold" mb={6} display="flex" alignItems="center" gap={2}>
            <Icon color="primary"><MdSettings /></Icon>
            Configuration Sections
          </Heading>
          <Box p={6} bg="cardBg" border="1px solid" borderColor="border" borderRadius="lg">
            <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
              <Flex gap={3} p={4} bg="bg" border="1px solid" borderColor="border" borderRadius="md" alignItems="flex-start">
                <Icon fontSize="xl" color="primary" mt={1}><MdBuild /></Icon>
                <Box>
                  <Text fontWeight="semibold" color="text" mb={1}>General</Text>
                  <Text fontSize="sm" color="text" opacity={0.8}>Basic application settings like URLs and titles</Text>
                </Box>
              </Flex>
              <Flex gap={3} p={4} bg="bg" border="1px solid" borderColor="border" borderRadius="md" alignItems="flex-start">
                <Icon fontSize="xl" color="primary" mt={1}><MdPerson /></Icon>
                <Box>
                  <Text fontWeight="semibold" color="text" mb={1}>Athlete</Text>
                  <Text fontSize="sm" color="text" opacity={0.8}>Personal information including heart rate zones, weight history, and FTP data</Text>
                </Box>
              </Flex>
              <Flex gap={3} p={4} bg="bg" border="1px solid" borderColor="border" borderRadius="md" alignItems="flex-start">
                <Icon fontSize="xl" color="primary" mt={1}><MdPalette /></Icon>
                <Box>
                  <Text fontWeight="semibold" color="text" mb={1}>Appearance</Text>
                  <Text fontSize="sm" color="text" opacity={0.8}>Visual customization options for your statistics display</Text>
                </Box>
              </Flex>
              <Flex gap={3} p={4} bg="bg" border="1px solid" borderColor="border" borderRadius="md" alignItems="flex-start">
                <Icon fontSize="xl" color="primary" mt={1}><MdGetApp /></Icon>
                <Box>
                  <Text fontWeight="semibold" color="text" mb={1}>Import</Text>
                  <Text fontSize="sm" color="text" opacity={0.8}>Data import settings and preferences</Text>
                </Box>
              </Flex>
              <Flex gap={3} p={4} bg="bg" border="1px solid" borderColor="border" borderRadius="md" alignItems="flex-start">
                <Icon fontSize="xl" color="primary" mt={1}><MdShowChart /></Icon>
                <Box>
                  <Text fontWeight="semibold" color="text" mb={1}>Metrics</Text>
                  <Text fontSize="sm" color="text" opacity={0.8}>Configuration for statistical calculations and metrics</Text>
                </Box>
              </Flex>
              <Flex gap={3} p={4} bg="bg" border="1px solid" borderColor="border" borderRadius="md" alignItems="flex-start">
                <Icon fontSize="xl" color="primary" mt={1}><MdDirectionsBike /></Icon>
                <Box>
                  <Text fontWeight="semibold" color="text" mb={1}>Gear</Text>
                  <Text fontSize="sm" color="text" opacity={0.8}>Equipment and bike configuration</Text>
                </Box>
              </Flex>
              <Flex gap={3} p={4} bg="bg" border="1px solid" borderColor="border" borderRadius="md" alignItems="flex-start">
                <Icon fontSize="xl" color="primary" mt={1}><MdComputer /></Icon>
                <Box>
                  <Text fontWeight="semibold" color="text" mb={1}>Zwift</Text>
                  <Text fontSize="sm" color="text" opacity={0.8}>Zwift integration settings</Text>
                </Box>
              </Flex>
              <Flex gap={3} p={4} bg="bg" border="1px solid" borderColor="border" borderRadius="md" alignItems="flex-start">
                <Icon fontSize="xl" color="primary" mt={1}><MdLink /></Icon>
                <Box>
                  <Text fontWeight="semibold" color="text" mb={1}>Integrations</Text>
                  <Text fontSize="sm" color="text" opacity={0.8}>Third-party service connections and API settings</Text>
                </Box>
              </Flex>
              <Flex gap={3} p={4} bg="bg" border="1px solid" borderColor="border" borderRadius="md" alignItems="flex-start">
                <Icon fontSize="xl" color="primary" mt={1}><MdAccessTime /></Icon>
                <Box>
                  <Text fontWeight="semibold" color="text" mb={1}>Scheduling Daemon</Text>
                  <Text fontSize="sm" color="text" opacity={0.8}>Automated task scheduling and background processes</Text>
                </Box>
              </Flex>
            </Grid>
          </Box>
        </Box>

        <Box as="section">
          <Heading as="h3" size="lg" color="text" fontWeight="semibold" mb={6} display="flex" alignItems="center" gap={2}>
            <Icon color="primary"><MdInsertDriveFile /></Icon>
            YAML Utility
          </Heading>
          <Box p={6} bg="cardBg" border="1px solid" borderColor="border" borderRadius="lg">
            <Heading as="h4" size="md" color="text" fontWeight="semibold" mb={4}>
              File Validation and Management
            </Heading>
            <Text color="text" opacity={0.9} mb={4}>
              The YAML Utility provides essential configuration file management tools:
            </Text>
            <Box as="ul" pl={6} color="text" opacity={0.9} lineHeight="1.6" mb={6}>
              <li><Text as="strong" color="text">Validate YAML files</Text> - Check syntax and structure for errors</li>
              <li><Text as="strong" color="text">View file contents</Text> - Browse and inspect configuration files</li>
              <li><Text as="strong" color="text">Combine configurations</Text> - Merge multiple YAML files into a single unified configuration</li>
            </Box>
            
            <Heading as="h4" size="md" color="text" fontWeight="semibold" mb={4}>
              Future Enhancements
            </Heading>
            <Text color="text" opacity={0.9} mb={4}>Planned features for upcoming releases:</Text>
            <Box as="ul" pl={6} color="text" opacity={0.9} lineHeight="1.6" mb={6}>
              <li><Text as="strong" color="text">Direct file editing</Text> - Edit YAML files with syntax highlighting and validation</li>
              <li><Text as="strong" color="text">Configuration splitting</Text> - Break a single config file into separate section files</li>
            </Box>
            
            <Box p={4} bg="bg" border="1px solid" borderColor="border" borderRadius="md">
              <Text color="text" opacity={0.9}>
                <Text as="strong">Current Limitation:</Text> The YAML Utility does not support direct editing. 
                For manual configuration changes, edit the files using an external text editor.
              </Text>
            </Box>
          </Box>
        </Box>

        <Box as="section">
          <Heading as="h3" size="lg" color="text" fontWeight="semibold" mb={6} display="flex" alignItems="center" gap={2}>
            <Icon color="primary"><MdWidgets /></Icon>
            Widget Definitions Editor
          </Heading>
          <Box p={6} bg="cardBg" border="1px solid" borderColor="border" borderRadius="lg">
            <Heading as="h4" size="md" color="text" fontWeight="semibold" mb={4}>
              Managing Dashboard Widget Definitions
            </Heading>
            <Text color="text" opacity={0.9} mb={6}>
              The Widget Definitions Editor (accessible via Settings → Widgets tab) allows you to manage the widget templates that define what widgets are available for your dashboard.
            </Text>
            
            <Heading as="h4" size="md" color="text" fontWeight="semibold" mb={4}>
              What are Widget Definitions?
            </Heading>
            <Text color="text" opacity={0.9} mb={4}>
              Widget definitions are templates that describe:
            </Text>
            <Box as="ul" pl={6} color="text" opacity={0.9} lineHeight="1.6" mb={6}>
              <li><Text as="strong" color="text">Widget metadata</Text> - Name, display name, and description</li>
              <li><Text as="strong" color="text">Instance rules</Text> - Whether multiple instances of the widget can be added</li>
              <li><Text as="strong" color="text">Configuration options</Text> - What settings the widget supports</li>
              <li><Text as="strong" color="text">Default values</Text> - Initial configuration values for new widget instances</li>
            </Box>

            <Heading as="h4" size="md" color="text" fontWeight="semibold" mb={4}>
              File Storage
            </Heading>
            <Text color="text" opacity={0.9} mb={6}>
              Widget definitions are stored in <Code colorPalette="gray">settings/widget-definitions.yaml</Code> within your default file path. 
              This file is automatically created when you first open the tool and is synced with any widgets already in your dashboard configuration.
            </Text>

            <Heading as="h4" size="md" color="text" fontWeight="semibold" mb={4}>
              Using the Editor
            </Heading>
            <Box as="ol" pl={6} color="text" opacity={0.9} lineHeight="1.6" mb={6}>
              <li><Text as="strong" color="text">Open Settings</Text> - Click the gear icon in the top navigation</li>
              <li><Text as="strong" color="text">Select Widgets tab</Text> - Navigate to the Widget Definitions section</li>
              <li><Text as="strong" color="text">View widgets</Text> - Widgets are grouped by "Can be added multiple times" and "Can only be added once"</li>
              <li><Text as="strong" color="text">Expand details</Text> - Click the toggle arrow to see widget properties and configuration templates</li>
              <li><Text as="strong" color="text">Add/Edit/Delete</Text> - Use the respective buttons to manage widget definitions</li>
              <li><Text as="strong" color="text">Save changes</Text> - Click the Save button to write all changes to the file</li>
            </Box>

            <Box p={3} bg="bg" borderLeft="4px solid" borderColor="orange.500" borderRadius="md" mb={6}>
              <Text color="text" opacity={0.9}>
                <Icon display="inline" color="orange.500" mr={2}><MdWarning /></Icon>
                <Text as="strong">Important:</Text> Individual widget changes are saved in memory only. 
                You must click the main <Text as="strong">Save</Text> button to write all changes to the file.
              </Text>
            </Box>

            <Heading as="h4" size="md" color="text" fontWeight="semibold" mb={4}>
              Widget Properties
            </Heading>
            <Stack gap={4} mb={6}>
              <Box>
                <Text fontWeight="semibold" color="text" mb={1}>Widget Name (camelCase)</Text>
                <Text color="text" opacity={0.8} ml={4}>Unique identifier in camelCase format (e.g., mostRecentActivities)</Text>
              </Box>
              <Box>
                <Text fontWeight="semibold" color="text" mb={1}>Display Name</Text>
                <Text color="text" opacity={0.8} ml={4}>Human-readable name shown in the UI (e.g., "Most Recent Activities")</Text>
              </Box>
              <Box>
                <Text fontWeight="semibold" color="text" mb={1}>Description</Text>
                <Text color="text" opacity={0.8} ml={4}>Brief explanation of what the widget displays or does</Text>
              </Box>
              <Box>
                <Text fontWeight="semibold" color="text" mb={1}>Allow multiple instances</Text>
                <Text color="text" opacity={0.8} ml={4}>If checked, multiple copies of this widget can be added to the dashboard</Text>
              </Box>
              <Box>
                <Text fontWeight="semibold" color="text" mb={1}>Has configuration options</Text>
                <Text color="text" opacity={0.8} ml={4}>If checked, the widget supports customizable settings</Text>
              </Box>
              <Box>
                <Text fontWeight="semibold" color="text" mb={1}>Config Template (YAML)</Text>
                <Text color="text" opacity={0.8} ml={4}>Example configuration showing available options and syntax</Text>
              </Box>
            </Stack>

            <Heading as="h4" size="md" color="text" fontWeight="semibold" mb={4}>
              Automatic Initialization
            </Heading>
            <Text color="text" opacity={0.9} mb={4}>
              When the app starts:
            </Text>
            <Box as="ul" pl={6} color="text" opacity={0.9} lineHeight="1.6" mb={6}>
              <li><Text as="strong" color="text">File creation</Text> - If the widget definitions file doesn't exist, it's created with 19 default widgets</li>
              <li><Text as="strong" color="text">Config sync</Text> - Widget default values are updated based on widgets in your dashboard configuration</li>
              <li><Text as="strong" color="text">Validation</Text> - All widget definitions are validated for correct structure</li>
            </Box>

            <Heading as="h4" size="md" color="text" fontWeight="semibold" mb={4}>
              Default Widgets
            </Heading>
            <Text color="text" opacity={0.9} mb={4}>The system includes these built-in widget definitions:</Text>
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={2}>
              <Text color="text" opacity={0.9}>• Most Recent Activities</Text>
              <Text color="text" opacity={0.9}>• Introduction Text</Text>
              <Text color="text" opacity={0.9}>• Training Goals</Text>
              <Text color="text" opacity={0.9}>• Weekly Statistics</Text>
              <Text color="text" opacity={0.9}>• Peak Power Outputs</Text>
              <Text color="text" opacity={0.9}>• Heart Rate Zones</Text>
              <Text color="text" opacity={0.9}>• Activity Grid</Text>
              <Text color="text" opacity={0.9}>• Monthly Statistics</Text>
              <Text color="text" opacity={0.9}>• Training Load</Text>
              <Text color="text" opacity={0.9}>• Weekday Statistics</Text>
              <Text color="text" opacity={0.9}>• Day Time Statistics</Text>
              <Text color="text" opacity={0.9}>• Distance Breakdown</Text>
              <Text color="text" opacity={0.9}>• Yearly Statistics</Text>
              <Text color="text" opacity={0.9}>• Zwift Statistics</Text>
              <Text color="text" opacity={0.9}>• Gear Statistics</Text>
              <Text color="text" opacity={0.9}>• Eddington Number</Text>
              <Text color="text" opacity={0.9}>• Challenge Consistency</Text>
              <Text color="text" opacity={0.9}>• Most Recent Challenges</Text>
              <Text color="text" opacity={0.9}>• FTP History</Text>
              <Text color="text" opacity={0.9}>• Athlete Weight History</Text>
            </Grid>
          </Box>
        </Box>

        <Box as="section">
          <Heading as="h3" size="lg" color="text" fontWeight="semibold" mb={6} display="flex" alignItems="center" gap={2}>
            <Icon color="primary"><MdRocket /></Icon>
            Getting Started
          </Heading>
          <Box p={6} bg="cardBg" border="1px solid" borderColor="border" borderRadius="lg">
            <Box as="ol" pl={6} color="text" opacity={0.9} lineHeight="1.6">
              <li><Text as="strong" color="text">Choose a configuration section</Text> from the sidebar menu</li>
              <li><Text as="strong" color="text">Fill in the form fields</Text> - required fields are marked with *</li>
              <li><Text as="strong" color="text">Use the descriptions</Text> to understand what each setting does</li>
              <li><Text as="strong" color="text">Save your changes</Text> - the tool will validate your input</li>
              <li><Text as="strong" color="text">Review the results</Text> - check that your configuration works as expected</li>
            </Box>
          </Box>
        </Box>

        <Box as="section">
          <Heading as="h3" size="lg" color="text" fontWeight="semibold" mb={6} display="flex" alignItems="center" gap={2}>
            <Icon color="primary"><MdHelpOutline /></Icon>
            Troubleshooting
          </Heading>
          <Box p={6} bg="cardBg" border="1px solid" borderColor="border" borderRadius="lg">
            <Heading as="h4" size="md" color="text" fontWeight="semibold" mb={6}>
              Common Issues
            </Heading>
            <Stack gap={4}>
              <Box>
                <Text fontWeight="semibold" color="text" mb={1}>Form validation errors</Text>
                <Text color="text" opacity={0.8} ml={4}>Check that all required fields are filled and values are in the correct format</Text>
              </Box>
              
              <Box>
                <Text fontWeight="semibold" color="text" mb={1}>Changes not saving</Text>
                <Text color="text" opacity={0.8} ml={4}>Ensure you have write permissions to the configuration directory</Text>
              </Box>
              
              <Box>
                <Text fontWeight="semibold" color="text" mb={1}>Lost comments after saving</Text>
                <Text color="text" opacity={0.8} ml={4}>This is expected behavior - use manual YAML editing to preserve all comments</Text>
              </Box>
              
              <Box>
                <Text fontWeight="semibold" color="text" mb={1}>Configuration not loading</Text>
                <Text color="text" opacity={0.8} ml={4}>Verify your YAML files have valid syntax and are in the expected directory</Text>
              </Box>
              
              <Box>
                <Text fontWeight="semibold" color="text" mb={1}>Widget definitions not updating</Text>
                <Text color="text" opacity={0.8} ml={4}>Remember to click the main Save button after editing widgets - individual changes are held in memory</Text>
              </Box>
              
              <Box>
                <Text fontWeight="semibold" color="text" mb={1}>Widget definition file missing</Text>
                <Text color="text" opacity={0.8} ml={4}>The file is auto-created on app startup. Check your default file path in Settings → Files</Text>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
};

export default Help;