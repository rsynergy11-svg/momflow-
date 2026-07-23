import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAF7F0",
        primary: "#3D4A2A",
        secondary: "#5A6B3A",
        accent: "#B8CE90",
        surface: "#FFFFFF",
        muted: "#F2EDE0",
        "text-primary": "#1A1C0E",
        "text-secondary": "#6A6C50",
        error: "#C84030",
        success: "#3A8040",
        warning: "#C89040",
        marigold: "#E08C3A",
        "marigold-dark": "#B96F26",
        "hero-start": "#2A3818",
        "hero-end": "#4C5B30",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "20px",
        btn: "12px",
      },
      boxShadow: {
        soft: "0 2px 16px rgba(0,0,0,.08)",
      },
      backgroundImage: {
        hero: "linear-gradient(155deg, #2A3818, #4C5B30)",
      },
    },
  },
  plugins: [],
};

export default config;
