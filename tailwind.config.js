export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy:  { DEFAULT:'#0A2240', 2:'#0D2D55', 3:'#1B3F72' },
        irpc:  { green:'#00A878', 'green-d':'#00875F', 'green-l':'#E6F7F2',
                 amber:'#F5A623', 'amber-l':'#FEF7EA',
                 red:'#E53935',   'red-l':'#FDECEA',
                 blue:'#2D6AB4',  'blue-l':'#EBF3FB' },
        bg: '#F0F5FA',
      },
      fontFamily: { sans: ['Inter','Segoe UI','system-ui','sans-serif'] },
      borderRadius: { '2xl':'16px', '3xl':'24px' },
      boxShadow: {
        card: '0 2px 12px rgba(10,34,64,0.06)',
        'card-lg': '0 8px 32px rgba(10,34,64,0.12)',
      }
    },
  },
  plugins: [],
}
