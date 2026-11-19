// Draws the cover: a multi-panel poster. The hero panel is a full-bleed film
// still — teal-orange grade, no dead black space at the top — and the title
// band is a hot sunset sky with halftone dots, neon framing, a tilted glowing
// title, a skyline ribbon that breaks across the panel seam, and a sticker
// badge. All artwork is drawn here in code; no Rockstar logo, artwork or
// fonts are used.

export const THEMES = {
  cinema: {
    band: ['#1d0b3d', '#ff2d78', '#ff9e2e'],
    title: '#ffffff',
    titleGrad: ['#ffffff', '#ffe9a8'],
    accent: '#00e5c0',
    kicker: '#ffd319',
    sun: '#ffd319',
    skyline: '#160a24',
  },
  sunset: {
    band: ['#ff2d78', '#ff7e2e', '#ffd319'],
    title: '#ffffff',
    titleGrad: ['#ffffff', '#ffe3f0'],
    accent: '#ffd319',
    kicker: '#ffe9a8',
    sun: '#fff3b0',
    skyline: '#2b0a3a',
  },
  neon: {
    band: ['#150833', '#5b2ee5', '#ff2d95'],
    title: '#ffffff',
    titleGrad: ['#ffffff', '#9ff5e8'],
    accent: '#00f5d4',
    kicker: '#ff5ce1',
    sun: '#ff5ce1',
    skyline: '#08041c',
  },
  night: {
    band: ['#0b0b1e', '#1b2a52', '#3a2a6e'],
    title: '#ffe9a8',
    titleGrad: ['#ffe9a8', '#ffffff'],
    accent: '#ff5e3a',
    kicker: '#ffb37a',
    sun: '#ffd9a0',
    skyline: '#050510',
  },
  // Poster Ink: the cover's signature comic-book grade — hot pink / orange
  // duotone, hard contrast, halftone dots. The default theme.
  posterink: {
    band: ['#2b0a3a', '#ff2d78', '#ffb020'],
    title: '#ffffff',
    titleGrad: ['#ffffff', '#ffd319'],
    accent: '#00e5ff',
    kicker: '#ffe9a8',
    sun: '#ff5ce1',
    skyline: '#160a24',
  },
};

export const FILTERS = {
  none: '',
  cinema: 'saturate(1.28) contrast(1.18) sepia(0.16) hue-rotate(-8deg) brightness(1.02)',
  sunset: 'saturate(1.35) contrast(1.08) sepia(0.28) hue-rotate(-12deg)',
  neon: 'saturate(1.8) contrast(1.15) hue-rotate(18deg) brightness(1.05)',
  noir: 'grayscale(1) contrast(1.25) brightness(0.95)',
  vivid: 'saturate(1.6) contrast(1.1)',
  // Poster Ink: blown-out duotone pink/orange, hard comic contrast. The
  // halftone dot overlay is painted on top by drawPanel.
  posterink: 'saturate(2.1) contrast(1.55) sepia(0.32) hue-rotate(-14deg) brightness(1.04)',
};

/** Panel rectangles for a cover of size w x h. Returns [hero, lower-left, lower-right].
 *  The photo area is full-bleed at the top: the hero (and, in the wide layout,
 *  the side column) starts at y = 0, so no dead black space ever sits above a
 *  photo. The only dark backdrop left is the thin side frame and the gutters. */
export function layoutFor(w, h) {
  const wide = w > h;
  const frame = Math.round(Math.min(w, h) * 0.022);
  const gut = Math.round(Math.min(w, h) * 0.012);
  const bandH = Math.round(h * 0.17);
  const bandY = h - bandH;
  if (wide) {
    const heroW = Math.round(w * 0.60);
    const half = Math.round((bandY - gut) / 2);
    return [
      { x: frame, y: 0, w: heroW - frame - gut, h: bandY },
      { x: heroW + gut, y: 0, w: w - heroW - frame - gut, h: half },
      { x: heroW + gut, y: half + gut, w: w - heroW - frame - gut, h: bandY - half - gut },
    ];
  }
  const heroH = Math.round(bandY * (h > w ? 0.54 : 0.58));
  const rowY = heroH + gut;
  const rowH = bandY - rowY;
  const half = Math.round((w - frame * 2 - gut) / 2);
  return [
    { x: frame, y: 0, w: w - frame * 2, h: heroH },
    { x: frame, y: rowY, w: half, h: rowH },
    { x: frame + half + gut, y: rowY, w: half, h: rowH },
  ];
}

