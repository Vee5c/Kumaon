/* Where video and poster files are served from.
   Leave PUBLIC_MEDIA_BASE empty to serve them from this site (public/videos, public/images).
   Set it (e.g. https://media.example.com) to serve them from a CDN or storage bucket instead. */
const base = (import.meta.env.PUBLIC_MEDIA_BASE ?? '').replace(/\/$/, '');
export const media = (path) => base + path;
