/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vk: {
          dark: '#131921',       // Amazon Dark Slate Header
          subnav: '#232f3e',     // Amazon Subnav Navy
          accent: '#febd69',     // Amazon Gold Accent
          orange: '#f08804',     // Action Button Orange
          orangeHover: '#d67500',// Darker Orange
          blue: '#007185',       // Amazon Link Teal/Blue
          blueDark: '#004b57',
          light: '#f7f8f8',      // Amazon Light Background
          card: '#ffffff',
          border: '#e7e7e7',
          price: '#b12704',      // Reddish Amazon Price
          stockGreen: '#007600',
        }
      },
      fontFamily: {
        sans: ['"Amazon Ember"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'amazon': '0 2px 5px 0 rgba(213,217,217,.5)',
        'amazon-hover': '0 4px 10px 0 rgba(0,0,0,.15)',
      }
    },
  },
  plugins: [],
}