/** Deterministic pseudo-random from a seed, so the skyline is stable per render. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Draws a self-drawn skyline: blocky towers with lit windows and palm trees. */
export function drawSkyline(ctx, x, y, w, h, color) {
  const rand = rng(20261119);
  ctx.save();
  ctx.fillStyle = color;
  let cx = x;
  while (cx < x + w) {
    const bw = w * (0.05 + rand() * 0.07);
    const bh = h * (0.35 + rand() * 0.6);
    const by = y + h - bh;
    ctx.fillRect(cx, by, bw, bh);
    // rooftop antenna
    if (rand() > 0.55) ctx.fillRect(cx + bw / 2 - 1, by - h * 0.22, 2, h * 0.22);
    // lit windows
    ctx.fillStyle = 'rgba(255, 211, 25, 0.75)';
    for (let wy = by + h * 0.08; wy < y + h - h * 0.06; wy += h * 0.14) {
      for (let wx = cx + bw * 0.18; wx < cx + bw - bw * 0.18; wx += bw * 0.3) {
        if (rand() > 0.55) ctx.fillRect(wx, wy, Math.max(2, bw * 0.09), Math.max(2, h * 0.05));
      }
    }
    ctx.fillStyle = color;
    // palm tree between towers
    if (rand() > 0.45) {
      const px = cx + bw + w * 0.012;
      const ph = h * (0.55 + rand() * 0.3);
      const topY = y + h - ph;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, w * 0.004);
      ctx.beginPath();
      ctx.moveTo(px, y + h);
      ctx.quadraticCurveTo(px + w * 0.006, topY + ph * 0.5, px + w * 0.01, topY);
      ctx.stroke();
      ctx.lineWidth = Math.max(1.5, w * 0.0025);
      for (let f = 0; f < 6; f++) {
        const a = Math.PI * (0.08 + f * 0.17);
        const fx = px + w * 0.01 + Math.cos(a) * w * 0.028 * (f % 2 ? 1 : -1);
        const fy = topY + Math.sin(a) * h * 0.16 + h * 0.05;
        ctx.beginPath();
        ctx.moveTo(px + w * 0.01, topY);
        ctx.quadraticCurveTo((px + w * 0.01 + fx) / 2, topY - h * 0.06, fx, fy);
        ctx.stroke();
      }
      ctx.strokeStyle = color;
    }
    cx += bw + w * 0.012;
  }
  ctx.restore();
}

/** Neon L-brackets on a panel's four corners — the poster's signature detail. */
function cornerAccents(ctx, rect, color) {
  const L = Math.max(12, Math.round(Math.min(rect.w, rect.h) * 0.09));
  const lw = Math.max(3, Math.round(Math.min(rect.w, rect.h) * 0.008));
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  const corners = [
    [rect.x, rect.y, 1, 1],
    [rect.x + rect.w, rect.y, -1, 1],
    [rect.x, rect.y + rect.h, 1, -1],
    [rect.x + rect.w, rect.y + rect.h, -1, -1],
  ];
  for (const [cx, cy, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx + sx * L, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + sy * L);
    ctx.stroke();
  }
  ctx.restore();
}

/** Round sticker badge ("LEONIDA / EST. 2026"), tilted like a pasted sticker. */
function drawBadge(ctx, x, y, r, theme) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.21);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = Math.max(3, r * 0.07);
  ctx.strokeStyle = theme.accent;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#160a24';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.round(r * 0.32)}px "Arial Narrow", sans-serif`;
  ctx.fillText('LEONIDA', 0, -r * 0.16);
  ctx.font = `700 ${Math.round(r * 0.2)}px "Arial Narrow", sans-serif`;
  ctx.fillText('EST. 2026', 0, r * 0.22);
  ctx.restore();
}

let noiseTile = null;
function grainTile() {
  if (noiseTile) return noiseTile;
  const t = document.createElement('canvas');
  t.width = 128;
  t.height = 128;
  const c = t.getContext('2d');
  const img = c.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  noiseTile = t;
  return t;
}

