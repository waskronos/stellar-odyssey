"""Recolour the player shot frames per ship.

The red shot uses about 5 brightness levels (dark red -> red -> orange-red -> pink -> white core),
plus some near-duplicates from anti-aliasing. Each pixel is matched to the closest of the 5 levels,
then replaced with the same level from that ship's ramp, so the glow and core stay where they were.
"""
import glob
import os
from PIL import Image, ImageDraw, ImageFont

SRC = 'images/ship1/shots/'   # run from the project folder
OUT = 'images/ship1/shots/'

LEVELS = ['#c70310', '#e1211a', '#ff4722', '#fb8376', '#ffeae7']   # dark -> light, from the red shot
RAMPS = {
    'vanguard': ['#1d3fa8', '#2f6be0', '#4fa3ff', '#a6d8ff', '#f2fbff'],   # electric blue
    'lancer':   ['#0b6a6a', '#12a39f', '#2ed8c9', '#94f2e6', '#f0fffc'],   # teal
    'aegis':    ['#a3460a', '#e07812', '#ffa726', '#ffd47e', '#fff7e2'],   # amber
}


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


LEVEL_RGB = [rgb(c) for c in LEVELS]


def nearest_level(c):
    return min(range(len(LEVEL_RGB)), key=lambda i: sum((a - b) ** 2 for a, b in zip(c, LEVEL_RGB[i])))


for ship, ramp in RAMPS.items():
    ramp_rgb = [rgb(c) for c in ramp]
    os.makedirs(OUT + ship, exist_ok=True)
    for path in sorted(glob.glob(SRC + '*.png')):
        im = Image.open(path).convert('RGBA')
        px = im.load()
        for y in range(im.height):
            for x in range(im.width):
                r, g, b, a = px[x, y]
                if a:
                    px[x, y] = ramp_rgb[nearest_level((r, g, b))] + (a,)
        im.save(OUT + ship + '/' + os.path.basename(path))

# preview: for each ship, the 5 muzzle frames, the travel frame, then the 8 hit frames,
# with the new red boss bullet at the end of the strip to check they never look alike
font = ImageFont.truetype('fonts/in.ttf', 14)
order = [f'shot{i}f.png' for i in range(1, 6)] + ['shot1.png'] + [f'shot{i}e.png' for i in range(1, 9)]
cell = 96
sheet = Image.new('RGBA', (140 + cell * (len(order) + 1), 30 + cell * 4), (10, 12, 20, 255))
d = ImageDraw.Draw(sheet)
rows = [('NOW', SRC)] + [(s.upper(), OUT + s + '/') for s in RAMPS]
boss = Image.open('images/enemies/boss/weapon/bull.png').convert('RGBA').resize((80, 30), Image.NEAREST)
for r, (label, folder) in enumerate(rows):
    y = 30 + r * cell
    d.text((10, y + cell // 2 - 8), label, font=font, fill=(255, 204, 0, 255))
    for i, name in enumerate(order):
        fr = Image.open(folder + name).convert('RGBA').resize((cell, cell), Image.NEAREST)
        sheet.alpha_composite(fr, (140 + i * cell, y))
    sheet.alpha_composite(boss, (140 + len(order) * cell + 8, y + cell // 2 - 15))
d.text((140, 6), 'MUZZLE FLASH (5)        TRAVEL     HIT (8)', font=font, fill=(150, 160, 180, 255))
d.text((140 + len(order) * cell, 6), 'ENEMY', font=font, fill=(255, 90, 80, 255))
sheet.save('asset-staging/shots-recolour-preview.png')
print('done', sheet.size)
