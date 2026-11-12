/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2fbeb",
          100: "#e3f7d2",
          200: "#c8eda9",
          300: "#a3df78",
          400: "#7ccb49",
          500: "#58b227",
          600: "#3f960f",
          700: "#33770d",
          800: "#2c5e11",
          900: "#275013",
          950: "#112a06",
        },
        ink: {
          50: "#f6f8f5",
          100: "#ecefe9",
          200: "#dce2d7",
          300: "#c3cdbc",
          400: "#65745b",
          500: "#5a6a4f",
          600: "#46533e",
          700: "#394333",
          800: "#2c3428",
          900: "#1f261d",
          950: "#141a12",
        },
        forest: {
          700: "#123c25",
          800: "#0d2f1c",
          900: "#092415",
          950: "#06180e",
        },
        lime: {
          300: "#d8f99b",
          400: "#c6f26a",
          500: "#aee93b",
        },
        canvas: "#f4f7f2",
      },
      fontFamily: {
        display: ["Lexend", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: [
          "Source Sans 3",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(20 26 18 / 0.04), 0 1px 3px 0 rgb(20 26 18 / 0.05)",
        soft: "0 8px 24px -16px rgb(20 26 18 / 0.22)",
        lift: "0 24px 48px -24px rgb(9 36 21 / 0.28)",
        glow: "0 0 0 1px rgb(88 178 39 / 0.18), 0 12px 32px -12px rgb(63 150 15 / 0.35)",
        inset: "inset 0 1px 0 0 rgb(255 255 255 / 0.06)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fade: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(0.85)" },
        },
      },
      animation: {
        rise: "rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        fade: "fade 0.4s ease-out both",
        "pulse-dot": "pulse-dot 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