function drawPanel(ctx, rect, panel, photos) {
  const img = photos[panel.photo];
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (img) {
    const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
    const scale = base * (panel.zoom || 1);
    const pw = img.naturalWidth * scale;
    const ph = img.naturalHeight * scale;
    const ox = (panel.ox || 0) * rect.w;
    const oy = (panel.oy || 0) * rect.h;
    // Clamp the pan so the photo always covers the whole panel: a large pan
    // must never expose the backdrop as a black bar inside a panel.
    const dx = Math.max(rect.x + rect.w - pw, Math.min(rect.x, rect.x + (rect.w - pw) / 2 + ox));
    const dy = Math.max(rect.y + rect.h - ph, Math.min(rect.y, rect.y + (rect.h - ph) / 2 + oy));
    ctx.filter = FILTERS[panel.filter] || '';
    ctx.drawImage(img, dx, dy, pw, ph);
    ctx.filter = 'none';
    // Poster Ink: halftone dot screen + a hot-pink wash over the graded
    // photo, so the panel reads as printed comic ink, not a plain photo.
    if (panel.filter === 'posterink') {
      ctx.fillStyle = 'rgba(255, 45, 120, 0.06)';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      const gap = Math.max(7, Math.round(Math.min(rect.w, rect.h) * 0.022));
      ctx.fillStyle = 'rgba(12, 4, 26, 0.16)';
      for (let py = rect.y + gap / 2; py < rect.y + rect.h; py += gap) {
        for (let px = rect.x + gap / 2; px < rect.x + rect.w; px += gap) {
          ctx.beginPath();
          ctx.arc(px, py, Math.max(1, gap * 0.16), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } else {
    ctx.fillStyle = '#241a33';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  // gentle bottom shade so the panel reads as one graded photograph
  const shade = ctx.createLinearGradient(0, rect.y + rect.h * 0.55, 0, rect.y + rect.h);
  shade.addColorStop(0, 'rgba(10, 8, 24, 0)');
  shade.addColorStop(1, 'rgba(10, 8, 24, 0.35)');
  ctx.fillStyle = shade;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/**
 * Draws the whole cover onto `canvas`.
 * state: { panels: [{photo, zoom, ox, oy, filter} x3], title, subtitle, theme,
 *          titlePos: 'bottom'|'top', letterbox, grain }
 * photos: { key: HTMLImageElement }
 */
export function drawCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const theme = THEMES[state.theme] || THEMES.cinema;
  const rects = layoutFor(w, h);
  const frame = Math.round(Math.min(w, h) * 0.022);

  // backdrop + frame (deep violet, not black — only the thin side frame and
  // the gutters show it; the top is full-bleed photo)
  ctx.fillStyle = '#170b28';
  ctx.fillRect(0, 0, w, h);

  // hero panel first so the title band can overlap its foot if needed
  drawPanel(ctx, rects[0], state.panels[0], photos);
  drawPanel(ctx, rects[1], state.panels[1], photos);
  drawPanel(ctx, rects[2], state.panels[2], photos);

  // white gutters / panel borders, poster style
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, Math.round(Math.min(w, h) * 0.006));
  for (const r of rects) ctx.strokeRect(r.x, r.y, r.w, r.h);

  // neon corner accents on every panel — the poster's signature detail
  for (const r of rects) cornerAccents(ctx, r, theme.accent);

  // letterbox bars on the hero panel: a slim cinematic frame, not a dead band
  if (state.letterbox) {
    const barH = Math.round(rects[0].h * 0.045);
    ctx.fillStyle = '#000000';
    ctx.fillRect(rects[0].x, rects[0].y, rects[0].w, barH);
    ctx.fillRect(rects[0].x, rects[0].y + rects[0].h - barH, rects[0].w, barH);
  }

  // skyline silhouette along the foot of the hero panel
  const skyH = Math.round(rects[0].h * 0.16);
  drawSkyline(ctx, rects[0].x, rects[0].y + rects[0].h - skyH, rects[0].w, skyH, 'rgba(12, 6, 22, 0.92)');

  // ---- title band: sunset sky, sun, skyline ----
  const bandH = Math.round(h * 0.17);
  const bandY = state.titlePos === 'top' ? 0 : h - bandH;
  // skyline ribbon straddling the seam above the band: its towers rise out of
  // the photos and dive behind the band, so the panels visibly overlap
  const ribbonH = Math.round(bandH * 0.55);
  drawSkyline(ctx, 0, bandY - ribbonH * 0.45, w, ribbonH, 'rgba(10, 4, 20, 0.95)');
  const sky = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  sky.addColorStop(0, theme.band[0]);
  sky.addColorStop(0.55, theme.band[1]);
  sky.addColorStop(1, theme.band[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, bandY, w, bandH);
  // halftone dot texture over the sunset sky, growing toward the bottom-right
  const dotGap = Math.max(10, Math.round(bandH * 0.11));
  for (let dy = bandY + dotGap * 0.6; dy < bandY + bandH; dy += dotGap) {
    for (let dx = dotGap * 0.6; dx < w; dx += dotGap) {
      const t = ((dy - bandY) / bandH) * 0.7 + (dx / w) * 0.3;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.beginPath();
      ctx.arc(dx, dy, Math.max(1, dotGap * 0.15 * t + 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Glowing sun, low and tight to the right edge. Its disc is placed so it
  // always clears the centred title: the title may reach 0.88w, the disc
  // starts past 0.89w, whatever the cover size.
  const sunR = bandH * 0.33;
  const sunX = Math.max(w - frame - sunR * 0.55, w * 0.88 + sunR + Math.round(w * 0.01));
  const sunY = bandY + bandH * 0.52;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.1);
  glow.addColorStop(0, theme.sun);
  glow.addColorStop(0.35, theme.sun + '55');
  glow.addColorStop(1, theme.sun + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - sunR * 2.2, sunY - sunR * 2.2, sunR * 4.4, sunR * 4.4);
  ctx.fillStyle = theme.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  // Tagline strip along the bottom edge of the band (HEATWAVE-style
  // "IN STORES SOMEWHERE SOON" strip). When a tagline is set it replaces
  // the band skyline so the strip text stays clean and legible.
  const tagline = (state.tagline || '').trim();
  if (tagline) {
    const stripH = Math.round(bandH * 0.15);
    ctx.fillStyle = '#0a0414';
    ctx.fillRect(0, bandY + bandH - stripH, w, stripH);
    ctx.fillStyle = theme.accent;
    ctx.fillRect(0, bandY + bandH - stripH, w, Math.max(2, Math.round(h * 0.002)));
    ctx.fillStyle = theme.kicker;
    ctx.font = `700 ${Math.round(stripH * 0.5)}px "Arial Narrow", "Helvetica Neue", sans-serif`;
    try { ctx.letterSpacing = `${Math.round(w * 0.004)}px`; } catch { /* ignore */ }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagline.toUpperCase(), w / 2, bandY + bandH - stripH / 2 + Math.round(stripH * 0.04));
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  } else {
    // skyline along the bottom edge of the band — kept short (0.16 of the
    // band) so it stays below the subtitle instead of crossing the text
    const bandSkyH = Math.round(bandH * 0.16);
    drawSkyline(ctx, 0, bandY + bandH - bandSkyH, w, bandSkyH, theme.skyline);
  }
  // neon frame around the band: thick accent stripe + thin white pinline on
  // top, accent line along the bottom edge
  const stripeH = Math.max(4, Math.round(h * 0.006));
  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, bandY, w, stripeH);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillRect(0, bandY + stripeH + 2, w, 2);
  const bottomLineH = Math.max(3, Math.round(h * 0.003));
  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, bandY + bandH - bottomLineH, w, bottomLineH);

  // ---- typography: kicker, big title, subtitle ----
  const cx = w / 2;
  const kicker = 'A LEONIDA STORY';
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = `${Math.round(w * 0.006)}px`; } catch { /* older canvas */ }
  ctx.fillStyle = theme.kicker;
  ctx.font = `700 ${Math.round(bandH * 0.13)}px "Arial Narrow", "Helvetica Neue", sans-serif`;
  ctx.fillText(kicker, cx, bandY + bandH * 0.14);
  try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  if (title) {
    let size = Math.round(bandH * 0.5);
    const condensed = `"Arial Narrow", "HelveticaNeue-CondensedBold", "Franklin Gothic Medium", sans-serif`;
    ctx.font = `900 ${size}px ${condensed}`;
    while (ctx.measureText(title).width > w * 0.74 && size > 10) {
      size -= 2;
      ctx.font = `900 ${size}px ${condensed}`;
    }
    // big, tilted, glowing: the title leans -1.6deg for energy, with a thick
    // dark outline for legibility and a hot-pink neon glow behind it
    ctx.save();
    ctx.translate(cx, bandY + bandH * 0.47);
    ctx.rotate(-0.028);
    const grad = ctx.createLinearGradient(0, -size * 0.55, 0, size * 0.55);
    grad.addColorStop(0, theme.titleGrad[0]);
    grad.addColorStop(1, theme.titleGrad[1]);
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(255, 45, 120, 0.6)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.05;
    ctx.strokeStyle = 'rgba(10, 4, 20, 0.9)';
    ctx.lineWidth = Math.max(2, size * 0.055);
    ctx.strokeText(title, 0, 0);
    ctx.fillText(title, 0, 0);
    ctx.restore();
  }
  if (subtitle) {
    // Neon script subtitle under the big gradient title — the cover's
    // signature line, drawn in a cursive hand with a neon glow.
    ctx.save();
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = Math.round(bandH * 0.09);
    ctx.fillStyle = '#ffffff';
    ctx.font = `italic 700 ${Math.round(bandH * 0.17)}px "Brush Script MT", "Segoe Script", "Snell Roundhand", cursive`;
    ctx.fillText(subtitle, cx, bandY + bandH * (tagline ? 0.71 : 0.79));
    ctx.restore();
  }

  // sticker badge overlapping the hero's top-right corner
  const badgeR = Math.round(Math.min(w, h) * 0.088);
  drawBadge(ctx, w - badgeR, badgeR, badgeR, theme);

  // ---- film grain + vignette over the whole cover ----
  if (state.grain !== false) {
    ctx.save();
    ctx.globalAlpha = state.theme === 'cinema' || state.theme === 'posterink' ? 0.085 : 0.06;
    ctx.globalCompositeOperation = 'overlay';
    const tile = grainTile();
    const pat = ctx.createPattern(tile, 'repeat');
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(5, 2, 12, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}
