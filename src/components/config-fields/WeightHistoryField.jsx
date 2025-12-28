import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

/**
 * WeightHistoryField - Manages weight history entries with dates
 * Supports dynamic unit display (kg/lbs) based on unitSystem prop
 */
const WeightHistoryField = ({ 
  value = {}, 
  onChange, 
  unitSystem = null,
  fieldSchema = {},
  hasError 
}) => {
  const weightUnit = unitSystem === 'imperial' ? 'lbs' : unitSystem === 'metric' ? 'kg' : 'kg/lbs';
  const showUnitNote = !unitSystem;
  
  // Initialize with default entry if empty
  const weightHistory = Object.keys(value).length === 0 ? { "1970-01-01": 0 } : value;
  
  // Parse date string as local date (not UTC) to avoid timezone issues
  const parseLocalDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  
  // Sort weight history entries newest to oldest
  const sortWeightHistory = (history) => {
    return Object.entries(history)
      .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
      .reduce((acc, [date, weight]) => {
        acc[date] = weight;
        return acc;
      }, {});
  };
  
  // Initialize with default if empty
  React.useEffect(() => {
    if (Object.keys(value).length === 0) {
      onChange({ "1970-01-01": 0 });
    }
  }, [value, onChange]);
  
  const handleAddWeightEntry = () => {
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    let newDate = iso;
    let counter = 1;
    
    while (weightHistory[newDate]) {
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() - counter);
      newDate = nextDay.toISOString().slice(0, 10);
      counter++;
    }
    
    const updated = { ...weightHistory, [newDate]: 0 };
    onChange(sortWeightHistory(updated));
  };
  
  const handleRemoveWeightEntry = (date) => {
    const updated = { ...weightHistory };
    delete updated[date];
    onChange(sortWeightHistory(updated));
  };
  
  const handleWeightChange = (date, weight) => {
    const numericWeight = weight === '' ? 0 : parseFloat(weight);
    if (isNaN(numericWeight)) return;
    
    if (numericWeight <= 0) {
      alert('Weight must be greater than zero.');
      return;
    }
    
    const updated = { ...weightHistory, [date]: numericWeight };
    onChange(sortWeightHistory(updated));
  };
  
  const handleDateChange = (oldDate, selectedDate) => {
    if (!selectedDate) return;
    
    const newDate = selectedDate.toISOString().slice(0, 10);
    if (newDate === oldDate) return;
    
    const today = new Date();
    if (selectedDate > today) {
      alert('Date cannot be in the future. Please select today\'s date or a past date.');
      return;
    }
    
    if (weightHistory[newDate]) {
      alert('A weight entry for this date already exists.');
      return;
    }
    
    const updated = { ...weightHistory };
    updated[newDate] = updated[oldDate];
    delete updated[oldDate];
    onChange(sortWeightHistory(updated));
  };
  
  return (
    <div className="form-field weight-history">
      <div className="field-label-section">
        <h4 className="field-label">{fieldSchema.title || 'Weight History'}</h4>
        {fieldSchema.description && (
          <p className="field-description">{fieldSchema.description}</p>
        )}
      </div>
      
      <div className="weight-history-section">
        <div className="weight-history-header">
          <h5>
            Weight Entries
            <span 
              className="info-tooltip-trigger" 
              title="If you don't care about relative power, you can use &quot;1970-01-01&quot;: YOUR_CURRENT_WEIGHT as a single entry in the Weight History to set a fixed weight for all activities."
            >
              ?
            </span>
          </h5>
          <button type="button" className="add-weight-entry-btn" onClick={handleAddWeightEntry}>
            + Add Weight Entry
          </button>
        </div>
        
        {showUnitNote && (
          <div className="weight-unit-notice">
            <span className="info-icon">ℹ️</span>
            <span>Weight unit depends on <strong>appearance.unitSystem</strong> setting (imperial = lbs, metric = kg). Configure this in the Appearance section.</span>
          </div>
        )}
        
        {Object.keys(weightHistory).length === 0 && (
          <div className="weight-history-empty">No weight entries defined.</div>
        )}
        
        <div className="weight-history-list">
          {Object.entries(weightHistory)
            .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
            .map(([date, weight]) => (
              <div key={date} className="weight-history-entry">
                <DatePicker
                  selected={parseLocalDate(date)}
                  onChange={(selectedDate) => handleDateChange(date, selectedDate)}
                  maxDate={new Date()}
                  dateFormat="yyyy-MM-dd"
                  className="weight-date-input"
                  showPopperArrow={true}
                  popperPlacement="bottom-start"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  yearDropdownItemNumber={50}
                  withPortal
                  popperModifiers={[
                    {
                      name: "offset",
                      options: {
                        offset: [0, 5],
                      },
                    },
                  ]}
                />
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => handleWeightChange(date, e.target.value)}
                  className="weight-value-input"
                  placeholder="Weight"
                  min="0"
                  step="0.1"
                />
                <span className="weight-unit">{weightUnit}</span>
                <button 
                  type="button" 
                  className="remove-weight-entry-btn" 
                  onClick={() => handleRemoveWeightEntry(date)}
                >
                  Remove
                </button>
              </div>
            ))}
        </div>
      </div>
      
      {hasError && <span className="field-error">{hasError}</span>}
    </div>
  );
};

export default WeightHistoryField;
