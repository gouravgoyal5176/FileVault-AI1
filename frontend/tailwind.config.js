/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mind: {
          dark: '#070A12',
          surface: '#0E1424',
          'surface-hover': '#151D32',
          card: '#121A2D',
          border: 'rgba(99, 102, 241, 0.15)',
          primary: '#6366F1',
          accent: '#10B981',
          violet: '#8B5CF6',
          teal: '#14B8A6',
          rose: '#F43F5E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      backgroundImage: {
        'hero-radial': 'radial-gradient(ellipse at 50% -20%, rgba(99, 102, 241, 0.18), rgba(20, 184, 166, 0.08) 45%, transparent 80%)',
        'card-glow': 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.12), transparent 70%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
