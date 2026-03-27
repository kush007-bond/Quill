/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /**
       * Quill's "Warm Editorial Minimalism" Design Tokens (Spec 5.3)
       * These tokens implement the 'Paper' (light) and 'Ink' (dark) themes.
       */
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: 'var(--bg-surface)',
        overlay: 'var(--bg-overlay)',
        border: 'var(--border)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)',
        },
      },
      fontFamily: {
        serif: ['Lora', 'serif'],       // Primary Editor Font (Spec 5.2)
        sans: ['DM Sans', 'sans-serif'], // Primary UI Font (Spec 5.2)
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '10': '64px', // Spec 5.4 - Page-level margins
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
