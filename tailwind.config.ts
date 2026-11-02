import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: "#0A6FD6",
        ink: "#1F2633",
        surface: "#F5F7FA",
      },
    },
  },
  plugins: [],
};

export default config;
