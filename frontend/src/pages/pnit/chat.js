import Head from 'next/head';
import PNITLayout from '../../components/PNITLayout';
import ChatInterface from '../../components/ChatInterface';

export default function Chat() {
  return (
    <PNITLayout>
      <Head>
        <title>Chat Interface | PNIT</title>
        <meta name="description" content="Chat with your LinkedIn network data using AI-powered queries" />
      </Head>
      
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Chat with Your Network Data
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Use natural language to search and interact with your LinkedIn connections
          </p>
        </header>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg">
          <ChatInterface />
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How to use the chat
          </h2>
          <ul className="text-blue-800 dark:text-blue-200 space-y-1 text-sm">
            <li>• Ask about specific companies: "Who works at Google?"</li>
            <li>• Search by role: "Show me product managers"</li>
            <li>• Combine criteria: "Find software engineers at startups"</li>
            <li>• Use natural language: "I'm looking for people in marketing"</li>
          </ul>
        </div>
      </div>
    </PNITLayout>
  );
}
