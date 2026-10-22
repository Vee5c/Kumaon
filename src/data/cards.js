/* The row in the Work section, in display order. Layout is a small system, not per-card tweaks:
   - three media heights only (in "u", 1u = the smaller of 1% of screen height and 0.85% of screen width):
     SIZE.lead for the first film on the first screen, SIZE.tall for phone-shaped films, SIZE.wide for the rest;
   - tall films sit on the upper line, wide films on the lower line (align: 'start' / 'end'), one gap between all items;
   - speed: how fast a card drifts left relative to the row (1 = with the row). Later cards are a little faster,
     so the gaps slowly close as you scroll.
   - at: the second where the film's preview starts (the same moment as its poster picture), so a card never changes
     picture when it starts to move. Edit work.js for files, titles and links. */
import { featured, reels, versatility } from './work.js';

export const SIZE = { lead: 44, tall: 56, wide: 38 };

const all = [featured, ...reels, ...versatility];
const find = (id) => all.find((c) => c.video.endsWith(`/${id}.mp4`));

const ORDER = [
  { id: 'sato-clip',       label: 'Sato - Holiday Campaign',        tall: false, lead: true, at: 0 },
  { id: 'pizza-clip',      label: 'Lyfe - The Pizza Cut',           tall: true,  align: 'start', speed: 1.04, gap: 12, at: 0 },
  { id: 'metal-clip',      label: 'Metal - Cut to the Riff',        tall: false, align: 'end',   speed: 1.08, gap: 24, h: 46, at: 8 },
  { id: 'dream39-clip',    label: 'Animated intro - just for you',   tall: false, align: 'start',   speed: 1.12, gap: 16, h: 42, at: 0, preview: 2.5 },
  { id: 'sandwichie-clip', label: 'FnB - quick, catchy, gone',        tall: true, align: 'start', speed: 1.16, gap: 16, at: 0 },
];

export const cards = ORDER.map(({ id, ...extra }) => ({
  ...find(id),
  ...extra,
  h: extra.h ?? (extra.lead ? SIZE.lead : extra.tall ? SIZE.tall : SIZE.wide),
}));


/* the posters shown in the crate at the end */
export const crateCovers = ['metal-clip', 'pizza-clip', 'dream39-clip'].map((id) => find(id).poster);
