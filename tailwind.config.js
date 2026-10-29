/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        // Butun ilova bo'yicha "blue-*" sifatida ishlatilgan asosiy brend rangi
        // Zolvi uslubidagi issiq amber/jigarrang urg'u rangiga almashtirildi
        // (sahifalarni birma-bir o'zgartirmasdan — mavjud bg-blue-*/text-blue-* hammasi avtomatik yangilanadi).
        blue: {
          50: '#fbf7ef',
          100: '#f5ead3',
          200: '#ead3a3',
          300: '#dfbb74',
          400: '#d4a34c',
          500: '#c68a3a',
          600: '#b0742d',
          700: '#8f5d21',
          800: '#6f481a',
          900: '#523412',
          950: '#332112',
        },
        // Zolvi'dagi krem fon rangi
        cream: '#F4F4ED',
      },
    },
  },
  plugins: [],
};
