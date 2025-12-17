import React from 'react';
import './Help.css';

const Help = () => {
  return (
    <div className="help-container">
      <div className="help-header">
        <h2>Help & Documentation</h2>
        <p className="help-subtitle">Configuration tool guide and important information</p>
      </div>

      <div className="help-content">
        <section className="help-section">
          <h3>📝 Using the Configuration Editor</h3>
          <div className="help-card">
            <h4>Form-Based Configuration</h4>
            <p>
              This tool provides guided forms for editing your Strava configuration files. Each form includes:
            </p>
            <ul>
              <li><strong>Field descriptions</strong> - Explanations of what each setting does</li>
              <li><strong>Input validation</strong> - Prevents invalid values from being saved</li>
              <li><strong>Type-specific controls</strong> - Dropdowns for enums, number inputs for numeric values</li>
              <li><strong>Required field indicators</strong> - Red asterisks (*) mark mandatory fields</li>
            </ul>
          </div>

          <div className="help-card warning">
            <h4>⚠️ Important: Comment Preservation</h4>
            <p>
              When saving configuration changes through this editor:
            </p>
            <ul>
              <li><strong>Section headers are preserved</strong> - Main comments like section titles remain intact</li>
              <li><strong>Embedded comments may be removed</strong> - Detailed comments within YAML structures might be lost</li>
              <li><strong>This is by design</strong> - The forms provide all necessary guidance, making embedded comments redundant</li>
            </ul>
            <p>
              <em>If you need to preserve all comments, edit the YAML files manually instead of using this tool.</em>
            </p>
          </div>
        </section>

        <section className="help-section">
          <h3>⚙️ Configuration Sections</h3>
          <div className="help-card">
            <div className="config-sections">
              <div className="section-item">
                <span className="section-icon">🔧</span>
                <div>
                  <strong>General</strong>
                  <p>Basic application settings like URLs and titles</p>
                </div>
              </div>
              <div className="section-item">
                <span className="section-icon">👤</span>
                <div>
                  <strong>Athlete</strong>
                  <p>Personal information including heart rate zones, weight history, and FTP data</p>
                </div>
              </div>
              <div className="section-item">
                <span className="section-icon">🎨</span>
                <div>
                  <strong>Appearance</strong>
                  <p>Visual customization options for your statistics display</p>
                </div>
              </div>
              <div className="section-item">
                <span className="section-icon">📥</span>
                <div>
                  <strong>Import</strong>
                  <p>Data import settings and preferences</p>
                </div>
              </div>
              <div className="section-item">
                <span className="section-icon">📊</span>
                <div>
                  <strong>Metrics</strong>
                  <p>Configuration for statistical calculations and metrics</p>
                </div>
              </div>
              <div className="section-item">
                <span className="section-icon">🚴</span>
                <div>
                  <strong>Gear</strong>
                  <p>Equipment and bike configuration</p>
                </div>
              </div>
              <div className="section-item">
                <span className="section-icon">🖥️</span>
                <div>
                  <strong>Zwift</strong>
                  <p>Zwift integration settings</p>
                </div>
              </div>
              <div className="section-item">
                <span className="section-icon">🔗</span>
                <div>
                  <strong>Integrations</strong>
                  <p>Third-party service connections and API settings</p>
                </div>
              </div>
              <div className="section-item">
                <span className="section-icon">⏰</span>
                <div>
                  <strong>Scheduling Daemon</strong>
                  <p>Automated task scheduling and background processes</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="help-section">
          <h3>📄 YAML Utility</h3>
          <div className="help-card">
            <h4>File Validation and Management</h4>
            <p>
              The YAML Utility provides essential configuration file management tools:
            </p>
            <ul>
              <li><strong>Validate YAML files</strong> - Check syntax and structure for errors</li>
              <li><strong>View file contents</strong> - Browse and inspect configuration files</li>
              <li><strong>Combine configurations</strong> - Merge multiple YAML files into a single unified configuration</li>
            </ul>
            
            <h4>Future Enhancements</h4>
            <p>Planned features for upcoming releases:</p>
            <ul>
              <li><strong>Direct file editing</strong> - Edit YAML files with syntax highlighting and validation</li>
              <li><strong>Configuration splitting</strong> - Break a single config file into separate section files</li>
            </ul>
            
            <p className="note">
              <strong>Current Limitation:</strong> The YAML Utility does not support direct editing. 
              For manual configuration changes, edit the files using an external text editor.
            </p>
          </div>
        </section>

        <section className="help-section">
          <h3>🚀 Getting Started</h3>
          <div className="help-card">
            <ol>
              <li><strong>Choose a configuration section</strong> from the sidebar menu</li>
              <li><strong>Fill in the form fields</strong> - required fields are marked with *</li>
              <li><strong>Use the descriptions</strong> to understand what each setting does</li>
              <li><strong>Save your changes</strong> - the tool will validate your input</li>
              <li><strong>Review the results</strong> - check that your configuration works as expected</li>
            </ol>
          </div>
        </section>

        <section className="help-section">
          <h3>❓ Troubleshooting</h3>
          <div className="help-card">
            <h4>Common Issues</h4>
            <dl className="troubleshooting-list">
              <dt>Form validation errors</dt>
              <dd>Check that all required fields are filled and values are in the correct format</dd>
              
              <dt>Changes not saving</dt>
              <dd>Ensure you have write permissions to the configuration directory</dd>
              
              <dt>Lost comments after saving</dt>
              <dd>This is expected behavior - use manual YAML editing to preserve all comments</dd>
              
              <dt>Configuration not loading</dt>
              <dd>Verify your YAML files have valid syntax and are in the expected directory</dd>
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Help;