import type {Config} from 'tailwindcss';

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4A2F1F',
        accent: '#C9A27A',
        surface: '#F3EFEA',
        dark: '#2A2A2A',
        sand: '#E8DFD1',
      },
      fontFamily: {
        display: ['"Mark Bold"', 'serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '24px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
} satisfies Config;
