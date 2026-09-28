/** @type {import('tailwindcss').Config} */
// Palette manStock : acier d'entrepôt + ambre des étiquettes de palette.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        acier: { DEFAULT: '#1D3336', clair: '#2B4A4E', pale: '#E3EAE9' },
        papier: '#F4F6F5',
        ligne: '#D5DDDA',
        encre: { DEFAULT: '#172022', douce: '#4E5E60' },
        ambre: { DEFAULT: '#E0A030', fonce: '#9A6A12', pale: '#FBF1DD' },
        alerte: { DEFAULT: '#A63D2A', pale: '#F7E4E0' },
        succes: { DEFAULT: '#2E6A4E', pale: '#E0EFE7' },
      },
      fontFamily: {
        sans: ['"Archivo Variable"', 'Archivo', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: { sm: '3px', DEFAULT: '5px', lg: '8px' },
    },
  },
  plugins: [],
};
