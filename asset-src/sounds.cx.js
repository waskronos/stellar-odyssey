// Stellar Odyssey sound pack, made with chirp.
// Every sound here is synthesized from code: original, nothing to credit.

// ---------- WEAPONS ----------

// Missile launch: click + thump (leaves the rack), ignition hiss (motor lights), whoosh (flies off).
// Mostly noise, not a note: a pitched tone is what made the old one sound like a "boing".
sfx("missile_launch", { vol: 1.35, fx: [drive({ amount: 1.4 }), reverb({ size: 0.35, mix: 0.12 }), limiter({ ceiling: 0.9 })] },
  noise({ color: "white", dur: 0.015, env: [0.001, 0.012, 0, 0.01], filter: { type: "hp", cutoff: 2500 }, vol: 0.6 }),    // rack release click
  tone({ wave: "sine", freq: 90, to: 50, slide: 0.06, dur: 0.06, env: [0.001, 0.04, 0.2, 0.04], vol: 0.4 }),              // short soft thump, so it never sounds like a boing
  at(0.02, noise({ color: "white", dur: 0.25, env: [0.02, 0.1, 0.6, 0.15],
    filter: { type: "bp", from: 900, to: 3200, q: 1.2 }, vol: 0.7 })),                                                       // ignition hiss, brightening
  at(0.05, noise({ color: "pink", dur: 0.55, env: [0.03, 0.2, 0.5, 0.35],
    filter: { type: "lp", from: 5000, to: 500 }, vol: 0.6 })))                                                                // whoosh, darkening as it leaves
sfx("missile_launch_2", { base: "missile_launch", pitch: 1.5 })   // slight variant, alternate them so repeats dont sound copied

// ---------- SHIP MOVEMENT (cutscenes) ----------

// Fly in: approaching roar that rises in pitch and brightness, then a braking thump as it settles.
sfx("ship_flyin", { vol: 1.1, fx: [reverb({ size: 0.5, mix: 0.18 }), limiter({ ceiling: 0.9 })] },
  noise({ color: "pink", dur: 1.25, env: [0.9, 0.2, 0.7, 0.3], filter: { type: "lp", from: 300, to: 4500 }, vol: 0.7 }),
  tone({ wave: "saw", freq: 55, to: 120, slide: 1.2, dur: 1.25, env: [0.8, 0.2, 0.6, 0.3],
    filter: { type: "lp", from: 200, to: 1400 }, vol: 0.35 }),
  at(1.2, tone({ wave: "sine", freq: 140, to: 60, slide: 0.18, dur: 0.18, env: [0.002, 0.1, 0.3, 0.15], vol: 0.8 })),     // brake thump
  at(1.2, noise({ color: "brown", dur: 0.3, env: [0.002, 0.1, 0.3, 0.3], filter: { type: "lp", cutoff: 1200 }, vol: 0.5 })))

// Fly out (ending): engines punch, pitch climbs as it accelerates, then fades and darkens into the distance.
sfx("ship_flyout", { vol: 1.2, fx: [reverb({ size: 0.6, mix: 0.2 }), limiter({ ceiling: 0.9 })] },
  tone({ wave: "sine", freq: 90, to: 50, slide: 0.15, dur: 0.15, env: [0.002, 0.1, 0.3, 0.1], vol: 0.7 }),                // ignition kick
  tone({ wave: "saw", freq: 60, to: 210, slide: 1.4, dur: 1.6, env: [0.05, 0.3, 0.7, 0.8],
    filter: { type: "lp", from: 500, to: 2500 }, vol: 0.3 }),
  noise({ color: "pink", dur: 1.7, env: [0.1, 0.4, 0.6, 0.8], filter: { type: "lp", from: 6000, to: 400 }, vol: 0.65 }))

// ---------- MISSION DECK ----------

// Door locks release: heavy metal clunk, then a hiss of pressure escaping.
sfx("door_unlock", { vol: 1.1, fx: [reverb({ size: 0.7, mix: 0.25 }), limiter({ ceiling: 0.9 })] },
  tone({ wave: "fm", freq: 95, fm: { ratio: 3.5, index: 5, decay: 0.12 }, dur: 0.15, env: [0.001, 0.1, 0.2, 0.15], vol: 0.6 }),   // metal clunk
  tone({ wave: "sine", freq: 70, to: 40, slide: 0.15, dur: 0.15, env: [0.001, 0.1, 0.2, 0.1], vol: 0.7 }),
  noise({ color: "white", dur: 0.02, env: [0.001, 0.015, 0, 0.01], filter: { type: "bp", cutoff: 1800, q: 2 }, vol: 0.5 }),
  at(0.08, noise({ color: "white", dur: 0.7, env: [0.01, 0.15, 0.5, 0.5], filter: { type: "bp", from: 2500, to: 4500, q: 0.8 }, vol: 0.2 })))   // steam hiss, softer and less piercing

