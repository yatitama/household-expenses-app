/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      fontSize: {
        caption: ['11px', { lineHeight: '1.4' }],
        label: ['12px', { lineHeight: '1.4' }],
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.5' }],
        base: ['15px', { lineHeight: '1.6' }],
        lg: ['16px', { lineHeight: '1.6' }],
        xl: ['17px', { lineHeight: '1.6' }],
        '2xl': ['19px', { lineHeight: '1.5' }],
        '3xl': ['21px', { lineHeight: '1.4' }],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      colors: {
        primary: {
          '50': '#f9fafb',
          '100': '#f3f4f6',
          '200': '#e5e7eb',
          '300': '#d1d5db',
          '400': '#9ca3af',
          '500': '#6b7280',
          '600': '#4b5563',
          '700': '#374151',
          '800': '#1f2937',
          '900': '#111827',
        },
        success: {
          '50': '#f9fafb',
          '600': '#374151',
          '700': '#1f2937',
        },
        danger: {
          '50': '#f9fafb',
          '600': '#374151',
          '700': '#1f2937',
        },
        warning: {
          '50': '#f9fafb',
          '600': '#6b7280',
          '700': '#4b5563',
        },
      },
    },
  },
  plugins: [],
};
