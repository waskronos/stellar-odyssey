# Asset Credits

## From the original assignment

The first version of the game was a uni assignment. We were allowed to use assets from the internet for it. These come from that version:

- Player ship (Vanguard), enemy ships, boss, explosions, missile and shot sprites (`images/ship1/`, `images/enemies/`)
- Original sound effects (`sounds/shipshot.wav`, `sounds/enemy2shot.wav`, `sounds/enemy3.wav`, `sounds/misshit.mp3`) and the intro song (`sounds/bgmusic.mp3`)
- Title font (`fonts/in.ttf`)

I didn't keep a record of where each one came from. If one of them is yours, open an issue and I'll credit it or take it down.

The intro cinematic (`images/intro.mp4`) is my own, made in Blender.

## Space backgrounds

The nebula backgrounds (`images/background.png`, `images/backgg.png`, `images/spabg.png`, `images/maps/asteroid-belt.png`) were made with [Pixel Space Background Generator](https://deep-fold.itch.io/space-background-generator) by Deep-Fold. The author allows generated images to be used in games. The generator's [source code](https://github.com/Deep-Fold/PixelSpace) is MIT licensed.

## UI font

`fonts/Silkscreen-Regular.ttf`: [Silkscreen](https://github.com/googlefonts/silkscreen) by Jason Kottke. SIL Open Font License 1.1, see `fonts/Silkscreen-OFL.txt`.

## Made with Claude

These were made with Claude (Anthropic) while I expanded the game. The source for each one is in `asset-src/`.

- **Ships:** Lancer and Aegis, derived from the Vanguard sprite (`ships.px.js`). The escort carrier (`carrier.px.js`).
- **Asteroids:** 3 sizes and 3 variants each (`asteroids.px.js`).
- **Portraits:** the commander and the pilot, mouth open and closed (`portraits.px.js`).
- **Shot colours and boss redraw:** recolours of the original shots and a sharper 2x redraw of the original boss (`shots_recolour.py`, `boss_redraw.py`).
- **Sound effects:** missile launch, fly in and fly out, deck doors and ambience, boss warning and phase siren, hull repair, mission complete, menu sounds, asteroid breaks, carrier hits, interceptor alert, jump drive and radio click (`sounds.cx.js`).
- **Music:** the gameplay and boss loops, `sounds/battle` and `sounds/boss` (`music.cx.js`).

The pixel art was drawn with [pxl](https://github.com/uilianks/pxl) and the audio was synthesized with [chirp](https://github.com/uilianks/chirp).

## Voices

The commander and pilot voice lines (`sounds/voice/`) were generated with [Kokoro](https://github.com/hexgrad/kokoro), an open-source text-to-speech model (Apache 2.0), through [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx). They use the `bm_george` and `am_michael` voices. The radio effect is added by `asset-src/radio_voice.py`.
