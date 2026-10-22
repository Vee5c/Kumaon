# Kumaon & Co. landing page

Built with [Astro](https://astro.build): the page is split into components and builds to plain static HTML, CSS and JS that any static host can serve. React is not used; Node is only needed on your computer to build.

```bash
npm install        # once
npm run dev        # http://localhost:4321 with live reload
npm run build      # writes the site to dist/
npm run preview    # serve dist/ locally
```

## The page, top to bottom

| Section | What it is |
|---|---|
| Header | Fixed bar: theme toggle, "Kumaon & Co." card (click it to glide, or wave, back to the top), Work / Approach / Contact us. Below 680px the links move into a menu card. A "Skip to content" link appears on keyboard focus. Links glide to their section, or cross a colour wave when the section is far away. From the "More work" page they take the same wave across to the home page (the wave covers the screen, the page loads under it, and it carries on up and off): `waveLeave` in `ui.js`, the `kc-arriving` class set by a script in `Layout.astro`'s head. |
| Hero | "You dream, We deliver." It stays still while the orange logo scene slides up over it. The orange has a traced mountain ridge on the right with light-blue snow patches and falling flakes. |
| Logo scene | Pinned scroll scene: the logo builds, the wordmark melts into a blue pointer that travels the logo's edge and stops at Advertisement, Music and Marketing & Design. |
| Selected work | Pinned scene: scrolling slides one row of films sideways, then the page continues. Contour lines, birds and a small temple drift behind it at their own speeds. Films preview themselves (muted, 6 seconds, looping) while on screen; pressing a film plays it with sound. |
| Approach | Heading and three short ideas on the left. On screens wider than 900px, a services crossword on the right: drag (or tap) the letter blocks into the blanks; a right letter lands and a finished word turns into coloured tiles, a wrong one shakes and returns. Skip fills it in. The first time it scrolls into view the page stops briefly and the blocks hop. Hidden on small screens. |
| Contact | Blue closing section with a river edge: ripples, floating diyas, a boat, and fish that leap out of the water in one smooth arc. WhatsApp (cream) and Instagram (orange) buttons; hovering WhatsApp or a diya lights the diyas' glow. Vee's photo opens a polaroid with WhatsApp and Instagram links. |

## Structure

```
src/
  pages/index.astro         The page: the components in order, inside <main>
  pages/work.astro          Placeholder for the full archive (the "More work" record links here)
  layouts/Layout.astro      <head> (meta, share tags, fonts), the steady page height (--vh), theme script
  components/
    Header.astro  Hero.astro  Approach.astro  Contact.astro  Footer.astro  Lightbox.astro
    LogoReveal.astro        The logo scene's markup, with LogoArtwork.astro (the logo as inline SVG)
    ServicesFlat.astro      Plain list of services for reduced-motion visitors
    RidgeSnow.astro         Snow on the ridge: patches that settle in, flakes that fall
    Work.astro              The Work scene, its scroll script, the preview logic, the temple and the background
    WorkCard.astro          One film: video, poster, caption
  data/
    work.js                 Every film: files, poster, title, text, link
    cards.js                Order, label, line, speed, gap and preview start (`at`) of each card
    media.js                Where media is served from (see below)
  styles/                   tokens, header, hero, logo-reveal, sections, work
  scripts/                  logo-reveal.js (logo scene timeline), ui.js (theme, menu, header, name-to-top, wave transitions, smooth links, pausing off-screen animation),
                            crossword.js (the Approach crossword: drag, snap, tiles, hand-drawn grid lines, the stop-and-nudge scroll),
                            sound.js (opt-in sound made in the browser: tick, guitar pluck, record crackle)
public/
  videos/  images/          Served as-is at /videos/... and /images/...
  fonts/                    The two typefaces (latin only), served from this site
  audio/                    The sound clips (see Sound below): two tiger roars, a temple bell, birdsong
  favicon.png  apple-touch-icon.png
unused-media/               Old clips and logo images, kept out of the site; delete when you like
legacy-static/              The previous single-file version, kept for reference (safe to delete)
```

## Colours

One fixed palette at the top of `src/styles/tokens.css`, used everywhere through variables:

| Token | Value | Role |
|---|---|---|
| `--c-orange` | `#c8741f` | The logo orange: the only orange (accent, fills, hover) |
| `--c-amber` | `#f0a64a` | Light tint of the orange: button labels on near-black |
| `--c-blue` | `#0086b8` | The logo blue (a touch deeper than the original so cream text on it passes 3:1) |
| `--c-blue-bright` | `#008fc3` | Blue for small text and icons on near-black |
| `--c-blue-deep` | `#006a93` | Blue for the cream pill in dark mode |
| `--c-cream` / `--c-night` | `#efe6d3` / `#1c1712` | The page cream and the warm near-black |

`--water` and `--on-water` give the blue closing field (a lighter `#0077a6` in dark mode, with cream text). `--ease-out` is the one easing curve. Themed values (`--ink`, `--accent`, `--line` and so on) are built from these and remapped for dark mode. The logo scene reads `--paper` and `--scene-text` from `src/styles/logo-reveal.css`.

## Films

Each film has two files: the full one and a light one for phones, slow connections and data-saver (about a quarter of the size).

- Add a film: put `name-clip.mp4` and `name-clip-sm.mp4` in `public/videos/`, a poster in `public/images/`, add an entry in `src/data/work.js`, and a line in `src/data/cards.js`.
- `at` in `cards.js` is the second where the preview starts. Use the same moment as the poster picture so a card never changes picture when it starts moving.
- Make a light version: `ffmpeg -i name-clip.mp4 -vf scale=960:-2 -c:v libx264 -crf 29 -maxrate 900k -bufsize 1800k -pix_fmt yuv420p -c:a aac -b:a 80k -movflags +faststart name-clip-sm.mp4` (use `scale=540:-2` for tall films).
- To host films elsewhere (a CDN or storage bucket), copy `.env.example` to `.env`, set `PUBLIC_MEDIA_BASE=https://your-host`, and upload the same `videos/` and `images/` paths there.

## Notes

- Fonts are served from `public/fonts/`: Bricolage Grotesque (headings) and Hanken Grotesk (everything else), latin only, with `font-display: swap`. No request goes to Google.
- `prefers-reduced-motion` visitors skip the scroll scenes and previews: they get the finished logo, a plain list of services, and stills.
- `site` in `astro.config.mjs` is `https://kumaon.co`, so the share image link (`og:image`) and canonical links are full URLs.
- **Sound** is off until the visitor presses the speaker button in the header (beside the menu button on phones). The choice is saved in `localStorage` (`kc-sound`) only when turned on, and everything stops when the tab is hidden. All of it lives in `src/scripts/sound.js`; `window.kcSound.play(name)` plays a sound when it is on.
- **Finding the sounds**: with sound off, arriving on the finished logo, the temple or the mountain snow makes the header speaker wiggle (at most every few seconds); the cursor turns into a music note over them. On touch screens a tap on the temple or the mountain plays its sound.
- **"Click me" bubble**: with sound on, a mouse pointer on the finished logo shows a small "Click me" bubble beside the music-note cursor (hidden while it roars, and on touch screens).
- **Smooth logo scroll**: the logo scene follows the scroll through an eased copy of the section's position (`logo-reveal.js`, about a tenth of a second), so a mouse wheel's steps glide instead of jumping. A long jump (a link, a refresh half way down) lands at once.
- **Sound you can see**: the roar swells the logo; the temple's edges glow very softly with the bell (`--glow`, from the bell's measured loudness; with sound off it follows the same curve silently); the snowfall makes the flakes fall about 12% faster while it plays.
- **The mountain's snow** (`src/components/RidgeSnow.astro`) is drawn by a small WebGL shader: round dots settle into the patches from 1.5 s to 11 s (a little slower at first, faster towards the end), and a quick pointer pass blows the flakes aside. Flakes land on the ridge and melt into it. Without WebGL the same arrival is done with SVG masks; with reduced motion the patches are simply there.
- **The water's gust** (Contact): a quick pointer pass over the water bends the ripple lines for a moment (an SVG displacement filter, only while the gust blows), sends a few faint glints along the surface, and nudges the diyas and boat sideways a few pixels. It dies away as soon as the pointer stops, and is off on touch screens and with reduced motion.
- **Gust over the water** (`src/components/Contact.astro`): a quick pointer pass over the Contact section sends a few faint glints of light along the surface and nudges the diyas and boat a few pixels sideways, then they settle back. It dies away the moment the pointer stops, and is off for touch and reduced motion.
  - Made in the browser (no files): a wooden tick when a crossword block lands, a plucked string when a word finishes, a harmonium chord when sound is switched on, a soft electric-piano jazz chord on the "More work" record.
  - Recordings in `public/audio/` (cut, denoised and levelled with ffmpeg from your originals; keep the originals elsewhere): `tiger-roar-1.mp3` and `tiger-roar-2.mp3` (the two roars of one take, played on alternate clicks of the logo, only once the whole logo is on screen), `temple-bell.mp3` (3 s, from 20 s into the original, fading out) and `birds.mp3` (the first 7 s of the original slowed to 72% so the chirps are further apart, about 9.7 s, very quiet) and `snowfall.mp3` (7 s, seconds 1 to 8 of a 5-minute snowfall ambience: hovering the mountain in the first screen plays it once). Hovering the temple in the Selected work scene rings the bell with the birds underneath; each plays to its own end wherever the pointer goes. Hovering again rings the bell once it has finished (the birds carry on if they have not), and restarts both together when both have finished. Every sound (roar, temple and birds, snowfall) fades out when its section scrolls out of view, and stops when you switch sound off or leave the tab. On phones the sound switch sits beside the menu button. With sound off, a click on the finished logo only makes the eye glow once; the logo shows a lighter hover shadow either way.
  - The logo's pulse (swell, shadow and eye glow) follows the roar's loudness. `ROARS` in `sound.js` holds, per clip, a table of its volume every 40 ms measured from the file; if you replace a clip, remeasure it (an example: `ffmpeg -i clip.mp3 -ac 1 -ar 22050 clip.wav`, then take the RMS of 80 ms windows every 40 ms and scale to 0 to 1).
