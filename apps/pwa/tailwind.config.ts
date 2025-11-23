import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#01579b',
          600: '#014170',
          700: '#013a5f',
          800: '#01324d',
          900: '#012a3c'
        },
        surface: {
          50: '#f5f7fa',
          100: '#e5edf9',
          200: '#cbd5e1',
          300: '#94a3b8',
          400: '#64748b',
          500: '#475569'
        },
        success: {
          50: '#e8f5e9',
          500: '#2e7d32',
          600: '#1b5e20'
        },
        error: {
          50: '#ffebee',
          500: '#d32f2f',
          600: '#c62828'
        },
        warning: {
          50: '#fff3e0',
          500: '#f57c00',
          600: '#e65100'
        }
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ]
      },
      borderRadius: {
        '4xl': '2rem'
      },
      boxShadow: {
        card: '0 10px 30px rgba(15, 23, 42, 0.08)',
        'card-hover': '0 20px 40px rgba(15, 23, 42, 0.12)',
        'nav': '0 -6px 16px rgba(15, 23, 42, 0.08)'
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem'
      },
      minHeight: {
        'screen-safe': 'calc(100vh - 4.5rem)'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class'
    })
  ]
} satisfies Config;
