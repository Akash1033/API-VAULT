// Path: tailwind.config.js
// Purpose: Tailwind configuration integrating custom CSS tokens
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgBase: 'var(--bg-base)',
        bgSurface: 'var(--bg-surface)',
        bgRaised: 'var(--bg-raised)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        textMuted: 'var(--text-muted)',
        border: 'var(--border)',
        borderHover: 'var(--border-hover)',
        green: 'var(--green)',
        amber: 'var(--amber)',
        blue: 'var(--blue)',
        red: 'var(--red)',
        purple: 'var(--purple)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
