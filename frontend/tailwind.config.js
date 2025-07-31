/** @type {import('tailwindcss').Config} */
module.exports = {
  safelist: [
    "hidden",
    "md:hidden",
    "menu-toggle",
    "hamburger",
    "hamburger-bar",
    "bg-gray-900",
    "bg-white",
    "dark:bg-white",
    "dark:bg-gray-900",
    "dark:text-white",
    "dark:text-blue-400",
    "text-primary",
    "text-blue-700",
    "text-blue-300",
    "text-link",
  ],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        primary: "#0052a5",
        secondary: "#006459",
      },
      spacing: {
        header: "var(--header-height)",
      },
      transitionDuration: {
        menu: "var(--transition-speed)",
      },
    },
  },
  plugins: [],
};
