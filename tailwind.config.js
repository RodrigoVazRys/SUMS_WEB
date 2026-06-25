/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans', 'sans-serif'],
      },
      colors: {
        primary: '#006657',
        'primary-dark': '#004f42',
        'primary-light': '#00856e',
        gold: '#BC955C',
        'gold-light': '#d4b07a',
        maroon: '#691C32',
        'neutral-bg': '#F3F4F6',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'pulse-border': 'pulseBorder 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseBorder: {
          '0%, 100%': { borderColor: '#f59e0b', boxShadow: '0 0 0 0 rgba(245,158,11,0.3)' },
          '50%': { borderColor: '#d97706', boxShadow: '0 0 0 4px rgba(245,158,11,0.1)' },
        },
      },
    },
  },
  plugins: [],
}
