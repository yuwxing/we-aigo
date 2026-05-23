/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6ffff',
          100: '#b3ffff',
          200: '#80ffff',
          300: '#4dffff',
          400: '#1af0ff',
          500: '#00f0ff',
          600: '#00ccd9',
          700: '#00a3ad',
          800: '#007a82',
          900: '#005257',
        },
        secondary: {
          50: '#ffe6ff',
          100: '#ffb3ff',
          200: '#ff80ff',
          300: '#ff4dff',
          400: '#ff1aff',
          500: '#ff00ff',
          600: '#cc00cc',
          700: '#990099',
          800: '#660066',
          900: '#330033',
        },
        accent: {
          50: '#e6fff0',
          100: '#b3ffd1',
          200: '#80ffb3',
          300: '#4dff94',
          400: '#1aff75',
          500: '#00ff88',
          600: '#00cc6e',
          700: '#009953',
          800: '#006638',
          900: '#00331c',
        },
        dark: {
          50: '#2a2a3a',
          100: '#1f1f2e',
          200: '#151522',
          300: '#0e0e1a',
          400: '#0a0a1a',
          500: '#070712',
          600: '#05050d',
          700: '#030308',
          800: '#010104',
          900: '#000000',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient': 'gradient 3s ease infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'neon-pulse': 'neon-pulse 3s ease-in-out infinite',
        'scan-line': 'scanLine 4s linear infinite',
        'border-run': 'borderRun 4s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'neon-pulse': {
          '0%, 100%': { opacity: '0.7', filter: 'brightness(1)' },
          '50%': { opacity: '1', filter: 'brightness(1.3)' },
        },
        scanLine: {
          '0%': { top: '-10%' },
          '100%': { top: '110%' },
        },
        borderRun: {
          '0%': { borderColor: 'rgba(0, 240, 255, 0.3)' },
          '25%': { borderColor: 'rgba(255, 0, 255, 0.3)' },
          '50%': { borderColor: 'rgba(77, 77, 255, 0.3)' },
          '75%': { borderColor: 'rgba(0, 255, 136, 0.3)' },
          '100%': { borderColor: 'rgba(0, 240, 255, 0.3)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'neon-gradient': 'linear-gradient(135deg, #00f0ff, #ff00ff)',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(0, 240, 255, 0.3)',
        'neon-lg': '0 0 40px rgba(0, 240, 255, 0.4)',
        'neon-magenta': '0 0 20px rgba(255, 0, 255, 0.3)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}
