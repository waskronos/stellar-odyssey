// Stellar Odyssey gameplay music. Same key (C minor) and tempo (123 BPM) as the intro song,
// so it feels like one soundtrack. Two loops: "battle" for the waves, "boss" for the boss fight.
// Because they share a tempo the game can crossfade between them when the WARNING shows.

const BPM = 123

// ---------- instruments ----------
inst("pad", { wave: "saw", env: [0.35, 0.6, 0.7, 0.9], filter: { type: "lp", cutoff: 1300 }, vol: 0.11 })
inst("arp", { wave: "square", duty: 0.25, env: [0.002, 0.08, 0.3, 0.06], filter: { type: "lp", cutoff: 1500 }, vol: 0.09 })
inst("bass", { wave: "saw", env: [0.003, 0.09, 0.6, 0.05], filter: { type: "lp", cutoff: 650 }, vol: 0.34 })
inst("sub", { wave: "sine", env: [0.01, 0.2, 0.9, 0.2], vol: 0.3 })
inst("lead", { wave: "square", duty: 0.5, env: [0.01, 0.15, 0.65, 0.2], filter: { type: "lp", cutoff: 2200 },
  vibrato: { rate: 5.5, depth: 0.18, delay: 0.18 }, vol: 0.12 })
inst("lead_saw", { wave: "saw", env: [0.005, 0.12, 0.7, 0.15], filter: { type: "lp", cutoff: 2600 },
  vibrato: { rate: 6, depth: 0.2, delay: 0.12 }, vol: 0.1 })

// ---------- helpers: build one bar (16 steps) at a time ----------
const notes = (name, oct) => chord(name, oct).split("+")                 // "Cm" -> ["C4", "D#4", "G4"]
const hold = (token) => token + " -".repeat(15)                          // one sound held for the whole bar
const padBar = (c) => hold(chord(c, 3))
const subBar = (c) => hold(notes(c, 1)[0])
const bassBar = (c) => {                                                // pulsing 8ths: root, octave up on the offbeat
  const r = notes(c, 2)[0], up = notes(c, 3)[0]
  return [r, ".", up, ".", r, ".", up, ".", r, ".", up, ".", r, ".", up, "."].join(" ")
}
const bass16Bar = (c) => {                                              // boss: driving 16ths
  const r = notes(c, 2)[0], up = notes(c, 3)[0]
  return [r, r, up, r, r, r, up, r, r, r, up, r, r, up, r, up].join(" ")
}
const arpBar = (c) => {                                                 // up and down through the chord, 16ths
  const n = notes(c, 4), hi = notes(c, 5)
  return [n[0], n[1], n[2], hi[0], hi[1], hi[0], n[2], n[1]].concat([n[0], n[1], n[2], hi[0], hi[1], hi[0], n[2], n[1]]).join(" ")
}
const rest = ". ".repeat(16).trim()
const bars = (list, fn) => list.map(fn).join(" | ")
const times = (n, s) => Array(n).fill(s).join(" | ")

// drums, one bar each
const KICK = "X . . . x . . . X . . . x . . ."
const KICK_BOSS = "X . . x x . . . X . . x x . x ."
const SNARE = ". . . . x . . . . . . . x . . ."
const SNARE_FILL = ". . . . x . . . . . . . x . x x"
const SNARE_BOSS = ". . . . X . . x . . . . X . x x"
const HAT8 = ". . x . . . x . . . x . . . x ."
const HAT16 = "x x X x x x X x x x X x x x X x"
const TOM_FILL = ". . . . . . . . x . x . x x x x"

// ---------- harmony ----------
const A = ["Cm", "G#", "D#", "A#"]     // i VI III VII: the epic "space" progression (Ab Eb Bb written as sharps)
const B = ["Fm", "G#", "A#", "G"]      // iv VI VII V: G major pulls hard back to Cm at the loop
const BOSS = ["Cm", "C#", "Cm", "G"]   // C# (Db) = the flat-two, the darkest move in minor

