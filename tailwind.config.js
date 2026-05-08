/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './tuna-scenario-tool.jsx',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          fire: '#ff3a05',
          slate: '#2e2e36',
          dark: '#dcdcdc',
          light: '#f0f0f0',
        },
        signal: {
          thought: '#f0c22e',
          advisory: '#4b9875',
          speaking: '#8371dc',
          book: '#76b1d2',
          press: '#f47a49',
        },
        surface: {
          base: '#1a1a20',
          raised: '#2e2e36',
          muted: '#26262d',
          border: '#3a3a44',
        },
        ink: {
          primary: '#f0f0f0',
          secondary: '#a8a8b3',
          muted: '#6a6a74',
          inverse: '#1a1a20',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Noto Sans Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
