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
        'accent-purple':    'var(--accent-purple)',
        'accent-purple-br': 'var(--accent-purple-bright)',
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
        'glow-purple': '0 0 20px rgba(124, 58, 237, 0.3)',
        'glow-green':  '0 0 15px rgba(16, 185, 129, 0.2)',
        'glow-red':    '0 0 15px rgba(239, 68, 68, 0.25)',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
