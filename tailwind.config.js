/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    boxShadow: {
      none: 'none',
    },
    extend: {
      fontSize: {
        'caption': ['10px', { lineHeight: '1.4' }],
        'label': ['11px', { lineHeight: '1.4' }],
        'xs': ['12px', { lineHeight: '1.5' }],
        'sm': ['13px', { lineHeight: '1.5' }],
        'base': ['14px', { lineHeight: '1.6' }],
        'lg': ['15px', { lineHeight: '1.6' }],
        'xl': ['16px', { lineHeight: '1.6' }],
        '2xl': ['18px', { lineHeight: '1.5' }],
        '3xl': ['20px', { lineHeight: '1.4' }],
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      colors: {
        'primary': {
          '50': '#f5f1e8',
          '100': '#ede6da',
          '200': '#e8dcc8',
          '300': '#dccfb2',
          '400': '#c9b89a',
          '500': '#a68860',
          '600': '#8b7355',
          '700': '#6b5344',
          '800': '#4a3728',
          '900': '#2d1f12',
        },
        'success': {
          '50': '#f5f1e8',
          '600': '#8b7355',
          '700': '#6b5344',
        },
        'danger': {
          '50': '#f5f1e8',
          '600': '#8b7355',
          '700': '#6b5344',
        },
        'warning': {
          '50': '#f5f1e8',
          '600': '#a68860',
          '700': '#8b7355',
        },
      },
      keyframes: {
        'slide-in-left': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
