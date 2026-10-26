# Stellar Odyssey

A retro side-scrolling space shooter made with p5.js and p5play.

## The original project

This started as my Creative Coding assignment in first year of uni, 2 years ago. The brief was to make a 1980s style space shooter in our own style. We were allowed to use assets from the internet for the assignment. The intro cinematic is my own, made in Blender.

The first version had one game mode. It had a score system, three waves of enemies and a multi-phase boss at the end. The assignment also asked for a leaderboard that reads from a JSON file. That's why `images/data.json` exists. The names in it are placeholders and the leaderboard isn't connected to real scores yet.

My original code and design is kept in `sketch.js.txt`, so you can see what the game looked like before I came back to it. Some older assets however have been removed as part of cleaning up the directory.

## Coming back to it with AI

When I picked the project up again recently, I used Claude to help me push it further. I decided what I wanted the game to be, and I supervised and reviewed everything that was added. This was mainly just as a hobby thing to make it more in-line with what I would want to see in a game like this

What changed:

- Cleaned up the old code. Removed redundant code, cleared up the logic and kept the style simple and close to how I originally wrote it.
- A new mission deck with three ships (Vanguard, Lancer, Aegis), three difficulties and a mission picker
- A second mission, Escort: defend a carrier through an asteroid belt while interceptors chase it
- Commander and pilot briefings with voice lines and talking portraits
- A new HUD, boss bar, ending cutscene and game over screen
- Hull repair between waves
- New sound effects and gameplay music
- One consistent look across the menus and screens, especially going from the 3d intro into the 2d shooter

An Endless mode is planned and shows as work in progress. I'm still working out the specifics.

## Controls

**Assault**

- `A` / `D`: move up and down
- `W`: fire
- Left click: missile towards the pointer
- `Space`: boost

**Escort**

- `W` `A` `S` `D`: move
- Mouse: aim
- Hold left click: fire at the reticle
- Right click: missile at the reticle

**Everywhere**

- `Esc`: pause, or go back
- `Enter` or click: skip the briefing line
- `Enter`: skip the intro once it's mostly loaded
- `R`: retry after a game over, `M`: menu

## Run it

The game loads images, sounds and JSON, so it needs a local server. Opening `index.html` directly won't work.

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Files

- `sketch.js`: the main game
- `escort.js`: the escort mission
- `dialogue.js`: the briefing dialogue box
- `sketch.js.txt`: my original assignment code
- `asset-src/`: the source files used to make the new art and sounds
- `ASSET-CREDITS.md`: where every asset came from

## Built with

p5.js 1.6, p5.sound, p5play and Planck.js. All of them are included in `lib/`.
