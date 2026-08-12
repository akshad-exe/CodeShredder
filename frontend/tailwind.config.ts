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
        background: '#07090D',
        sidebar: '#0B0D12',
        panel: '#101217',
        'panel-2': '#151922',
        border: '#262B36',
        text: '#F5F7FA',
        muted: '#8B93A7',
        faint: '#596070',
        accent: '#168BFF',
        danger: '#FF4D4F',
        safe: '#3DDC97',
        warning: '#FFB020',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config