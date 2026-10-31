/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {
    colors: { canvas: '#0b111b', panel: '#111a27', mint: '#48e5bf', ink: '#edf3f8', muted: '#95a2b4' },
    fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] },
  } },
  plugins: [],
}
