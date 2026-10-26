"""Boss redraw: recolour to the fleet palette, then redraw at double detail with Scale2x.

The boss PNGs are 2x upscaled pixel art (every art pixel is a 2x2 block). So:
  1. shrink by 2 with nearest-neighbour -> the real art (351x296), nothing lost
  2. recolour with one table (same table for all 7 frames and the bullets)
  3. Scale2x back up to the same size -> same size on screen, but each art pixel
     becomes 4 new pixels that follow the shape, so staircase edges get smoothed
Same size + same shape = every gun coordinate in sketch.js still lines up.
"""
import os
from PIL import Image

SRC = 'asset-staging/originals/boss/'   # run from the project folder
OUT = 'images/enemies/boss/'

REMAP = {
    # chrome greens -> dark gunmetal
    '#080808': '#0b0a0a', '#102010': '#131417', '#283828': '#1e2125', '#384838': '#2a2e33',
    '#485848': '#383d43', '#687868': '#4e545b', '#90a090': '#6b7279', '#c0d0c0': '#8b9298',
    '#d8d8d8': '#a6acb1', '#d7d7ce': '#a6acb1', '#e8f0e8': '#c3c8cc',
    # orange trim -> hostile crimson
    '#700000': '#4a0a10', '#982000': '#7a141b', '#d05808': '#b52a2a', '#f08800': '#ff5a3c',
    '#f8d880': '#ffc2a0',
    # blue blades (all phases) -> red energy
    '#000058': '#2a070c', '#000070': '#3e0a12', '#000090': '#5c1018', '#0048d8': '#c8303a',
    '#3070e8': '#ff6a6a', '#00a8e8': '#ff4a4a', '#80d0f0': '#ffb0a8',
    # boss bullet + impact (blue) -> red, so enemy fire is always red
    '#000091': '#5c1018', '#0046d1': '#c8303a', '#3e79ef': '#ff6a6a', '#00b2ef': '#ff4a4a',
    '#a0e1ff': '#ffd0c8', '#007faf': '#a8242c', '#6dc5e7': '#ff7a6a', '#c9f0ff': '#ffe0d8',
}
LUT = {tuple(int(k[i:i + 2], 16) for i in (1, 3, 5)): tuple(int(v[i:i + 2], 16) for i in (1, 3, 5))
       for k, v in REMAP.items()}


def recolour(im):
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and (r, g, b) in LUT:
                px[x, y] = LUT[(r, g, b)] + (a,)
    return im


def is_2x(im):
    """True if (almost) every 2x2 block is one colour, i.e. the image is 2x upscaled pixel art.
    99% is enough: a few frames had a handful of pixels touched up after upscaling."""
    px = im.load()
    blocks = bad = 0
    for y in range(0, im.height - 1, 2):
        for x in range(0, im.width - 1, 2):
            blocks += 1
            if not (px[x, y] == px[x + 1, y] == px[x, y + 1] == px[x + 1, y + 1]):
                bad += 1
    return bad / blocks < 0.01


def shrink2x(im):
    """Back to the real art size: each 2x2 block becomes its most common colour."""
    px = im.load()
    out = Image.new('RGBA', (im.width // 2, im.height // 2))
    dst = out.load()
    for y in range(out.height):
        for x in range(out.width):
            block = [px[2 * x, 2 * y], px[2 * x + 1, 2 * y], px[2 * x, 2 * y + 1], px[2 * x + 1, 2 * y + 1]]
            dst[x, y] = max(set(block), key=block.count)
    return out


def scale2x(im):
    """EPX / Scale2x. For pixel P with neighbours up A, right B, left C, down D:
    each corner copies a neighbour when the two neighbours touching that corner match
    (and the shape isn't a straight line), otherwise it keeps P. That rounds off stairs."""
    w, h = im.size
    src = im.load()
    out = Image.new('RGBA', (w * 2, h * 2))
    dst = out.load()

    def at(x, y):
        return src[min(max(x, 0), w - 1), min(max(y, 0), h - 1)]

    for y in range(h):
        for x in range(w):
            P, A, B, C, D = at(x, y), at(x, y - 1), at(x + 1, y), at(x - 1, y), at(x, y + 1)
            e0 = e1 = e2 = e3 = P
            if C == A and C != D and A != B:
                e0 = A
            if A == B and A != C and B != D:
                e1 = B
            if D == C and D != B and C != A:
                e2 = C
            if B == D and B != A and D != C:
                e3 = D
            dst[2 * x, 2 * y], dst[2 * x + 1, 2 * y] = e0, e1
            dst[2 * x, 2 * y + 1], dst[2 * x + 1, 2 * y + 1] = e2, e3
    return out


files = ['normal/boss0.png', 'normal/boss1.png', 'crazed/bosscrazy0.png', 'crazed/bosscrazy1.png',
         'crazed/bosscrazy2.png', 'ultboss/ultboss0.png', 'ultboss/ultboss1.png',
         'weapon/bull.png'] + [f'weapon/impact{i}.png' for i in range(5)]
for f in files:
    im = Image.open(SRC + f).convert('RGBA')
    doubled = is_2x(im)
    if doubled:
        result = scale2x(recolour(shrink2x(im)))
    else:
        result = recolour(im)  # already 1x: just recolour, dont upscale
    assert result.size == im.size, (f, result.size, im.size)
    os.makedirs(os.path.dirname(OUT + f), exist_ok=True)
    result.save(OUT + f)
    print(f, im.size, 'scale2x' if doubled else 'recolour only')
