/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'star': 'star-pulse 2s infinite ease-in-out',
      },
      keyframes: {
        'star-pulse': {
          '0%, 100% { transform: scale(1); opacity: 1; }',
          '50% { transform: scale(1.2); opacity: 0.8; filter: drop-shadow(0 0 5px rgba(236, 72, 153, 0.6)); }',
        }
      }
    },
  },
  plugins: [],
}