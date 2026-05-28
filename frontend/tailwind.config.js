/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind сканує ці файли щоб знайти className="..."
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Тут додаватимемо кастомні кольори, шрифти, розміри
      colors: {
        primary: "#FF6B6B",
        "primary-dark": "#E85555",
      },
    },
  },
  plugins: [],
};
