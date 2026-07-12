/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Consolas", "monospace"]
      },
      colors: {
        ops: {
          bg: "#0B0E14",
          sidebar: "#11161D",
          surface: "#11151B",
          surface2: "#151B23",
          border: "#2A313C",
          muted: "#8A94A6",
          text: "#E7ECF3",
          amber: "#B66A00",
          amber2: "#F59E0B",
          blue: "#5AA2E8",
          green: "#3FB950",
          red: "#F87171"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(245, 158, 11, .12), 0 16px 60px rgba(0,0,0,.28)"
      }
    }
  },
  plugins: []
};
