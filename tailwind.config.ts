import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        ui: ['Sora', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        bg: {
          0: '#0a0a0f',
          1: '#0f0f18',
          2: '#14141f',
          3: '#1a1a28',
          4: '#1f1f30',
        },
        accent: {
          DEFAULT: '#7c6af7',
          2: '#a78bfa',
        },
        teal: '#2dd4bf',
        border: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          hover: 'rgba(255,255,255,0.12)',
        },
      },
      animation: {
        'typing-pulse': 'typingPulse 1.4s ease-in-out infinite',
        'msg-in': 'msgIn 0.3s ease',
        'think-glow': 'thinkGlow 2s ease-in-out infinite',
      },
      keyframes: {
        typingPulse: {
          '0%, 80%, 100%': { opacity: '0.2', transform: 'scale(0.8)' },
          '40%': { opacity: '1', transform: 'scale(1)' },
        },
        msgIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        thinkGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(124,106,247,0.15)' },
          '50%': { boxShadow: '0 0 25px rgba(124,106,247,0.25), 0 0 50px rgba(45,212,191,0.05)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
