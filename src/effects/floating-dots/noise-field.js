/**
 * Independent 2D value noise and fractal Brownian motion.
 * Copyright (c) 2026 PlonGuo. Released under the MIT License.
 *
 * A noise field is not a random number generator. Random numbers give
 * each position an unrelated value, which makes neighbouring dots move
 * in unrelated directions and reads as visual static. Value noise
 * interpolates between lattice values, so nearby positions get nearby
 * values — that continuity is what makes a group of dots flow together
 * like water rather than twitch like dust.
 *
 * This is the classic value-noise construction: hash lattice corners to
 * pseudo-random values, then smooth-interpolate between them. The hash
 * here is an integer mixer; it is not derived from any third-party
 * implementation.
 */

/** Integer hash (xorshift-style mixer) returning a float in -1..1. */
function hash2(x, y, seed) {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263 + (seed | 0) * 2246822519;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) / 4294967295) * 2 - 1;
}

/** Smoothstep-like fade. Gives the field a continuous first derivative. */
function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

const lerp = (a, b, t) => a + (b - a) * t;

/** Create a deterministic 2D value-noise function bounded to -1..1. */
export function createNoise2D(seed = 0) {
  return function noise(x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = fade(x - x0);
    const fy = fade(y - y0);
    const top = lerp(hash2(x0, y0, seed), hash2(x0 + 1, y0, seed), fx);
    const bottom = lerp(hash2(x0, y0 + 1, seed), hash2(x0 + 1, y0 + 1, seed), fx);
    return lerp(top, bottom, fy);
  };
}

/**
 * Fractal Brownian motion: sum several noise octaves at increasing
 * frequency and decreasing amplitude. One octave gives a smooth swell;
 * stacking octaves adds fine detail on top of it, which is what makes
 * the motion read as water rather than as a single slow blob.
 */
export function fbm(noise, x, y, octaves = 3, lacunarity = 2, gain = 0.5) {
  let amplitude = 1;
  let frequency = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    sum += amplitude * noise(x * frequency, y * frequency);
    norm += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return norm === 0 ? 0 : sum / norm;
}

// 3D simplex noise, a JavaScript translation of the Ashima Arts / Ian
// McEwan GLSL construction used by the reference. The third coordinate
// is time, so particles drift smoothly instead of rerolling random values.
// Copyright (C) 2011 Ashima Arts. All rights reserved.
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
// THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.
const mod289 = x => x - Math.floor(x / 289) * 289;
const permute = x => mod289((x * 34 + 1) * x);
function corner(x, y, z, ix, iy, iz) {
  const m = 0.6 - x * x - y * y - z * z;
  if (m <= 0) return 0;
  const p = permute(permute(permute(iz) + iy) + ix);
  const j = p - 49 * Math.floor(p / 49);
  const gx = Math.floor(j / 7);
  const gy = Math.floor(j - 7 * gx);
  let px = gx * (2 / 7) - 13 / 14;
  let py = gy * (2 / 7) - 13 / 14;
  const pz = 1 - Math.abs(px) - Math.abs(py);
  if (pz <= 0) {
    px -= Math.floor(px) * 2 + 1;
    py -= Math.floor(py) * 2 + 1;
  }
  const norm = 1.79284291400159 - 0.85373472095314 * (px * px + py * py + pz * pz);
  return m * m * m * m * norm * (px * x + py * y + pz * z);
}
export function simplex3D(x, y, z) {
  const skew = (x + y + z) / 3;
  let ix = Math.floor(x + skew), iy = Math.floor(y + skew), iz = Math.floor(z + skew);
  const unskew = (ix + iy + iz) / 6;
  const x0 = x - ix + unskew, y0 = y - iy + unskew, z0 = z - iz + unskew;
  const gx = x0 >= y0 ? 1 : 0, gy = y0 >= z0 ? 1 : 0, gz = z0 >= x0 ? 1 : 0;
  const ax = Math.min(gx, 1 - gz), ay = Math.min(gy, 1 - gx), az = Math.min(gz, 1 - gy);
  const bx = Math.max(gx, 1 - gz), by = Math.max(gy, 1 - gx), bz = Math.max(gz, 1 - gy);
  ix = mod289(ix); iy = mod289(iy); iz = mod289(iz);
  return 42 * (
    corner(x0, y0, z0, ix, iy, iz) +
    corner(x0 - ax + 1 / 6, y0 - ay + 1 / 6, z0 - az + 1 / 6, ix + ax, iy + ay, iz + az) +
    corner(x0 - bx + 1 / 3, y0 - by + 1 / 3, z0 - bz + 1 / 3, ix + bx, iy + by, iz + bz) +
    corner(x0 - 0.5, y0 - 0.5, z0 - 0.5, ix + 1, iy + 1, iz + 1)
  );
}
