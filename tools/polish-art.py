"""Pixel detail polish pass for ground tiles, flora, facades, and industrial assets.
Preserves every existing PNG resolution in data/asset-manifest.json.
"""
import random
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / 'assets/pixel'


def polish_ground():
    path = ROOT / 'tilesets' / 'ground.png'
    im = Image.open(path).convert('RGBA')
    d = ImageDraw.Draw(im)
    rng = random.Random(901)
    # Enrich sidewalk masonry (tiles 0, 4) with subtle sunlit pebbles & bevels
    for idx in (0, 4):
        ox = idx * 32
        for _ in range(18):
            x, y = ox + rng.randrange(1, 30), rng.randrange(1, 30)
            c = rng.choice(['#ebd2ab', '#c4a682', '#b49471'])
            d.point((x, y), fill=c)
    # Enrich tropical grass (tiles 2, 6) with delicate flowers & blade highlights
    for idx in (2, 6):
        ox = idx * 32
        for _ in range(16):
            x, y = ox + rng.randrange(2, 29), rng.randrange(2, 29)
            d.line([(x, y), (x + 1, y - 2)], fill=rng.choice(['#c5cf7f', '#7d985c']))
        for _ in range(3):
            x, y = ox + rng.randrange(4, 27), rng.randrange(4, 27)
            d.point((x, y), fill=rng.choice(['#ffefb3', '#f4c77b']))
    # Enrich interior ceramic tiles (tile 3) with gentle glossy diagonal sheen
    ox = 3 * 32
    for yy in (2, 18):
        for xx in (2, 18):
            d.line([(ox + xx, yy + 3), (ox + xx + 3, yy)], fill='#fff6e2')
    im.save(path)


def polish_yard_ground():
    path = ROOT / 'tilesets' / 'yard-ground.png'
    im = Image.open(path).convert('RGBA')
    d = ImageDraw.Draw(im)
    rng = random.Random(902)
    # Concrete slab joints & fine aggregate texture
    for idx, (hi, lo, joint) in enumerate([('#bcc6bf', '#95a29d', '#8c9994'), ('#96a5a7', '#718184', '#69777b')]):
        ox = idx * 32
        d.line([(ox, 0), (ox + 31, 0)], fill=hi)
        d.line([(ox, 16), (ox + 31, 16)], fill=joint)
        d.line([(ox + 16, 0), (ox + 16, 31)], fill=joint)
        for _ in range(24):
            x, y = ox + rng.randrange(1, 31), rng.randrange(1, 31)
            d.point((x, y), fill=rng.choice([hi, lo]))
    im.save(path)


def polish_industrial():
    # SANY main hall: crisp skylight reflections, vertical facade shadow seams, red accent trim
    hall_p = ROOT / 'buildings' / 'sany-hall.png'
    im = Image.open(hall_p).convert('RGBA')
    d = ImageDraw.Draw(im)
    d.rectangle((172, 39, 218, 41), fill='#d95358')  # crisp red canopy accent above SANY entrance
    d.rectangle((172, 42, 218, 43), fill='#e5e6d7')
    for x in range(18, 160, 24):
        d.line([(x, 125), (x + 10, 125)], fill='#d5dcd1')
    im.save(hall_p)

    # Excavator: clean hand-pixelled SANY lettering (fixes blurry font "BANY"), glass sheen & stripes
    ex_p = ROOT / 'props' / 'excavator.png'
    im = Image.open(ex_p).convert('RGBA')
    d = ImageDraw.Draw(im)
    d.rectangle((11, 42, 37, 50), fill='#e6b242')
    glyphs = {
        'S': ['1111', '1000', '1111', '0001', '1111'],
        'A': ['0110', '1001', '1111', '1001', '1001'],
        'N': ['1001', '1101', '1011', '1001', '1001'],
        'Y': ['1001', '1001', '0110', '0100', '0100'],
    }
    for idx, ch in enumerate('SANY'):
        gx = 13 + idx * 6
        for ry, row in enumerate(glyphs[ch]):
            for rx, bit in enumerate(row):
                if bit == '1':
                    d.point((gx + rx, 44 + ry), fill='#2c353a')
    for i in range(4):
        x = 12 + i * 5
        d.line([(x, 51), (x + 2, 54)], fill='#f2cb57', width=2)
    d.line([(45, 25), (53, 24)], fill='#d9ebe4', width=1)
    d.line([(44, 28), (50, 28)], fill='#b8d6ce', width=1)
    im.save(ex_p)

    # Service bay: amber caution light housing above door + crisp safety stripes
    sb_p = ROOT / 'buildings' / 'service-bay.png'
    im = Image.open(sb_p).convert('RGBA')
    d = ImageDraw.Draw(sb_p if False else im)
    d.rectangle((108, 39, 115, 45), fill='#3a4648', outline='#242d2f')
    d.rectangle((110, 40, 113, 43), fill='#f6c958')
    for y in range(56, 98, 6):
        d.rectangle((11, y, 13, y + 2), fill='#e8be4e')
        d.rectangle((126, y, 128, y + 2), fill='#e8be4e')
    im.save(sb_p)


def polish_flora():
    # Add crisp sunlit leaf highlights to shade-tree and planter
    for name, boxes in [
        ('shade-tree', [(30, 10, 4, 2), (40, 12, 5, 2), (20, 20, 4, 2), (50, 19, 5, 2), (32, 27, 6, 2), (56, 30, 4, 2)]),
        ('planter', [(14, 10, 3, 2), (24, 9, 3, 2), (19, 14, 4, 2)])
    ]:
        p = ROOT / 'props' / f'{name}.png'
        im = Image.open(p).convert('RGBA')
        d = ImageDraw.Draw(im)
        for x, y, w, h in boxes:
            d.rectangle((x, y, x + w - 1, y + h - 1), fill='#a6c46a')
        im.save(p)


if __name__ == '__main__':
    polish_ground()
    polish_yard_ground()
    polish_industrial()
    polish_flora()
    print('Polish pass completed.')
