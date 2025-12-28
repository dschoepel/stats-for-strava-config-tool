import { getConfigSchemas } from './src/schemas/configSchemas.js';

function getDefaultsFromSchema(schema, depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}Processing schema...`);
  
  if (!schema || !schema.properties) {
    console.log(`${indent}No properties found`);
    return {};
  }
  
  const defaults = {};
  Object.entries(schema.properties).forEach(([key, prop]) => {
    console.log(`${indent}Property '${key}': type=${prop.type}, hasDefault=${prop.default !== undefined}`);
    
    if (prop.default !== undefined) {
      defaults[key] = prop.default;
      console.log(`${indent}  -> Added default: ${JSON.stringify(prop.default).substring(0, 50)}`);
    } else if (prop.type === 'object' && prop.properties) {
      console.log(`${indent}  -> Recursing into nested object...`);
      const nestedDefaults = getDefaultsFromSchema(prop, depth + 2);
      if (Object.keys(nestedDefaults).length > 0) {
        defaults[key] = nestedDefaults;
        console.log(`${indent}  -> Added nested object with ${Object.keys(nestedDefaults).length} properties`);
      } else {
        console.log(`${indent}  -> Skipped (no defaults in children)`);
      }
    } else if (prop.type === 'array') {
      defaults[key] = prop.default || [];
      console.log(`${indent}  -> Added array default`);
    }
  });
  
  console.log(`${indent}Returning ${Object.keys(defaults).length} defaults: ${Object.keys(defaults).join(', ')}`);
  return defaults;
}

const schemas = getConfigSchemas();
console.log('\n=== Testing appearance schema ===\n');
const appearanceDefaults = getDefaultsFromSchema(schemas.appearance);
console.log('\n=== Final Result ===');
console.log(JSON.stringify(appearanceDefaults, null, 2));
