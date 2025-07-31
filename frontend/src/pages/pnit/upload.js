import Head from 'next/head';
import { useState } from 'react';
import PNITLayout from '../../components/PNITLayout';
import CSVUpload from '../../components/CSVUpload';

export default function UploadCSV() {
  const [lastUpload, setLastUpload] = useState(null);

  const handleUploadSuccess = (result) => {
    setLastUpload({
      timestamp: new Date().toLocaleString(),
      message: result.message
    });
  };

  return (
    <PNITLayout>
      <Head>
        <title>Upload LinkedIn CSV | PNIT</title>
        <meta name="description" content="Upload your LinkedIn connections CSV file to start using PNIT" />
      </Head>
      
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Upload Your LinkedIn Connections
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Import your LinkedIn connections CSV file to start querying your network with AI
          </p>
        </header>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
          <CSVUpload 
            userId={1} 
            onUploadSuccess={handleUploadSuccess}
          />
        </div>

        {/* Upload Status */}
        {lastUpload && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Upload History
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>
                <span className="font-medium">Last upload:</span>{' '}
                <span aria-live="polite">{lastUpload.timestamp}</span>
              </p>
              <p>
                <span className="font-medium">Status:</span> {lastUpload.message}
              </p>
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            🔒 Privacy & Security
          </h2>
          <ul className="text-yellow-800 dark:text-yellow-200 space-y-1 text-sm">
            <li>• Your connection data is stored securely and never shared</li>
            <li>• Only you can access and query your network information</li>
            <li>• You can delete your data at any time from the settings page</li>
            <li>• All uploads are encrypted and processed server-side</li>
          </ul>
        </div>

        {/* Next Steps */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            What's Next?
          </h2>
          <div className="text-blue-800 dark:text-blue-200 space-y-2 text-sm">
            <p>After uploading your connections, you can:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                <a href="/pnit/chat" className="underline hover:no-underline">
                  Start chatting with your network data
                </a>
              </li>
              <li>
                <a href="/pnit/history" className="underline hover:no-underline">
                  View your query history
                </a>
              </li>
              <li>
                <a href="/pnit/settings" className="underline hover:no-underline">
                  Manage your account settings
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </PNITLayout>
  );
}
