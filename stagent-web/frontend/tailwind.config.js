/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        doc: {
          bg: '#f8fafc',
          surface: '#ffffff',
          muted: '#f1f5f9',
          border: '#e2e8f0',
          text: '#0f172a',
          subtext: '#475569',
          accent: '#2563eb',
          success: '#16a34a',
          warning: '#d97706',
          danger: '#dc2626',
        },
      },
      borderRadius: {
        doc: '14px',
      },
      boxShadow: {
        doc: '0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 1px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
}
