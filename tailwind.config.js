/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        canvas: { bg: '#0e0e12', grid: '#1a1a22' },
        panel: { bg: '#141418', border: '#27272f', hover: '#1e1e26' },
        accent: { DEFAULT: '#6d5cff', light: '#8b7dff', dim: '#3d3480' },
        node: {
          input: '#22c55e',
          core: '#3b82f6',
          attention: '#f59e0b',
          reduction: '#ec4899',
          tensor: '#8b5cf6',
          block: '#06b6d4',
          hf: '#f97316',
          custom: '#64748b',
        },
        edge: { valid: '#4ade80', error: '#f87171', unknown: '#52525b' },
      },
    },
  },
  plugins: [],
};
