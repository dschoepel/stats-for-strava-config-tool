import React, { useState, useEffect } from 'react';
import './CountrySelector.css';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content country-selector-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Select Country</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="country-selector-controls">
          <input
            type="text"
            placeholder="Search countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="country-search-input"
            autoFocus
          />
          <div className="region-controls">
            <button type="button" onClick={expandAll} className="region-control-btn">
              Expand All
            </button>
            <button type="button" onClick={collapseAll} className="region-control-btn">
              Collapse All
            </button>
            <button type="button" onClick={handleClear} className="region-control-btn clear-btn">
              Clear Selection
            </button>
          </div>
        </div>

        {value && (
          <div className="current-selection">
            <strong>Current:</strong> {value}
          </div>
        )}

        <div className="country-list">
          {loading ? (
            <div className="loading-state">Loading countries...</div>
          ) : Object.keys(filteredCountryByRegion).length === 0 ? (
            <div className="empty-state">No countries found matching "{searchTerm}"</div>
          ) : (
            Object.entries(filteredCountryByRegion)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([region, regionCountries]) => (
                <div key={region} className="country-region">
                  <h4 
                    className="region-header collapsible"
                    onClick={() => toggleRegion(region)}
                  >
                    <span className="region-toggle-icon">
                      {expandedRegions[region] ? '▼' : '▶'}
                    </span>
                    {region} ({regionCountries.length})
                  </h4>
                  {expandedRegions[region] && (
                    <div className="country-items">
                      {regionCountries.map(country => (
                        <button
                          key={country.code}
                          type="button"
                          className={`country-item ${value === country.code ? 'selected' : ''}`}
                          onClick={() => handleCountrySelect(country.code)}
                        >
                          <span className="country-name">{country.name}</span>
                          <span className="country-code">{country.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CountrySelector;
