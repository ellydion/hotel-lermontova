/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './lib/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 700: '#2c3b5e', 800: '#25324f', 900: '#1f2a44', 950: '#161e31' },
        gold: { 50: '#fbf7ee', 100: '#f4ead3', 200: '#e9d6a8', 400: '#c9a24a', 500: '#b08a35', 600: '#8f6f28' },
        hotel: { 600: '#475569', 700: '#334155', 900: '#0f172a' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        soft: '0 1px 2px rgba(31,42,68,0.04), 0 4px 16px -4px rgba(31,42,68,0.08)',
      },
    },
  },
  plugins: [],
};
