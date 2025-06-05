/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette principale
        primary: {
          DEFAULT: '#7C3AED', // Violet principal
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          950: '#2E1065',
        },
        // Palette secondaire (rose)
        secondary: {
          DEFAULT: '#EC4899',
          50: '#FDF2F8',
          100: '#FCE7F3',
          200: '#FBCFE8',
          300: '#F9A8D4',
          400: '#F472B6',
          500: '#EC4899',
          600: '#DB2777',
          700: '#BE185D',
          800: '#9D174D',
          900: '#831843',
          950: '#500724',
        },
        // Palette tertiaire (bleu)
        tertiary: {
          DEFAULT: '#3B82F6',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        // Couleurs pour le fond et les surfaces
        background: {
          DEFAULT: '#0F0F1A',
          lighter: '#1A1A2F',
          card: '#1E1E36',
          elevated: '#25253D',
        },
        // Couleurs pour les effets néon
        neon: {
          purple: '#9333EA',
          pink: '#EC4899',
          blue: '#3B82F6',
          cyan: '#06B6D4',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-roboto-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(to right, #7C3AED, #EC4899)',
        'gradient-secondary': 'linear-gradient(to right, #3B82F6, #06B6D4)',
        'gradient-tertiary': 'linear-gradient(to right, #EC4899, #3B82F6)',
        'gradient-dark': 'linear-gradient(to bottom, #0F0F1A, #1A1A2F)',
      },
      boxShadow: {
        'neon-purple': '0 0 5px #9333EA, 0 0 20px rgba(147, 51, 234, 0.3)',
        'neon-pink': '0 0 5px #EC4899, 0 0 20px rgba(236, 72, 153, 0.3)',
        'neon-blue': '0 0 5px #3B82F6, 0 0 20px rgba(59, 130, 246, 0.3)',
        'neon-cyan': '0 0 5px #06B6D4, 0 0 20px rgba(6, 182, 212, 0.3)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'gradient': 'gradient 8s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(147, 51, 234, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(147, 51, 234, 0.8), 0 0 30px rgba(147, 51, 234, 0.6)' },
        },
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(8px)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function({ addUtilities }) {
      const newUtilities = {
        '.glassmorphism': {
          background: 'rgba(255, 255, 255, 0.05)',
          'backdrop-filter': 'blur(16px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
          'box-shadow': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        },
        '.glassmorphism-dark': {
          background: 'rgba(15, 15, 26, 0.7)',
          'backdrop-filter': 'blur(16px)',
          'border': '1px solid rgba(255, 255, 255, 0.05)',
          'box-shadow': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        },
        '.text-gradient-primary': {
          'background-image': 'linear-gradient(to right, #7C3AED, #EC4899)',
          'color': 'transparent',
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
        },
        '.text-gradient-secondary': {
          'background-image': 'linear-gradient(to right, #3B82F6, #06B6D4)',
          'color': 'transparent',
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
        },
        '.border-gradient': {
          'border': 'double 1px transparent',
          'background-image': 'linear-gradient(#1A1A2F, #1A1A2F), linear-gradient(to right, #7C3AED, #EC4899)',
          'background-origin': 'border-box',
          'background-clip': 'padding-box, border-box',
        },
        '.animate-background': {
          'background-size': '400% 400%',
          'animation': 'gradient 8s ease infinite',
        },
      };
      
      addUtilities(newUtilities);
    },
  ],
};
