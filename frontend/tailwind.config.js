/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/renderer/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#481ca6",
        secondary: "#1A0859",
        third: "#352EF2",
      },
      boxShadow: {
        red: "0 0 30px #ef4444",
        green: "0 0 30px #22c55e",
        blue: "0 0 30px #3b82f6",
        yellow: "0 0 30px #f59e0b",
      },
    },
  },
  plugins: [],
};
