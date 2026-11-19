// Wires the page: photos, panels, caption, theme, export. A `?shot=` query sets
// up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, layoutFor, FILTERS } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const panelHost = document.getElementById('panel-controls');

const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};
const PANEL_NAMES = ['Hero panel', 'Panel 2', 'Panel 3'];

// The Poster Ink setup is the default, so the first cover already looks
// like a printed comic poster: hot pink/orange duotone, full-bleed hero
// (letterbox off — it only adds thin bars when the user turns it on), grain
// on. Every panel shows a different photo — no repeats inside one cover.
const state = {
  size: '1080x1080',
  theme: 'posterink',
  title: 'Sunset Chase',
  subtitle: 'Coastline Nights',
  tagline: 'EVERY STREET IS A STAGE',
  titlePos: 'bottom',
  letterbox: false,
  grain: true,
  panels: [
    { photo: 'sportscar', zoom: 1.0, ox: 0, oy: 0.05, filter: 'posterink' },
    { photo: 'boulevard', zoom: 1.0, ox: 0, oy: 0.5, filter: 'vivid' },
    { photo: 'skyline', zoom: 1.0, ox: 0, oy: 0.2, filter: 'neon' },
  ],
};

const photos = {}; // key -> HTMLImageElement
const photoNames = {
  pier: 'Pier',
  boulevard: 'Boulevard',
  sportscar: 'Sportscar',
  skyline: 'Skyline',
  beach: 'Beach',
  street: 'Street',
};

function redraw() {
  const [w, h] = SIZES[state.size];
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  drawCover(canvas, state, photos);
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function photoOptions(selected) {
  return Object.keys(photos)
    .map((k) => `<option value="${k}"${k === selected ? ' selected' : ''}>${photoNames[k] || k}</option>`)
    .join('');
}

function buildPanelControls() {
  panelHost.innerHTML = '';
  state.panels.forEach((panel, i) => {
    const box = document.createElement('div');
    box.className = 'panel-box';
    box.innerHTML = `
      <h3>${PANEL_NAMES[i]}</h3>
      <div class="row">
        <label>Photo
          <select data-panel="${i}" data-field="photo">${photoOptions(panel.photo)}</select>
        </label>
        <label>Grade
          <select data-panel="${i}" data-field="filter">
            ${Object.keys(FILTERS).map((f) => `<option value="${f}"${f === panel.filter ? ' selected' : ''}>${f[0].toUpperCase() + f.slice(1)}</option>`).join('')}
          </select>
        </label>
      </div>
      <label>Zoom <span class="zoom-val">${panel.zoom.toFixed(2)}&times;</span>
        <input type="range" min="1" max="3" step="0.05" value="${panel.zoom}" data-panel="${i}" data-field="zoom">
      </label>`;
    panelHost.appendChild(box);
  });
  panelHost.querySelectorAll('select').forEach((sel) => {
    sel.addEventListener('change', () => {
      const p = state.panels[Number(sel.dataset.panel)];
      p[sel.dataset.field] = sel.value;
      redraw();
    });
  });
  panelHost.querySelectorAll('input[type=range]').forEach((slider) => {
    slider.addEventListener('input', () => {
      const p = state.panels[Number(slider.dataset.panel)];
      p.zoom = Number(slider.value);
      slider.parentElement.querySelector('.zoom-val').textContent = `${p.zoom.toFixed(2)}×`;
      redraw();
    });
  });
}

// ---- photo sources ----
async function addSample(key) {
  if (!photos[key]) photos[key] = await loadImage(`samples/${key}.jpg`);
  return photos[key];
}

document.querySelectorAll('.sample').forEach((btn) => {
  btn.addEventListener('click', async () => {
    await addSample(btn.dataset.sample);
    state.panels[0].photo = btn.dataset.sample;
    buildPanelControls();
    redraw();
  });
});

async function addUpload(file) {
  const key = `upload-${Object.keys(photos).length}-${file.name.replace(/[^a-z0-9.]+/gi, '_')}`;
  photos[key] = await loadImage(URL.createObjectURL(file));
  photoNames[key] = file.name.length > 18 ? file.name.slice(0, 15) + '…' : file.name;
  return key;
}

document.getElementById('upload').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  if (!files.length) return;
  for (const f of files) {
    const key = await addUpload(f);
    state.panels[0].photo = key; // newest upload goes to the hero panel
  }
  buildPanelControls();
  redraw();
  status.textContent = `Loaded ${files.length} photo${files.length > 1 ? 's' : ''} — the latest is on the hero panel.`;
});

