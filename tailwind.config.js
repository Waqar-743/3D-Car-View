/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Luxury dark theme
        charcoal: {
          DEFAULT: '#1a1a1a',
          50: '#2a2a2a',
          100: '#252525',
          200: '#202020',
          300: '#1a1a1a',
          400: '#151515',
          500: '#101010',
          600: '#0a0a0a',
        },
        gold: {
          DEFAULT: '#d4af37',
          50: '#fdf8e8',
          100: '#f9edc4',
          200: '#f2dc8a',
          300: '#e8c84f',
          400: '#d4af37',
          500: '#b8942c',
          600: '#9a7a24',
          700: '#7c601c',
          800: '#5e4814',
        },
        platinum: {
          DEFAULT: '#c0c0c0',
          50: '#f5f5f5',
          100: '#e8e8e8',
          200: '#d4d4d4',
          300: '#c0c0c0',
          400: '#a8a8a8',
          500: '#909090',
        },
        'light-gray': '#e0e0e0',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(212, 175, 55, 0.3)',
        'gold-glow-lg': '0 0 40px rgba(212, 175, 55, 0.4)',
        'inner-dark': 'inset 0 2px 10px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(212, 175, 55, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.6)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
}
