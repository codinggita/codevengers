/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Placeholder "dark mystery" palette — refine in Phase 5 polish.
        mystery: {
          bg: '#0f0e17',
          panel: '#1a1825',
          accent: '#e63946',
          text: '#fffffe',
          muted: '#a7a9be',
        },
      },
    },
  },
  plugins: [],
};
