import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'cb-black': '#0a0a0a',
        'cb-charcoal': '#1a1a1a',
        'cb-dark': '#2a2a2a',
        'cb-steel': '#4a4a4a',
        'cb-gray': '#8a8a8a',
        'cb-bone': '#f5f5f5',
        'cb-white': '#ffffff',
        'cb-crimson': '#dc143c',
        'cb-crimson-dark': '#8b0a1a',
        'cb-amber': '#d4a574',
        'cb-electric': '#00ff00',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['IBM Plex Mono', ...defaultTheme.fontFamily.mono],
        display: ['Space Grotesk', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
      },
      boxShadow: {
        'cb-sm': '0 1px 2px rgba(255, 255, 255, 0.05)',
        'cb-md': '0 4px 6px rgba(255, 255, 255, 0.1)',
        'cb-lg': '0 10px 15px rgba(255, 255, 255, 0.1)',
        'cb-crimson': '0 0 20px rgba(220, 20, 60, 0.3)',
      },
      backgroundImage: {
        'gradient-grain':
          'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' result=\'noise\' /%3E%3C/filter%3E%3Crect width=\'400\' height=\'400\' fill=\'%23000\' filter=\'url(%23noiseFilter)\' opacity=\'0.02\'/%3E%3C/svg%3E")',
      },
    },
  },
  plugins: [],
};

export default config;
