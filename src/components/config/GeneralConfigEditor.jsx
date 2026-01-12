import { memo } from 'react';
import BaseConfigEditor from './BaseConfigEditor';

/**
 * GeneralConfigEditor - Handles general configuration fields
 * Uses BaseConfigEditor for standard field rendering
 */
const GeneralConfigEditor = ({ 
  initialData, 
  onSave, 
  onCancel, 
  isLoading,
  onDirtyChange 
}) => {
  return (
    <BaseConfigEditor
      sectionName="general"
      initialData={initialData}
      onSave={onSave}
      onCancel={onCancel}
      isLoading={isLoading}
      onDirtyChange={onDirtyChange}
    >
      {({ schema, renderBasicField, renderObjectField }) => (
        <>
          {schema?.properties && Object.entries(schema.properties).map(([fieldName, fieldSchema]) => {
            // Handle object types
            if (fieldSchema.type === 'object') {
              return renderObjectField(fieldName, fieldSchema);
            }

            // Default to basic field rendering
            return renderBasicField(fieldName, fieldSchema);
          })}
        </>
      )}
    </BaseConfigEditor>
  );
};

// Wrap with memo to prevent unnecessary re-renders
export default memo(GeneralConfigEditor);