- **Browsers only allow sound after a click or key press.** A saved "sound on" therefore waits after a reload (the button shows off) and switches itself on at the first click or key press; if the browser refuses a clip, the button goes back to off and pulses.
- **Selected work**: the scroll stops briefly (about half a second) as the section reaches the top of the screen, once per page load; any deliberate scroll after that carries on.
- **Night mode** lights the Contact diyas on their own and adds fireflies around the temple (hovering the temple makes their glow 20% stronger); by day, yellow petals drift down past the temple instead. The Kumaon photo opens as a polaroid that develops over about 1.8 seconds. The footer shows Bangalore time (`.bangalore-time`, updated from `ui.js`). The "More work" record spins up on hover and turns polished bronze in dark mode.
- Wave transitions (`waveWipe` in `ui.js`) are shared by the Work, Approach, Contact and name-to-top buttons.
- Pinned scenes use one steady page height (`--vh`, set in `Layout.astro`) so they keep filling the screen as a phone's address bar slides away.

## Publishing

`npm run build` writes the finished site to `dist/`. That folder is plain files, so it can be served by any static host. `dist/` is not committed (see `.gitignore`), so **pushing the source to GitHub does not by itself change a live site**: something has to run the build and publish `dist/`. Pick one way.

### A. GitHub Pages, built by GitHub (workflow)

