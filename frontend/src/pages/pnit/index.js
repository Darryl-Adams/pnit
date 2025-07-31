import Head from 'next/head';
import PNITLayout from '../../components/PNITLayout';

export default function PNITLanding() {
  return (
    <PNITLayout>
      <Head>
        <title>Professional Network Intelligence Tool (PNIT)</title>
      </Head>
      <div className="max-w-3xl mx-auto py-12 px-4" id="main-content">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-normal mb-2" tabIndex={0}>Professional Network Intelligence Tool</h1>
          <p className="text-xl text-gray-700">A conversational tool to surface meaningful insights from your LinkedIn connections.</p>
        </header>

        <section aria-labelledby="what-it-does" className="mb-8">
          <h2 id="what-it-does" className="text-2xl font-semibold mb-2">What It Does</h2>
          <p className="text-lg text-gray-800">The Professional Network Intelligence Tool (PNIT) helps you explore and query your LinkedIn network using plain language. Whether you’re identifying potential collaborators, scanning for hiring leads, or just better understanding your network — PNIT makes it easy to get fast, structured answers from your existing connections.</p>
        </section>

        <section aria-labelledby="get-started" className="mb-8">
          <h2 id="get-started" className="text-2xl font-semibold mb-2">Get Started in 3 Simple Steps</h2>
          <ol className="list-decimal list-inside space-y-3 text-lg">
            <li>
              <strong>Download your LinkedIn connection data:</strong> <a href="/pnit/download-instructions" className="text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-400">How to download your data</a>
            </li>
            <li>
              <strong>Upload your <code>Connections.csv</code> file:</strong> We’ll securely store and process your network data locally — no one else can access it.
            </li>
            <li>
              <strong>Start asking questions:</strong> For example:
              <ul className="list-disc list-inside ml-6 mt-2 text-base">
                <li>Who do I know in accessibility at Microsoft?</li>
                <li>Which of my contacts are product managers in Boston?</li>
              </ul>
              PNIT will respond conversationally, like an assistant who knows your network inside and out.
            </li>
          </ol>
        </section>

        <section aria-labelledby="privacy" className="mb-8">
          <h2 id="privacy" className="text-2xl font-semibold mb-2">Your Data Stays Private</h2>
          <p className="text-lg text-gray-800">All processing happens in a secure, private environment. No data is shared or sent to LinkedIn or third parties.</p>
        </section>

        <section aria-labelledby="why-matters" className="mb-8">
          <h2 id="why-matters" className="text-2xl font-semibold mb-2">Why This Matters</h2>
          <p className="text-lg text-gray-800">You’ve spent years building a network — this tool helps you tap into it with context and clarity.</p>
        </section>

        <div className="mt-10 flex justify-center">
          <a href="/pnit/upload" className="inline-block bg-blue-700 text-white text-lg font-semibold px-8 py-4 rounded shadow hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors" role="button" aria-label="Upload your CSV to begin">
            Upload Your CSV to Begin
          </a>
        </div>
      </div>
    </PNITLayout>
  );
}
