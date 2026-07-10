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
          red: '#b3231c',
          brass: '#d4a24c',
          text: '#ece6d6',
          textSecondary: '#8a8378',
        },
      },
      fontFamily: {
        typewriter: ['"Special Elite"', 'monospace'],
        case: ['Lora', 'serif'],
      }
    },
  },
  plugins: [],
};