// ---------- melody (one note per step, "-" holds) ----------
const MOTIF = [
  "G4 . . C5 . . D5 . D#5 - - - D5 . C5 .",      // Cm
  "D#5 - - - . . C5 . G#4 - - - G4 . G#4 .",     // Ab
  "G4 - - A#4 . . D#5 . G5 - - - F5 . D#5 .",    // Eb
  "D5 - - - F5 - - - A#4 - - - . . . .",         // Bb
]
const MOTIF_B = [
  "C5 - - G#4 . . F4 . C5 - - - D#5 . D5 .",     // Fm
  "C5 - - - D#5 - - - G#5 - - - G5 . F5 .",      // Ab
  "F5 - - - D5 - - - A#4 - - - D5 . F5 .",       // Bb
  "B4 - - - D5 - - - G5 - - - - - - -",          // G (B natural = leading note back to C)
]
const BOSS_MOTIF = [
  "C5 . C5 . D#5 . D5 . C5 . . . G4 . . .",      // Cm, same notes as the theme but stabbing
  "C#5 - - - C5 - - - G#4 - - - G4 . . .",       // Db
  "C5 . C5 . D#5 . F5 . G5 - - - D#5 . D5 .",    // Cm, climbing
  "B4 - - - D5 - - - F5 - - - G5 - - -",         // G, tension before the loop
]

// ---------- BATTLE: 48 bars = intro 8 | main 16 | break 8 | main B 16 ----------
// main B: B, B, then the original theme once (A) so the loop feels like home, then B to lead back to the start
const introChords = [...A, ...A], mainChords = [...A, ...A, ...A, ...A], breakChords = [...A, ...A], bChords = [...B, ...B, ...A, ...B]
const all = [...introChords, ...mainChords, ...breakChords, ...bChords]

song("battle", { bpm: BPM, bars: 48, vol: 0.85, fx: [filter({ type: "lp", cutoff: 7000 }), chorus({ mix: 0.25 }), reverb({ size: 0.55, mix: 0.16 }), limiter({ ceiling: 0.9 })] },
  track("pad", bars(all, padBar)),
  track("sub", bars(all, subBar)),
  track("arp", [times(4, rest), bars(A, arpBar), bars(mainChords, arpBar), times(8, rest), bars(bChords, arpBar)].join(" | ")),
  track("bass", [times(8, rest), bars(mainChords, bassBar), bars(breakChords, subBar), bars(bChords, bassBar)].join(" | ")),
  track("lead", [times(8, rest), MOTIF.join(" | "), times(4, rest), MOTIF.join(" | "), times(4, rest),
    times(8, rest), MOTIF_B.join(" | "), MOTIF_B.join(" | "), MOTIF.join(" | "), MOTIF_B.join(" | ")].join(" | ")),
  track("kick", [times(4, rest), times(4, KICK), times(16, KICK), times(8, rest), times(16, KICK)].join(" | ")),
  // snare: enters with a fill, rests in the break, then a snare roll launches the last section
  track("snare", [times(7, rest), SNARE_FILL, times(15, SNARE), SNARE_FILL, times(7, rest), TOM_FILL, times(15, SNARE), SNARE_FILL].join(" | ")),
  track("hat", [times(6, rest), times(2, HAT8), times(16, HAT8), times(8, rest), times(16, HAT16)].join(" | "), { vol: 0.35 }),
  track("tom", [times(23, rest), TOM_FILL, times(23, rest), TOM_FILL].join(" | ")),
)

// ---------- BOSS: 24 bars, same tempo (so it crossfades with battle) but HALF-TIME: grave, heavy ----------
// Half-time = the snare lands once per bar instead of twice, so 123 BPM feels like 61.
inst("brass", { wave: "fm", fm: { ratio: 1, index: 3, decay: 0.35 }, env: [0.02, 0.4, 0.5, 0.5], filter: { type: "lp", cutoff: 1600 }, vol: 0.2 })
inst("choir", { wave: "saw", env: [0.6, 0.5, 0.8, 1.2], filter: { type: "lp", cutoff: 850 }, vibrato: { rate: 4.5, depth: 0.1, delay: 0.4 }, vol: 0.11 })
inst("dark_lead", { wave: "saw", env: [0.08, 0.3, 0.75, 0.5], filter: { type: "lp", cutoff: 1400 }, vibrato: { rate: 5, depth: 0.15, delay: 0.3 }, vol: 0.13 })
inst("pulse", { wave: "triangle", env: [0.002, 0.05, 0.2, 0.05], vol: 0.12 })

