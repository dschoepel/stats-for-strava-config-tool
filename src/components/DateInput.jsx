import { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { Input } from '@chakra-ui/react';
import 'react-datepicker/dist/react-datepicker.css';

// Add styles to fix z-index issues (only on client side)
if (typeof document !== 'undefined' && !document.getElementById('datepicker-styles')) {
  const style = document.createElement('style');
  style.id = 'datepicker-styles';
  style.textContent = `
    .react-datepicker-popper {
      z-index: 9999 !important;
    }
    .date-picker-popper {
      z-index: 9999 !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * DateInput - Chakra UI compatible date picker using react-datepicker
 * 
 * Handles date string (YYYY-MM-DD) conversion to avoid timezone issues.
 * Always works with strings, never with Date objects for storage.
 */

// Custom input component that wraps Chakra Input
const ChakraDateInput = forwardRef(({ value, onClick, onChange, placeholder, ...props }, ref) => (
  <Input
    ref={ref}
    value={value}
    onClick={onClick}
    onChange={onChange}
    placeholder={placeholder}
    readOnly
    cursor="pointer"
    {...props}
  />
));

ChakraDateInput.displayName = 'ChakraDateInput';

export const DateInput = ({ 
  value, 
  onChange, 
  placeholder = 'Select date',
  displayFormat = 'MM/dd/yyyy', // Default to Month/Day/Year format
  minDate,
  maxDate,
  ...props 
}) => {
  // Convert string (YYYY-MM-DD) to Date object for DatePicker
  const dateValue = value ? new Date(value + 'T00:00:00') : null;
  
  // Convert Date object back to string (YYYY-MM-DD) on change
  const handleChange = (date) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      onChange(dateString);
    } else {
      onChange('');
    }
  };

  return (
    <DatePicker
      selected={dateValue}
      onChange={handleChange}
      customInput={<ChakraDateInput {...props} />}
      dateFormat={displayFormat}
      placeholderText={placeholder}
      minDate={minDate}
      maxDate={maxDate}
      showYearDropdown
      showMonthDropdown
      dropdownMode="select"
      withPortal
      popperClassName="date-picker-popper"
      popperModifiers={[
        {
          name: 'offset',
          options: {
            offset: [0, 8],
          },
        },
        {
          name: 'preventOverflow',
          options: {
            rootBoundary: 'viewport',
            tether: false,
            altAxis: true,
          },
        },
      ]}
    />
  );
};
