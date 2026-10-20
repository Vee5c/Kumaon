import { defineConfig } from 'astro/config';

// Static output: `npm run build` writes plain HTML/CSS/JS to dist/, which any static host can serve.
// `site` is the live address: it turns the share image (og:image) and canonical links into full URLs.
export default defineConfig({ site: 'https://kumaon.co' });
