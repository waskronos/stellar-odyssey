// Dialogue portraits: the commander and your pilot. 64x64, shown at 3x in the dialogue box.
// Each one has two pictures: mouth closed and mouth open. Swapping them while the text types
// (plus a little squash and stretch in code) is what makes them look like they're talking.
// Light comes from the top-left like the rest of the game's art. Both face right, towards the text.

shades("abcd", "#b98262")          // skin, a darkest -> d lightest
shades("uvwx", "#2c3b55")          // commander's navy uniform
shades("efgh", "#6b7480")          // grey: commander's hair and moustache, pilot's helmet shell
pal({
  k: "#0b0d11",                    // outline
  Y: "#ffcc00", y: "#9a7400",      // gold (same yellow as the UI)
  T: "#3fd6c8", t: "#1d6763",      // teal (friendly colour, same as the carrier lights)
  m: "#3a1414", M: "#8c3a3a",      // mouth inside / lip
  W: "#e8f0f6",                    // eye whites, visor shine
  O: "#c4622d", o: "#7e3a1a",      // pilot's flight suit orange
})

// ---------- commander ----------
// an older officer: peaked cap, grey moustache, high collar with gold tabs, scar across the cheek
const commanderBody = [
  // shoulders and chest
  poly([2, 64, 6, 52, 18, 46, 46, 46, 58, 52, 62, 64], "v"),
  poly([2, 64, 6, 52, 14, 48, 14, 64], "u"),                // far shoulder in shadow
  rect(28, 50, 2, 14, "u"),                                 // jacket opening
  rect(40, 54, 10, 3, "Y"), rect(40, 58, 10, 2, "y"),       // medal ribbons
  // neck and high collar
  rect(25, 38, 14, 10, "b"),
  poly([20, 46, 24, 42, 40, 42, 44, 46, 40, 50, 24, 50], "w"),
  rect(22, 45, 5, 3, "Y"), rect(38, 45, 5, 3, "Y"),         // collar tabs
  // head
  ellipse(32, 27, 13, 14, "c"),
  poly([21, 34, 44, 33, 44, 39, 38, 43, 26, 43, 21, 38], "c"),   // square jaw
  poly([19, 22, 23, 22, 23, 40, 26, 43, 21, 40], "b"),      // far side of the face in shadow
  hline(26, 43, 12, "b"),                                   // under the chin
  rect(44, 27, 3, 6, "c"), px(46, 32, "b"),                 // nose
  rect(17, 26, 4, 7, "b"), px(18, 28, "a"),                 // ear
  rect(19, 20, 4, 8, "f"),                                  // grey sideburn
  // eye and brow
  rect(37, 25, 4, 2, "W"), rect(39, 25, 2, 2, "k"),
  rect(35, 22, 7, 2, "g"),
  // scar over the near cheek
  line(33, 29, 37, 34, "a"),
  // moustache
  poly([32, 37, 36, 35, 46, 35, 47, 38, 40, 38, 33, 39], "g"),
  hline(34, 38, 12, "f"),
  // cap: crown, gold band, badge, visor
  poly([15, 18, 18, 9, 30, 5, 44, 7, 50, 13, 49, 18], "v"),
  poly([18, 9, 30, 5, 36, 6, 22, 13, 16, 17], "w"),          // lit top of the crown
  rect(16, 17, 34, 3, "y"),
  rect(39, 10, 5, 5, "Y"), px(41, 12, "y"),                 // cap badge
  poly([33, 20, 50, 19, 54, 22, 36, 23], "u"),              // visor
  hline(37, 20, 14, "v"),
  light((x, y) => y < 16, 1, 0.5),                          // light only on the top of the cap
]

sprite("commander", { w: 64, h: 64, selout: "k" },
  ...commanderBody,
  hline(38, 40, 6, "a"))                                    // mouth closed: a short dark line under the moustache

sprite("commander_talk", { w: 64, h: 64, selout: "k" },
  ...commanderBody,
  rect(37, 39, 7, 4, "m"), hline(38, 43, 5, "M"))           // mouth open

// ---------- pilot ----------
// you: flight helmet with the visor pushed up, orange flight suit, teal comms light on the helmet
const pilotBody = [
  // shoulders, suit, harness straps
  poly([2, 64, 6, 52, 18, 47, 46, 47, 58, 52, 62, 64], "O"),
  poly([2, 64, 6, 52, 14, 49, 14, 64], "o"),
  line(20, 49, 28, 64, "y", 2), line(44, 49, 36, 64, "y", 2),   // harness
  rect(46, 54, 8, 5, "e"), rect(47, 55, 3, 2, "T"),         // chest radio
  // neck ring of the suit
  rect(26, 40, 13, 8, "b"),
  poly([21, 47, 25, 43, 40, 43, 44, 47], "e"),
  // face
  ellipse(33, 29, 11, 12, "c"),
  poly([23, 32, 43, 32, 42, 38, 37, 42, 29, 42, 23, 38], "c"),   // jaw
  poly([22, 24, 25, 24, 25, 39, 29, 42, 23, 39], "b"),      // far side of the face in shadow
  rect(43, 29, 3, 5, "c"), px(45, 33, "b"),                 // nose
  rect(36, 27, 4, 2, "W"), rect(38, 27, 2, 2, "k"),         // eye
  rect(35, 24, 6, 2, "a"),                                  // dark brow
  // helmet shell around the face
  poly([16, 40, 14, 22, 20, 10, 32, 5, 44, 8, 50, 16, 46, 20, 40, 18, 28, 18, 22, 24, 23, 40], "g"),
  poly([14, 22, 20, 10, 32, 5, 38, 6, 24, 12, 18, 22], "h"),  // lit top
  poly([16, 40, 23, 40, 22, 30, 15, 30], "f"),              // ear cup
  ellipse(19, 33, 3, 4, "e"),
  // yellow stripe and teal comms light
  line(20, 11, 44, 8, "Y", 2),
  rect(16, 26, 3, 3, "T"),
  // visor pushed up over the forehead
  poly([24, 18, 30, 13, 46, 13, 51, 17, 46, 20, 28, 20], "t"),
  hline(31, 15, 12, "T"), px(44, 16, "W"),
  // mic boom to the mouth
  line(20, 37, 33, 42, "e", 1), rect(33, 41, 3, 2, "f"),
  light((x, y) => y < 12, 1, 0.5),
]

sprite("pilot", { w: 64, h: 64, selout: "k" },
  ...pilotBody,
  hline(37, 38, 5, "a"))

sprite("pilot_talk", { w: 64, h: 64, selout: "k" },
  ...pilotBody,
  rect(37, 37, 5, 4, "m"), hline(38, 40, 3, "M"))

sheet("portraits", ["commander", "commander_talk", "pilot", "pilot_talk"], { pad: 4 })
