import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bleu marine — couleur principale (d'après le logo Coursa)
        brand: {
          50: "#f2f6fb",
          100: "#e3ebf5",
          200: "#c6d6e8",
          300: "#9db6d4",
          400: "#6d8db6",
          500: "#456695",
          600: "#2d4d78",
          700: "#20395b",
          800: "#152840",
          900: "#0f1e35",
          950: "#081221",
        },
        // Or — couleur d'accent (CTA, détails premium)
        gold: {
          50: "#fdf8ec",
          100: "#f8ecc9",
          200: "#f0da95",
          300: "#e7c258",
          400: "#dcab34",
          500: "#c9912b",
          600: "#ab721f",
          700: "#89561c",
          800: "#71461d",
          900: "#5f3b1b",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
