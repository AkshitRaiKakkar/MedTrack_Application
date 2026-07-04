/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--bg-surface)",
        card: "var(--bg-card)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        subtle: "var(--border-subtle)",
        strong: "var(--border-strong)",
        hover: "var(--bg-hover)",
      }
    },
  },
  plugins: [],
};
