/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        mystery: {
          bg: '#0b0a08',
          panel: '#161310',
          panelLight: '#1e1a15',
          hairline: '#3a3129',
          red: '#b3231c',
          brass: '#d4a24c',
          text: '#ece6d6',
          textSecondary: '#8a8378',
        },
      },
      fontFamily: {
        typewriter: ['"Special Elite"', 'monospace'],
        case: ['Lora', 'serif'],
      },
      keyframes: {
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        'stamp-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
        'dash-fill': {
          '0%, 100%': { opacity: '0.25' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        'stamp-pulse': 'stamp-pulse 2s ease-in-out infinite',
        'dash-fill': 'dash-fill 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
