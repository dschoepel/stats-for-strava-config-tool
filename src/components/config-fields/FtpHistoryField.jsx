import React from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

/**
 * FtpHistoryField - Manages FTP history for cycling and running
 * Each sport has separate date-based FTP entries
 */
const FtpHistoryField = ({ 
  value = {}, 
  onChange, 
  fieldSchema = {},
  hasError 
}) => {
  const ftpHistory = value;
  
  // Parse date string as local date (not UTC) to avoid timezone issues
  const parseLocalDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  
  // Sort FTP history entries newest to oldest
  const sortFtpHistory = (history) => {
    return Object.entries(history)
      .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
      .reduce((acc, [date, ftp]) => {
        acc[date] = ftp;
        return acc;
      }, {});
  };
  
  const handleAddFtpEntry = (sport) => {
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    let newDate = iso;
    let counter = 1;
    
    const sportHistory = ftpHistory[sport] || {};
    
    while (sportHistory[newDate]) {
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() - counter);
      newDate = nextDay.toISOString().slice(0, 10);
      counter++;
    }
    
    const updatedSportHistory = { ...sportHistory, [newDate]: 0 };
    const updated = { ...ftpHistory, [sport]: sortFtpHistory(updatedSportHistory) };
    onChange(updated);
  };
  
  const handleRemoveFtpEntry = (sport, date) => {
    const sportHistory = { ...(ftpHistory[sport] || {}) };
    delete sportHistory[date];
    
    const updated = { ...ftpHistory };
    if (Object.keys(sportHistory).length === 0) {
      delete updated[sport];
    } else {
      updated[sport] = sortFtpHistory(sportHistory);
    }
    onChange(updated);
  };
  
  const handleFtpChange = (sport, date, ftp) => {
    const numericFtp = ftp === '' ? 0 : parseFloat(ftp);
    if (isNaN(numericFtp)) return;
    
    if (numericFtp <= 0) {
      alert('FTP must be greater than zero.');
      return;
    }
    
    const sportHistory = { ...(ftpHistory[sport] || {}), [date]: numericFtp };
    const updated = { ...ftpHistory, [sport]: sortFtpHistory(sportHistory) };
    onChange(updated);
  };
  
  const handleDateChange = (sport, oldDate, selectedDate) => {
    if (!selectedDate) return;
    
    const newDate = selectedDate.toISOString().slice(0, 10);
    if (newDate === oldDate) return;
    
    const today = new Date();
    if (selectedDate > today) {
      alert('Date cannot be in the future. Please select today\'s date or a past date.');
      return;
    }
    
    const sportHistory = ftpHistory[sport] || {};
    
    if (sportHistory[newDate]) {
      alert('An FTP entry for this date already exists.');
      return;
    }
    
    const updated = { ...sportHistory };
    updated[newDate] = updated[oldDate];
    delete updated[oldDate];
    const updatedFull = { ...ftpHistory, [sport]: sortFtpHistory(updated) };
    onChange(updatedFull);
  };
  
  const renderSportFtpHistory = (sport, sportTitle, tooltip) => {
    const sportHistory = ftpHistory[sport] || {};
    
    return (
      <div key={sport} className="ftp-sport-section">
        <div className="ftp-sport-header">
          <h5>
            {sportTitle}
            <span 
              className="info-tooltip-trigger" 
              title={tooltip}
            >
              ?
            </span>
          </h5>
          <button type="button" className="add-ftp-entry-btn" onClick={() => handleAddFtpEntry(sport)}>
            + Add {sportTitle} FTP
          </button>
        </div>
        
        {Object.keys(sportHistory).length === 0 && (
          <div className="ftp-history-empty">No {sportTitle} FTP entries defined.</div>
        )}
        
        <div className="ftp-history-list">
          {Object.entries(sportHistory)
            .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
            .map(([date, ftp]) => (
              <div key={date} className="ftp-history-entry">
                <DatePicker
                  selected={parseLocalDate(date)}
                  onChange={(selectedDate) => handleDateChange(sport, date, selectedDate)}
                  maxDate={new Date()}
                  dateFormat="yyyy-MM-dd"
                  className="ftp-date-input"
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
                  value={ftp}
                  onChange={(e) => handleFtpChange(sport, date, e.target.value)}
                  className="ftp-value-input"
                  placeholder="FTP"
                  min="0"
                  step="1"
                />
                <span className="ftp-unit">watts</span>
                <button 
                  type="button" 
                  className="remove-ftp-entry-btn" 
                  onClick={() => handleRemoveFtpEntry(sport, date)}
                >
                  Remove
                </button>
              </div>
            ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="form-field ftp-history">
      <div className="field-label-section">
        <h4 className="field-label">{fieldSchema.title || 'FTP History'}</h4>
        {fieldSchema.description && (
          <p className="field-description">{fieldSchema.description}</p>
        )}
      </div>
      
      <div className="ftp-history-section">
        {renderSportFtpHistory(
          'cycling', 
          'Cycling', 
          'Functional Threshold Power (FTP) is the highest average power (measured in watts) you can sustain for about one hour without fatiguing. Usually tested with a 20-minute all-out effort. Your average power for those 20 minutes is multiplied by 0.95 to estimate your FTP.'
        )}
        
        {renderSportFtpHistory(
          'running', 
          'Running', 
          'Running equivalent (threshold pace or critical power) is using pace at lactate threshold (the fastest pace you can sustain for ~60 minutes). Some advanced setups with running power meters (like Stryd) do calculate a "running FTP," but most runners stick to pace or heart rate zones.'
        )}
      </div>
      
      {hasError && <span className="field-error">{hasError}</span>}
    </div>
  );
};

FtpHistoryField.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  fieldSchema: PropTypes.object,
  hasError: PropTypes.bool
};

export default FtpHistoryField;
