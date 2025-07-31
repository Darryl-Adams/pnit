import React, { useState, useRef } from 'react';
import { useAuth, authenticatedFetch } from '../utils/auth';
import { useAccessibility } from './AccessibilityProvider';
import { LoadingSpinner, ProgressBar } from './LoadingSpinner';
import { ErrorAlert } from './ErrorBoundary';
import { SettingsContainer } from './SettingsComponents';

// Data Export Component
export const DataExport = () => {
  const { announce } = useAccessibility();
  const [exportType, setExportType] = useState('all');
  const [exportFormat, setExportFormat] = useState('json');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const exportOptions = {
    all: 'All Data (Connections, Queries, Settings)',
    connections: 'Connections Only', 
    queries: 'Query History Only',
    settings: 'Settings & Preferences Only'
  };

  const formatOptions = {
    json: 'JSON',
    csv: 'CSV (Connections only)',
    xlsx: 'Excel (Connections only)'
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);
      setProgress(0);
      
      announce('Starting data export', 'polite');

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await authenticatedFetch('/api/data/export', {
        method: 'POST',
        body: JSON.stringify({
          type: exportType,
          format: exportFormat
        })
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pnit-export-${exportType}-${Date.now()}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      announce('Data export completed successfully', 'polite');
      
    } catch (err) {
      setError(err.message);
      announce('Data export failed', 'assertive');
    } finally {
      setExporting(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return (
    <SettingsContainer 
      title="Export Data" 
      description="Download your data in various formats for backup or analysis"
    >
      {error && (
        <ErrorAlert 
          error={error} 
          onDismiss={() => setError(null)}
          className="mb-6"
        />
      )}

      <div className="space-y-6">
        {/* Export Type Selection */}
        <div>
          <fieldset>
            <legend className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              What would you like to export?
            </legend>
            <div className="space-y-3">
              {Object.entries(exportOptions).map(([value, label]) => (
                <div key={value} className="flex items-center">
                  <input
                    id={`export-${value}`}
                    name="export-type"
                    type="radio"
                    value={value}
                    checked={exportType === value}
                    onChange={(e) => setExportType(e.target.value)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <label 
                    htmlFor={`export-${value}`} 
                    className="ml-3 text-sm text-gray-700 dark:text-gray-300"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Format Selection */}
        <div>
          <label htmlFor="export-format" className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
            Export Format
          </label>
          <select
            id="export-format"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            disabled={exporting}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white disabled:opacity-50"
          >
            {Object.entries(formatOptions).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {(exportFormat === 'csv' || exportFormat === 'xlsx') && exportType === 'all' && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              ⚠️ CSV/Excel formats only support connections data. Other data will be excluded.
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {exporting && (
          <div>
            <ProgressBar 
              progress={progress} 
              label="Exporting data..." 
              showPercentage={true}
            />
          </div>
        )}

        {/* Export Button */}
        <div className="flex justify-start">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Data
              </>
            )}
          </button>
        </div>

        {/* Export Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            📋 Export Information
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Exported data includes timestamps and metadata</li>
            <li>• Personal information is included for your records</li>
            <li>• Large exports may take a few minutes to process</li>
            <li>• Files are generated securely and not stored on our servers</li>
          </ul>
        </div>
      </div>
    </SettingsContainer>
  );
};

// Data Import Component
export const DataImport = () => {
  const { announce } = useAccessibility();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [progress, setProgress] = useState(0);
  const [importPreview, setImportPreview] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (file) => {
    setError(null);
    setSuccess(null);
    setImportPreview(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file type
    const allowedTypes = ['.json', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setError('Please select a JSON or CSV file');
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);

    // Generate preview for JSON files
    if (fileExtension === '.json') {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        const preview = {
          connections: data.connections?.length || 0,
          queries: data.queries?.length || 0,
          settings: data.settings ? 1 : 0,
          fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB'
        };
        
        setImportPreview(preview);
      } catch (err) {
        setError('Invalid JSON file format');
        setSelectedFile(null);
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setImporting(true);
      setError(null);
      setProgress(0);
      
      announce('Starting data import', 'polite');

      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 90));
      }, 500);

      const response = await authenticatedFetch('/api/data/import', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const result = await response.json();
      setSuccess(`Successfully imported: ${result.summary?.imported || 0} records`);
      setSelectedFile(null);
      setImportPreview(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      announce('Data import completed successfully', 'polite');

    } catch (err) {
      setError(err.message);
      announce('Data import failed', 'assertive');
    } finally {
      setImporting(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return (
    <SettingsContainer 
      title="Import Data" 
      description="Upload and restore your data from exported files"
    >
      {error && (
        <ErrorAlert 
          error={error} 
          onDismiss={() => setError(null)}
          className="mb-6"
        />
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex">
            <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-green-800 dark:text-green-200">
              {success}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 text-gray-400 dark:text-gray-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            
            <div>
              <label htmlFor="import-file" className="cursor-pointer">
                <span className="text-lg font-medium text-gray-900 dark:text-white">
                  {selectedFile ? selectedFile.name : 'Drop your file here, or browse'}
                </span>
                <input
                  id="import-file"
                  ref={fileInputRef}
                  name="import-file"
                  type="file"
                  accept=".json,.csv"
                  className="sr-only"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  disabled={importing}
                  aria-describedby="import-file-description"
                />
              </label>
              <p id="import-file-description" className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                JSON or CSV files up to 50MB
              </p>
            </div>

            {!selectedFile && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select File
              </button>
            )}
          </div>
        </div>

        {/* Import Preview */}
        {importPreview && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-3">
              ✓ File Preview
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-green-800 dark:text-green-200">
              <div>
                <div className="font-medium">{importPreview.connections}</div>
                <div className="text-xs opacity-75">Connections</div>
              </div>
              <div>
                <div className="font-medium">{importPreview.queries}</div>
                <div className="text-xs opacity-75">Queries</div>
              </div>
              <div>
                <div className="font-medium">{importPreview.settings}</div>
                <div className="text-xs opacity-75">Settings</div>
              </div>
              <div>
                <div className="font-medium">{importPreview.fileSize}</div>
                <div className="text-xs opacity-75">File Size</div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {importing && (
          <div>
            <ProgressBar 
              progress={progress} 
              label="Importing data..." 
              showPercentage={true}
            />
          </div>
        )}

        {/* Import Button */}
        {selectedFile && (
          <div className="flex justify-start">
            <button
              onClick={handleImport}
              disabled={importing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l3 3m0 0l3-3m-3 3V8" />
                  </svg>
                  Import Data
                </>
              )}
            </button>
          </div>
        )}

        {/* Import Warning */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
            ⚠️ Import Warning
          </h4>
          <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
            <li>• Importing will merge with existing data (not replace)</li>
            <li>• Duplicate entries will be detected and handled automatically</li>
            <li>• Large imports may take several minutes to process</li>
            <li>• Make sure to backup your current data before importing</li>
          </ul>
        </div>
      </div>
    </SettingsContainer>
  );
};

export default { DataExport, DataImport };