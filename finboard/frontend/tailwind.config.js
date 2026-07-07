/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-base':          'var(--bg-base)',
        'bg-surface':       'var(--bg-surface)',
        'bg-card':          'var(--bg-card)',
        'bg-elevated':      'var(--bg-elevated)',
        'border-dim':       'var(--border)',
        'border-bright':    'var(--border-bright)',
        'text-primary':     'var(--text-primary)',
        'text-secondary':   'var(--text-secondary)',
        'text-muted':       'var(--text-muted)',
        /* Primary accent — orange */
        'accent-primary':   'var(--accent-primary)',
        'accent-orange':    'var(--accent-primary)',
        /* Legacy aliases */
        'accent-purple':    'var(--accent-purple)',
        'accent-purple-br': 'var(--accent-purple-bright)',
        /* Status */
        'accent-green':     'var(--accent-green)',
        'accent-red':       'var(--accent-red)',
        'accent-amber':     'var(--accent-amber)',
        'accent-blue':      'var(--accent-blue)',
      },
      fontFamily: {
        grotesk: ['Space Grotesk', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        sans:    ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-orange': '0 4px 12px rgba(249, 115, 22, 0.2)',
        'glow-green':  '0 0 8px rgba(22, 163, 74, 0.15)',
        'glow-red':    '0 0 8px rgba(220, 38, 38, 0.15)',
        'card':        '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover':  '0 4px 12px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
