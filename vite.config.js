import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths, so the build works from a sub-folder
  // (GitHub Pages' /little-desk/, itch.io's iframe) as well as from the root.
  base: './',
  // Phaser is one big library, so silence the "large chunk" warning.
  build: { chunkSizeWarningLimit: 2000 },
});
