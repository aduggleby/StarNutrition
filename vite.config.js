import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/StarNutrition/',
  plugins: [tailwindcss()],
  server: {
    port: 3000,
    open: true
  }
});