1. Add `public/CNAME` containing just your domain (for example `www.example.com`), so the custom domain survives every deploy.
2. Add this workflow as `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

3. In the repository on GitHub: Settings, then Pages, then set **Source** to **GitHub Actions**. After that, every push to `main` builds and publishes by itself.
4. Domain: in GoDaddy's DNS, the domain should point at GitHub Pages (an `A` record set for the apex, or a `CNAME` for `www`, as in GitHub's custom-domain guide). If the old static site already worked from this domain, the DNS is already right and only steps 1 to 3 are needed. Turn on **Enforce HTTPS** once GitHub offers it.

The workflow (with manual publishing, see above) and `CNAME` are already in the repository.

### Publish by hand from GitHub (the workflow in `.github/workflows/deploy.yml`)

Every push and pull request is built automatically, so a broken site shows up straight away. Publishing only happens when you start it: open the repository's **Actions** tab, choose **Build and publish**, and press **Run workflow**. That builds the latest `main` and publishes it. One-time setup: Settings, then Pages, then set **Source** to **GitHub Actions**. The domain file `public/CNAME` is already in place. Pushing to `main` alone never changes the live site.

(The older way still works if you prefer it: `npm run build`, then `npx gh-pages -d dist`, with Pages set to serve the `gh-pages` branch. Use one way or the other, not both.)

### Netlify

`netlify.toml` tells Netlify what to do: run `npm run build` and serve `dist/` with Node 22. If the Netlify site was set up for the old single-file page, check Site configuration, then Build and deploy, and clear any old build command or publish folder, so this file is used. A page-not-found after deploying usually means Netlify is serving the repository's root folder instead of `dist/`.

### Search and sharing (SEO)

`public/robots.txt` and `public/sitemap.xml` (the home page only, for now) are served as they are. `src/pages/404.astro` is the not-found page (Netlify serves it as `404.html`, and it is marked `noindex`). The home page carries a small block of structured data (`Organization`: name, logo, Bangalore, founded 2025, Vee as founder, Instagram), set in `src/pages/index.astro`. `netlify.toml` also sets cache headers: built scripts and styles for a year, fonts for 30 days, images, video and audio for a week. When a page is added, add it to `sitemap.xml`.

### B. Build on your computer and upload

Run `npm run build`, then upload the contents of `dist/` to the hosting for the domain (GoDaddy's file manager or FTP), replacing the old files. This works for GoDaddy shared hosting; nothing runs automatically.

### Before the first publish

- `site` is already set to `https://kumaon.co` in `astro.config.mjs`; change it there if the address ever changes.
- `legacy-static/` and `unused-media/` are kept in the repository (about 9 MB); delete them if you do not need them.
- If the old single-file site is still what GitHub Pages serves from a branch, switching the Pages source to GitHub Actions (above) replaces it with this build.
