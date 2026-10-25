/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#06141B",
        surface: "#06141B",
        "surface-container-lowest": "#040d12",
        "surface-container-low": "#0b1922",
        "surface-container": "#11212D",
        "surface-container-high": "#192c3a",
        "surface-container-highest": "#253745",
        outline: "#4A5C6A",
        "outline-variant": "#253745",
        primary: {
          DEFAULT: "#10B981",
          light: "#4edea3",
          dark: "#059669",
        },
        cyan: {
          DEFAULT: "#06B6D4",
          light: "#4cd7f6",
          dark: "#0891b2",
        },
        amber: {
          DEFAULT: "#F59E0B",
          light: "#ffb95f",
          dark: "#d97706",
        },
        coral: {
          DEFAULT: "#E2856E",
          dark: "#3d1f19",
        },
        slate: {
          850: '#11212D',
          900: '#0b1922',
          950: '#06141B',
        },
        vortex: {
          bg: "#06141B",
          panel: "#11212D",
          border: "#253745",
          borderLight: "#4A5C6A",
          text: "#F0F4F6",
          textMuted: "#9BA8AB",
          highlight: "#CCD0CF",
          accentEmerald: "#10B981",
          accentCyan: "#06B6D4",
          accentCoral: "#E2856E",
        }
      },
      fontFamily: {
        sans: ["Geist", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      }
    },
  },
  plugins: [],
}
