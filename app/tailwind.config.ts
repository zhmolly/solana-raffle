import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {

      colors: {
        primary: {
          100: '#161B19',
          200: '#14F195',
          300: '#B0B2B1',
          400: '#1E2423',
          500: '#1E242380',
        },
        purple: "#7140FF",
      },

      boxShadow: {
        'custom': '4px 4px 4px rgba(0, 0, 0, 0.25)',
      },

      backgroundImage: {
        'gradient-gray': 'linear-gradient(153.81deg, rgba(30, 36, 35, 0.5) 0%, rgba(30, 30, 30, 0.5) 51.56%, rgba(176, 178, 177, 0.5) 100%)',
      },

      screens: {
        'xs': '420px'
      },

    },
  },
  plugins: [],
}
export default config