// Doors sliding: a servo whir that speeds up then slows down, matching the smoothstep slide (about 1.7s).
sfx("door_slide", { vol: 1.2, fx: [reverb({ size: 0.6, mix: 0.2 }), limiter({ ceiling: 0.9 })] },
  tone({ wave: "saw", freq: 80, to: 130, slide: 0.8, dur: 1.6, env: [0.2, 0.4, 0.6, 0.3],
    filter: { type: "lp", cutoff: 700 }, vibrato: { rate: 18, depth: 0.15 }, vol: 0.35 }),
  noise({ color: "brown", dur: 1.6, env: [0.2, 0.4, 0.5, 0.3], filter: { type: "lp", cutoff: 500 }, vol: 0.45 }),
  at(1.6, tone({ wave: "fm", freq: 70, fm: { ratio: 2.7, index: 3, decay: 0.1 }, dur: 0.1, env: [0.001, 0.08, 0.1, 0.1], vol: 0.45 })))   // stop thud

// Hangar room tone: a quiet loop for the mission deck (vents, power hum, air). Ambient, not music.
sfx("deck_ambience", { dur: 6, loop: true, vol: 0.4 },
  tone({ wave: "sine", freq: 50, dur: 6.5, tremolo: { rate: 0.3, depth: 0.25 }, vol: 0.4 }),               // power hum
  tone({ wave: "sine", freq: 100, dur: 6.5, vol: 0.12 }),                                                  // its harmonic
  noise({ color: "pink", dur: 6.5, filter: { type: "lp", cutoff: 900 }, tremolo: { rate: 0.17, depth: 0.4 }, vol: 0.35 }))   // air through vents

// ---------- GAME EVENTS ----------

// Boss warning: a deep warship klaxon, not a beeping alarm. Two long low blasts that sag in pitch
// at the end (down = threat), each landing with a sub boom, over a low metallic drone.
// Grave = low notes, slow rhythm, long tails.
const klaxon = (t) => [
  at(t, tone({ wave: "saw", freq: "C3", to: "A#2", slide: 0.85, curve: "lin", dur: 0.85, env: [0.04, 0.2, 0.85, 0.35], filter: { type: "lp", cutoff: 1500 }, vol: 0.55 })),   // harmonics up to 1.5k so small speakers still hear the growl
  at(t, tone({ wave: "square", freq: "C2", to: "A#1", slide: 0.85, curve: "lin", dur: 0.85, duty: 0.4, env: [0.04, 0.2, 0.85, 0.35], filter: { type: "lp", cutoff: 500 }, vol: 0.5 })),
  at(t, tone({ wave: "sine", freq: 60, to: 32, slide: 0.5, dur: 0.5, env: [0.002, 0.3, 0.5, 0.4], vol: 0.9 })),       // sub boom
]
sfx("boss_warning", { vol: 0.5, fx: [drive({ amount: 1.5 }), reverb({ size: 0.7, damp: 0.6, mix: 0.28 }), limiter({ ceiling: 0.9 })] },
  ...klaxon(0), ...klaxon(1.25),
  tone({ wave: "fm", freq: "C1", fm: { ratio: 1.41, index: 2.5 }, dur: 2.4, env: [0.6, 0.5, 0.6, 0.8], tremolo: { rate: 3, depth: 0.3 }, vol: 0.35 }))   // metallic drone

// Boss phase change: a grave, pixely air-raid wail. Low square rising and falling twice, a saw an octave
// under it for weight, and a bitcrusher (fewer bits + lower sample rate) for the old-console grit.
const wail = (t) => [
  at(t, tone({ wave: "square", freq: 130, to: 260, slide: 0.6, curve: "lin", dur: 0.6, duty: 0.5, env: [0.05, 0.1, 0.9, 0.02], vibrato: { rate: 9, depth: 0.12 } })),
  at(t + 0.6, tone({ wave: "square", freq: 260, to: 120, slide: 0.65, curve: "lin", dur: 0.65, duty: 0.5, env: [0.01, 0.1, 0.9, 0.2], vibrato: { rate: 9, depth: 0.12 } })),
  at(t, tone({ wave: "saw", freq: 65, to: 130, slide: 0.6, curve: "lin", dur: 0.6, env: [0.05, 0.1, 0.9, 0.02], filter: { type: "lp", cutoff: 900 }, vol: 0.6 })),
  at(t + 0.6, tone({ wave: "saw", freq: 130, to: 60, slide: 0.65, curve: "lin", dur: 0.65, env: [0.01, 0.1, 0.9, 0.2], filter: { type: "lp", cutoff: 900 }, vol: 0.6 })),
]
sfx("boss_phase_siren", { vol: 0.32, fx: [crush({ bits: 5, rate: 8000 }), drive({ amount: 1.4 }), reverb({ size: 0.6, mix: 0.2 }), limiter({ ceiling: 0.9 })] },
  ...wail(0), ...wail(1.3),
  tone({ wave: "sine", freq: 55, to: 35, slide: 0.4, dur: 0.4, env: [0.002, 0.3, 0.4, 0.3], vol: 0.8 }))   // low hit as the phase breaks

