/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FAFAF7', // off-white quente
          pure: '#FFFFFF',
          soft: '#F3F3EF'
        },
        ink: {
          950: '#0A0F0D',
          900: '#12181A',
          700: '#3A4441',
          500: '#6B7773',
          300: '#B7BEB9',
          200: '#D9DDD8',
          100: '#EEF0EC'
        },
        line: {
          DEFAULT: '#E4E7E4',
          soft: '#EEF0EC'
        },
        ton: {
          DEFAULT: '#00CC2C',
          deep: '#00A324',
          soft: '#E6F9EC'
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        soft: '0 1px 2px rgba(10,15,13,0.04), 0 8px 24px -12px rgba(10,15,13,0.08)',
        card: '0 1px 3px rgba(10,15,13,0.03), 0 10px 40px -18px rgba(10,15,13,0.10)'
      }
    }
  },
  plugins: []
};
