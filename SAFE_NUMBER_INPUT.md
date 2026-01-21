# SafeNumberInput Component - Developer Documentation

## Critical Information

**⚠️ DO NOT use `<NumberInput>` from Chakra UI v3 directly in this codebase.**

Always use the `<SafeNumberInput>` wrapper component instead.

## Why SafeNumberInput Exists

### The Problem

Chakra UI v3's `NumberInput` component has a critical bug when used as a controlled component with immediate numeric parsing:

**When typing multi-digit numbers like "42", the input becomes "1220"**

This happens because:
1. User types "4" → onValueChange fires with number `4`
2. Parent component updates value to `4`
3. User types "2" → Input shows "42" briefly
4. onValueChange fires with number `42` 
5. Parent component updates value to `42`
6. **Chakra re-parses "42" and triggers another onValueChange**
7. This creates a feedback loop causing corrupted input

### The Solution

`SafeNumberInput` fixes this by:
1. **Storing the RAW STRING** during typing (not parsing immediately)
2. **Only parsing on blur** (when user finishes editing)
3. **Validating and clamping** the result before committing
4. **Showing validation errors** without breaking the input flow

## Usage

### Basic Usage

```jsx
import SafeNumberInput from '@/components/ui/SafeNumberInput';

<SafeNumberInput
  value={myNumber}
  onChange={(num) => setMyNumber(num)}
  min={0}
  max={100}
  step={1}
  label="Age"
  helperText="Enter your age"
/>
```

### With Validation

```jsx
<SafeNumberInput
  value={heartRate}
  onChange={setHeartRate}
  min={30}
  max={220}
  label="Heart Rate (BPM)"
  isRequired={true}
  errorText="Invalid heart rate"
/>
```

### Optional Values

```jsx
<SafeNumberInput
  value={purchasePrice}  // Can be undefined
  onChange={setPurchasePrice}
  min={0}
  label="Purchase Price (optional)"
  placeholder="e.g., 50000 for $500.00"
/>
```

### With Decimal Support

```jsx
<SafeNumberInput
  value={weight}
  onChange={setWeight}
  min={0}
  max={500}
  step={0.1}
  allowDecimal={true}
  label="Weight (kg)"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number \| undefined` | - | **Required.** Current numeric value |
| `onChange` | `(value: number \| undefined) => void` | - | **Required.** Called when value is committed (on blur) |
| `min` | `number` | - | Minimum allowed value (enforced on blur) |
| `max` | `number` | - | Maximum allowed value (enforced on blur) |
| `step` | `number` | `1` | Increment/decrement step |
| `label` | `string` | - | Field label text |
| `helperText` | `string` | - | Helper text shown below input |
| `errorText` | `string` | - | Custom error message |
| `isRequired` | `boolean` | `false` | Whether field is required |
| `isDisabled` | `boolean` | `false` | Whether input is disabled |
| `placeholder` | `string` | - | Placeholder text |
| `width` | `ResponsiveValue` | - | Input width (Chakra responsive values) |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Input size |
| `allowDecimal` | `boolean` | `false` | Allow decimal values (uses `parseFloat` instead of `parseInt`) |

Additional props are passed through to the underlying `NumberInput.Root` component.

## Features

### Automatic Validation

SafeNumberInput automatically validates:
- **Non-numeric input** - Shows "Please enter a valid number"
- **Below minimum** - Shows "Value must be at least {min}"
- **Above maximum** - Shows "Value must be at most {max}"
- **Required but empty** - Shows "This field is required"

### Live Validation

- First blur: Validation error appears if invalid
- After first blur: Validation updates live as you type
- Prevents calling `onChange` with invalid values

### Value Clamping

When a valid number exceeds min/max bounds, it's automatically clamped on blur:
```jsx
// User types "250" with max={100}
// On blur: onChange(100) is called, input shows "100"
```

### Optional Values

Empty input with `isRequired={false}` calls `onChange(undefined)`:
```jsx
<SafeNumberInput 
  value={optionalPrice}
  onChange={setOptionalPrice}  // Can receive undefined
  min={0}
/>
```

## Migration Guide

### From Direct NumberInput

**Before:**
```jsx
const [valueString, setValueString] = useState(String(value));

const handleChange = (newString) => {
  setValueString(newString);
};

const handleBlur = () => {
  const num = parseInt(valueString);
  if (!isNaN(num)) {
    onChange(Math.max(min, Math.min(max, num)));
  }
};

<NumberInput.Root
  value={valueString}
  onValueChange={(e) => handleChange(e.value)}
  min={min}
  max={max}
  step={step}
>
  <NumberInput.Input onBlur={handleBlur} />
  <NumberInput.Control />
</NumberInput.Root>
```

