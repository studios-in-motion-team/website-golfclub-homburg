/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                golf: {
                    green: '#0a2e23',
                    light: '#fdfdfb',
                    gold: '#b08d44',
                    accent: '#2d5a4a',
                }
            },
            fontFamily: {
                serif: ['"Playfair Display"', 'serif'],
                sans: ['"Lato"', 'sans-serif'],
            }
        }
    },
    plugins: [],
}
