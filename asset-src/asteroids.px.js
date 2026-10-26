// Stellar Odyssey asteroids: original art to replace the ripped ones.
// 3 sizes x 3 variants. Light comes from the top-left, like the ships.

// warm grey-brown rock: the opposite of the purple belt map, so rocks always stand out
shades("1234", "#7d6a58")     // 1 darkest -> 4 lightest
pal({ k: "#1a1218", h: "#c9b49a" })   // k = outline, h = rare highlight on sharp edges

// tiny seeded random, so the same seed always draws the same rock
function rng(seed) {
  let s = seed * 9301 + 49297
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
}

function asteroid(name, r, seed) {
  const rand = rng(seed)
  const size = r * 2 + 4
  const c = size / 2
  // lumpy outline: points around a circle, each at a slightly different distance
  const pts = []
  const n = 12 + Math.floor(r / 6)
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const d = r * (0.78 + rand() * 0.24)
    pts.push(Math.round(c + Math.cos(a) * d), Math.round(c + Math.sin(a) * d))
  }
  const items = [poly(pts, "3")]
  // light comes from a point up and to the left: the further a pixel is from it, the darker it gets.
  // distance from a point (not a straight line) curves the shadow edge around the rock, so it reads as round
  const lx = c - r * 0.6, ly = c - r * 0.6
  const far = (x, y) => Math.hypot(x - lx, y - ly)
  items.push(shade((x, y) => far(x, y) > r * 1.1 && far(x, y) < r * 1.25, 1, 0.5))   // thin dithered band at the shadow edge only
  items.push(shade((x, y) => far(x, y) >= r * 1.25, 1))
  items.push(shade((x, y) => far(x, y) > r * 1.8, 1))         // core shadow on the far side
  items.push(light((x, y) => far(x, y) < r * 0.42, 1))        // small lit patch facing the light
  // craters: dark bowl, then the floor offset down-right, which leaves a shadow on the upper-left wall
  const craters = Math.max(1, Math.floor(r / 12))
  for (let i = 0; i < craters; i++) {
    const a = rand() * Math.PI * 2, d = rand() * r * 0.5
    const cx = Math.round(c + Math.cos(a) * d), cy = Math.round(c + Math.sin(a) * d)
    const cr = Math.max(2, Math.round(r * (0.12 + rand() * 0.12)))
    items.push(clip(pts, ellipse(cx, cy, cr, Math.max(2, Math.round(cr * 0.8)), "1"),
      ellipse(cx + 1, cy + 1, cr - 1, Math.max(1, Math.round(cr * 0.8) - 1), "2"),
      px(cx + cr - 1, cy + Math.round(cr * 0.5), "4")))     // lit lower-right rim
  }
  sprite(name, { w: size, h: size, selout: "k" }, ...items)
}

// LARGE (breaks into 2 medium), MEDIUM (breaks into 2 small), SMALL
for (let i = 0; i < 3; i++) {
  asteroid("rock_l_" + i, 44, 11 + i * 7)
  asteroid("rock_m_" + i, 27, 51 + i * 5)
  asteroid("rock_s_" + i, 14, 91 + i * 3)
}
sheet("rocks", ["rock_l_*", "rock_m_*", "rock_s_*"], { pad: 6 })
