// Fixed scenes for screenshots. `?shot=editor` shows the page with photos loaded;
// `?shot=cover` (and portrait / wide) shows the cover alone. The default scene is
// the Poster Ink one — Sunset Chase, full-bleed hero, letterbox off, grain — so the
// first cover already looks like a printed comic poster. window.__shotReady is set
// once painted.
//
// Rule every scene follows (learned from the top-ranked entries): no photo may
// repeat inside one cover — each panel shows a different photo.
const SCENES = {
  cover: {
    caption: 'Sunset Chase',
    subtitle: 'Coastline Nights',
    tagline: 'EVERY STREET IS A STAGE',
    theme: 'posterink',
    panels: [
      { photo: 'sportscar', zoom: 1.0, ox: 0, oy: 0.05, filter: 'posterink' },
      { photo: 'boulevard', zoom: 1.0, ox: 0, oy: 0.5, filter: 'vivid' },
      { photo: 'skyline', zoom: 1.0, ox: 0, oy: 0.2, filter: 'neon' },
    ],
  },
  portrait: {
    caption: 'Sunset Heist',
    subtitle: 'Golden Hour Run',
    tagline: 'ONE LAST SCORE',
    theme: 'sunset',
    panels: [
      { photo: 'beach', zoom: 1.0, ox: 0, oy: 0, filter: 'sunset' },
      { photo: 'street', zoom: 1.0, ox: 0, oy: 0.3, filter: 'vivid' },
      { photo: 'pier', zoom: 1.0, ox: 0, oy: 0.22, filter: 'sunset' },
    ],
  },
  wide: {
    caption: 'Neon Run',
    subtitle: 'Midnight in Leonida',
    tagline: 'THE CITY NEVER SLEEPS',
    theme: 'neon',
    panels: [
      { photo: 'skyline', zoom: 1.0, ox: 0, oy: 0.1, filter: 'neon' },
      { photo: 'street', zoom: 1.0, ox: 0, oy: 0.3, filter: 'vivid' },
      { photo: 'sportscar', zoom: 1.0, ox: 0, oy: 0.05, filter: 'posterink' },
    ],
  },
};

export async function runShot(shot, query, state, photos, addSample, redraw, buildPanelControls) {
  const scene = SCENES[shot] || SCENES.cover;
  const caption = query.get('caption') ?? scene.caption;
  const subtitle = query.get('subtitle') ?? scene.subtitle;
  const tagline = query.get('tagline') ?? scene.tagline;
  const theme = query.get('theme') ?? scene.theme;
  const size = query.get('size') ?? (shot === 'portrait' ? '1080x1350' : shot === 'wide' ? '1920x1080' : '1080x1080');

  state.theme = theme;
  state.title = caption;
  state.subtitle = subtitle;
  state.tagline = tagline;
  state.size = size;
  state.letterbox = query.get('letterbox') === '1';
  state.grain = query.get('grain') !== '0';
  state.panels = scene.panels.map((p) => ({ ...p }));

  for (const key of ['pier', 'boulevard', 'sportscar', 'skyline', 'beach', 'street']) {
    await addSample(key);
  }

  // keep the visible controls in sync with the scene
  const titleEl = document.getElementById('title');
  if (titleEl) titleEl.value = caption;
  const subEl = document.getElementById('subtitle');
  if (subEl) subEl.value = subtitle;
  const tagEl = document.getElementById('tagline');
  if (tagEl) tagEl.value = tagline;
  const themeEl = document.getElementById('theme');
  if (themeEl) themeEl.value = theme;
  const sizeEl = document.querySelector(`input[name=size][value="${size}"]`);
  if (sizeEl) sizeEl.checked = true;

  if (shot !== 'editor') document.body.classList.add('shot-cover');
  buildPanelControls();
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
