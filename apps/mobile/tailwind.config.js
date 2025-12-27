/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,jsx,ts,tsx}"],
  theme: {
    // Mobile-friendly breakpoints
    screens: {
      sm: "380px",
      md: "420px",
      lg: "680px",
      tablet: "1024px",
    },
    extend: {
      colors: {
        // App theme colors matching Colors.ts
        primary: "#2f95dc",
        background: {
          light: "#fff",
          dark: "#000",
        },
        foreground: {
          light: "#000",
          dark: "#fff",
        },
      },
    },
  },
};
