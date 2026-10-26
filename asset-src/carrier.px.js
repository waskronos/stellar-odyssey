// The carrier you escort. Faces right, sits on the left edge of the screen, only its front is visible.
// Same dark gunmetal as the fleet, teal lights = friendly (enemy stuff is red).

shades("abcd", "#3a424c")        // hull metal, a darkest -> d lightest
pal({
  k: "#0b0d11",                  // outline / deep gaps
  g: "#1c2128",                  // panel seams
  T: "#3fd6c8", t: "#1d6763",    // teal running lights / glow
  A: "#ffb347",                  // amber warning lights
  w: "#e8f6ff",                  // brightest light cores
})

const W = 320, H = 640, cy = H / 2

// where the hull edge is at a given x (top edge), so details can be placed just inside it
const topEdge = (x) => (x < 150 ? 20 + x * 50 / 150 : 70 + (x - 150) * 180 / 120)
const botEdge = (x) => H - topEdge(x)

// small surface details, the things that make a big ship read as big: vents and hatches
const vent = (x, y) => [rect(x, y, 14, 6, "a"), hline(x + 1, y + 2, 12, "g"), hline(x + 1, y + 4, 12, "g")]
const hatch = (x, y) => [rect(x, y, 10, 10, "a"), rect(x + 2, y + 2, 6, 6, "c")]
const turret = (x, y) => [ellipse(x, y, 9, 7, "a"), ellipse(x - 1, y - 1, 6, 4, "c"), px(x - 3, y - 3, "d"), rect(x + 6, y - 1, 12, 3, "b")]

sprite("carrier", { w: W, h: H, selout: "k" },
  // main hull: a long arrowhead, wide at the back (left edge) and tapering to the nose
  poly([0, 20, 150, 70, 270, 250, 316, cy, 270, 390, 150, 570, 0, 620], "b"),
  // raised upper and lower armour decks, a step lighter so the hull has layers
  poly([0, 60, 140, 105, 236, 250, 236, 280, 0, 272], "c"),
  poly([0, 368, 236, 360, 236, 390, 140, 535, 0, 580], "c"),
  // centre spine: the flight deck running to the nose
  rect(0, cy - 34, 290, 68, "b"),
  rect(0, cy - 30, 286, 60, "a"),
  hline(0, cy - 30, 286, "c"),                    // lit edge of the deck
  ...Array.from({ length: 12 }, (_, i) => rect(14 + i * 22, cy - 2, 8, 4, i % 2 ? "t" : "T")),   // runway guide lights
  ...Array.from({ length: 6 }, (_, i) => rect(30 + i * 44, cy - 22, 2, 8, "g")),                 // deck plate joints
  ...Array.from({ length: 6 }, (_, i) => rect(30 + i * 44, cy + 14, 2, 8, "g")),
  // hangar bay mouth at the nose: dark opening with a teal glow inside
  rect(270, cy - 22, 32, 44, "k"),
  rect(274, cy - 16, 24, 32, "t"),
  rect(280, cy - 9, 14, 18, "T"),
  rect(285, cy - 4, 5, 8, "w"),
  // bridge tower on the upper deck
  rect(66, 118, 78, 44, "c"),
  rect(72, 108, 56, 14, "d"),
  rect(90, 98, 18, 12, "c"),                       // sensor mast
  hline(76, 132, 60, "T"), hline(76, 134, 60, "t"),   // bridge windows
  // plate seams on the armour decks
  ...[170, 205, 240].map(y => hline(0, y, 190, "g")),
  ...[400, 435, 470, 505].map(y => hline(0, y, 170, "g")),
  ...[48, 104, 168].map(x => vline(x, 165, 95, "g")),
  ...[48, 104, 168].map(x => vline(x, 380, 120, "g")),
  // details
  ...vent(14, 178), ...vent(14, 212), ...vent(120, 444), ...vent(120, 478),
  ...hatch(60, 410), ...hatch(190, 196), ...hatch(16, 452),
  ...turret(185, 232), ...turret(120, 232), ...turret(185, 404), ...turret(120, 404),
  // hull number painted on the lower deck
  text(22, 516, "CV-01", "c"),
  // running lights just inside the hull edge: teal = friendly, amber at the bow
  ...[40, 100, 170, 220].map(x => rect(x, Math.round(topEdge(x)) + 6, 3, 3, "T")),
  ...[40, 100, 170, 220].map(x => rect(x, Math.round(botEdge(x)) - 9, 3, 3, "T")),
  rect(296, cy - 40, 4, 4, "A"), rect(296, cy + 36, 4, 4, "A"),
  // light from the top-left: upper half a touch lighter, lower half shadowed
  light((x, y) => y < 150 && x < 200, 1, 0.5),
  shade((x, y) => y > cy + 40, 1),
  shade((x, y) => y > cy + 190, 1, 0.5),
  glow("TwA", { r: 5, strength: 0.45 }),
)
