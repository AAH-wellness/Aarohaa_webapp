/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          50: '#f0f9f4',
          100: '#dcf4e6',
          200: '#bce8d0',
          300: '#8fd5b0',
          400: '#5bb88a',
          500: '#389d6f',
          600: '#2a7f5a',
          700: '#24664a',
          800: '#0e4826',
          900: '#0a3620',
        },
        gold: {
          400: '#FFD700',
          500: '#FFC107',
          600: '#FFB300',
        },
        beige: {
          200: '#d0b6a8',
          300: '#c4a896',
          400: '#b89a88',
        },
      },
    },
  },
  plugins: [],
}

