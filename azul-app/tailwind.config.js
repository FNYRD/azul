/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'teal-app':    '#5DA8B5',
        'teal-dark':   '#4A8E99',
        'teal-deeper': '#3A7580',
        'teal-light':  '#7BC8D0',
        'teal-pale':   '#D0EDEF',
        'teal-surface':'#4E97A4',
        cream:         '#EAE5D9',
        'cream-warm':  '#E2DDD0',
        'cream-border':'#CEC7B8',
        ink:           '#2A4B52',
        'ink-light':   '#4A7580',
        'ink-muted':   '#7A9EA5',
      },
      fontFamily: {
        fairy:   ['"Pinyon Script"', '"Great Vibes"', 'cursive'],
        display: ['"Playfair Display"', 'serif'],
        body:    ['"Crimson Text"', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:        '0 1px 2px rgba(42,75,82,0.08), 0 6px 16px rgba(42,75,82,0.14), 0 12px 28px rgba(42,75,82,0.10)',
        'card-hover':'0 2px 4px rgba(42,75,82,0.10), 0 12px 28px rgba(42,75,82,0.20), 0 24px 48px rgba(42,75,82,0.14)',
        modal:       '0 -8px 40px rgba(42,75,82,0.25)',
        inner:       'inset 0 2px 8px rgba(42,75,82,0.08)',
      },
    },
  },
  plugins: [],
}
