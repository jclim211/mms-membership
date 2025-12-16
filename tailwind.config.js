/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1e3a8a",
        emerald: "#10b981",
        "muted-red": "#ef4444",
        "light-grey": "#F3F4F6",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Roboto Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
