/** @type {import('tailwindcss').Config} */
export default {
    content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        colors: {
          // Swiss flag colors
          swiss: {
            red: '#FF0000',
            white: '#FFFFFF',
          },
          // Additional custom colors if needed
          primary: {
            DEFAULT: '#2563EB', // blue-600
            light: '#3B82F6',  // blue-500
            dark: '#1D4ED8',   // blue-700
          },
        },
        fontFamily: {
          sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui'],
        },
        spacing: {
          '0': '0',
          '1': '0.25rem',
          '2': '0.5rem',
          '3': '0.75rem',
          '4': '1rem',
          '5': '1.25rem',
          '6': '1.5rem',
          '8': '2rem',
          '10': '2.5rem',
          '12': '3rem',
          '16': '4rem',
          '20': '5rem',
          '24': '6rem',
          '32': '8rem',
          '40': '10rem',
          '48': '12rem',
          '56': '14rem',
          '64': '16rem',
        },
        borderRadius: {
          'none': '0',
          'sm': '0.125rem',
          DEFAULT: '0.25rem',
          'md': '0.375rem',
          'lg': '0.5rem',
          'full': '9999px',
        },
        boxShadow: {
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
      },
    },
    plugins: [],
    corePlugins: {
      // 명시적으로 필요한 코어 플러그인 활성화
      margin: true,
      padding: true,
      height: true,
      width: true,
      display: true,
      flexDirection: true,
      alignItems: true,
      justifyContent: true,
      gap: true,
      borderRadius: true,
      backgroundColor: true,
      textColor: true,
      boxShadow: true,
      fontSize: true,
      fontWeight: true,
    }
  }