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
        ink: "#14213D",
        paper: "#F1F3EF",
        amber: "#E3A039",
        teal: "#1F6F6B",
        stampRed: "#B23A2E",
        graphite: "#232B36",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "ui-sans-serif", "sans-serif"],
        sans: ["var(--font-ibm-plex-sans)", "ui-sans-serif", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
