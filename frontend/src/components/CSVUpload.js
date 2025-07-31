import { useState, useRef } from 'react';

export default function CSVUpload({ userId = 1, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  
  const fileInputRef = useRef(null);

  // Expected LinkedIn CSV headers (case-insensitive matching)
  const expectedHeaders = [
    'First Name',
    'Last Name', 
    'Company',
    'Position',
    'Profile URL'
  ];

  const validateCSVStructure = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const missingHeaders = [];
    const foundHeaders = [];

    expectedHeaders.forEach(expected => {
      const found = headers.find(h => 
        h.toLowerCase().includes(expected.toLowerCase()) || 
        expected.toLowerCase().includes(h.toLowerCase())
      );
      if (found) {
        foundHeaders.push(expected);
      } else {
        missingHeaders.push(expected);
      }
    });

    // Parse sample rows to check data quality
    const dataRows = lines.slice(1, Math.min(6, lines.length)); // Check first 5 rows
    const validRows = dataRows.filter(row => {
      const cells = row.split(',').map(cell => cell.replace(/"/g, '').trim());
      return cells.length >= 2 && cells[0] && cells[1]; // At least first and last name
    });

    return {
      totalRows: lines.length - 1,
      validRows: validRows.length,
      sampleRows: Math.min(5, dataRows.length),
      headers: foundHeaders,
      missingHeaders,
      hasRequiredData: foundHeaders.includes('First Name') && foundHeaders.includes('Last Name')
    };
  };

  const handleFileSelect = async (selectedFile) => {
    setError(null);
    setSuccess(null);
    setValidationResults(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file (.csv extension required)');
      return;
    }

    // Validate file size (50MB max)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    try {
      const text = await selectedFile.text();
      const validation = validateCSVStructure(text);
      
      if (!validation.hasRequiredData) {
        setError('CSV must contain at least "First Name" and "Last Name" columns. Please check your LinkedIn export format.');
        return;
      }

      setFile(selectedFile);
      setValidationResults(validation);
      
      if (validation.missingHeaders.length > 0) {
        setError(`Warning: Some optional columns are missing: ${validation.missingHeaders.join(', ')}. Upload will proceed with available data.`);
      }
    } catch (err) {
      setError(`Error reading CSV file: ${err.message}`);
    }
  };

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files[0]);
  };

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

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file || !validationResults?.hasRequiredData) {
      setError('Please select a valid CSV file first');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const csvText = await file.text();
      
      // Simulate progress for better UX
      setUploadProgress(25);
      
      const response = await fetch('/api/upload-connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          csv_data: csvText
        }),
      });

      setUploadProgress(75);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setUploadProgress(100);
      
      setSuccess(`Successfully imported ${result.message.match(/\d+/)?.[0] || 'your'} connections!`);
      setFile(null);
      setValidationResults(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onUploadSuccess) {
        onUploadSuccess(result);
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          How to export your LinkedIn connections
        </h2>
        <ol className="text-blue-800 dark:text-blue-200 space-y-1 text-sm list-decimal list-inside">
          <li>Go to LinkedIn.com and sign in</li>
          <li>Click on "Me" → "Settings & Privacy"</li>
          <li>Go to "Data Privacy" → "Get a copy of your data"</li>
          <li>Select "Connections" and download the CSV file</li>
          <li>Upload the "Connections.csv" file below</li>
        </ol>
      </div>

      {/* Upload Area */}
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
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-lg font-medium text-gray-900 dark:text-white">
                {file ? file.name : 'Drop your CSV file here, or browse'}
              </span>
              <input
                id="file-upload"
                ref={fileInputRef}
                name="file-upload"
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={handleFileInputChange}
                disabled={isUploading}
                aria-describedby="file-upload-description"
              />
            </label>
            <p id="file-upload-description" className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              CSV files up to 50MB
            </p>
          </div>

          {!file && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select File
            </button>
          )}
        </div>
      </div>

      {/* Validation Results */}
      {validationResults && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
            ✓ File Validation Passed
          </h3>
          <div className="text-green-800 dark:text-green-200 text-sm space-y-1">
            <p>• Found {validationResults.totalRows} total connections</p>
            <p>• {validationResults.validRows} rows have required data</p>
            <p>• Available columns: {validationResults.headers.join(', ')}</p>
            {validationResults.missingHeaders.length > 0 && (
              <p className="text-amber-700 dark:text-amber-300">
                • Missing optional columns: {validationResults.missingHeaders.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div 
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div 
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
          role="alert"
          aria-live="polite"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
            <span className="text-gray-600 dark:text-gray-400">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      {file && validationResults?.hasRequiredData && (
        <form onSubmit={handleUpload} className="flex justify-center">
          <button
            type="submit"
            disabled={isUploading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading Connections...
              </>
            ) : (
              `Upload ${validationResults.totalRows} Connections`
            )}
          </button>
        </form>
      )}
    </div>
  );
}