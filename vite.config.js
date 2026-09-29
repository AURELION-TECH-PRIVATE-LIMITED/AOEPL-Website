import { mkdirSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// site.js and hero.js are plain classic scripts (not type="module"), so Vite's
// bundler ignores them; copy them into dist/assets untouched after the build.
function copyPlainScripts() {
  return {
    name: 'copy-plain-scripts',
    closeBundle() {
      var outAssets = resolve(__dirname, 'dist/assets');
      mkdirSync(outAssets, { recursive: true });
      ['site.js', 'hero.js'].forEach(function (f) {
        copyFileSync(resolve(__dirname, 'assets', f), resolve(outAssets, f));
      });
    },
  };
}

export default defineConfig({
  plugins: [copyPlainScripts()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        services: resolve(__dirname, 'services.html'),
        howWeWork: resolve(__dirname, 'how-we-work.html'),
        estimate: resolve(__dirname, 'estimate.html'),
        contact: resolve(__dirname, 'contact.html'),
      },
    },
  },
});
