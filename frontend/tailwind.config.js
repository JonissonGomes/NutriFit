/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
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
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': '0.6875rem',    // 11px (antes 12px)
        'sm': '0.8125rem',    // 13px (antes 14px)
        'base': '0.875rem',   // 14px (antes 16px)
        'lg': '0.9375rem',    // 15px (antes 18px)
        'xl': '1.0625rem',    // 17px (antes 20px)
        '2xl': '1.25rem',     // 20px (antes 24px)
        '3xl': '1.5rem',      // 24px (antes 30px)
        '4xl': '1.875rem',    // 30px (antes 36px)
        '5xl': '2.25rem',     // 36px (antes 48px)
        '6xl': '2.75rem',     // 44px (antes 60px)
        '7xl': '3.25rem',     // 52px (antes 72px)
        '8xl': '4rem',        // 64px (antes 96px)
        '9xl': '5rem',        // 80px (antes 128px)
      },
    },
  },
  plugins: [],
}

