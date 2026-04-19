import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Institutional color system
        primary: {
          50: 'hsl(217, 91%, 97%)',
          100: 'hsl(217, 91%, 92%)',
          200: 'hsl(217, 91%, 85%)',
          300: 'hsl(217, 91%, 75%)',
          400: 'hsl(217, 91%, 65%)',
          500: 'hsl(217, 91%, 55%)',
          600: 'hsl(217, 91%, 45%)',
          700: 'hsl(217, 70%, 35%)',
          800: 'hsl(217, 60%, 25%)',
          900: 'hsl(217, 50%, 15%)',
        },
        accent: {
          50: 'hsl(45, 100%, 96%)',
          100: 'hsl(45, 100%, 90%)',
          200: 'hsl(45, 100%, 80%)',
          300: 'hsl(45, 100%, 70%)',
          400: 'hsl(45, 100%, 60%)',
          500: 'hsl(45, 100%, 50%)',
          600: 'hsl(45, 90%, 45%)',
        },
        background: 'hsl(0, 0%, 100%)',
        foreground: 'hsl(217, 20%, 15%)',
        card: {
          DEFAULT: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(217, 20%, 15%)',
        },
        muted: {
          DEFAULT: 'hsl(217, 20%, 96%)',
          foreground: 'hsl(217, 15%, 45%)',
        },
        border: 'hsl(217, 20%, 90%)',
        input: 'hsl(217, 20%, 90%)',
        ring: 'hsl(217, 91%, 55%)',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'strong': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
