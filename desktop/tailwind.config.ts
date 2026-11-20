import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#080A0B',
        sidebar: '#0D1114',
        panel: '#11171B',
        'panel-2': '#161E24',
        border: '#252D33',
        text: '#F5F5F5',
        muted: '#A7ADB4',
        faint: '#747D85',
        accent: '#FF702B',
        danger: '#FF4D4F',
        safe: '#3DDC97',
        warning: '#FFB020',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans Variable', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono Variable', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config