/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a0a0a',
          secondary: '#141414',
          tertiary: '#1f1f1f',
          elevated: '#262626',
        },
        ink: {
          primary: '#f5f5f5',
          secondary: '#a0a0a0',
          tertiary: '#6b6b6b',
        },
        accent: {
          DEFAULT: '#00d4ff',
          hover: '#00b8e0',
        },
        cat: {
          ai: '#ff6b9d',
          tehnologije: '#00d4ff',
          mobilni: '#ffd60a',
          gedzeti: '#a78bfa',
          biznis: '#10b981',
          gaming: '#f97316',
          nauka: '#06b6d4',
        },
        line: {
          subtle: '#2a2a2a',
          DEFAULT: '#3a3a3a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        container: '1280px',
      },
      fontSize: {
        'hero': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'h1': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'h2': ['2rem', { lineHeight: '1.25' }],
        'h3': ['1.5rem', { lineHeight: '1.3' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.05em' }],
      },
    },
  },
  plugins: [],
};
