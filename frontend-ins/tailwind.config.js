/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Student lightTheme tokens ──────────────────────
        primary: {
          50:  '#eef2ff',   // priLL
          100: '#e0e7ff',   // priL / bdr
          500: '#6366f1',   // txtM
          600: '#4f46e5',   // gradient end
          700: '#4338ca',   // pri (main)
          800: '#3730a3',   // gradient start
          900: '#1e1b4b',   // txt (dark heading)
        },
        accent: {
          DEFAULT: '#f43f5e',   // acc
          mid:     '#fb7185',   // accMid
          light:   '#fff1f2',   // accL
          xlight:  '#ffe4e6',   // accLL
        },
        ok:   '#059669',
        okL:  '#ecfdf5',
        warn: '#d97706',
        warnL:'#fffbeb',
        'app-bg':    '#f0f2ff',  // bg
        'app-bgalt': '#e8eaff',  // bgAlt
      },
      backgroundImage: {
        'pri-gradient': 'linear-gradient(135deg, #3730a3, #4f46e5)',
      },
      boxShadow: {
        'card':  '0 1px 4px rgba(67,56,202,.08)',
        'card-md': '0 4px 20px rgba(67,56,202,.13)',
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
