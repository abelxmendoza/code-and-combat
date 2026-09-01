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
        // Surfaces, darkest to lightest.
        'cb-black': '#050505', // page background
        'cb-charcoal': '#09090b', // raised surface (cards/panels)
        'cb-dark': '#101014', // secondary surface (inputs, nested panels)
        'cb-steel': '#202027', // borders
        // Text, muted to brightest.
        'cb-muted': '#71717a',
        'cb-gray': '#a1a1aa',
        'cb-bone': '#f4f4f5',
        'cb-white': '#ffffff',
        // Purple accent system — restrained, used as edge lighting and
        // active/focus states, not fills. See styles/globals.css glow utilities.
        'cb-purple': '#6d28d9', // primary accent
        'cb-purple-deep': '#2e1065', // pressed/hover-dark, deep blacklight purple
        'cb-electric': '#8b5cf6', // bright ultraviolet — hover glow, active/confirmed states
        'cb-void': '#170b26', // atmospheric gradients only, never text/borders
        'cb-cyan': '#22d3ee', // code, technology, and interactive highlights
        'cb-cyan-deep': '#083344', // subtle cyan-tinted surfaces
        'cb-gold': '#f59e0b', // combat and momentum highlights
        // Reserved semantic colors — kept separate from the brand accent so
        // errors/warnings never get lost in the purple glow.
        'cb-danger': '#ef4444',
        'cb-amber': '#d4a574',
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
        display: ['var(--font-display)', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '3px',
        md: '4px',
        lg: '6px',
      },
      boxShadow: {
        'cb-sm': '0 1px 2px rgba(0, 0, 0, 0.4)',
        'cb-md': '0 4px 12px rgba(0, 0, 0, 0.5)',
        'cb-lg': '0 10px 30px rgba(0, 0, 0, 0.6)',
        'cb-glow-sm': '0 0 0 1px rgba(139, 92, 246, 0.4), 0 0 12px rgba(139, 92, 246, 0.15)',
        'cb-glow-md': '0 0 0 1px rgba(139, 92, 246, 0.5), 0 0 24px rgba(139, 92, 246, 0.25)',
        'cb-glow-cyan': '0 0 0 1px rgba(34, 211, 238, 0.35), 0 10px 30px rgba(34, 211, 238, 0.12)',
        'cb-glow-gold': '0 0 0 1px rgba(245, 158, 11, 0.3), 0 10px 30px rgba(245, 158, 11, 0.1)',
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
