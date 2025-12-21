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
          <h3>🧩 Widget Definitions Editor</h3>
          <div className="help-card">
            <h4>Managing Dashboard Widget Definitions</h4>
            <p>
              The Widget Definitions Editor (accessible via Settings → Widgets tab) allows you to manage the widget templates that define what widgets are available for your dashboard.
            </p>
            
            <h4>What are Widget Definitions?</h4>
            <p>
              Widget definitions are templates that describe:
            </p>
            <ul>
              <li><strong>Widget metadata</strong> - Name, display name, and description</li>
              <li><strong>Instance rules</strong> - Whether multiple instances of the widget can be added</li>
              <li><strong>Configuration options</strong> - What settings the widget supports</li>
              <li><strong>Default values</strong> - Initial configuration values for new widget instances</li>
            </ul>

            <h4>File Storage</h4>
            <p>
              Widget definitions are stored in <code>settings/widget-definitions.yaml</code> within your default file path. 
              This file is automatically created when you first open the tool and is synced with any widgets already in your dashboard configuration.
            </p>

            <h4>Using the Editor</h4>
            <ol>
              <li><strong>Open Settings</strong> - Click the gear icon (⚙️) in the top navigation</li>
              <li><strong>Select Widgets tab</strong> - Navigate to the Widget Definitions section</li>
              <li><strong>View widgets</strong> - Widgets are grouped by "Can be added multiple times" and "Can only be added once"</li>
              <li><strong>Expand details</strong> - Click the toggle arrow to see widget properties and configuration templates</li>
              <li><strong>Add/Edit/Delete</strong> - Use the respective buttons to manage widget definitions</li>
              <li><strong>Save changes</strong> - Click the 💾 Save button to write all changes to the file</li>
            </ol>

            <div className="warning" style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(255, 193, 7, 0.1)', borderLeft: '4px solid #ffc107', borderRadius: '4px' }}>
              <p style={{ margin: 0 }}>
                <strong>⚠️ Important:</strong> Individual widget changes are saved in memory only. 
                You must click the main <strong>Save</strong> button to write all changes to the file.
              </p>
            </div>

            <h4>Widget Properties</h4>
            <dl className="troubleshooting-list">
              <dt>Widget Name (camelCase)</dt>
              <dd>Unique identifier in camelCase format (e.g., mostRecentActivities)</dd>
              
              <dt>Display Name</dt>
              <dd>Human-readable name shown in the UI (e.g., "Most Recent Activities")</dd>
              
              <dt>Description</dt>
              <dd>Brief explanation of what the widget displays or does</dd>
              
              <dt>Allow multiple instances</dt>
              <dd>If checked, multiple copies of this widget can be added to the dashboard</dd>
              
              <dt>Has configuration options</dt>
              <dd>If checked, the widget supports customizable settings</dd>
              
              <dt>Config Template (YAML)</dt>
              <dd>Example configuration showing available options and syntax</dd>
            </dl>

            <h4>Automatic Initialization</h4>
            <p>
              When the app starts:
            </p>
            <ul>
              <li><strong>File creation</strong> - If the widget definitions file doesn't exist, it's created with 19 default widgets</li>
              <li><strong>Config sync</strong> - Widget default values are updated based on widgets in your dashboard configuration</li>
              <li><strong>Validation</strong> - All widget definitions are validated for correct structure</li>
            </ul>

            <h4>Default Widgets</h4>
            <p>The system includes these built-in widget definitions:</p>
            <ul style={{ columnCount: 2, columnGap: '20px' }}>
              <li>Most Recent Activities</li>
              <li>Introduction Text</li>
              <li>Training Goals</li>
              <li>Weekly Statistics</li>
              <li>Peak Power Outputs</li>
              <li>Heart Rate Zones</li>
              <li>Activity Grid</li>
              <li>Monthly Statistics</li>
              <li>Training Load</li>
              <li>Weekday Statistics</li>
              <li>Day Time Statistics</li>
              <li>Distance Breakdown</li>
              <li>Yearly Statistics</li>
              <li>Zwift Statistics</li>
              <li>Gear Statistics</li>
              <li>Eddington Number</li>
              <li>Challenge Consistency</li>
              <li>Most Recent Challenges</li>
              <li>FTP History</li>
              <li>Athlete Weight History</li>
            </ul>
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
              
              <dt>Widget definitions not updating</dt>
              <dd>Remember to click the main Save button after editing widgets - individual changes are held in memory</dd>
              
              <dt>Widget definition file missing</dt>
              <dd>The file is auto-created on app startup. Check your default file path in Settings → Files</dd>
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Help;