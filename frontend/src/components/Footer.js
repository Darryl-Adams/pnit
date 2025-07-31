export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-base leading-relaxed py-8 font-sans tracking-normal">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
          <a href="/privacy/" className="text-link">Privacy Policy</a>
          <span>Access Insights, LLC</span>
          <a href="/accessibility/" className="text-link">Accessibility Statement</a>
        </p>
      </div>
    </footer>
  );
}
