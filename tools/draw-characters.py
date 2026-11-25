"""Organic Stardew-inspired 32x40 character sprites + 64x64 Teacher Wan pixel portrait.
Teacher Wan faithfully follows assets/references/npc_user_video_contact_sheet.jpg:
- Organic rounded head/jaw, spiky short black hair with smooth side/nape fade
- Sleeveless deep navy polo vest with collar, placket & tiny white chest emblem
- Bare muscular arms + chunky black wristwatch on left wrist
- Diagonal black crossbody strap (right shoulder -> left hip pouch)
- Dark charcoal knee-length shorts, bare calves, and tan lace-up work boots
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
        """Pixel-crisp rounded rectangle (avoids blocky Minecraft silhouettes)."""
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


def draw_wan_frame(direction, step):
    p = Pix(32, 40)
    bob = -1 if step in (1, 2) else 0
    skin_hi, skin, skin_sh = '#f7b984', '#e79b65', '#bd7043'
    hair_dk, hair_md, hair_hi, fade = '#1c1a1e', '#2d2b32', '#42404a', '#8c664e'
    vest_hi, vest, vest_sh = '#425d94', '#2c4271', '#1b2a4d'
    short_hi, short, short_sh = '#4a4e57', '#33363e', '#212329'
    bag_hi, bag, bag_sh = '#434650', '#25272d', '#15161a'
    boot_hi, boot, boot_sh, sole = '#e5ae69', '#c88c49', '#915c2c', '#3c2a20'

    p.oval(6, 35, 20, 4, (34, 38, 32, 74))
    l_dy = 0 if step == 0 else (-2 if step == 1 else 1)
    r_dy = 0 if step == 0 else (1 if step == 1 else -2)

    if direction == 0:  # FRONT
        for lx, dy in [(10, l_dy), (17, r_dy)]:
            p.rbox(lx, 25 + bob, 5, 7, 1, short, INK)
            p.box(lx + 1, 26 + bob, 2, 5, short_hi)
            p.box(lx + 1, 31 + bob, 3, 4 + max(0, dy), skin, INK)
            p.px(lx + 1, 32 + bob, skin_hi)
            by = 34 + dy
            p.rbox(lx, by, 5, 5, 1, boot, INK)
            p.box(lx + 1, by + 1, 3, 2, boot_hi)
            p.px(lx + 2, by + 1, '#f6e4bd')
            p.box(lx + 1, by + 4, 3, 1, sole)
        p.box(11, 25 + bob, 10, 3, short)
        p.box(15, 26 + bob, 2, 3, short_sh)

        # Bare muscular arms (rounded shoulders & hands)
        arm_l = 17 + bob + (1 if step == 2 else 0)
        arm_r = 17 + bob + (1 if step == 1 else 0)
        p.rbox(7, arm_l, 4, 10, 1, skin, INK)
        p.box(8, arm_l + 1, 2, 6, skin_hi)
        p.px(8, arm_l + 8, skin_sh)
        p.rbox(21, arm_r, 4, 10, 1, skin, INK)
        p.box(22, arm_r + 1, 2, 5, skin_hi)
        p.box(21, arm_r + 6, 4, 2, bag, INK)  # black wristwatch on left wrist
        p.px(23, arm_r + 6, '#8791a2')

        # Sleeveless navy polo vest
        p.rbox(10, 16 + bob, 12, 10, 2, vest, INK)
        p.box(11, 17 + bob, 4, 8, vest_hi)
        p.box(19, 17 + bob, 2, 8, vest_sh)
        p.box(14, 15 + bob, 4, 3, skin)
        p.px(12, 16 + bob, vest_hi); p.px(19, 16 + bob, vest_hi)
        p.box(15, 18 + bob, 2, 3, vest_sh)
        p.px(18, 19 + bob, '#f5f7fb'); p.px(19, 19 + bob, '#f5f7fb')
        p.px(18, 20 + bob, '#d6dff0'); p.px(19, 20 + bob, '#f5f7fb')

        # Crossbody strap + pouch on left hip
        for i in range(9):
            p.box(11 + i, 16 + bob + i, 2, 2, bag)
            p.px(11 + i, 16 + bob + i, bag_hi)
        p.rbox(20, 23 + bob, 4, 5, 1, bag, INK)
        p.box(21, 24 + bob, 2, 2, bag_hi)

        # Organic rounded head + spiky short hair + temple fade
        p.box(14, 14 + bob, 4, 3, skin_sh)
        p.rbox(8, 10 + bob, 2, 3, 1, skin, INK)
        p.rbox(22, 10 + bob, 2, 3, 1, skin, INK)
        p.rbox(9, 5 + bob, 14, 11, 4, skin, INK)
        p.rbox(10, 7 + bob, 12, 7, 2, skin_hi)
        p.box(12, 14 + bob, 8, 1, skin_sh)
        # Organic spiky hair crown
        p.rbox(9, 3 + bob, 14, 5, 3, hair_dk, INK)
        p.box(11, 2 + bob, 10, 2, hair_dk)
        for hx in (11, 14, 17, 20):
            p.px(hx, 2 + bob, hair_dk)
            p.px(hx, 4 + bob, hair_hi)
        p.px(10, 3 + bob, hair_md); p.px(21, 3 + bob, hair_md)
        p.box(9, 7 + bob, 2, 3, fade)
        p.box(21, 7 + bob, 2, 3, fade)
        # Brows, eyes, nose, mouth
        p.box(11, 9 + bob, 3, 1, hair_dk)
        p.box(18, 9 + bob, 3, 1, hair_dk)
        p.box(12, 10 + bob, 2, 2, INK)
        p.box(18, 10 + bob, 2, 2, INK)
        p.px(12, 10 + bob, '#fff9ee'); p.px(18, 10 + bob, '#fff9ee')
        p.px(15, 12 + bob, skin_sh)
        p.box(14, 13 + bob, 4, 1, '#a15c3b')

    elif direction == 1:  # LEFT SIDE
        sf = 0 if step == 0 else (-2 if step == 1 else 2)
        sb = -sf
        p.rbox(13 + sb, 25 + bob, 6, 7, 1, short_sh, INK)
        p.box(14 + sb, 31 + bob, 4, 4, skin_sh, INK)
        p.rbox(12 + sb, 34, 7, 5, 1, boot_sh, INK)
        p.box(13 + sb, 38, 5, 1, sole)
        p.rbox(12 + sf, 25 + bob, 7, 7, 1, short, INK)
        p.box(13 + sf, 26 + bob, 3, 5, short_hi)
        p.box(13 + sf, 31 + bob, 4, 4, skin, INK)
        p.px(14 + sf, 32 + bob, skin_hi)
        p.rbox(11 + sf, 34, 7, 5, 1, boot, INK)
        p.box(12 + sf, 35, 4, 2, boot_hi)
        p.px(13 + sf, 35, '#f6e4bd')
        p.box(12 + sf, 38, 5, 1, sole)

        p.rbox(11, 16 + bob, 10, 10, 2, vest, INK)
        p.box(12, 17 + bob, 3, 8, vest_hi)
        p.rbox(13, 15 + bob, 6, 2, 1, vest_hi, INK)
        p.px(12, 19 + bob, '#f5f7fb')
        p.line((12, 17 + bob), (19, 24 + bob), bag, 2)
        p.rbox(19, 22 + bob, 5, 6, 1, bag, INK)
        p.box(20, 23 + bob, 3, 2, bag_hi)

        adx = 0 if step == 0 else (1 if step == 1 else -1)
        p.rbox(14 + adx, 17 + bob, 4, 10, 1, skin, INK)
        p.box(15 + adx, 18 + bob, 2, 5, skin_hi)
        p.box(13 + adx, 24 + bob, 5, 2, bag, INK)
        p.px(15 + adx, 24 + bob, '#8791a2')

        # Rounded profile head with smooth temple fade
        p.box(13, 14 + bob, 5, 3, skin_sh)
        p.rbox(10, 5 + bob, 12, 11, 4, skin, INK)
        p.rbox(11, 7 + bob, 6, 7, 2, skin_hi)
        p.rbox(10, 3 + bob, 12, 5, 3, hair_dk, INK)
        p.box(12, 2 + bob, 9, 2, hair_dk)
        for hx in (12, 15, 18):
            p.px(hx, 4 + bob, hair_hi)
        p.rbox(17, 6 + bob, 5, 6, 2, hair_dk)
        p.box(15, 8 + bob, 3, 4, fade)
        p.rbox(16, 10 + bob, 2, 3, 1, skin, INK)
        p.box(11, 9 + bob, 2, 1, hair_dk)
        p.box(11, 10 + bob, 2, 2, INK); p.px(11, 10 + bob, '#fff9ee')
        p.px(9, 11 + bob, skin)
        p.box(11, 13 + bob, 2, 1, '#a15c3b')

    elif direction == 2:  # RIGHT SIDE
        sf = 0 if step == 0 else (2 if step == 1 else -2)
        sb = -sf
        p.rbox(13 + sb, 25 + bob, 6, 7, 1, short_sh, INK)
        p.box(14 + sb, 31 + bob, 4, 4, skin_sh, INK)
        p.rbox(13 + sb, 34, 7, 5, 1, boot_sh, INK)
        p.box(14 + sb, 38, 5, 1, sole)
        p.rbox(13 + sf, 25 + bob, 7, 7, 1, short, INK)
        p.box(15 + sf, 26 + bob, 3, 5, short_hi)
        p.box(15 + sf, 31 + bob, 4, 4, skin, INK)
        p.px(16 + sf, 32 + bob, skin_hi)
        p.rbox(14 + sf, 34, 7, 5, 1, boot, INK)
        p.box(16 + sf, 35, 4, 2, boot_hi)
        p.px(18 + sf, 35, '#f6e4bd')
        p.box(15 + sf, 38, 5, 1, sole)

        p.rbox(11, 16 + bob, 10, 10, 2, vest, INK)
        p.box(17, 17 + bob, 3, 8, vest_hi)
        p.rbox(13, 15 + bob, 6, 2, 1, vest_hi, INK)
        p.line((15, 16 + bob), (20, 22 + bob), bag, 2)
        adx = 0 if step == 0 else (-1 if step == 1 else 1)
        p.rbox(14 + adx, 17 + bob, 4, 10, 1, skin, INK)
        p.box(15 + adx, 18 + bob, 2, 6, skin_hi)

        p.box(14, 14 + bob, 5, 3, skin_sh)
        p.rbox(10, 5 + bob, 12, 11, 4, skin, INK)
        p.rbox(15, 7 + bob, 6, 7, 2, skin_hi)
        p.rbox(10, 3 + bob, 12, 5, 3, hair_dk, INK)
        p.box(11, 2 + bob, 9, 2, hair_dk)
        for hx in (13, 16, 19):
            p.px(hx, 4 + bob, hair_hi)
        p.rbox(10, 6 + bob, 5, 6, 2, hair_dk)
        p.box(14, 8 + bob, 3, 4, fade)
        p.rbox(14, 10 + bob, 2, 3, 1, skin, INK)
        p.box(19, 9 + bob, 2, 1, hair_dk)
        p.box(19, 10 + bob, 2, 2, INK); p.px(20, 10 + bob, '#fff9ee')
        p.px(22, 11 + bob, skin)
        p.box(19, 13 + bob, 2, 1, '#a15c3b')

    else:  # BACK
        for lx, dy in [(10, l_dy), (17, r_dy)]:
            p.rbox(lx, 25 + bob, 5, 7, 1, short, INK)
            p.box(lx + 1, 27 + bob, 3, 2, short_sh)
            p.box(lx + 1, 31 + bob, 3, 4 + max(0, dy), skin, INK)
            by = 34 + dy
            p.rbox(lx, by, 5, 5, 1, boot, INK)
            p.box(lx + 1, by + 1, 3, 2, boot_sh)
            p.box(lx + 1, by + 4, 3, 1, sole)
        p.box(11, 25 + bob, 10, 3, short)

        arm_l = 17 + bob + (1 if step == 1 else 0)
        arm_r = 17 + bob + (1 if step == 2 else 0)
        p.rbox(7, arm_l, 4, 10, 1, skin, INK)
        p.box(8, arm_l + 1, 2, 5, skin_hi)
        p.box(7, arm_l + 6, 4, 2, bag, INK)
        p.rbox(21, arm_r, 4, 10, 1, skin, INK)
        p.box(22, arm_r + 1, 2, 6, skin_hi)

        p.rbox(10, 16 + bob, 12, 10, 2, vest, INK)
        p.box(11, 17 + bob, 10, 2, vest_hi)
        p.rbox(12, 15 + bob, 8, 2, 1, vest_sh, INK)
        for i in range(9):
            p.box(19 - i, 16 + bob + i, 2, 2, bag)
            p.px(19 - i, 16 + bob + i, bag_hi)
        p.rbox(9, 23 + bob, 6, 5, 1, bag, INK)
        p.box(10, 24 + bob, 4, 2, bag_hi)

        p.box(13, 13 + bob, 6, 3, skin_sh, INK)
        p.rbox(8, 10 + bob, 2, 3, 1, skin, INK)
        p.rbox(22, 10 + bob, 2, 3, 1, skin, INK)
        p.rbox(9, 3 + bob, 14, 10, 4, hair_dk, INK)
        p.box(11, 2 + bob, 10, 2, hair_dk)
        for hx in (11, 14, 17, 20):
            p.px(hx, 4 + bob, hair_hi)
        p.rbox(11, 10 + bob, 10, 3, 1, fade)

    return p.im


def draw_wan_portrait():
    """Draw a smooth, expressive 64x64 Stardew-style dialogue portrait of Teacher Wan."""
    p = Pix(64, 64)
    # Warm parchment portrait frame
    p.box(0, 0, 64, 64, '#d9c59d', '#5c4b39')
    p.box(2, 2, 60, 60, '#f6ebd0', '#b79e74')
    p.box(4, 4, 56, 56, '#efe1bf')
    p.box(4, 4, 56, 23, '#d7e5dc')
    p.box(4, 25, 56, 7, '#e5e3cb')

    skin_hi, skin, skin_sh = '#f8bb86', '#e99e68', '#bf7143'
    hair_dk, hair_md, hair_hi, fade = '#1c1a1e', '#2d2b32', '#44414c', '#8e6950'
    vest_hi, vest, vest_sh = '#445f97', '#2c4271', '#1b2b4e'
    bag_hi, bag = '#434752', '#22242a'

    # Bare muscular shoulders (smooth rounded silhouette)
    p.rbox(7, 43, 14, 18, 6, skin, INK)
    p.rbox(43, 43, 14, 18, 6, skin, INK)
    p.rbox(9, 46, 5, 13, 2, skin_hi)
    p.rbox(49, 46, 5, 13, 2, skin_hi)
    p.box(14, 52, 3, 8, skin_sh)
    p.box(47, 52, 3, 8, skin_sh)

    # Navy sleeveless polo vest
    p.rbox(17, 41, 30, 20, 4, vest, INK)
    p.box(19, 43, 11, 16, vest_hi)
    p.box(40, 43, 5, 16, vest_sh)
    # Collar & V-placket
    p.rbox(26, 38, 12, 8, 3, skin, INK)
    p.poly([(22, 41), (28, 41), (29, 47), (24, 47)], vest_hi, INK)
    p.poly([(42, 41), (36, 41), (35, 47), (40, 47)], vest_hi, INK)
    p.box(30, 46, 4, 9, vest_sh, INK)
    p.px(31, 48, '#dbe3f2'); p.px(31, 51, '#dbe3f2')
    # White emblem on left chest
    p.box(38, 48, 4, 2, '#f5f7fb')
    p.px(39, 49, vest); p.px(40, 49, vest)
    p.box(38, 50, 4, 1, '#d6dff0')

    # Diagonal crossbody strap
    for i in range(19):
        p.box(19 + i, 41 + i, 4, 3, bag)
        p.px(20 + i, 41 + i, bag_hi)

    # Neck
    p.box(27, 35, 10, 7, skin, INK)
    p.box(28, 36, 8, 3, skin_sh)

    # Ears
    p.rbox(17, 23, 5, 7, 2, skin, INK); p.box(19, 25, 2, 3, skin_sh)
    p.rbox(42, 23, 5, 7, 2, skin, INK); p.box(43, 25, 2, 3, skin_sh)

    # Organic oval-square face (rounded jaw & cheekbones!)
    p.rbox(20, 12, 24, 26, 7, skin, INK)
    p.rbox(22, 15, 20, 19, 5, skin_hi)
    p.rbox(24, 34, 16, 3, 2, skin_sh)
    p.box(28, 36, 8, 1, '#855136')

    # Organic spiky short black hair crown + soft temple fade
    p.rbox(19, 8, 26, 10, 6, hair_dk, INK)
    p.rbox(22, 6, 20, 5, 3, hair_dk)
    # Soft varied hair tufts (not comb teeth!)
    for hx, hy, hw in [(22, 6, 3), (26, 5, 4), (31, 5, 4), (36, 6, 4), (40, 7, 2)]:
        p.box(hx, hy, hw, 3, hair_dk)
    for hx, hy in [(24, 9), (29, 8), (34, 9), (38, 10)]:
        p.box(hx, hy, 3, 2, hair_hi)
    p.box(21, 13, 22, 2, hair_md)
    p.box(19, 15, 3, 8, hair_dk)
    p.box(42, 15, 3, 8, hair_dk)
    p.box(20, 17, 2, 6, fade)
    p.box(42, 17, 2, 6, fade)

    # Friendly steady brows, eyes, nose, warm mouth
    p.rbox(23, 21, 6, 2, 1, hair_dk)
    p.rbox(35, 21, 6, 2, 1, hair_dk)
    p.box(24, 24, 4, 3, '#fffaf0')
    p.box(36, 24, 4, 3, '#fffaf0')
    p.box(25, 24, 3, 3, INK)
    p.box(36, 24, 3, 3, INK)
    p.px(25, 24, '#ffffff'); p.px(36, 24, '#ffffff')
    p.box(31, 26, 2, 3, skin_sh)
    p.box(30, 29, 4, 1, skin_sh)
    p.box(28, 32, 8, 1, '#9b583a')
    p.px(27, 32, skin_sh); p.px(36, 32, skin_sh)

    # Clean bottom border
    p.box(0, 61, 64, 3, '#5c4b39')
    p.box(2, 60, 60, 2, '#b79e74')
    p.im.save(ROOT / 'ui' / 'portrait-wan.png')


def draw_person_frame(who, cfg, direction, step):
    p = Pix(32, 40)
    bob = -1 if step in (1, 2) else 0
    side = direction in (1, 2)
    skin_hi, skin, skin_sh = cfg['skin']
    hair_dk, hair_hi = cfg['hair']
    top_hi, top, top_sh = cfg['top']
    bot_hi, bot, bot_sh = cfg['bottom']
    shoe = cfg['shoe']

    p.oval(6, 35, 20, 4, (34, 38, 32, 72))
    l_dy = 0 if step == 0 else (-2 if step == 1 else 1)
    r_dy = 0 if step == 0 else (1 if step == 1 else -2)

    if not side:
        for lx, dy in [(10, l_dy), (17, r_dy)]:
            p.rbox(lx, 25 + bob, 5, 10 + max(0, dy), 1, bot, INK)
            p.box(lx + 1, 26 + bob, 2, 8, bot_hi)
            p.rbox(lx, 34 + dy, 5, 4, 1, shoe, INK)
            p.box(lx + 1, 35 + dy, 3, 1, '#d6b48a')
        p.box(11, 25 + bob, 10, 3, bot)
    else:
        sf = 0 if step == 0 else (-2 if step == 1 else 2)
        sb = -sf
        p.rbox(13 + sb, 25 + bob, 6, 10, 1, bot_sh, INK)
        p.rbox(12 + sb, 34, 7, 4, 1, shoe, INK)
        p.rbox(12 + sf, 25 + bob, 6, 10, 1, bot, INK)
        p.box(13 + sf, 26 + bob, 2, 8, bot_hi)
        p.rbox(11 + sf, 34, 7, 4, 1, shoe, INK)
        p.box(12 + sf, 35, 4, 1, '#d6b48a')

    if not side:
        for idx, ax in enumerate([7, 21]):
            ay = 18 + bob + (1 if step == idx + 1 else 0)
            p.rbox(ax, ay, 4, 6, 1, top, INK)
            p.box(ax + 1, ay + 1, 2, 4, top_hi)
            p.rbox(ax, ay + 6, 4, 3, 1, skin, INK)
        p.rbox(10, 16 + bob, 12, 11, 2, top, INK)
        p.box(11, 17 + bob, 4, 9, top_hi)
        p.box(19, 17 + bob, 2, 9, top_sh)
        if direction == 0:
            p.box(14, 16 + bob, 4, 2, skin)
    else:
        p.rbox(11, 16 + bob, 10, 11, 2, top, INK)
        p.box(12, 17 + bob, 3, 9, top_hi)
        adx = 0 if step == 0 else (1 if step == 1 else -1)
        p.rbox(14 + adx, 18 + bob, 4, 6, 1, top, INK)
        p.box(15 + adx, 19 + bob, 2, 4, top_hi)
        p.rbox(14 + adx, 24 + bob, 4, 3, 1, skin, INK)

    if who == 'player':
        if not side:
            p.line((11, 17 + bob), (20, 26 + bob), '#b57b42', 2)
            p.rbox(18, 24 + bob, 5, 5, 1, '#8f5932', INK)
            p.box(19, 25 + bob, 3, 2, '#d8a567')
        else:
            p.line((12, 17 + bob), (19, 24 + bob), '#b57b42', 2)
            p.rbox(18, 23 + bob, 4, 5, 1, '#8f5932', INK)
    elif who == 'clerk' and direction != 3:
        if not side:
            p.rbox(12, 19 + bob, 8, 9, 1, '#f6ebcb', INK)
            p.box(14, 21 + bob, 4, 2, '#cf4d4a')
        else:
            p.rbox(11, 19 + bob, 6, 9, 1, '#f6ebcb', INK)
    elif who == 'engineer':
        p.box(11, 21 + bob, 10, 2, '#e8c452')
        p.box(11, 24 + bob, 10, 1, '#f4e39e')
    elif who == 'rider':
        p.box(11, 21 + bob, 10, 2, '#d7ebcf')
    elif who == 'vendor' and not side and direction == 0:
        p.rbox(12, 20 + bob, 8, 7, 1, '#c78b4b', INK)
        p.box(13, 22 + bob, 6, 1, '#f4d99b')
        p.box(13, 24 + bob, 6, 1, '#f4d99b')
    elif who == 'student' and not side:
        p.box(12, 17 + bob, 8, 2, '#fff0d1')
    elif who == 'hijab':
        # Draped modest shawl hem over shoulders & crossbody tote strap
        if not side:
            p.rbox(10, 16 + bob, 12, 5, 2, '#d9ece2', INK)
            p.box(12, 17 + bob, 8, 2, '#eef7f1')
            p.line((19, 19 + bob), (21, 25 + bob), '#8f5d3c', 1)
        else:
            p.rbox(11, 16 + bob, 10, 5, 2, '#d9ece2', INK)
            p.box(12, 17 + bob, 6, 2, '#eef7f1')
    elif who == 'auntie':
        # Warm Indonesian Batik tunic motif dots/stripes + shopping tote
        if not side:
            for bx in (12, 15, 18):
                p.px(bx, 19 + bob, '#f6d27a')
                p.px(bx + 1, 22 + bob, '#f6d27a')
            p.box(11, 24 + bob, 10, 2, '#e6b85c')
        else:
            p.px(13, 19 + bob, '#f6d27a'); p.px(16, 22 + bob, '#f6d27a')
            p.box(12, 24 + bob, 8, 2, '#e6b85c')
    elif who == 'office':
        # Collared batik/striped shirt + ID lanyard
        if not side and direction == 0:
            p.box(14, 16 + bob, 4, 3, '#fff6df')
            p.box(15, 18 + bob, 2, 6, '#395a85')
            p.box(15, 23 + bob, 3, 2, '#f5ebd0', INK)
        elif not side:
            p.box(12, 17 + bob, 8, 1, '#dbe6f2')
    elif who == 'boss':
        # Hi-vis lime/amber contractor vest over crisp polo
        if not side:
            p.rbox(10, 17 + bob, 12, 9, 1, '#d9a438', INK)
            p.box(11, 21 + bob, 10, 2, '#f8f2c8')
            p.box(14, 17 + bob, 4, 8, '#36566e')
        else:
            p.rbox(11, 17 + bob, 10, 9, 1, '#d9a438', INK)
            p.box(12, 21 + bob, 8, 2, '#f8f2c8')
    elif who == 'tech':
        # Blue-grey workshop coveralls + yellow chest pocket & tool stripe
        p.box(11, 20 + bob, 10, 2, '#e4b84a')
        if not side and direction == 0:
            p.box(12, 18 + bob, 3, 2, '#f7e6a8')

    # Organic rounded head
    p.box(14, 14 + bob, 4, 3, skin_sh)
    if not side:
        p.rbox(8, 10 + bob, 2, 3, 1, skin, INK)
        p.rbox(22, 10 + bob, 2, 3, 1, skin, INK)
        p.rbox(9, 5 + bob, 14, 11, 4, skin, INK)
        p.rbox(10, 7 + bob, 12, 7, 2, skin_hi)
    else:
        p.rbox(10, 5 + bob, 12, 11, 4, skin, INK)
        p.rbox(11, 7 + bob, 6, 7, 2, skin_hi)
        p.rbox(16, 10 + bob, 2, 3, 1, skin, INK)

    # Rounded hair cap (or hijab headwrap)
    if who == 'hijab':
        if not side:
            p.rbox(8, 3 + bob, 16, 13, 5, '#c7e0d4', INK)
            p.box(11, 4 + bob, 10, 3, '#e8f5ee')
            if direction == 0:
                p.rbox(11, 7 + bob, 10, 8, 3, skin, INK)
                p.rbox(12, 8 + bob, 8, 5, 2, skin_hi)
        else:
            p.rbox(9, 3 + bob, 14, 13, 5, '#c7e0d4', INK)
            p.box(11, 4 + bob, 8, 3, '#e8f5ee')
            p.rbox(10, 7 + bob, 7, 7, 2, skin, INK)
            p.box(11, 8 + bob, 4, 4, skin_hi)
    elif not side:
        p.rbox(9, 3 + bob, 14, 6, 3, hair_dk, INK)
        p.box(11, 4 + bob, 9, 2, hair_hi)
        if direction == 3:
            p.rbox(9, 6 + bob, 14, 7, 3, hair_dk, INK)
            p.box(11, 8 + bob, 8, 3, hair_hi)
        if who == 'auntie':
            # Neat traditional bun on top/back
            p.rbox(12, 1 + bob, 8, 4, 2, hair_dk, INK)
            p.box(14, 2 + bob, 4, 1, hair_hi)
    else:
        p.rbox(10, 3 + bob, 12, 6, 3, hair_dk, INK)
        p.box(12, 4 + bob, 7, 2, hair_hi)
        p.rbox(16, 6 + bob, 6, 7, 2, hair_dk)
        if who == 'auntie':
            p.rbox(18, 5 + bob, 5, 5, 2, hair_dk, INK)

    if direction == 0:
        p.box(12, 10 + bob, 2, 2, INK)
        p.box(18, 10 + bob, 2, 2, INK)
        p.px(12, 10 + bob, '#fff9ee'); p.px(18, 10 + bob, '#fff9ee')
        if who == 'office':
            # Crisp hollow pixel eyeglasses over eyes
            p.box(11, 9 + bob, 4, 4, None, '#3d352e')
            p.box(17, 9 + bob, 4, 4, None, '#3d352e')
            p.px(15, 10 + bob, '#3d352e'); p.px(16, 10 + bob, '#3d352e')
        p.box(14, 13 + bob, 4, 1, '#a76345')
    elif side:
        p.box(11, 10 + bob, 2, 2, INK)
        p.px(11, 10 + bob, '#fff9ee')
        if who == 'office':
            p.box(10, 9 + bob, 4, 4, None, '#3d352e')
        p.box(11, 13 + bob, 2, 1, '#a76345')

    if who == 'player':
        p.rbox(5, 7 + bob, 22, 3, 1, '#f2cf84', INK)
        p.box(6, 7 + bob, 20, 1, '#ffebb6')
        p.rbox(9, 2 + bob, 14, 6, 2, '#dfb46c', INK)
        p.box(9, 6 + bob, 14, 2, '#995338')
    elif who == 'engineer':
        p.rbox(7, 6 + bob, 18, 3, 1, '#e8be4a', INK)
        p.rbox(9, 2 + bob, 14, 6, 3, '#f2cf62', INK)
        p.box(12, 3 + bob, 6, 2, '#fff0b2')
    elif who == 'boss':
        # White contractor hard hat with red SANY/site stripe
        p.rbox(7, 6 + bob, 18, 3, 1, '#e2e5e6', INK)
        p.rbox(9, 2 + bob, 14, 6, 3, '#f7f8f5', INK)
        p.box(14, 3 + bob, 4, 2, '#c84245')
    elif who == 'tech':
        # Navy SANY work cap
        p.rbox(8, 6 + bob, 16, 3, 1, '#2b476b', INK)
        p.rbox(10, 3 + bob, 12, 4, 2, '#3c6291', INK)
        if direction == 0:
            p.box(14, 4 + bob, 4, 2, '#f0c44d')
    elif who == 'clerk':
        p.rbox(8, 6 + bob, 16, 3, 1, '#c84245', INK)
        p.rbox(10, 3 + bob, 12, 4, 2, '#de5554', INK)
        if direction == 0:
            p.box(14, 4 + bob, 4, 2, '#fff2d2')
    elif who == 'rider':
        p.rbox(7, 6 + bob, 17, 3, 1, '#2f6a54', INK)
        p.rbox(10, 3 + bob, 12, 4, 2, '#3e8569', INK)
    elif who == 'vendor':
        p.rbox(9, 3 + bob, 14, 6, 3, '#e3be7a', INK)
        p.box(11, 4 + bob, 10, 2, '#f5d99e')
    elif who == 'student' and not side and direction == 0:
        p.box(19, 8 + bob, 3, 1, '#e8765c')

    if direction == 2:
        return p.im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    return p.im


ROLES = {
    'player': {'skin': ('#f5bc8d', '#e49f71', '#bd764b'), 'hair': ('#46352a', '#694f3d'), 'top': ('#5d98a1', '#427984', '#2e5863'), 'bottom': ('#6e7b6b', '#525f52', '#39433a'), 'shoe': '#5c4132'},
    'student': {'skin': ('#f5bd90', '#e3a174', '#ba774e'), 'hair': ('#312927', '#4f433e'), 'top': ('#db8d5c', '#bf6f43', '#945030'), 'bottom': ('#4f5b6b', '#394454', '#272f3b'), 'shoe': '#54463d'},
    'vendor': {'skin': ('#eda97a', '#d88f60', '#af6a41'), 'hair': ('#2e2624', '#4a3d39'), 'top': ('#a6755b', '#875b45', '#634031'), 'bottom': ('#5b5349', '#453e37', '#302b26'), 'shoe': '#523c31'},
    'rider': {'skin': ('#eca87a', '#d78e60', '#ad6942'), 'hair': ('#29282b', '#444247'), 'top': ('#599674', '#3f785a', '#2c5742'), 'bottom': ('#434b52', '#31383e', '#22272c'), 'shoe': '#3d3936'},
    'clerk': {'skin': ('#f6c196', '#e5a478', '#bd7a52'), 'hair': ('#382c28', '#594740'), 'top': ('#db5d5b', '#bf4546', '#913033'), 'bottom': ('#495461', '#353e4a', '#252c35'), 'shoe': '#4d3b35'},
    'engineer': {'skin': ('#efb082', '#da9567', '#b16e46'), 'hair': ('#2f2e32', '#49484e'), 'top': ('#86949c', '#697780', '#4d5961'), 'bottom': ('#606e78', '#48545e', '#333d45'), 'shoe': '#4c3a2d'},
    'hijab': {'skin': ('#f4bc8e', '#e19d70', '#b8744b'), 'hair': ('#332824', '#4f3f39'), 'top': ('#e08976', '#c66b59', '#994e40'), 'bottom': ('#5b6c75', '#425159', '#2d3940'), 'shoe': '#5e463a'},
    'auntie': {'skin': ('#eba87b', '#d58c5e', '#aa663e'), 'hair': ('#2c2626', '#4a4141'), 'top': ('#9d526e', '#7e3b55', '#5a263b'), 'bottom': ('#4f443d', '#3a312c', '#26201d'), 'shoe': '#4a362c'},
    'office': {'skin': ('#f2b98a', '#de9b6c', '#b47247'), 'hair': ('#272529', '#413e46'), 'top': ('#8fb0c9', '#6e90ab', '#4f6d85'), 'bottom': ('#484d54', '#33373d', '#22252a'), 'shoe': '#3c332d'},
    'boss': {'skin': ('#eba97c', '#d58f61', '#ab6841'), 'hair': ('#2c292b', '#4d484c'), 'top': ('#4b728f', '#36566e', '#243c4f'), 'bottom': ('#524d46', '#3d3934', '#292622'), 'shoe': '#4a372a'},
    'tech': {'skin': ('#efb081', '#d99365', '#af6c43'), 'hair': ('#2b292c', '#454247'), 'top': ('#5b7a9e', '#415c7d', '#2d425c'), 'bottom': ('#4c627d', '#374a61', '#263445'), 'shoe': '#42362d'},
}


def draw_role_portrait(who):
    """Draw an original 64x64 Stardew-inspired dialogue portrait matching each character's sprite."""
    p = Pix(64, 64)
    # Warm sunlit portrait frame
    p.box(0, 0, 64, 64, '#d9c59d', '#5c4b39')
    p.box(2, 2, 60, 60, '#f6ebd0', '#b79e74')
    p.box(4, 4, 56, 56, '#efe1bf')

    palettes = {
        'player':   {'bg': '#d7e6dd', 'skin': ('#f6be90', '#e5a173', '#be754a'), 'hair': ('#46352a', '#6a503e'), 'top': ('#5d98a1', '#427984', '#2e5863')},
        'student':  {'bg': '#e8dfd1', 'skin': ('#f7c194', '#e5a478', '#bc784e'), 'hair': ('#2e2725', '#4e423d'), 'top': ('#dc8f5d', '#bf6f43', '#924f2f')},
        'vendor':   {'bg': '#e7e1cb', 'skin': ('#eeab7d', '#d88f60', '#af6941'), 'hair': ('#2d2523', '#493c38'), 'top': ('#a6755b', '#875b45', '#623f30')},
        'rider':    {'bg': '#d6e4da', 'skin': ('#edaa7c', '#d78e60', '#ad6942'), 'hair': ('#28272b', '#444247'), 'top': ('#599674', '#3f785a', '#2c5742')},
        'clerk':    {'bg': '#f2dfd6', 'skin': ('#f7c499', '#e6a579', '#be7a52'), 'hair': ('#372b27', '#5a4740'), 'top': ('#dd5e5c', '#bf4546', '#913033')},
        'engineer': {'bg': '#d8e0e2', 'skin': ('#f0b184', '#da9567', '#b16e46'), 'hair': ('#2f2e32', '#49484e'), 'top': ('#86949c', '#697780', '#4d5961')},
        'guide':    {'bg': '#e2e4d5', 'skin': ('#efb082', '#da9567', '#b06d45'), 'hair': ('#342c28', '#52463f'), 'top': ('#a38768', '#866b51', '#614d3a')},
        'hijab':    {'bg': '#dfece3', 'skin': ('#f6be92', '#e29e72', '#b9754c'), 'hair': ('#332824', '#4f3f39'), 'top': ('#e08976', '#c66b59', '#994e40')},
        'auntie':   {'bg': '#f0e2d2', 'skin': ('#eeab7d', '#d68d5f', '#aa663e'), 'hair': ('#2c2626', '#4a4141'), 'top': ('#9d526e', '#7e3b55', '#5a263b')},
        'office':   {'bg': '#dae5ee', 'skin': ('#f3ba8c', '#df9c6e', '#b47247'), 'hair': ('#272529', '#413e46'), 'top': ('#8fb0c9', '#6e90ab', '#4f6d85')},
        'boss':     {'bg': '#e5e2d3', 'skin': ('#edaa7e', '#d69062', '#ab6841'), 'hair': ('#2c292b', '#4d484c'), 'top': ('#4b728f', '#36566e', '#243c4f')},
        'tech':     {'bg': '#d6e1ea', 'skin': ('#f0b182', '#da9466', '#af6c43'), 'hair': ('#2b292c', '#454247'), 'top': ('#5b7a9e', '#415c7d', '#2d425c')},
    }
    cfg = palettes[who]
    skin_hi, skin, skin_sh = cfg['skin']
    hair_dk, hair_hi = cfg['hair']
    top_hi, top, top_sh = cfg['top']

    p.box(4, 4, 56, 25, cfg['bg'])
    p.box(4, 27, 56, 6, '#e7e0c7')

    # Shoulders & torso
    p.rbox(10, 42, 44, 19, 8, top, INK)
    p.rbox(13, 44, 15, 15, 4, top_hi)
    p.rbox(41, 44, 9, 15, 3, top_sh)

    # Role-specific outfit details
    if who == 'player':
        p.box(26, 40, 12, 7, skin, INK)
        p.poly([(22, 42), (28, 42), (29, 49), (24, 49)], top_hi, INK)
        p.poly([(42, 42), (36, 42), (35, 49), (40, 49)], top_hi, INK)
        for i in range(19):
            p.box(17 + i, 42 + i, 4, 3, '#9a6338')
            p.px(18 + i, 42 + i, '#d8a263')
    elif who == 'student':
        p.rbox(22, 42, 20, 7, 3, '#fff1d4', INK)
        p.box(27, 40, 10, 6, skin, INK)
    elif who == 'vendor':
        p.box(26, 40, 12, 6, skin, INK)
        p.rbox(20, 47, 24, 13, 2, '#c88c4c', INK)
        p.box(22, 50, 20, 2, '#f5db9e')
        p.box(22, 55, 20, 2, '#f5db9e')
    elif who == 'rider':
        p.box(27, 40, 10, 6, skin, INK)
        p.box(12, 51, 40, 4, '#d9eed2')
        p.box(31, 46, 2, 14, '#254a37')
    elif who == 'clerk':
        p.box(26, 40, 12, 6, skin, INK)
        p.rbox(20, 46, 24, 14, 2, '#f8eed0', INK)
        p.box(27, 50, 10, 4, '#cf4d4a')
    elif who == 'engineer':
        p.box(27, 40, 10, 6, skin, INK)
        p.box(12, 50, 40, 4, '#ecc855')
        p.box(12, 55, 40, 2, '#f6e7a6')
    elif who == 'guide':
        p.box(26, 40, 12, 6, skin, INK)
        p.poly([(24, 42), (32, 51), (40, 42)], '#f4ebd2', INK)
        p.box(31, 48, 2, 12, '#624b37')
    elif who == 'hijab':
        # Draped mint-cream hijab shawl across shoulders
        p.rbox(14, 39, 36, 17, 7, '#c7e0d4', INK)
        p.rbox(18, 41, 28, 10, 4, '#e5f3eb')
        p.box(22, 51, 20, 3, '#a4c4b5')
    elif who == 'auntie':
        p.box(26, 40, 12, 6, skin, INK)
        # Indonesian batik gold pattern dots on plum tunic
        for bx in (17, 23, 29, 35, 41):
            p.box(bx, 48, 3, 2, '#f4cc70')
            p.box(bx + 2, 53, 3, 2, '#f4cc70')
        p.box(16, 57, 32, 2, '#dfae4f')
    elif who == 'office':
        p.box(26, 40, 12, 6, skin, INK)
        p.poly([(22, 42), (29, 42), (30, 50), (24, 50)], '#f5f0df', INK)
        p.poly([(42, 42), (35, 42), (34, 50), (40, 50)], '#f5f0df', INK)
        p.box(30, 48, 4, 12, '#35537d', INK)
    elif who == 'boss':
        p.box(26, 40, 12, 6, skin, INK)
        p.rbox(12, 43, 15, 17, 2, '#dda639', INK)
        p.rbox(37, 43, 15, 17, 2, '#dda639', INK)
        p.box(13, 51, 13, 4, '#faf3c8')
        p.box(38, 51, 13, 4, '#faf3c8')
        p.box(28, 46, 8, 14, '#36566e')
    elif who == 'tech':
        p.box(26, 40, 12, 6, skin, INK)
        p.box(12, 50, 40, 4, '#e6ba4c')
        p.box(18, 46, 8, 4, '#f7e6a8', INK)

    # Neck & ears
    p.box(27, 35, 10, 7, skin, INK)
    p.box(28, 36, 8, 2, skin_sh)
    if who != 'hijab':
        p.rbox(17, 23, 5, 7, 2, skin, INK); p.box(19, 25, 2, 3, skin_sh)
        p.rbox(42, 23, 5, 7, 2, skin, INK); p.box(43, 25, 2, 3, skin_sh)

    # Back hair / hijab wrap
    if who in ('student', 'clerk'):
        p.rbox(16, 15, 32, 24, 8, hair_dk, INK)
    elif who == 'hijab':
        p.rbox(15, 8, 34, 34, 12, '#c7e0d4', INK)
        p.rbox(18, 10, 28, 10, 6, '#e8f5ee')
    elif who == 'auntie':
        p.rbox(22, 3, 20, 10, 5, hair_dk, INK)
        p.rbox(26, 5, 12, 3, 1, hair_hi)

    # Face
    p.rbox(20, 13, 24, 25, 7, skin, INK)
    p.rbox(22, 16, 20, 18, 5, skin_hi)
    p.rbox(24, 34, 16, 3, 2, skin_sh)

    # Hair crown (skip if hijab covers crown)
    if who == 'hijab':
        p.rbox(18, 10, 28, 8, 4, '#c7e0d4', INK)
        p.box(21, 11, 22, 3, '#e8f5ee')
        p.box(20, 16, 24, 2, '#9dbfae')
    else:
        p.rbox(19, 9, 26, 11, 6, hair_dk, INK)
        p.rbox(22, 10, 18, 4, 2, hair_hi)
        if who == 'student':
            p.box(19, 17, 4, 11, hair_dk)
            p.box(41, 17, 4, 11, hair_dk)
            p.rbox(36, 17, 6, 3, 1, '#e8765c', INK)  # coral hair clip
        elif who == 'clerk':
            p.box(19, 17, 4, 10, hair_dk)
            p.box(41, 17, 4, 10, hair_dk)
        elif who == 'auntie':
            p.box(19, 17, 4, 8, hair_dk)
            p.box(41, 17, 4, 8, hair_dk)
            p.px(21, 13, '#8a8280'); p.px(42, 13, '#8a8280')

    # Eyes, brows, cheeks & warm expression
    p.rbox(23, 21, 5, 2, 1, hair_dk)
    p.rbox(36, 21, 5, 2, 1, hair_dk)
    p.box(24, 24, 4, 3, '#fffaf0')
    p.box(36, 24, 4, 3, '#fffaf0')
    p.box(25, 24, 3, 3, INK)
    p.box(36, 24, 3, 3, INK)
    p.px(25, 24, '#ffffff'); p.px(36, 24, '#ffffff')
    if who == 'office':
        # Crisp hollow eyeglasses frames on portrait
        p.box(22, 22, 8, 7, None, '#332d28')
        p.box(34, 22, 8, 7, None, '#332d28')
        p.box(30, 24, 4, 1, '#332d28')
    p.box(31, 26, 2, 3, skin_sh)
    if who in ('student', 'clerk', 'vendor', 'player', 'hijab', 'auntie'):
        p.box(22, 28, 3, 2, '#f09c82')  # soft warm cheek blush
        p.box(39, 28, 3, 2, '#f09c82')
        p.box(29, 32, 6, 1, '#a55c3e')
        p.px(28, 31, '#a55c3e'); p.px(35, 31, '#a55c3e')  # friendly smile
    else:
        p.box(28, 32, 8, 1, '#9b583a')
        if who == 'boss':
            p.box(27, 30, 10, 2, hair_dk)  # distinguished contractor mustache

    # Distinct headgear
    if who == 'player':
        p.rbox(10, 14, 44, 6, 3, '#f2cf84', INK)
        p.box(13, 15, 38, 2, '#ffecb8')
        p.rbox(18, 6, 28, 11, 5, '#dfb46c', INK)
        p.box(20, 12, 24, 3, '#9a5337')
    elif who == 'engineer':
        p.rbox(14, 13, 36, 6, 3, '#e8be4a', INK)
        p.rbox(18, 6, 28, 11, 6, '#f2cf62', INK)
        p.rbox(24, 8, 12, 3, 1, '#fff0b2')
    elif who == 'boss':
        p.rbox(14, 13, 36, 6, 3, '#e2e5e6', INK)
        p.rbox(18, 6, 28, 11, 6, '#f7f8f5', INK)
        p.rbox(28, 7, 8, 4, 1, '#c84245')
    elif who == 'tech':
        p.rbox(16, 13, 32, 5, 2, '#2b476b', INK)
        p.rbox(19, 6, 26, 9, 5, '#3c6291', INK)
        p.rbox(28, 9, 8, 3, 1, '#f0c44d')
    elif who == 'clerk':
        p.rbox(16, 13, 32, 5, 2, '#c84245', INK)
        p.rbox(19, 6, 26, 9, 5, '#de5554', INK)
        p.rbox(28, 9, 8, 4, 1, '#fff2d2')
    elif who == 'rider':
        p.rbox(14, 13, 35, 5, 2, '#2f6a54', INK)
        p.rbox(19, 6, 26, 9, 5, '#3e8569', INK)
        p.box(25, 9, 14, 2, '#b9dfc7')
    elif who == 'vendor':
        p.rbox(18, 7, 28, 12, 6, '#e3be7a', INK)
        p.rbox(22, 9, 18, 4, 2, '#f6dca1')

    # Re-stamp crisp bottom border
    p.box(0, 61, 64, 3, '#5c4b39')
    p.box(2, 60, 60, 2, '#b79e74')
    p.im.save(ROOT / 'ui' / f'portrait-{who}.png')


def generate_all():
    from importlib.machinery import SourceFileLoader
    wan_mod = SourceFileLoader('draw_wan', str(Path(__file__).resolve().parent / 'draw-wan.py')).load_module()
    wan_mod.build_wan_sheet()
    wan_mod.build_wan_portrait()
    for who in ('player', 'student', 'vendor', 'rider', 'clerk', 'engineer', 'guide', 'hijab', 'auntie', 'office', 'boss', 'tech'):
        draw_role_portrait(who)
    for who, cfg in ROLES.items():
        sheet = Image.new('RGBA', (96, 160), (0, 0, 0, 0))
        for d in range(4):
            for s in range(3):
                sheet.paste(draw_person_frame(who, cfg, d, s), (s * 32, d * 40))
        sheet.save(ROOT / 'characters' / f'{who}.png')


if __name__ == '__main__':
    generate_all()
    print('Generated organic rounded characters + Teacher Wan turnaround sprite & portrait.')