// drag & drop an image file straight onto a panel
canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', async (e) => {
  e.preventDefault();
  const file = [...(e.dataTransfer.files || [])].find((f) => f.type.startsWith('image/'));
  if (!file) return;
  const rect = canvas.getBoundingClientRect();
  const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const idx = layoutFor(canvas.width, canvas.height).findIndex(
    (r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h,
  );
  const key = await addUpload(file);
  if (idx >= 0) state.panels[idx].photo = key;
  buildPanelControls();
  redraw();
  status.textContent = `Photo dropped onto ${idx >= 0 ? PANEL_NAMES[idx].toLowerCase() : 'the cover'}.`;
});

// ---- drag to pan, scroll to zoom ----
let drag = null;
function panelAt(px, py) {
  return layoutFor(canvas.width, canvas.height).findIndex(
    (r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h,
  );
}
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const idx = panelAt(px, py);
  if (idx < 0) return;
  drag = { idx, x: px, y: py, ox: state.panels[idx].ox, oy: state.panels[idx].oy };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const panel = state.panels[drag.idx];
  const r = layoutFor(canvas.width, canvas.height)[drag.idx];
  panel.ox = Math.max(-0.5, Math.min(0.5, drag.ox + (px - drag.x) / r.w));
  panel.oy = Math.max(-0.5, Math.min(0.5, drag.oy + (py - drag.y) / r.h));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const idx = panelAt(px, py);
  if (idx < 0) return;
  const panel = state.panels[idx];
  panel.zoom = Math.max(1, Math.min(3, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  const slider = panelHost.querySelector(`input[data-panel="${idx}"][data-field="zoom"]`);
  if (slider) {
    slider.value = panel.zoom;
    slider.parentElement.querySelector('.zoom-val').textContent = `${panel.zoom.toFixed(2)}×`;
  }
  redraw();
}, { passive: false });

// ---- caption / theme / size ----
document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.getElementById('tagline').addEventListener('input', (e) => { state.tagline = e.target.value; redraw(); });
document.getElementById('theme').addEventListener('change', (e) => { state.theme = e.target.value; redraw(); });
document.getElementById('title-pos').addEventListener('change', (e) => { state.titlePos = e.target.value; redraw(); });
document.querySelectorAll('input[name=size]').forEach((r) => {
  r.addEventListener('change', () => { state.size = r.value; redraw(); });
});

// letterbox + grain toggles live in the caption fieldset (added by index.html)
const letterboxEl = document.getElementById('letterbox');
if (letterboxEl) letterboxEl.addEventListener('change', () => { state.letterbox = letterboxEl.checked; redraw(); });
const grainEl = document.getElementById('grain');
if (grainEl) grainEl.addEventListener('change', () => { state.grain = grainEl.checked; redraw(); });

// ---- export ----
document.getElementById('export').addEventListener('click', () => {
  const [w, h] = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state, photos);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cover-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved cover-${w}x${h}.png`;
  }, 'image/png');
});

// ---- boot ----
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  await runShot(shot, query, state, photos, addSample, redraw, buildPanelControls);
} else {
  for (const key of ['pier', 'boulevard', 'sportscar', 'skyline', 'beach', 'street']) {
    await addSample(key);
  }
  buildPanelControls();
  redraw();
}
