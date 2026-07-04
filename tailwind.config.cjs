/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        elite: {
          50: '#f5f9ff',
          100: '#e8f2ff',
          200: '#cfe4ff',
          300: '#a8ceff',
          400: '#6eaef7',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        elite: '0 10px 40px -12px rgba(37, 99, 235, 0.18)',
        card: '0 4px 24px -6px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