// Hull repaired between waves: a rising swoosh (air sweeping up = gain), with a soft tone gliding
// up underneath and a faint chime where it lands.
sfx("hull_repair", { vol: 2.6, fx: [reverb({ size: 0.5, mix: 0.2 }), limiter({ ceiling: 0.9 })] },
  noise({ color: "pink", dur: 0.45, env: [0.25, 0.1, 0.6, 0.3], filter: { type: "bp", from: 350, to: 6000, q: 1.4 }, vol: 0.8 }),
  tone({ wave: "sine", freq: 300, to: 1200, slide: 0.45, dur: 0.45, env: [0.2, 0.25, 0, 0.05], vol: 0.14 }),   // fades out with the air, no beep left hanging
  at(0.42, tone({ wave: "sine", freq: "C6", dur: 0.1, env: [0.005, 0.1, 0.3, 0.35], vol: 0.15 })))

// Mission complete: short fanfare, about 2 seconds.
const fanfare = [["G4", 0, 0.12], ["C5", 0.14, 0.12], ["E5", 0.28, 0.12], ["G5", 0.42, 0.35], ["E5", 0.82, 0.12], ["G5", 0.96, 0.9]]
sfx("mission_complete", { vol: 0.4, fx: [reverb({ size: 0.6, mix: 0.22 })] },
  ...fanfare.map(([n, t, d]) => at(t, tone({ wave: "square", freq: n, dur: d, duty: 0.25, env: [0.004, 0.08, 0.6, 0.15] }))),
  ...fanfare.map(([n, t, d]) => at(t, tone({ wave: "triangle", freq: n, dur: d, env: [0.004, 0.08, 0.6, 0.15], vol: 0.5 }))),
  at(0.96, tone({ wave: "triangle", freq: "C3", dur: 0.9, env: [0.01, 0.2, 0.6, 0.4], vol: 0.6 })))

// ---------- ESCORT MODE ----------

// Asteroid breaking: rock is noise, not a note. A dull crack, a low thud, then gravelly debris that thins out.
sfx("asteroid_break", { vol: 0.9, fx: [crush({ bits: 7, rate: 16000 }), reverb({ size: 0.3, mix: 0.1 }), limiter({ ceiling: 0.9 })] },
  noise({ color: "white", dur: 0.03, env: [0.001, 0.02, 0, 0.02], filter: { type: "bp", cutoff: 1500, q: 1.5 }, vol: 0.7 }),   // crack
  tone({ wave: "sine", freq: 95, to: 45, slide: 0.12, dur: 0.12, env: [0.001, 0.08, 0.2, 0.08], vol: 0.6 }),                  // thud
  noise({ color: "brown", freq: 2200, dur: 0.35, env: [0.002, 0.12, 0.3, 0.2], filter: { type: "lp", from: 3000, to: 500 }, vol: 0.8 }))   // gravel (sample-and-hold = crunchy)
sfx("asteroid_break_small", { base: "asteroid_break", pitch: 5, vol: 0.6 })

// Carrier hit: a heavy metallic boom on the big ship, with a short alarm blip so you notice it's the carrier, not you.
sfx("carrier_hit", { vol: 1.25, fx: [reverb({ size: 0.75, mix: 0.3 }), limiter({ ceiling: 0.9 })] },
  tone({ wave: "fm", freq: 70, fm: { ratio: 2.3, index: 6, decay: 0.25 }, dur: 0.35, env: [0.001, 0.25, 0.3, 0.4], vol: 0.7 }),
  noise({ color: "brown", dur: 0.4, env: [0.001, 0.2, 0.3, 0.3], filter: { type: "lp", cutoff: 900 }, vol: 0.6 }),
  at(0.18, tone({ wave: "square", freq: 880, dur: 0.07, duty: 0.25, env: [0.002, 0.03, 0.6, 0.03], filter: { type: "lp", cutoff: 2500 }, vol: 0.18 })),
  at(0.3, tone({ wave: "square", freq: 880, dur: 0.07, duty: 0.25, env: [0.002, 0.03, 0.6, 0.03], filter: { type: "lp", cutoff: 2500 }, vol: 0.18 })))