const GRAVE = ["Cm", "Cm", "C#", "C#", "Cm", "Cm", "G", "G"]          // one chord per 2 bars, slow and heavy
const graveChords = [...GRAVE, ...GRAVE, ...GRAVE]                     // 24 bars
const choirBar = (c) => hold(chord(c, 3))
const brassBar = (c, i) => (i % 2 === 0 ? chord(c, 3) + "! - - - - - . . . . . . . . . ." : rest)   // stab only on each chord change
const bassGraveBar = (c) => {                                          // slow 8ths, root only, very low
  const r = notes(c, 1)[0], up = notes(c, 2)[0]
  return [r, "-", ".", ".", r, ".", up, ".", r, "-", ".", ".", r, ".", up, "."].join(" ")
}
const pulseBar = (c) => notes(c, 3).slice(0, 1).map((n) => [n, ".", n, ".", n, ".", n, ".", n, ".", n, ".", n, ".", n, "."].join(" "))[0]   // ticking clock

const KICK_HALF = "X . . . . . . . X . x . . . . ."
const SNARE_HALF = ". . . . . . . . X . . . . . . ."
const HAT_HALF = "x . x . x . x . x . x . x . x ."
const TIMPANI = "X . . . . . . . . . . . x . x x"                    // low tom rolls into each chord change

// from bar 9 the beat doubles up: same tempo, twice the drive
const KICK_DRIVE = "X . x . X . . x X . x . X . x x"
const SNARE_DRIVE = ". . . . X . . . . . . . X . . ."
const HAT_DRIVE = "x x X x x x X x x x X x x x X x"
const bassDriveBar = (c) => {                                          // 16th pulse, still very low so it stays heavy
  const r = notes(c, 1)[0], up = notes(c, 2)[0]
  return [r, r, up, r, r, r, up, r, r, r, up, r, r, up, r, up].join(" ")
}
const pulse16Bar = (c) => Array(16).fill(notes(c, 3)[0]).join(" ")   // the ticking clock speeds up too

const GRAVE_LEAD = [
  "C4 - - - - - - - G3 - - - - - - -",      // Cm
  "D#4 - - - - - - - D4 - - - C4 - - -",    // Cm
  "C#4 - - - - - - - - - - - C4 - - -",     // Db: C against Db, a half-step grind, the darkest interval
  "G#3 - - - - - - - F3 - - - - - - -",     // Db
  "C4 - - - D#4 - - - G4 - - - - - - -",    // Cm, rising
  "F4 - - - D#4 - - - D4 - - - - - - -",    // Cm
  "B3 - - - - - - - D4 - - - - - - -",      // G: B natural pulls back to C at the loop
  "G3 - - - - - - - - - - - . . . .",       // G
].join(" | ")

song("boss", { bpm: BPM, bars: 24, vol: 0.52, fx: [drive({ amount: 1.35 }), filter({ type: "lp", cutoff: 5000 }), reverb({ size: 0.8, damp: 0.55, mix: 0.24 }), limiter({ ceiling: 0.9 })] },
  track("choir", bars(graveChords, choirBar)),
  track("sub", bars(graveChords, subBar)),
  // bars 1-8: heavy half-time entrance. bars 9-24: doubled-up drive
  track("bass", [bars(graveChords.slice(0, 8), bassGraveBar), bars(graveChords.slice(8), bassDriveBar)].join(" | ")),
  track("brass", graveChords.map(brassBar).join(" | ")),
  track("pulse", [times(8, rest), bars(graveChords.slice(8), pulse16Bar)].join(" | "), { vol: 0.8 }),
  track("dark_lead", [times(8, rest), GRAVE_LEAD, GRAVE_LEAD].join(" | ")),
  track("kick", [times(8, KICK_HALF), times(16, KICK_DRIVE)].join(" | ")),
  track("snare", [times(7, SNARE_HALF), SNARE_FILL, times(15, SNARE_DRIVE), SNARE_FILL].join(" | ")),
  track("hat", [times(8, HAT_HALF), times(16, HAT_DRIVE)].join(" | "), { vol: 0.28 }),
  track("tom", graveChords.map((c, i) => (i % 2 === 1 ? TIMPANI : rest)).join(" | "), { transpose: -5 }),
)