**After:**
```jsx
<SafeNumberInput
  value={value}
  onChange={onChange}
  min={min}
  max={max}
  step={step}
/>
```

## Architecture

### State Management

```
┌─────────────────────────────────────────┐
│ User Types                              │
│  "4" → "42" → "420"                     │
└──────────────┬──────────────────────────┘
               │
               │ onValueChange (stores STRING)
               ▼
┌─────────────────────────────────────────┐
│ Internal State: valueString             │
│  "4" → "42" → "420"                     │
└──────────────┬──────────────────────────┘
               │
               │ User blurs
               ▼
┌─────────────────────────────────────────┐
│ Parse & Validate                        │
│  parseInt("420") → 420                  │
│  Clamp: Math.max(min, Math.min(max, 420))│
└──────────────┬──────────────────────────┘
               │
               │ onChange(validatedNumber)
               ▼
┌─────────────────────────────────────────┐
│ Parent Component                        │
│  value updates                          │
└─────────────────────────────────────────┘
```

### External Value Sync

SafeNumberInput automatically syncs when the parent changes `value` prop:

```jsx
// Parent changes value from external action (e.g., reset button)
<SafeNumberInput value={newValue} onChange={...} />

// SafeNumberInput detects change and updates internal string
```

## Examples from Codebase

### RestingHeartRateEditor (Fixed Mode)
```jsx
<SafeNumberInput
  value={typeof value === 'number' ? value : 60}
  onChange={onChange}
  min={30}
  max={120}
  step={1}
  width={{ base: "100%", sm: "150px" }}
  label="Resting Heart Rate (BPM)"
  helperText="Enter a value between 30 and 120 BPM"
/>
```

### FilesSettingsModal (Backup Threshold)
```jsx
<SafeNumberInput
  value={settings.files?.backupThreshold || 10}
  onChange={(val) => handleChange('files.backupThreshold', val)}
  min={1}
  max={100}
  step={1}
  width={{ base: "100%", sm: "150px" }}
  size="sm"
/>
```

### GearItemEditor (Purchase Price - Optional)
```jsx
<SafeNumberInput
  value={gear.purchasePrice?.amountInCents}
  onChange={(val) => handlePurchasePriceUpdate('amountInCents', val)}
  min={0}
  size="sm"
  label="Amount (cents)"
  placeholder="e.g., 50000 for $500.00"
  errorText={errors[`${prefix}[${index}].purchasePrice.amountInCents`]}
/>
```

### WeightHistoryEditor (Decimal Support)
```jsx
<SafeNumberInput
  value={history[date] || 0}
  onChange={(newWeight) => handleWeightChange(date, newWeight)}
  min={0}
  step={0.1}
  width="120px"
  size="sm"
  allowDecimal={true}
/>
```

## Testing

When testing components that use SafeNumberInput:

```js
// Type value
fireEvent.change(input, { target: { value: '42' } });

// Blur to commit
fireEvent.blur(input);

// Assert onChange was called
expect(mockOnChange).toHaveBeenCalledWith(42);
```

## ESLint Rule (Future Enhancement)

Consider adding a custom ESLint rule to prevent direct `NumberInput` usage:

```js
// .eslintrc.js
rules: {
  'no-restricted-imports': ['error', {
    patterns: [{
      group: ['@chakra-ui/react'],
      importNames: ['NumberInput'],
      message: 'Use SafeNumberInput instead of direct NumberInput from Chakra UI'
    }]
  }]
}
```

## Related Files

- **Component:** [src/components/ui/SafeNumberInput.jsx](../src/components/ui/SafeNumberInput.jsx)
- **Usage Examples:**
  - [app/_components/fields/RestingHeartRateEditor.jsx](../app/_components/fields/RestingHeartRateEditor.jsx)
  - [app/_components/fields/WeightHistoryEditor.jsx](../app/_components/fields/WeightHistoryEditor.jsx)
  - [app/_components/fields/FtpHistoryEditor.jsx](../app/_components/fields/FtpHistoryEditor.jsx)
  - [app/(config)/_components/gear/GearItemEditor.jsx](../app/(config)/_components/gear/GearItemEditor.jsx)
  - [src/components/settings/FilesSettingsModal.jsx](../src/components/settings/FilesSettingsModal.jsx)

## Changelog

### 2024-01-XX - Initial Implementation
- Created SafeNumberInput component with raw string pattern
- Replaced all 7 direct NumberInput usages across codebase
- Added validation UI with error messages
- Fixed multi-digit typing bug (e.g., "42" → "1220")
