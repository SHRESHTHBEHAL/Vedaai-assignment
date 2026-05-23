import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213d",
        paper: "#fffaf0",
        chalk: "#f6f2e8",
        mint: "#3bb78f",
        plum: "#7c4dff",
        amber: "#f7b731",
        coral: "#ff6b6b",
      },
      boxShadow: {
        soft: "0 20px 70px rgba(20, 33, 61, 0.12)",
        line: "0 1px 0 rgba(20, 33, 61, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
