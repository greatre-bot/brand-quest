"""Original pixel art generator for Mixue Snow King dancing mascot (6-frame 40x48 sheet)
and young street dancer NPC Fina (32x40 4-dir spritesheet + 64x64 Stardew portrait).
Matches tools/draw-characters.py warm outline palette and shading rules.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / 'assets/pixel'
INK = (34, 26, 24, 255)


def rgba(hex_str, alpha=255):
    h = hex_str.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), alpha)


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

    def rbox(self, x, y, w, h, r, fill, outline=None):
        if w <= 0 or h <= 0:
            return
        fc = rgba(fill) if isinstance(fill, str) else fill
        oc = rgba(outline) if isinstance(outline, str) else outline
        self.d.rounded_rectangle((x, y, x + w - 1, y + h - 1), radius=r, fill=fc, outline=oc)

    def oval(self, x, y, w, h, fill, outline=None):
        fc = rgba(fill) if isinstance(fill, str) else fill
        oc = rgba(outline) if isinstance(outline, str) else outline
        self.d.ellipse((x, y, x + w - 1, y + h - 1), fill=fc, outline=oc)

    def poly(self, pts, fill, outline=None):
        fc = rgba(fill) if isinstance(fill, str) else fill
        oc = rgba(outline) if isinstance(outline, str) else outline
        self.d.polygon(pts, fill=fc, outline=oc)

    def line(self, p0, p1, c, width=1):
        fc = rgba(c) if isinstance(c, str) else c
        self.d.line([p0, p1], fill=fc, width=width)


def draw_snowking_frame(frame):
    """Draw one 40x48 frame of the dancing Mixue Snow King mascot.
    0: Center happy bounce
    1: Point / raise scepter high ('你爱我')
    2: Plump heart hug bounce ('我爱你')
    3: Wobbly hip sway left + right stomp ('蜜雪冰城' left)
    4: Wobbly hip sway right + left stomp ('蜜雪冰城' right)
    5: Joyful ^ ^ eyes victory pose ('甜蜜蜜' finale)
    """
    p = Pix(40, 48)

    white = '#fffdf5'
    white_sh = '#e5ded0'
    cape = '#cc3239'
    cape_hi = '#eb6665'
    cape_sh = '#8f1d24'
    gold = '#f0bc4c'
    gold_hi = '#ffea9c'
    nose = '#eb8434'
    cheek = '#eb5d66'
    shoe = '#573d2c'

    # Per-frame lively mascot motion offsets
    sway = [0, -1, 0, -2, 2, 0][frame]
    bob = [0, -1, -2, 0, 0, -1][frame]
    cape_shift = [0, 2, 0, 3, -3, 1][frame]
    l_foot_dy = [0, 0, -1, 0, -2, 0][frame]
    r_foot_dy = [0, -1, -1, -2, 0, 0][frame]
    cx = 20 + sway

    # Ground shadow
    p.oval(9, 43, 22, 4, (34, 38, 32, 76))

    # Red royal cape behind plump body (flaps playfully with sway)
    cape_pts = [
        (cx - 10, 22 + bob),
        (cx + 10, 22 + bob),
        (cx + 13 + cape_shift, 40 + bob),
        (cx - 13 + cape_shift, 40 + bob),
    ]
    p.poly(cape_pts, cape, INK)
    p.poly([
        (cx - 8, 24 + bob),
        (cx + 8, 24 + bob),
        (cx + 10 + cape_shift, 38 + bob),
        (cx - 10 + cape_shift, 38 + bob),
    ], cape_sh)

    # Stubby bouncing feet
    p.rbox(cx - 8, 40 + l_foot_dy, 6, 5, 2, shoe, INK)
    p.rbox(cx + 2, 40 + r_foot_dy, 6, 5, 2, shoe, INK)
    p.box(cx - 7, 41 + l_foot_dy, 3, 1, '#a67b58')
    p.box(cx + 3, 41 + r_foot_dy, 3, 1, '#a67b58')

    # Plump snowman lower body
    p.oval(cx - 12, 21 + bob, 24, 21, white, INK)
    p.oval(cx - 9, 34 + bob, 18, 6, white_sh)
    p.oval(cx - 10, 23 + bob, 19, 13, white)

    # Red scalloped cape collar across shoulders
    p.rbox(cx - 11, 20 + bob, 22, 6, 3, cape, INK)
    p.box(cx - 9, 21 + bob, 18, 2, cape_hi)
    p.rbox(cx - 3, 22 + bob, 6, 4, 1, gold, INK)
    p.px(cx - 1, 23 + bob, gold_hi)

    # Cute round white arms & ice-cream cone scepter!
    if frame == 2:
        # Heart-hug pose: both arms curled lovingly across chest + red heart badge
        p.oval(cx - 10, 25 + bob, 7, 6, white, INK)
        p.oval(cx + 3, 25 + bob, 7, 6, white, INK)
        # Cute pixel heart right over chest
        p.px(cx - 2, 25 + bob, cheek); p.px(cx + 1, 25 + bob, cheek)
        p.box(cx - 3, 26 + bob, 6, 2, cheek)
        p.box(cx - 2, 28 + bob, 4, 1, cheek)
        p.px(cx - 1, 29 + bob, cheek); p.px(cx, 29 + bob, cheek)
        # Scepter tucked upright on left
        sx, sy = cx - 12, 13 + bob
        p.line((sx, sy + 10), (sx, sy + 24), gold, 2)
        p.poly([(sx - 3, sy + 4), (sx + 3, sy + 4), (sx, sy + 11)], '#df9a42', INK)
        p.oval(sx - 3, sy - 1, 7, 6, white, INK)
    elif frame in (1, 5):
        # Scepter raised high on left + right arm waving joyfully!
        p.oval(cx - 15, 19 + bob, 7, 6, white, INK)
        p.oval(cx + 9, 18 + bob, 7, 6, white, INK)
        sx, sy = cx - 13, 6 + bob
        p.line((sx, sy + 9), (sx + 1, sy + 23), gold, 2)
        p.poly([(sx - 3, sy + 4), (sx + 4, sy + 4), (sx, sy + 11)], '#df9a42', INK)
        p.oval(sx - 3, sy - 1, 7, 6, white, INK)
        p.px(sx, sy - 2, white)
        if frame == 5:
            # Tiny sparkle pixels near crown & scepter
            p.px(cx + 14, 11 + bob, gold_hi)
            p.px(cx - 15, 3 + bob, gold_hi)
    else:
        # Lively swinging arms (opposite swing for frames 3 & 4)
        l_arm_y = 24 + bob + (-3 if frame == 3 else (2 if frame == 4 else 0))
        r_arm_y = 24 + bob + (2 if frame == 3 else (-3 if frame == 4 else 0))
        p.oval(cx - 15, l_arm_y, 7, 6, white, INK)
        p.oval(cx + 8, r_arm_y, 7, 6, white, INK)
        sx, sy = cx - 14, l_arm_y - 12
        p.line((sx, sy + 10), (sx + 1, sy + 23), gold, 2)
        p.poly([(sx - 3, sy + 4), (sx + 4, sy + 4), (sx, sy + 11)], '#df9a42', INK)
        p.oval(sx - 3, sy - 1, 7, 6, white, INK)

    # Round adorable snowman head
    p.oval(cx - 10, 7 + bob, 20, 16, white, INK)
    p.oval(cx - 8, 18 + bob, 16, 4, white_sh)
    p.oval(cx - 8, 9 + bob, 16, 11, white)

    # Signature 3-point Snow King crown on top
    p.poly([
        (cx - 5, 8 + bob),
        (cx - 6, 3 + bob),
        (cx - 2, 6 + bob),
        (cx, 2 + bob),
        (cx + 2, 6 + bob),
        (cx + 6, 3 + bob),
        (cx + 5, 8 + bob),
    ], white, INK)
    p.box(cx - 4, 7 + bob, 8, 2, gold)
    p.px(cx, 4 + bob, gold_hi)

    # Expressive face: eyes, rosy cheeks, carrot nose & happy smile
    if frame in (2, 5):
        # Joyful curved happy eyes ^ ^
        p.box(cx - 6, 13 + bob, 3, 1, INK)
        p.px(cx - 7, 14 + bob, INK); p.px(cx - 3, 14 + bob, INK)
        p.box(cx + 3, 13 + bob, 3, 1, INK)
        p.px(cx + 2, 14 + bob, INK); p.px(cx + 6, 14 + bob, INK)
    else:
        p.box(cx - 5, 12 + bob, 2, 3, INK)
        p.box(cx + 3, 12 + bob, 2, 3, INK)
        p.px(cx - 5, 12 + bob, '#ffffff')
        p.px(cx + 3, 12 + bob, '#ffffff')

    # Rosy round cheeks + orange carrot nose + smile
    p.box(cx - 8, 15 + bob, 3, 2, cheek)
    p.box(cx + 5, 15 + bob, 3, 2, cheek)
    p.box(cx - 1, 14 + bob, 4, 2, nose)
    p.px(cx + 2, 14 + bob, '#ffbe6b')
    p.box(cx - 3, 18 + bob, 6, 1, '#9c5244')
    p.px(cx - 4, 17 + bob, '#9c5244')
    p.px(cx + 3, 17 + bob, '#9c5244')

    return p.im


def draw_dancer_frame(direction, step):
    """Draw one 32x40 frame of Fina, a cheerful young Indonesian girl filming Snow King dance videos."""
    p = Pix(32, 40)
    bob = -1 if step in (1, 2) else 0
    side = direction in (1, 2)
    skin_hi, skin, skin_sh = '#f8c296', '#e6a276', '#be7950'
    hair_dk, hair_hi = '#2a2124', '#4d3c42'
    top_hi, top, top_sh = '#f58ca0', '#de667d', '#a84157'
    skirt_hi, skirt, skirt_sh = '#5e7da6', '#425d82', '#2b3e59'
    ribbon = '#ffe27a'
    shoe = '#f7f2e4'

    p.oval(6, 35, 20, 4, (34, 38, 32, 72))
    l_dy = 0 if step == 0 else (-2 if step == 1 else 1)
    r_dy = 0 if step == 0 else (1 if step == 1 else -2)

    # Legs, denim skirt & white sneakers
    if not side:
        for lx, dy in [(11, l_dy), (17, r_dy)]:
            p.box(lx, 29 + bob, 4, 6 + max(0, dy), skin, INK)
            p.px(lx + 1, 30 + bob, skin_hi)
            p.rbox(lx - 1, 34 + dy, 5, 4, 1, shoe, INK)
            p.box(lx, 36 + dy, 3, 1, top)
        p.rbox(9, 24 + bob, 14, 7, 2, skirt, INK)
        p.box(10, 25 + bob, 5, 5, skirt_hi)
        p.box(19, 25 + bob, 3, 5, skirt_sh)
    else:
        sf = 0 if step == 0 else (-2 if step == 1 else 2)
        sb = -sf
        p.box(14 + sb, 29 + bob, 4, 6, skin_sh, INK)
        p.rbox(13 + sb, 34, 6, 4, 1, shoe, INK)
        p.box(13 + sf, 29 + bob, 4, 6, skin, INK)
        p.rbox(12 + sf, 34, 6, 4, 1, shoe, INK)
        p.box(13 + sf, 36, 4, 1, top)
        p.rbox(10, 24 + bob, 12, 7, 2, skirt, INK)
        p.box(11, 25 + bob, 4, 5, skirt_hi)

    # Coral-pink cropped cardigan over cream inner tee + arms (holding tiny smartphone in front idle!)
    if not side:
        for idx, ax in enumerate([7, 21]):
            ay = 18 + bob + (1 if step == idx + 1 else 0)
            p.rbox(ax, ay, 4, 6, 1, top, INK)
            p.box(ax + 1, ay + 1, 2, 4, top_hi)
            p.rbox(ax, ay + 5, 4, 3, 1, skin, INK)
        p.rbox(10, 16 + bob, 12, 9, 2, top, INK)
        p.box(11, 17 + bob, 3, 7, top_hi)
        p.box(19, 17 + bob, 2, 7, top_sh)
        if direction == 0:
            p.box(14, 16 + bob, 4, 8, '#fff5de')
            p.box(21, 20 + bob, 4, 5, '#2b313a', INK)  # smartphone held in hand!
            p.box(22, 21 + bob, 2, 3, '#9fe3f5')
    else:
        p.rbox(11, 16 + bob, 10, 9, 2, top, INK)
        p.box(12, 17 + bob, 3, 7, top_hi)
        adx = 0 if step == 0 else (1 if step == 1 else -1)
        p.rbox(14 + adx, 18 + bob, 4, 6, 1, top, INK)
        p.rbox(14 + adx, 23 + bob, 4, 3, 1, skin, INK)

    # Rounded head + cheerful long ponytail / twin puffs with yellow ribbon
    p.box(14, 14 + bob, 4, 3, skin_sh)
    if not side:
        p.rbox(8, 10 + bob, 2, 3, 1, skin, INK)
        p.rbox(22, 10 + bob, 2, 3, 1, skin, INK)
        p.rbox(9, 5 + bob, 14, 11, 4, skin, INK)
        p.rbox(10, 7 + bob, 12, 7, 2, skin_hi)
        # Cute twin side hair buns + bangs
        p.oval(6, 2 + bob, 6, 6, hair_dk, INK)
        p.oval(20, 2 + bob, 6, 6, hair_dk, INK)
        p.box(9, 4 + bob, 2, 2, ribbon)
        p.box(21, 4 + bob, 2, 2, ribbon)
        p.rbox(9, 3 + bob, 14, 6, 3, hair_dk, INK)
        p.box(11, 4 + bob, 10, 2, hair_hi)
        if direction == 3:
            p.rbox(9, 6 + bob, 14, 8, 3, hair_dk, INK)
            p.box(11, 8 + bob, 9, 3, hair_hi)
        else:
            p.box(9, 8 + bob, 2, 5, hair_dk)
            p.box(21, 8 + bob, 2, 5, hair_dk)
            p.box(12, 10 + bob, 2, 2, INK)
            p.box(18, 10 + bob, 2, 2, INK)
            p.px(12, 10 + bob, '#fff9ee'); p.px(18, 10 + bob, '#fff9ee')
            p.px(11, 12 + bob, '#f29595'); p.px(20, 12 + bob, '#f29595')
            p.box(14, 13 + bob, 4, 1, '#b5564d')
    else:
        p.rbox(10, 5 + bob, 12, 11, 4, skin, INK)
        p.rbox(11, 7 + bob, 6, 7, 2, skin_hi)
        p.oval(18, 2 + bob, 6, 6, hair_dk, INK)
        p.box(18, 4 + bob, 2, 2, ribbon)
        p.rbox(10, 3 + bob, 12, 6, 3, hair_dk, INK)
        p.box(12, 4 + bob, 7, 2, hair_hi)
        p.rbox(16, 6 + bob, 6, 8, 2, hair_dk)
        p.box(11, 10 + bob, 2, 2, INK); p.px(11, 10 + bob, '#fff9ee')
        p.box(11, 13 + bob, 2, 1, '#b5564d')

    if direction == 2:
        return p.im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    return p.im


def draw_dancer_portrait():
    """64x64 Stardew-style dialogue portrait of Fina."""
    p = Pix(64, 64)
    p.box(0, 0, 64, 64, '#d9c59d', '#5c4b39')
    p.box(2, 2, 60, 60, '#f6ebd0', '#b79e74')
    p.box(4, 4, 56, 56, '#efe1bf')
    p.box(4, 4, 56, 25, '#f6e1dc')
    p.box(4, 27, 56, 6, '#f2e4ce')

    skin_hi, skin, skin_sh = '#f8c398', '#e6a377', '#be7950'
    hair_dk, hair_hi = '#2a2124', '#524046'
    top_hi, top, top_sh = '#f58ca0', '#de667d', '#a84157'
    ribbon = '#ffe27a'

    # Twin high hair buns behind head
    p.oval(10, 6, 14, 14, hair_dk, INK)
    p.oval(40, 6, 14, 14, hair_dk, INK)
    p.box(13, 9, 5, 3, hair_hi)
    p.box(43, 9, 5, 3, hair_hi)
    p.rbox(18, 11, 5, 4, 1, ribbon, INK)
    p.rbox(41, 11, 5, 4, 1, ribbon, INK)

    # Shoulders & coral cardigan over cream tee
    p.rbox(11, 42, 42, 19, 8, top, INK)
    p.rbox(14, 44, 12, 15, 4, top_hi)
    p.rbox(40, 44, 9, 15, 3, top_sh)
    p.rbox(24, 42, 16, 18, 3, '#fff6e0', INK)
    p.box(27, 40, 10, 6, skin, INK)

    # Neck & ears
    p.box(27, 35, 10, 7, skin, INK)
    p.box(28, 36, 8, 2, skin_sh)
    p.rbox(17, 23, 5, 7, 2, skin, INK)
    p.rbox(42, 23, 5, 7, 2, skin, INK)

    # Back hair framing face
    p.rbox(16, 15, 32, 25, 8, hair_dk, INK)

    # Face
    p.rbox(20, 13, 24, 25, 7, skin, INK)
    p.rbox(22, 16, 20, 18, 5, skin_hi)
    p.rbox(24, 34, 16, 3, 2, skin_sh)

    # Hair crown & soft bangs
    p.rbox(19, 9, 26, 11, 6, hair_dk, INK)
    p.rbox(22, 10, 18, 4, 2, hair_hi)
    p.box(19, 17, 4, 11, hair_dk)
    p.box(41, 17, 4, 11, hair_dk)
    p.px(25, 19, hair_dk); p.px(32, 19, hair_dk); p.px(38, 19, hair_dk)

    # Sparkling cheerful eyes, rosy blush & bright smile
    p.rbox(23, 21, 5, 2, 1, hair_dk)
    p.rbox(36, 21, 5, 2, 1, hair_dk)
    p.box(24, 24, 4, 3, '#fffaf0')
    p.box(36, 24, 4, 3, '#fffaf0')
    p.box(25, 24, 3, 3, INK)
    p.box(36, 24, 3, 3, INK)
    p.px(25, 24, '#ffffff'); p.px(36, 24, '#ffffff')
    p.box(31, 26, 2, 2, skin_sh)
    p.box(22, 28, 4, 2, '#f28f97')
    p.box(38, 28, 4, 2, '#f28f97')
    p.box(28, 32, 8, 2, '#c95757')
    p.box(29, 32, 6, 1, '#fff6e8')

    # Crisp bottom border
    p.box(0, 61, 64, 3, '#5c4b39')
    p.box(2, 60, 60, 2, '#b79e74')
    p.im.save(ROOT / 'ui' / 'portrait-dancer.png')


def main():
    # 1. Snow King 6-frame 40x48 dance spritesheet (240x48)
    sk_sheet = Image.new('RGBA', (240, 48), (0, 0, 0, 0))
    for i in range(6):
        sk_sheet.paste(draw_snowking_frame(i), (i * 40, 0))
    sk_sheet.save(ROOT / 'characters' / 'snowking.png')

    # 2. Fina 3x4 32x40 character spritesheet (96x160)
    f_sheet = Image.new('RGBA', (96, 160), (0, 0, 0, 0))
    for d in range(4):
        for s in range(3):
            f_sheet.paste(draw_dancer_frame(d, s), (s * 32, d * 40))
    f_sheet.save(ROOT / 'characters' / 'dancer.png')

    # 3. Fina 64x64 dialogue portrait
    draw_dancer_portrait()
    print('Generated snowking.png (240x48), dancer.png (96x160), portrait-dancer.png (64x64)')


if __name__ == '__main__':
    main()
