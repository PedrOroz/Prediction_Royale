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
        "canary-yellow": {
          500: "#f2ff00",
          600: "#c2cc00",
          700: "#919900",
          800: "#616600",
        },
        "iron-grey": {
          600: "#5a6b72",
          700: "#435056",
          800: "#2d3639",
          900: "#161b1d",
        },
        "ash-grey": {
          700: "#3c5d53",
        },
        "tiger-orange": {
          400: "#f9a339",
          600: "#c67006",
        },
        "yale-blue": {
          400: "#5eabd4",
          500: "#3696c9",
          900: "#0b1e28",
        },
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 4px #f2ff00, 0 0 8px #f2ff00",
          },
          "50%": {
            boxShadow: "0 0 8px #f2ff00, 0 0 16px #f2ff00",
          },
        },
      },
      animation: {
        shake: "shake 0.5s ease-in-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