// Interceptors incoming from behind: a quick falling two-tone warning, short so it doesn't get annoying.
sfx("interceptor_alert", { vol: 0.35, fx: [reverb({ size: 0.4, mix: 0.15 })] },
  tone({ wave: "square", freq: 740, to: 620, slide: 0.1, dur: 0.1, duty: 0.3, env: [0.003, 0.05, 0.7, 0.04], filter: { type: "lp", cutoff: 3000 } }),
  at(0.14, tone({ wave: "square", freq: 740, to: 620, slide: 0.1, dur: 0.1, duty: 0.3, env: [0.003, 0.05, 0.7, 0.04], filter: { type: "lp", cutoff: 3000 } })))

// Jump drive spooling up (plays over the last few seconds): a rising swell, getting brighter and faster.
sfx("jump_charge", { vol: 1.0, fx: [reverb({ size: 0.6, mix: 0.25 }), limiter({ ceiling: 0.9 })] },
  tone({ wave: "saw", freq: 55, to: 440, slide: 3, dur: 3, env: [0.5, 0.2, 0.9, 0.1], filter: { type: "lp", from: 300, to: 4000 }, tremolo: { rate: 8, depth: 0.4 }, vol: 0.5 }),
  tone({ wave: "sine", freq: 110, to: 880, slide: 3, dur: 3, env: [0.5, 0.2, 0.9, 0.1], vol: 0.3 }),
  noise({ color: "pink", dur: 3, env: [1.5, 0.2, 0.8, 0.1], filter: { type: "bp", from: 400, to: 6000, q: 1 }, vol: 0.4 }))

// The jump itself: everything snaps to a bright flash and a deep boom that rings out.
sfx("jump_flash", { vol: 0.8, fx: [reverb({ size: 0.9, damp: 0.3, mix: 0.4 }), limiter({ ceiling: 0.9 })] },
  noise({ color: "white", dur: 0.6, env: [0.001, 0.3, 0.3, 0.6], filter: { type: "lp", from: 9000, to: 300 }, vol: 0.7 }),
  tone({ wave: "sine", freq: 80, to: 30, slide: 1.2, dur: 1.2, env: [0.001, 0.5, 0.4, 0.8], vol: 0.9 }),
  tone({ wave: "fm", freq: 220, fm: { ratio: 3.5, index: 3, decay: 0.8 }, dur: 1, env: [0.001, 0.4, 0.3, 0.8], vol: 0.25 }))

// ---------- MENU ----------

sfx("ui_hover", { vol: 0.25 },
  tone({ wave: "square", freq: "A5", dur: 0.025, duty: 0.25, env: [0.001, 0.015, 0.3, 0.02], filter: { type: "lp", cutoff: 3000 } }))
// Select: soft two-note confirm. Triangle and sine instead of square (square = buzzy harmonics = "rough"),
// a few ms of attack so it doesnt click, and a low-pass to round it off.
sfx("ui_select", { vol: 0.45, fx: [reverb({ size: 0.3, mix: 0.12 })] },
  tone({ wave: "triangle", freq: "E5", dur: 0.05, env: [0.004, 0.03, 0.5, 0.04], filter: { type: "lp", cutoff: 2200 } }),
  at(0.05, tone({ wave: "sine", freq: "B5", dur: 0.1, env: [0.004, 0.05, 0.5, 0.12] })))

bank("stellar_sfx", ["missile_launch*", "ship_fly*", "door_*", "boss_warning", "hull_repair", "mission_complete", "ui_*"])

// ---------- DIALOGUE ----------

// Radio opens when the dialogue box slides up: a click and a short burst of static.
sfx("radio_open", { vol: 0.9, fx: [crush({ bits: 7 }), limiter({ ceiling: 0.9 })] },
  noise({ color: "white", dur: 0.012, env: [0.001, 0.01, 0, 0.005], filter: { type: "hp", cutoff: 3000 }, vol: 0.6 }),
  at(0.02, noise({ color: "white", dur: 0.22, env: [0.005, 0.08, 0.4, 0.12], filter: { type: "bp", cutoff: 2200, q: 1.5 }, vol: 0.3 })),
  at(0.03, tone({ wave: "square", freq: 1300, dur: 0.05, env: [0.002, 0.02, 0.3, 0.02], vol: 0.12 })))
