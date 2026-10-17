import { simplex3D } from './noise-field.js';

export const MAX_DT = 0.05;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export function smoothstep(a, b, value) {
  const t = clamp((value - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function createRingState(seed = 20261009) {
  const random = seededRandom(seed);
  return { x: 0, y: 0, radius: 0.175, noise: Array.from({ length: 256 }, random) };
}
function idleNoise(table, time) {
  const floor = Math.floor(time);
  const i = ((floor % 255) + 255) % 255;
  const t = smoothstep(0, 1, time - floor);
  return (table[i] + (table[(i + 1) % 255] - table[i]) * t - 0.5) * 2;
}

// The reference camera has a 40 degree field of view, sits at z=3.1,
// and displays a plane scaled by 5. Coordinates here are in that plane,
// which keeps the ring circular at every canvas aspect ratio.
export function projectionScale(height) {
  return height * 5 / (2 * Math.tan(Math.PI / 9) * 3.1);
}

export function stepRingPoints(points, ring, { time, width, height, settings, pointer }, dt) {
  const step = clamp(dt, 0, MAX_DT);
  if (step === 0) return;
  const frames = step * 60;
  const nx = idleNoise(ring.noise, time * 0.66 + 94.234);
  const ny = idleNoise(ring.noise, time * 0.75 + 21.028);
  const projection = projectionScale(Math.max(1, height));
  let targetX = nx * 0.2, targetY = ny * 0.1;
  if (pointer.active) {
    targetX = (pointer.x - width / 2) / projection * 0.875 + nx * 0.1;
    targetY = (height / 2 - pointer.y) / projection * 0.875 + ny * 0.1;
  }
  const follow = 1 - Math.exp(-(pointer.active ? settings.followSpeed : settings.idleSpeed) * step);
  ring.x += (targetX - ring.x) * follow;
  ring.y += (targetY - ring.y) * follow;
  ring.radius = 0.175 + Math.sin(time) * 0.03 + Math.cos(time * 3) * 0.02;
  const t = time * 0.5;
  const positionBlend = 1 - Math.pow(0.2, frames);
  const scaleBlend = 1 - Math.pow(0.8, frames);
  const velocityBlend = 1 - Math.pow(0.5, frames);
  for (const point of points) {
    const x = point.homeX, y = point.homeY;
    const distance = Math.hypot(x - ring.x, y - ring.y);
    const noise0 = simplex3D(x * 0.2 + 18.4924, y * 0.2 + 72.9744, t * 0.5) * 0.005;
    const distance1 = Math.hypot(x + noise0 - ring.x, y + noise0 - ring.y);
    const band = w => Math.max(0,
      smoothstep(ring.radius - w * 2, ring.radius, distance) -
      smoothstep(ring.radius, ring.radius + w, distance1));
    const broad = band(settings.ringWidth);
    const rim = Math.pow(band(settings.ringWidth2), 3);
    const inside = smoothstep(ring.radius + settings.ringWidth2, ring.radius, distance);
    const swell = simplex3D(x * 2 + 18.4924, y * 2 + 72.9744, t * 0.5);
    const scale = broad * broad + rim * 3 + inside * 0.4 +
      simplex3D(x * 30 + 11.4924, y * 30 + 12.9744, t * 0.5) * inside * 0.5 +
      Math.pow((swell + 1.5) * 0.5, 2) * 0.6;
    const wave = Math.min(distance, 1) * 0.02;
    const dx = simplex3D(x * 4 + 88.494, y * 4 + 32.4397, t * 0.35) * 0.03 +
      simplex3D(x * 20 + 18.4924, y * 20 + 72.9744, t * 0.5) * 0.005 + Math.sin(x * 20 + t * 4) * wave;
    const dy = simplex3D(x * 4 + 50.904, y * 4 + 120.947, t * 0.35) * 0.03 +
      simplex3D(x * 20 + 50.904, y * 20 + 120.947, t * 0.5) * 0.005 + Math.cos(y * 20 + t * 3) * wave;
    const push = Math.pow(rim, 0.75) * settings.ringDisplacement * 0.25;
    const targetPX = (x + dx + (x + dx - ring.x) * push) / 0.8;
    const targetPY = (y + dy + (y + dy - ring.y) * push) / 0.8;
    point.x += (targetPX - point.x) * positionBlend;
    point.y += (targetPY - point.y) * positionBlend;
    point.scale += (Math.max(0, scale) - point.scale) * scaleBlend;
    point.velocity += (point.scale * 0.5 - point.velocity) * velocityBlend;
    point.angle = Math.atan2(point.y - ring.y, point.x - ring.x) -
      simplex3D(point.x * 10 + 18.4924, point.y * 10 + 72.9744, time * 0.85) * 0.5;
    const colorNoise = (simplex3D(point.x * 2 + 74.664, point.y * 2 + 91.556, time * 0.5) + 1) * 0.5;
    point.color = smoothstep(0, 0.75, colorNoise * colorNoise);
    point.alpha = smoothstep(0.1, 0.2, point.scale);
  }
}
