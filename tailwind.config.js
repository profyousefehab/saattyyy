/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF5F0',
          100: '#DCEBE1',
          200: '#B7D6C3',
          300: '#8DBFA0',
          400: '#5FA47D',
          500: '#3F8A62',
          600: '#2D6F4E',
          700: '#245A40',
        },
        ink: {
          DEFAULT: '#1F2A24',
          soft: '#46524B',
          muted: '#66716A',
        },
        canvas: {
          DEFAULT: '#FBFAF6',
          deep: '#F3F1EA',
        },
        surface: '#FFFFFF',
        line: {
          DEFAULT: '#E2DED3',
          soft: '#EEECE4',
        },
        error: {
          50: '#FDF2F1',
          100: '#FADBD8',
          700: '#A3322A',
        },
        warning: {
          50: '#FBF5E6',
          100: '#F3E4B8',
          700: '#7A5209',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(31, 42, 36, 0.04), 0 4px 16px rgba(31, 42, 36, 0.05)',
        sheet: '0 -8px 32px rgba(31, 42, 36, 0.14)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'sheet-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out both',
        'sheet-up': 'sheet-up 280ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'toast-in': 'toast-in 220ms ease-out both',
      },
    },
  },
  plugins: [],
};
