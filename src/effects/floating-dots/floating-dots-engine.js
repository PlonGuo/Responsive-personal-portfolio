/** A self-contained Canvas 2D reconstruction of the Antigravity ring field. */
import { clamp, createRingState, projectionScale, seededRandom, stepRingPoints } from './motion.js';

const DEFAULTS = {
  background: '#000000', density: 220, particlesScale: 0.65,
  ringWidth: 0.15, ringWidth2: 0.05, ringDisplacement: 0.23,
  followSpeed: -Math.log(0.98) * 60, idleSpeed: -Math.log(0.99) * 60,
  pixelRatioCap: 2, maxParticles: 16000, seed: 20261009,
};

// Poisson sampling gives evenly spaced, irregular dots, without grid rows
// or the clumps of independent random positions. A spatial grid makes
// checking each new dot local, instead of comparing against every dot.
function createPoints(width, height, settings) {
  const projection = projectionScale(height);
  const halfX = Math.min(1, width / (2 * projection * 1.25) + 0.14);
  const halfY = Math.min(1, height / (2 * projection * 1.25) + 0.14);
  const spanX = halfX * 2, spanY = halfY * 2;
  const distance = (10 - settings.density * 8 / 300) / 250;
  const cell = distance / Math.SQRT2;
  const columns = Math.ceil(spanX / cell), rows = Math.ceil(spanY / cell);
  const grid = new Int32Array(columns * rows).fill(-1);
  const points = [], queue = [];
  const random = seededRandom(settings.seed);
  const add = (x, y) => {
    const index = points.length;
    points.push({ homeX: x - halfX, homeY: y - halfY, x: (x - halfX) * 1.25, y: (y - halfY) * 1.25, scale: 0, velocity: 0 });
    queue.push([x, y]);
    grid[Math.floor(y / cell) * columns + Math.floor(x / cell)] = index;
  };
  add(random() * spanX, random() * spanY);
  let head = 0;
  while (head < queue.length && points.length < settings.maxParticles) {
    const [baseX, baseY] = queue[head];
    let found = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      const radius = distance + random() / 250, angle = random() * Math.PI * 2;
      const x = baseX + Math.cos(angle) * radius, y = baseY + Math.sin(angle) * radius;
      if (x < 0 || x >= spanX || y < 0 || y >= spanY) continue;
      const gx = Math.floor(x / cell), gy = Math.floor(y / cell);
      let blocked = false;
      for (let row = Math.max(0, gy - 2); row <= Math.min(rows - 1, gy + 2) && !blocked; row++) {
        for (let col = Math.max(0, gx - 2); col <= Math.min(columns - 1, gx + 2); col++) {
          const index = grid[row * columns + col];
          if (index < 0) continue;
          const p = points[index];
          const dx = x - p.homeX - halfX, dy = y - p.homeY - halfY;
          if (dx * dx + dy * dy < distance * distance) { blocked = true; break; }
        }
      }
      if (!blocked) { add(x, y); found = true; break; }
    }
    if (!found) head++;
  }
  return points;
}

const ANGLES = 64, COLORS = 32, ALPHAS = 4, CELL = 16;
const toLinear = v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
const toSRGB = v => 255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);

// Cache the capsule shape, its rotation, color and opacity in one atlas.
// The frame loop only blits images, including the tiny background specks.
function createAtlas(background) {
  const atlas = document.createElement('canvas');
  atlas.width = ANGLES * CELL;
  atlas.height = COLORS * ALPHAS * CELL;
  const ctx = atlas.getContext('2d');
  // Fade blue dashes into the host theme instead of leaving black specks on white.
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1, 1);
  const backdrop = Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
  ctx.clearRect(0, 0, 1, 1);
  const colors = [[113, 137, 255], [48, 116, 249], backdrop].map(c => c.map(v => toLinear(v / 255)));
  ctx.lineCap = 'round';
  ctx.lineWidth = CELL * 0.4;
  for (let c = 0; c < COLORS; c++) {
    const progress = c / (COLORS - 1);
    const left = progress < 0.8 ? colors[0] : colors[1];
    const right = progress < 0.8 ? colors[1] : colors[2];
    const blend = progress < 0.8 ? progress / 0.8 : (progress - 0.8) / 0.2;
    const rgb = left.map((v, i) => Math.round(toSRGB(v + (right[i] - v) * blend)));
    for (let a = 0; a < ALPHAS; a++) {
      ctx.strokeStyle = `rgba(${rgb.join(',')},${(a + 1) / ALPHAS})`;
      for (let angle = 0; angle < ANGLES; angle++) {
        const theta = angle * Math.PI / ANGLES;
        const cos = Math.cos(theta), sin = Math.sin(theta);
        ctx.setTransform(cos, sin, -sin, cos, (angle + 0.5) * CELL, (c * ALPHAS + a + 0.5) * CELL);
        ctx.beginPath();
        ctx.moveTo(-CELL * 0.2, 0);
        ctx.lineTo(CELL * 0.2, 0);
        ctx.stroke();
      }
    }
  }
  return atlas;
}

