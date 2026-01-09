/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0088cc',
        secondary: '#FF6B35',
        // Uzbek Modern Minimalism Palette
        samarkand: {
          blue: '#00CED1',
          turquoise: '#20B2AA',
          deep: '#5F9EA0',
          light: '#AFEEEE',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#FFD700',
          warm: '#F4A460',
        },
        terracotta: {
          DEFAULT: '#CD853F',
          light: '#E8A87C',
          deep: '#B87333',
        },
        uzbek: {
          cream: '#FFFEF7',
          beige: '#FAF9F6',
          charcoal: '#2C2C2C',
          text: '#4A4A4A',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
      borderRadius: {
        'uzbek': '1.5rem', // Extra rounded for soft, dome-like feel
      },
      boxShadow: {
        'uzbek': '0 10px 40px rgba(0, 206, 209, 0.2)', // Samarkand blue glow
        'gold': '0 10px 40px rgba(212, 175, 55, 0.2)', // Gold glow
      },
    },
  },
  plugins: [],
}
