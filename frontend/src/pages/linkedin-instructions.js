import Head from 'next/head';

export default function LinkedInInstructions() {
  return (
    <>
      <Head>
        <title>How to Download Your LinkedIn Connection Data (CSV)</title>
      </Head>
      <main className="max-w-3xl mx-auto py-12 px-4" id="main-content">
        <header>
          <h1 className="text-2xl font-bold mb-4" tabIndex={0}>📄 How to Download Your LinkedIn Connection Data (CSV)</h1>
        </header>
        <p className="mb-6 text-lg">To use your LinkedIn connections in this app, you'll need to download your data from LinkedIn. This takes just a few minutes.</p>
        <nav aria-label="Page steps" className="mb-8">
          <ol className="list-decimal list-inside space-y-6" aria-label="Step-by-step instructions">
            <li>
              <strong>Go to the LinkedIn Data Export Page</strong><br />
              <a href="https://www.linkedin.com/settings/data-export-page" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-400" aria-label="Open LinkedIn Data Export Page in a new tab">
                https://www.linkedin.com/settings/data-export-page
              </a>
              <span className="sr-only">(opens in a new tab)</span>
              <br /><em>(You may be prompted to log in.)</em>
            </li>
            <li>
              <strong>Choose "Connections" as the Data Type</strong><br />
              Under “Download your data”, select:<br />
              <span className="inline-block bg-gray-100 rounded px-2 py-1 my-1 font-mono text-sm" aria-label="Connections option">✔️ Connections</span><br />
              <span>Make sure only Connections is checked.</span>
            </li>
            <li>
              <strong>Click the <span className="inline-block bg-blue-100 rounded px-2 py-1 font-mono text-sm">Request archive</span> Button</strong><br />
              LinkedIn may prompt you to re-enter your password for security.
            </li>
            <li>
              <strong>Wait for Email Notification</strong><br />
              You’ll receive an email (usually within a few minutes) with the subject:<br />
              <span className="inline-block bg-gray-100 rounded px-2 py-1 font-mono text-sm">“Your LinkedIn data archive is ready”</span><br />
              Click the link in that email to download a .zip file.
            </li>
            <li>
              <strong>Unzip the Downloaded File</strong><br />
              After downloading, extract/unzip the file.<br />
              Inside, you’ll find a file named:<br />
              <span className="inline-block bg-gray-100 rounded px-2 py-1 font-mono text-sm">Connections.csv</span><br />
              This file contains your full connection list (name, email, company, title, profile URL, etc.).
            </li>
            <li>
              <strong>Upload the Connections.csv File to This App</strong><br />
              Now return to this app and upload the file when prompted.
            </li>
          </ol>
        </nav>
        <section aria-labelledby="notes-heading" className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <h2 id="notes-heading" className="font-semibold text-lg mb-2">⚠️ Notes</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Only first-degree connections are included.</li>
            <li>LinkedIn limits data exports to your current connection info — no messages or 2nd-degree contacts.</li>
            <li>If you don’t see emails in the CSV, it’s due to LinkedIn’s privacy settings (they may hide some fields based on user settings).</li>
          </ul>
        </section>
      </main>
    </>
  );
}
