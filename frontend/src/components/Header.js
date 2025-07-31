import React, { useState } from "react";

function LogoSwitcher() {
  const [isDark, setIsDark] = React.useState(
    typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    // Set initial state in case of late load
    setIsDark(document.documentElement.classList.contains('dark'));

    return () => observer.disconnect();
  }, []);

  return (
    <img
      src={isDark
        ? '/assets/images/access_insights_logo_inverted.svg'
        : '/assets/images/access_insights_logo.svg'}
      alt="Access Insights Logo"
      aria-hidden="true"
      className="h-16 w-auto"
      width={320}
      height={64}
      loading="eager"
      decoding="async"
      fetchpriority="high"
    />
  );
}

export default function Header({ showLogo = true }) {
  // State for mobile menu and services dropdown
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm print:bg-white font-sans shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {showLogo ? (
          <div className="flex-shrink-0">
            <LogoSwitcher />
          </div>
        ) : (
          <div className="flex-shrink-0 w-0 md:w-[320px]"></div>
        )}



        {/* Hamburger menu for mobile */}
        <button
          className="menu-toggle md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-900"
          aria-label="Open main menu"
          aria-expanded={menuOpen}
          aria-controls="main-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="hamburger relative w-6 h-4 flex flex-col justify-between">
            <span className="hamburger-bar block w-6 h-0.5 bg-gray-900 dark:bg-white transition-transform duration-200"></span>
            <span className="hamburger-bar block w-6 h-0.5 bg-gray-900 dark:bg-white transition-transform duration-200"></span>
            <span className="hamburger-bar block w-6 h-0.5 bg-gray-900 dark:bg-white transition-transform duration-200"></span>
          </span>
        </button>

        {/* Main navigation */}
        <nav
          id="main-nav"
          className={
            `fixed md:static inset-y-0 right-0 w-64 md:w-auto bg-white dark:bg-gray-900 shadow-lg md:shadow-none
            transform ${menuOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-40
            md:flex md:items-center`
          }
          aria-label="Main"
          aria-hidden={!menuOpen && typeof window !== 'undefined' && window.innerWidth < 768}
        >
          <div className="h-full md:h-auto overflow-y-auto md:overflow-visible flex flex-col md:flex-row md:items-center p-4 md:p-0">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
              {showLogo && (
                <a href="/" className="nav-link p-2 text-base font-medium text-gray-900 dark:text-white hover:text-primary dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-900 rounded-md">Home</a>
              )}
              <div className="relative">
                <button
                  className="nav-link inline-flex items-center p-2 text-base font-medium text-gray-900 dark:text-white hover:text-primary dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-900 rounded-md"
                  id="services-menu-button"
                  aria-expanded={servicesOpen}
                  aria-controls="services-menu"
                  aria-haspopup="true"
                  aria-label="Services"
                  onClick={() => setServicesOpen((open) => !open)}
                  onBlur={() => setServicesOpen(false)}
                >
                  <span>Services</span>
                  <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.23 8.27a.75.75 0 01.02-1.06z" />
                  </svg>
                </button>
                {/* Dropdown menu */}
                <div
                  id="services-menu"
                  className={`static md:absolute left-0 md:left-auto z-10 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${servicesOpen ? 'opacity-100 visible' : 'opacity-0 invisible'} transition-all duration-200`}
                  aria-hidden={!servicesOpen}
                >
                  <div className="py-1" role="menu">
                    <a href="/consulting/" className="menu-item block w-full text-left px-4 py-2 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 focus:text-primary dark:focus:text-blue-400 first:rounded-t-lg" role="menuitem" tabIndex={-1}>Consulting</a>
                    <a href="/ai-accessibility/" className="menu-item block w-full text-left px-4 py-2 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 focus:text-primary dark:focus:text-blue-400" role="menuitem" tabIndex={-1}>AI & Accessibility</a>
                    <a href="/standards/" className="menu-item block w-full text-left px-4 py-2 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 focus:text-primary dark:focus:text-blue-400 last:rounded-b-lg" role="menuitem" tabIndex={-1}>Standards & Advocacy</a>
                  </div>
                </div>
              </div>
              <a href="/research/" className="nav-link p-2 text-base font-medium text-gray-900 dark:text-white hover:text-primary dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-900 rounded-md">Research</a>
              <a href="/about/" className="nav-link p-2 text-base font-medium text-gray-900 dark:text-white hover:text-primary dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-900 rounded-md">About</a>
              <a href="/contact/" className="nav-link p-2 text-base font-medium text-gray-900 dark:text-white hover:text-primary dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-900 rounded-md">Contact</a>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
