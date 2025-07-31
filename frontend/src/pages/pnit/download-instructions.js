import Head from 'next/head';
import PNITLayout from '../../components/PNITLayout';

export default function LinkedInInstructions() {
  return (
    <>
      <Head>
        <title>Instructions: How to Download Your LinkedIn Connection Data</title>
      </Head>
      <main className="max-w-3xl mx-auto py-12 px-4" id="main-content">
        <header>
          <h1 className="text-2xl font-bold mb-4" tabIndex={0}>Instructions: How to Download Your LinkedIn Connection Data</h1>
        </header>
        <p className="mb-6 text-lg">To use the Professional Network Intelligence Tool (PNIT), follow these steps to download your LinkedIn connection data:</p>
        <nav aria-label="Page steps" className="mb-8">
          <ol className="list-decimal list-inside space-y-6" aria-label="Step-by-step instructions">
            <li>
              <strong>Go to LinkedIn’s Data Export Page</strong><br />
              Visit:
              <div>
                <a href="https://www.linkedin.com/settings/data-export-page" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-400" aria-label="Open LinkedIn Data Export Page in a new tab">
                  https://www.linkedin.com/settings/data-export-page
                </a>
                <span className="sr-only">(opens in a new tab)</span>
              </div>
              <em>You may be prompted to sign in.</em>
            </li>
            <li>
              <strong>Choose the “Larger data archive” Option</strong><br />
              Under “Download larger data archive”, select:
              <div className="inline-block bg-gray-100 rounded px-2 py-1 my-1 font-mono text-sm" aria-label="The works option">✔️ The works (includes your connections)</div>
              <div>This is the only way LinkedIn currently includes your connection list.</div>
            </li>
            <li>
              <strong>Click “Request archive” and Enter Your Password</strong><br />
              Click the blue <span className="inline-block bg-blue-100 rounded px-2 py-1 font-mono text-sm">Request archive</span> button. LinkedIn will ask you to confirm your password for security reasons.
            </li>
            <li>
              <strong>Wait for LinkedIn’s Email</strong><br />
              You’ll receive an email within 10–20 minutes titled:
              <div className="inline-block bg-gray-100 rounded px-2 py-1 my-1 font-mono text-sm">“Your LinkedIn data archive is ready”</div>
              Click the download link in that message.
            </li>
            <li>
              <strong>Unzip the File and Find <code>Connections.csv</code></strong><br />
              Once you download the .zip file:
              <ul className="list-disc list-inside ml-6 mt-2 text-base">
                <li>Extract it to a folder.</li>
                <li>Inside, locate this file:
                  <div className="inline-block bg-gray-100 rounded px-2 py-1 my-1 font-mono text-sm">Connections.csv</div>
                  <span className="block mt-1">This file contains your full connection list with first name, last name, company, job title, and profile URL.</span>
                </li>
              </ul>
            </li>
            <li>
              <strong>Upload <code>Connections.csv</code> to the App</strong><br />
              Return to PNIT and upload the file to get started.
            </li>
          </ol>
        </nav>
        <section aria-labelledby="notes-heading" className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <h2 id="notes-heading" className="font-semibold text-lg mb-2">Note</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Email addresses are often missing due to LinkedIn privacy policies.</li>
            <li>The rest of the connection metadata (name, title, company, profile URL) is included and sufficient for most PNIT queries.</li>
          </ul>
        </section>
      </main>
    </>
  );
}

