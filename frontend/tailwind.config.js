/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0B1120",
          900: "#0F172A",
          800: "#141C2E",
          700: "#1B2436",
          600: "#26314A",
          500: "#334059",
        },
        cyan: {
          50: "#ECFEFF",
          100: "#CFFAFE",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
        },
        surface: "#F8FAFC",
        ink: {
          900: "#0F172A",
          600: "#334155",
          400: "#64748B",
        },
        line: "#E2E8F0",
        success: { 50: "#ECFDF5", 500: "#10B981", 600: "#059669" },
        warning: { 50: "#FFFBEB", 500: "#F59E0B", 600: "#D97706" },
        danger: { 50: "#FEF2F2", 500: "#EF4444", 600: "#DC2626" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)",
        pop: "0 8px 24px -8px rgb(15 23 42 / 0.18)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "fade-in": { from: { opacity: 0, transform: "translateY(4px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        "slide-in": { from: { opacity: 0, transform: "translateX(12px)" }, to: { opacity: 1, transform: "translateX(0)" } },
        shimmer: { from: { backgroundPosition: "-400px 0" }, to: { backgroundPosition: "400px 0" } },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in": "slide-in 0.25s ease-out",
        shimmer: "shimmer 1.6s infinite linear",
      },
    },
  },
  plugins: [],
};
