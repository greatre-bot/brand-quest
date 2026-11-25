"""Draw crisp 4-direction x 3-frame (144x192, 48x48 per frame) pixel e-scooter riding sprites
for the player character in both Jakarta scooter colorways:
  - assets/pixel/characters/ride-scooter.png (teal #3f8d89)
  - assets/pixel/characters/ride-vespa.png   (terracotta red #c66146)

Row order matches Phaser 4-dir character convention:
  row 0 = DOWN  (facing viewer)
  row 1 = LEFT  (riding left)
  row 2 = RIGHT (riding right, mirrored from LEFT)
  row 3 = UP    (riding north / away)
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / 'assets/pixel/characters'
INK = (36, 30, 28, 255)


def rgba(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


class Pix:
    def __init__(self, w, h):
        self.im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def px(self, x, y, c):
        if 0 <= x < self.im.width and 0 <= y < self.im.height:
            self.im.putpixel((int(x), int(y)), rgba(c) if isinstance(c, str) else c)

    def box(self, x, y, w, h, fill, outline=None):
        if w <= 0 or h <= 0:
            return
        fc = None if fill is None else (rgba(fill) if isinstance(fill, str) else fill)
        oc = None if outline is None else (rgba(outline) if isinstance(outline, str) else outline)
        self.d.rectangle((x, y, x + w - 1, y + h - 1), fill=fc, outline=oc)

    def oval(self, x, y, w, h, fill, outline=None):
        fc = None if fill is None else (rgba(fill) if isinstance(fill, str) else fill)
        oc = None if outline is None else (rgba(outline) if isinstance(outline, str) else outline)
        self.d.ellipse((x, y, x + w - 1, y + h - 1), fill=fc, outline=oc)

    def poly(self, pts, fill, outline=None):
        fc = rgba(fill) if isinstance(fill, str) else fill
        oc = None if outline is None else (rgba(outline) if isinstance(outline, str) else outline)
        self.d.polygon(pts, fill=fc, outline=oc)

    def line(self, p0, p1, c, width=1):
        self.d.line([p0, p1], fill=rgba(c) if isinstance(c, str) else c, width=width)


PALETTES = {
    'ride-scooter': {
        'body': '#3f8d89',
        'body_hi': '#6ab4ae',
        'body_sh': '#265c5a',
        'trim': '#e6cba3',
    },
    'ride-vespa': {
        'body': '#c66146',
        'body_hi': '#e4886c',
        'body_sh': '#8a3926',
        'trim': '#f2d9b1',
    },
}

# Player colors matching assets/pixel/characters/player.png
HAT_HI, HAT, HAT_SH, BAND = '#f7d996', '#e6bd72', '#c39752', '#8f5235'
SKIN_HI, SKIN, SKIN_SH = '#f5be8c', '#dfa47a', '#b67a54'
HAIR = '#3e3229'
SHIRT_HI, SHIRT, SHIRT_SH = '#639ca6', '#477b84', '#2e5760'
STRAP, BAG = '#d8a45e', '#a56d45'
PANTS, PANTS_SH = '#54685c', '#3b4a42'
SHOE = '#5b4232'
SEAT, SEAT_HI = '#503b33', '#785a4d'
TIRE, HUB, HUB_HI = '#2d3130', '#9ea092', '#d2d4c7'
LIGHT_ON, LIGHT_CORE = '#f9cf63', '#fff7cc'
TAIL_RED, TAIL_HI = '#cf3f39', '#ff8b7d'


def draw_rider_head_front(p, cx, top_y, facing_back=False):
    # Neck
    p.box(cx - 2, top_y + 11, 4, 3, SKIN_SH)
    # Head
    p.box(cx - 5, top_y + 4, 10, 8, SKIN, INK)
    if not facing_back:
        p.box(cx - 4, top_y + 5, 8, 5, SKIN_HI)
        # Hair peeks
        p.box(cx - 4, top_y + 5, 2, 2, HAIR)
        p.box(cx + 3, top_y + 5, 1, 2, HAIR)
        # Eyes + smile
        p.box(cx - 3, top_y + 7, 2, 2, INK)
        p.box(cx + 2, top_y + 7, 2, 2, INK)
        p.px(cx - 3, top_y + 7, '#fff7e8')
        p.px(cx + 2, top_y + 7, '#fff7e8')
        p.box(cx - 1, top_y + 10, 3, 1, '#a66b4c')
    else:
        p.box(cx - 4, top_y + 5, 8, 6, HAIR)
        p.box(cx - 3, top_y + 10, 6, 1, SKIN_SH)
    # Iconic wide straw hat
    p.box(cx - 6, top_y, 12, 5, HAT, INK)
    p.box(cx - 5, top_y + 1, 10, 2, HAT_HI)
    p.box(cx - 6, top_y + 3, 12, 2, BAND)
    p.box(cx - 9, top_y + 4, 18, 3, HAT, INK)
    p.box(cx - 8, top_y + 5, 16, 1, HAT_HI)


def draw_rider_head_left(p, cx, top_y):
    p.box(cx - 1, top_y + 11, 4, 3, SKIN_SH)
    p.box(cx - 5, top_y + 4, 10, 8, SKIN, INK)
    p.box(cx - 4, top_y + 5, 6, 5, SKIN_HI)
    # Hair on back of head (right side when facing left)
    p.box(cx, top_y + 5, 4, 5, HAIR)
    p.box(cx - 1, top_y + 5, 2, 2, HAIR)
    # Left-facing eye
    p.box(cx - 3, top_y + 7, 2, 2, INK)
    p.px(cx - 3, top_y + 7, '#fff7e8')
    p.px(cx - 4, top_y + 10, '#a66b4c')
    # Straw hat
    p.box(cx - 6, top_y, 12, 5, HAT, INK)
    p.box(cx - 5, top_y + 1, 10, 2, HAT_HI)
    p.box(cx - 6, top_y + 3, 12, 2, BAND)
    p.box(cx - 9, top_y + 4, 18, 3, HAT, INK)
    p.box(cx - 8, top_y + 5, 16, 1, HAT_HI)


def draw_down(pal, step):
    p = Pix(48, 48)
    bob = -1 if step == 1 else (1 if step == 2 else 0)
    cx = 24
    # Ground shadow
    p.oval(13, 39, 22, 6, (34, 38, 32, 82))

    # Front tire (animated tread bars)
    p.box(cx - 3, 35, 6, 9, TIRE, INK)
    tread_y = 37 + (step % 2) * 2
    p.box(cx - 2, tread_y, 4, 1, '#4c5250')
    p.box(cx - 2, tread_y + 3, 4, 1, '#4c5250')

    # Rider legs tucked behind front shield
    p.box(cx - 7, 27 + bob, 4, 9, PANTS, INK)
    p.box(cx + 3, 27 + bob, 4, 9, PANTS, INK)
    p.box(cx - 8, 34 + bob, 4, 3, SHOE, INK)
    p.box(cx + 4, 34 + bob, 4, 3, SHOE, INK)

    # Rider torso + crossbody strap behind handlebars
    p.box(cx - 7, 16 + bob, 14, 11, SHIRT, INK)
    p.box(cx - 6, 17 + bob, 5, 8, SHIRT_HI)
    p.line((cx - 5, 17 + bob), (cx + 4, 24 + bob), STRAP, 2)

    # Front scooter apron / leg shield
    p.box(cx - 7, 23 + bob, 14, 14, pal['body'], INK)
    p.box(cx - 6, 24 + bob, 5, 11, pal['body_hi'])
    p.box(cx + 4, 24 + bob, 2, 11, pal['body_sh'])
    p.box(cx - 4, 34 + bob, 8, 3, pal['trim'], INK)
    # Front fender over tire
    p.box(cx - 4, 35, 8, 3, pal['body'], INK)

    # Handlebars + mirrors + hands gripping
    p.box(cx - 11, 20 + bob, 22, 3, '#383d3b', INK)
    # Side mirrors
    p.line((cx - 8, 20 + bob), (cx - 10, 16 + bob), INK, 1)
    p.line((cx + 8, 20 + bob), (cx + 10, 16 + bob), INK, 1)
    p.box(cx - 13, 15 + bob, 4, 3, '#bbcdc2', INK)
    p.box(cx + 9, 15 + bob, 4, 3, '#bbcdc2', INK)
    # Hands + sleeves on grips
    p.box(cx - 10, 19 + bob, 4, 4, SHIRT, INK)
    p.box(cx + 6, 19 + bob, 4, 4, SHIRT, INK)
    p.box(cx - 9, 20 + bob, 3, 3, SKIN, INK)
    p.box(cx + 6, 20 + bob, 3, 3, SKIN, INK)

    # Bright warm pixel headlight centered on front fairing
    p.box(cx - 4, 22 + bob, 8, 6, LIGHT_ON, INK)
    p.box(cx - 3, 23 + bob, 6, 4, LIGHT_CORE)
    p.px(cx - 2, 24 + bob, '#ffffff')

    # Rider head & wide straw hat
    draw_rider_head_front(p, cx, 4 + bob, facing_back=False)
    return p.im


def draw_up(pal, step):
    p = Pix(48, 48)
    bob = -1 if step == 1 else (1 if step == 2 else 0)
    cx = 24
    # Ground shadow
    p.oval(13, 39, 22, 6, (34, 38, 32, 82))

    # Rear tire
    p.box(cx - 3, 35, 6, 9, TIRE, INK)
    tread_y = 37 + (step % 2) * 2
    p.box(cx - 2, tread_y, 4, 1, '#4c5250')
    p.box(cx - 2, tread_y + 3, 4, 1, '#4c5250')

    # Handlebars & mirrors peeking out from front
    p.box(cx - 11, 19 + bob, 22, 3, '#383d3b', INK)
    p.box(cx - 13, 15 + bob, 4, 3, '#9fb3a8', INK)
    p.box(cx + 9, 15 + bob, 4, 3, '#9fb3a8', INK)

    # Scooter rear body cowling
    p.box(cx - 8, 25 + bob, 16, 12, pal['body'], INK)
    p.box(cx - 7, 26 + bob, 5, 9, pal['body_hi'])
    p.box(cx + 4, 26 + bob, 3, 9, pal['body_sh'])
    # Cream trim strip & rear license plate
    p.box(cx - 7, 27 + bob, 14, 2, pal['trim'])
    p.box(cx - 4, 33 + bob, 8, 4, '#24292b', INK)
    p.box(cx - 3, 34 + bob, 6, 2, '#f0ead8')
    # Glowing red taillight
    p.box(cx - 4, 29 + bob, 8, 4, TAIL_RED, INK)
    p.box(cx - 2, 30 + bob, 4, 2, TAIL_HI)

    # Rear brown leather saddle
    p.box(cx - 6, 23 + bob, 12, 4, SEAT, INK)
    p.box(cx - 5, 24 + bob, 10, 1, SEAT_HI)

    # Rider sitting from behind (legs, torso, crossbody bag, arms reaching forward)
    p.box(cx - 7, 23 + bob, 3, 7, PANTS, INK)
    p.box(cx + 4, 23 + bob, 3, 7, PANTS, INK)
    p.box(cx - 7, 15 + bob, 14, 10, SHIRT, INK)
    p.box(cx - 6, 16 + bob, 5, 8, SHIRT_HI)
    p.box(cx - 9, 17 + bob, 3, 5, SHIRT, INK)
    p.box(cx + 6, 17 + bob, 3, 5, SHIRT, INK)
    p.line((cx - 5, 16 + bob), (cx + 4, 23 + bob), STRAP, 2)
    p.box(cx + 2, 21 + bob, 5, 4, BAG, INK)

    draw_rider_head_front(p, cx, 4 + bob, facing_back=True)
    return p.im


def draw_left(pal, step):
    p = Pix(48, 48)
    bob = -1 if step == 1 else 0
    # Ground shadow
    p.oval(4, 39, 40, 6, (34, 38, 32, 82))

    # Wheels (front left at x=7..18, rear right at x=31..42)
    for wx in (7, 31):
        p.oval(wx, 31, 11, 11, TIRE, INK)
        p.oval(wx + 3, 34, 5, 5, HUB)
        # Animated rotating wheel spoke highlight
        spokes = [(wx + 5, 34), (wx + 7, 36), (wx + 5, 38)][step % 3]
        p.px(spokes[0], spokes[1], HUB_HI)
        p.box(wx + 5, 36, 2, 2, '#494e4c')

    # Back-side rider leg / shoe on floorboard
    p.box(21, 28 + bob, 5, 6, PANTS_SH, INK)

    # Rear scooter chassis + floorboard + front leg shield (facing LEFT!)
    # Mirrors exact silhouette of scooter.png / vespa.png flipped left
    body_pts = [
        (43, 32 + bob), (38, 27 + bob), (27, 27 + bob), (24, 35 + bob),
        (18, 34 + bob), (15, 22 + bob), (10, 21 + bob), (8, 33 + bob),
        (13, 34 + bob), (17, 38 + bob), (35, 38 + bob)
    ]
    p.poly(body_pts, pal['body'], INK)
    # Highlights & cream side trim
    p.box(28, 28 + bob, 11, 2, pal['body_hi'])
    p.box(30, 30 + bob, 11, 2, pal['trim'])
    p.box(11, 23 + bob, 3, 9, pal['body_hi'])
    p.box(17, 35 + bob, 17, 2, pal['body_sh'])
    # Rear red taillight on right tail
    p.box(41, 28 + bob, 3, 4, TAIL_RED, INK)
    p.px(42, 29 + bob, TAIL_HI)
    # Saddle
    p.box(25, 24 + bob, 14, 4, SEAT, INK)
    p.box(27, 23 + bob, 10, 2, SEAT_HI)

    # Rider seated on saddle (facing LEFT, leaning forward slightly to grip handlebar)
    # Seated thigh + bent knee + shoe on step-through floorboard
    p.box(22, 25 + bob, 9, 4, PANTS, INK)
    p.box(20, 28 + bob, 5, 6, PANTS, INK)
    p.box(18, 33 + bob, 6, 3, SHOE, INK)
    # Torso
    p.box(23, 15 + bob, 10, 11, SHIRT, INK)
    p.box(24, 16 + bob, 4, 9, SHIRT_HI)
    p.box(30, 16 + bob, 2, 9, SHIRT_SH)
    # Crossbody bag
    p.line((25, 16 + bob), (31, 23 + bob), STRAP, 2)
    p.box(28, 21 + bob, 5, 4, BAG, INK)

    # Handlebar stem + mirror + glowing warm headlight on LEFT front
    p.box(10, 19 + bob, 5, 5, LIGHT_ON, INK)
    p.box(11, 20 + bob, 3, 3, LIGHT_CORE)
    p.line((14, 21 + bob), (17, 16 + bob), INK, 2)
    p.box(17, 14 + bob, 5, 3, '#bbcdc2', INK)

    # Forward arm & hand gripping the handlebar!
    p.box(16, 18 + bob, 9, 4, SHIRT, INK)
    p.box(17, 19 + bob, 6, 2, SHIRT_HI)
    p.box(14, 19 + bob, 3, 3, SKIN, INK)

    # Rider head + wide straw hat (facing LEFT)
    draw_rider_head_left(p, 26, 3 + bob)
    return p.im


def build_sheet(name, pal):
    sheet = Image.new('RGBA', (48 * 3, 48 * 4), (0, 0, 0, 0))
    for step in range(3):
        down = draw_down(pal, step)
        left = draw_left(pal, step)
        right = left.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        up = draw_up(pal, step)
        sheet.paste(down, (step * 48, 0))
        sheet.paste(left, (step * 48, 48))
        sheet.paste(right, (step * 48, 96))
        sheet.paste(up, (step * 48, 144))
    out = ROOT / f'{name}.png'
    sheet.save(out)
    print(f'Wrote {out} ({sheet.size[0]}x{sheet.size[1]})')


if __name__ == '__main__':
    for name, pal in PALETTES.items():
        build_sheet(name, pal)
