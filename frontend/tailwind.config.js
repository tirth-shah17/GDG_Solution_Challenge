/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Instrument Serif"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        background: {
          DEFAULT: '#0B0F19',
        },
        primary: {
          DEFAULT: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#A5B4FC',
          strong: '#6366F1'
        },
        secondary: {
          DEFAULT: '#9CA3AF',
        }
      },
      animation: {
        'fade-rise': 'fade-rise 0.8s ease-out forwards',
        'fade-rise-delay': 'fade-rise 0.8s ease-out 0.2s forwards',
        'fade-rise-delay-2': 'fade-rise 0.8s ease-out 0.4s forwards',
      },
      keyframes: {
        'fade-rise': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
