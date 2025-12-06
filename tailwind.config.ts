import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#0a0a1a",
                foreground: "#ffffff",
                primary: {
                    DEFAULT: "#ee3ec9",
                    hover: "#d635b4",
                    foreground: "#ffffff",
                },
                card: {
                    DEFAULT: "rgba(255, 255, 255, 0.05)",
                    foreground: "#ffffff",
                },
                border: "rgba(238, 62, 201, 0.2)",
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "hero-glow": "conic-gradient(from 180deg at 50% 50%, #ee3ec9 0deg, #9b2c82 180deg, #ee3ec9 360deg)",
            },
        },
    },
    plugins: [],
};
export default config;
