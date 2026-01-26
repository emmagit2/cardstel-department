import { defineConfig } from "tailwindcss";
import tailwindAnimate from "tailwind-animate"; // <- import the plugin

export default defineConfig({
  theme: {
    extend: {},
  },
  plugins: [
    tailwindAnimate(), // <- add it here
  ],
});