export function mountFloatingDots(container, options = {}) {
  if (!(container instanceof HTMLElement)) throw new TypeError('mountFloatingDots() expects an HTMLElement.');
  const settings = { ...DEFAULTS };
  function applyOptions(partial) {
    for (const [key, value] of Object.entries(partial)) {
      if (!(key in DEFAULTS)) continue;
      if (key === 'background') { if (typeof value === 'string') settings[key] = value; }
      else if (Number.isFinite(value)) settings[key] = value;
    }
    settings.density = clamp(settings.density, 100, 290);
    settings.maxParticles = clamp(Math.round(settings.maxParticles), 1, 30000);
    settings.pixelRatioCap = clamp(settings.pixelRatioCap, 1, 3);
    settings.particlesScale = clamp(settings.particlesScale, 0.1, 3);
    settings.ringWidth = clamp(settings.ringWidth, 0.001, 0.3);
    settings.ringWidth2 = clamp(settings.ringWidth2, 0.001, 0.2);
    settings.ringDisplacement = clamp(settings.ringDisplacement, 0, 1);
    settings.followSpeed = clamp(settings.followSpeed, 0.01, 12);
    settings.idleSpeed = clamp(settings.idleSpeed, 0.01, 12);
  }
  applyOptions(options);
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Canvas 2D is unavailable.');
  container.replaceChildren(canvas);
  let atlas = createAtlas(settings.background);
  let ring = createRingState(settings.seed);
  const pointer = { x: -10000, y: -10000, active: false };
  let width = 0, height = 0, ratio = 1, points = [], elapsed = 0;
  let disposed = false, running = false, visible = true, frame = 0, previous = 0, frames = 0;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function advance(dt) {
    stepRingPoints(points, ring, { time: elapsed, width, height, settings, pointer }, dt);
  }
  function render() {
    if (disposed) return;
    context.fillStyle = settings.background;
    context.fillRect(0, 0, width, height);
    const projection = projectionScale(height);
    const particleScale = width / 2000 * settings.particlesScale;
    for (const point of points) {
      if (point.alpha < 0.01) continue;
      const x = width / 2 + point.x * projection, y = height / 2 - point.y * projection;
      // The reference point sprite is scale * 7 * DPR * 0.5. Atlas padding
      // leaves 80% occupied by the dash, hence the 1.25 correction.
      const size = point.scale * 3.5 * particleScale * 1.25;
      if (x < -size || x > width + size || y < -size || y > height + size) continue;
      const angle = ((-point.angle % Math.PI) + Math.PI) % Math.PI;
      const column = Math.round(angle / Math.PI * ANGLES) % ANGLES;
      const color = clamp(Math.round(point.color * (COLORS - 1)), 0, COLORS - 1);
      const alpha = clamp(Math.round(point.alpha * ALPHAS) - 1, 0, ALPHAS - 1);
      context.drawImage(atlas, column * CELL, (color * ALPHAS + alpha) * CELL, CELL, CELL, x - size / 2, y - size / 2, size, size);
    }
  }
  function resize() {
    if (disposed) return;
    const bounds = container.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(bounds.width)), nextHeight = Math.max(1, Math.round(bounds.height));
    const nextRatio = Math.min(window.devicePixelRatio || 1, settings.pixelRatioCap);
    if (width === nextWidth && height === nextHeight && ratio === nextRatio && points.length) return;
    width = nextWidth; height = nextHeight; ratio = nextRatio;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    points = createPoints(width, height, settings);
    // Show an established ring immediately, also for reduced-motion users.
    for (let i = 0; i < 24; i++) advance(1 / 60);
    render();
  }
  function animate(timestamp) {
    frame = 0;
    if (disposed || !running) return;
    const dt = previous ? clamp((timestamp - previous) / 1000, 0, 0.05) : 1 / 60;
    previous = timestamp;
    elapsed += dt;
    advance(dt); render(); frames++;
    frame = window.requestAnimationFrame(animate);
  }
  function start() {
    if (disposed || running || document.hidden || !visible) return;
    if (motionQuery.matches) { render(); return; }
    running = true; previous = 0;
    frame = window.requestAnimationFrame(animate);
  }
  function stop() {
    running = false;
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0; previous = 0;
  }
  function pointerMove(event) {
    if (event.pointerType === 'touch') return;
    const bounds = container.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left; pointer.y = event.clientY - bounds.top;
    pointer.active = pointer.x >= 0 && pointer.x <= width && pointer.y >= 0 && pointer.y <= height;
  }
  function pointerOut() { pointer.active = false; pointer.x = -10000; pointer.y = -10000; }
  function boundaryOut(event) { if (event.relatedTarget === null) pointerOut(); }
  function visibilityChange() { if (document.hidden) stop(); else start(); }
  function reducedMotionChange() { if (motionQuery.matches) { stop(); render(); } else start(); }
  const resizeObserver = new ResizeObserver(resize);
  const intersectionObserver = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (visible) start(); else stop();
  });
  window.addEventListener('pointermove', pointerMove, { passive: true });
  window.addEventListener('pointerleave', pointerOut, { passive: true });
  window.addEventListener('pointerout', boundaryOut, { passive: true });
  window.addEventListener('blur', pointerOut);
  document.addEventListener('visibilitychange', visibilityChange);
  motionQuery.addEventListener('change', reducedMotionChange);
  resizeObserver.observe(container); intersectionObserver.observe(container);
  resize(); start();

  return {
    canvas, ready: Promise.resolve(), start, stop, renderOnce: render,
    advanceOnce(dt) {
      if (disposed || !Number.isFinite(dt)) return;
      const step = clamp(dt, 0, 0.05);
      elapsed += step; advance(step); render(); frames++;
    },
    debugPoints: () => points.map(p => ({ x: width / 2 + p.x * projectionScale(height), y: height / 2 - p.y * projectionScale(height) })),
    stats: () => ({ count: points.length, width, height, frames, running, pointer: { ...pointer }, settings: { ...settings },
      ring: { x: ring.x, y: ring.y, radius: ring.radius, screenX: width / 2 + ring.x * projectionScale(height), screenY: height / 2 - ring.y * projectionScale(height), screenRadius: ring.radius * projectionScale(height) } }),
    setOptions(partial = {}) {
      if (disposed) return;
      const before = { ...settings };
      applyOptions(partial);
      if (settings.background !== before.background) {
        const previousAtlas = atlas;
        atlas = createAtlas(settings.background);
        previousAtlas.width = 0; previousAtlas.height = 0;
      }
      if (settings.seed !== before.seed) ring = createRingState(settings.seed);
      if (['density', 'maxParticles', 'seed', 'pixelRatioCap'].some(k => settings[k] !== before[k])) {
        points = []; resize();
      } else {
        if (!running) for (let i = 0; i < 24; i++) advance(1 / 60);
        render();
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true; stop();
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerleave', pointerOut);
      window.removeEventListener('pointerout', boundaryOut);
      window.removeEventListener('blur', pointerOut);
      document.removeEventListener('visibilitychange', visibilityChange);
      motionQuery.removeEventListener('change', reducedMotionChange);
      resizeObserver.disconnect(); intersectionObserver.disconnect();
      if (canvas.parentNode === container) canvas.remove();
      points = []; atlas.width = 0; atlas.height = 0;
    },
  };
}
