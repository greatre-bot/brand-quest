"""Stardew-proportioned, turnaround-faithful Teacher Wan sprite (96x160: 32x40 x 3 x 4)
and 64x64 dialogue portrait matching assets/references/npc_user_video_contact_sheet.jpg (U001)
while harmonizing seamlessly with the game's crisp Stardew-inspired cast (player, rider, tech):
- Clean big readable head + crisp 2x2 highlighted eyes (no squinting/noisy pixel soup)
- Compact natural Stardew walk cycle (zero awkward scissor splits or oversized ski boots)
- Faithfully retains every turnaround signature: spiky short black hair + clean side/nape fade,
  deep navy sleeveless polo vest with collar & white chest H-mark, bare athletic arms,
  black wristwatch on left wrist, diagonal black crossbody strap + left-hip pouch,
  dark charcoal shorts, bare calves, and neat wheat-tan lace-up boots.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / 'assets/pixel'
INK = (34, 26, 24, 255)


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

    def rbox(self, x, y, w, h, r, fill, outline=None):
        if w <= 0 or h <= 0:
            return
        fc = None if fill is None else (rgba(fill) if isinstance(fill, str) else fill)
        oc = None if outline is None else (rgba(outline) if isinstance(outline, str) else outline)
        self.d.rounded_rectangle((x, y, x + w - 1, y + h - 1), radius=r, fill=fc, outline=oc)

    def oval(self, x, y, w, h, fill, outline=None):
        fc = None if fill is None else (rgba(fill) if isinstance(fill, str) else fill)
        oc = None if outline is None else (rgba(outline) if isinstance(outline, str) else outline)
        self.d.ellipse((x, y, x + w - 1, y + h - 1), fill=fc, outline=oc)


# Clean, cohesive Stardew palette (3 tones per material — zero muddy noise)
HAIR_DK, HAIR, HAIR_HI = '#1b1a20', '#2b2933', '#434150'
FADE_UP, FADE_LO = '#6c5346', '#ad7e60'
SKIN_HI, SKIN, SKIN_SH = '#f8c393', '#e79e69', '#bf7448'
VEST_HI, VEST, VEST_SH = '#49639c', '#314575', '#212e52'
STRAP_HI, STRAP, BAG_DK = '#4a4c56', '#282a32', '#17181d'
WATCH_BEZ = '#8c96a8'
SHORT_HI, SHORT, SHORT_SH = '#4b4e57', '#353740', '#23252b'
BOOT_HI, BOOT, BOOT_SH, LACE, SOLE = '#e8b36d', '#c78946', '#915c2c', '#f8e6c2', '#3a291e'


def draw_wan_frame(direction, step):
    """Draw one crisp 32x40 frame matching the exact Stardew scale of player/rider/tech."""
    p = Pix(32, 40)
    bob = -1 if step in (1, 2) else 0
    # Ground shadow (same y=35..38 footprint as player.png & rider.png)
    p.oval(6, 35, 20, 4, (34, 38, 32, 74))

    if direction == 0:  # FRONT (DOWN)
        # Legs + shorts + calves + compact tan boots (clean 1-2px step lift)
        l_up = -2 if step == 1 else (1 if step == 2 else 0)
        r_up = 1 if step == 1 else (-2 if step == 2 else 0)
        for lx, dy in [(10, l_up), (17, r_up)]:
            # Charcoal shorts leg
            p.box(lx, 26 + bob, 5, 5, SHORT, INK)
            p.box(lx + 1, 27 + bob, 2, 3, SHORT_HI)
            # Neat wheat-tan lace-up boot
            by = 34 + dy
            # Bare calf seamlessly bridges shorts (30+bob) down into boot cuff (by+1)
            calf_top = 30 + bob
            p.box(lx + 1, calf_top, 3, max(2, by - calf_top + 1), SKIN, INK)
            p.px(lx + 1, calf_top + 1, SKIN_HI)
            p.box(lx, by, 5, 4, BOOT, INK)
            p.box(lx + 1, by + 1, 3, 1, BOOT_HI)
            p.px(lx + 2, by + 1, LACE)
            p.box(lx + 1, by + 3, 3, 1, SOLE)
        # Sealed shorts waistband
        p.box(10, 25 + bob, 12, 3, SHORT, INK)
        p.box(11, 26 + bob, 5, 1, SHORT_HI)
        p.box(15, 26 + bob, 2, 2, SHORT_SH)

        # Bare athletic arms (gentle 1px alternating swing)
        al = 18 + bob + (1 if step == 2 else 0)
        ar = 18 + bob + (1 if step == 1 else 0)
        # Viewer-left arm (Wan's right arm)
        p.rbox(7, al, 4, 9, 1, SKIN, INK)
        p.box(8, al + 1, 2, 5, SKIN_HI)
        p.px(8, al + 7, SKIN_SH)
        # Viewer-right arm (Wan's left arm with black watch!)
        p.rbox(21, ar, 4, 9, 1, SKIN, INK)
        p.box(22, ar + 1, 2, 4, SKIN_HI)
        p.box(21, ar + 5, 4, 2, STRAP, INK)
        p.px(23, ar + 5, WATCH_BEZ)

        # Sleeveless navy polo vest
        p.rbox(10, 17 + bob, 12, 9, 2, VEST, INK)
        p.box(11, 18 + bob, 4, 7, VEST_HI)
        p.box(19, 18 + bob, 2, 7, VEST_SH)
        # Collar & tiny V-neck + white chest H-mark (viewer's right = Wan's left chest)
        p.box(14, 16 + bob, 4, 3, SKIN)
        p.px(12, 17 + bob, VEST_HI); p.px(19, 17 + bob, VEST_HI)
        p.box(15, 19 + bob, 2, 2, VEST_SH)
        p.px(18, 20 + bob, '#ffffff'); p.px(19, 20 + bob, '#e4ebf7')
        p.px(18, 21 + bob, '#d4ddf0'); p.px(19, 21 + bob, '#ffffff')

        # Diagonal black crossbody strap -> left-hip pouch
        for i in range(8):
            p.box(11 + i, 17 + bob + i, 2, 2, STRAP)
            p.px(11 + i, 17 + bob + i, STRAP_HI)
        p.rbox(19, 23 + bob, 5, 5, 1, STRAP, INK)
        p.box(20, 24 + bob, 3, 2, STRAP_HI)
        p.box(20, 26 + bob, 3, 1, BAG_DK)

        # Big readable Stardew head (y=3..17, 14px wide, rounded friendly jaw)
        p.box(14, 15 + bob, 4, 3, SKIN_SH)
        p.box(8, 10 + bob, 2, 4, SKIN, INK)
        p.box(22, 10 + bob, 2, 4, SKIN, INK)
        p.rbox(9, 5 + bob, 14, 12, 4, SKIN, INK)
        p.rbox(10, 7 + bob, 12, 8, 2, SKIN_HI)
        p.box(12, 15 + bob, 8, 1, SKIN_SH)
        # Clean spiky short black hair + temple fade
        p.rbox(9, 3 + bob, 14, 5, 3, HAIR_DK, INK)
        p.box(11, 2 + bob, 10, 2, HAIR_DK)
        for hx in (11, 14, 17, 20):
            p.px(hx, 2 + bob, HAIR_DK)
            p.px(hx, 4 + bob, HAIR_HI)
        p.px(10, 4 + bob, HAIR); p.px(21, 4 + bob, HAIR)
        p.box(9, 7 + bob, 2, 3, FADE_UP)
        p.box(21, 7 + bob, 2, 3, FADE_UP)
        p.px(9, 10 + bob, FADE_LO); p.px(22, 10 + bob, FADE_LO)
        # Crisp friendly Stardew 2x2 eyes with bright catchlight + calm mouth
        p.box(11, 9 + bob, 3, 1, '#4b3428')
        p.box(18, 9 + bob, 3, 1, '#4b3428')
        p.box(11, 10 + bob, 2, 2, INK)
        p.box(19, 10 + bob, 2, 2, INK)
        p.px(11, 10 + bob, '#fff9ee')
        p.px(19, 10 + bob, '#fff9ee')
        p.box(14, 14 + bob, 4, 1, '#a96846')

    elif direction == 3:  # BACK (UP)
        l_up = -2 if step == 1 else (1 if step == 2 else 0)
        r_up = 1 if step == 1 else (-2 if step == 2 else 0)
        for lx, dy in [(10, l_up), (17, r_up)]:
            p.box(lx, 26 + bob, 5, 5, SHORT, INK)
            p.box(lx + 1, 27 + bob, 2, 3, SHORT_HI)
            by = 34 + dy
            calf_top = 30 + bob
            p.box(lx + 1, calf_top, 3, max(2, by - calf_top + 1), SKIN, INK)
            p.box(lx, by, 5, 4, BOOT, INK)
            p.box(lx + 1, by + 1, 3, 1, BOOT_HI)
            p.box(lx + 1, by + 3, 3, 1, SOLE)
        p.box(10, 25 + bob, 12, 3, SHORT, INK)
        p.box(15, 26 + bob, 2, 2, SHORT_SH)

        al = 18 + bob + (1 if step == 1 else 0)
        ar = 18 + bob + (1 if step == 2 else 0)
        # Viewer-left is Wan's LEFT arm (with watch!) from behind
        p.rbox(7, al, 4, 9, 1, SKIN, INK)
        p.box(8, al + 1, 2, 4, SKIN_HI)
        p.box(7, al + 5, 4, 2, STRAP, INK)
        p.px(8, al + 5, WATCH_BEZ)
        p.rbox(21, ar, 4, 9, 1, SKIN, INK)
        p.box(22, ar + 1, 2, 5, SKIN_HI)

        p.rbox(10, 17 + bob, 12, 9, 2, VEST, INK)
        p.box(11, 18 + bob, 4, 7, VEST_HI)
        p.box(19, 18 + bob, 2, 7, VEST_SH)
        # Strap runs from Wan's right shoulder (viewer-right) down to left-hip pouch (viewer-left)
        for i in range(8):
            p.box(19 - i, 17 + bob + i, 2, 2, STRAP)
            p.px(19 - i, 17 + bob + i, STRAP_HI)
        p.rbox(8, 23 + bob, 5, 5, 1, STRAP, INK)
        p.box(9, 24 + bob, 3, 2, STRAP_HI)
        p.box(9, 26 + bob, 3, 1, BAG_DK)

        # Head from behind with clean nape fade
        p.box(14, 15 + bob, 4, 3, SKIN_SH)
        p.box(8, 10 + bob, 2, 4, SKIN, INK)
        p.box(22, 10 + bob, 2, 4, SKIN, INK)
        p.rbox(9, 5 + bob, 14, 12, 4, SKIN, INK)
        p.rbox(9, 3 + bob, 14, 9, 3, HAIR_DK, INK)
        p.box(11, 2 + bob, 10, 2, HAIR_DK)
        for hx in (11, 14, 17, 20):
            p.px(hx, 4 + bob, HAIR_HI)
            p.px(hx + 1, 7 + bob, HAIR)
        p.box(10, 11 + bob, 12, 2, FADE_UP)
        p.box(11, 13 + bob, 10, 2, FADE_LO)

    else:  # LEFT (direction == 1) & RIGHT (direction == 2)
        # Compact, natural Stardew side stride (identical clean rhythm to rider.png & player.png!)
        sf = 0 if step == 0 else (-2 if step == 1 else 2)
        sb = -sf
        # Back leg (slightly shaded, cleanly tucked & ankle-sealed)
        if step != 0:
            p.box(13 + sb, 26 + bob, 5, 5, SHORT_SH, INK)
            p.box(14 + sb, 30 + bob, 3, 5 - bob, SKIN_SH, INK)
            p.box(12 + sb, 34, 6, 4, BOOT_SH, INK)
            p.box(13 + sb, 37, 4, 1, SOLE)
        # Front leg (ankle-sealed cleanly into boot cuff)
        p.box(12 + sf, 26 + bob, 6, 5, SHORT, INK)
        p.box(13 + sf, 27 + bob, 3, 3, SHORT_HI)
        p.box(13 + sf, 30 + bob, 4, 5 - bob, SKIN, INK)
        p.px(14 + sf, 31 + bob, SKIN_HI)
        p.box(11 + sf, 34, 6, 4, BOOT, INK)
        p.box(12 + sf, 35, 4, 1, BOOT_HI)
        p.px(13 + sf, 35, LACE)
        p.box(12 + sf, 37, 4, 1, SOLE)
        # Sealed shorts hip
        p.box(11, 25 + bob, 10, 3, SHORT, INK)
        p.box(12, 26 + bob, 4, 1, SHORT_HI)

        # Torso (sleeveless navy polo vest, side profile)
        p.rbox(11, 17 + bob, 10, 9, 2, VEST, INK)
        p.box(12, 18 + bob, 3, 7, VEST_HI)
        p.box(18, 18 + bob, 2, 7, VEST_SH)
        p.px(12, 20 + bob, '#ffffff')  # chest emblem glimpse on front chest

        # Side arm + watch (visible on LEFT side = Wan's left arm!)
        arm_x = 14 + (1 if step == 1 else (-1 if step == 2 else 0))
        p.rbox(arm_x, 18 + bob, 4, 9, 1, SKIN, INK)
        p.box(arm_x + 1, 19 + bob, 2, 5, SKIN_HI)
        if direction == 1:
            p.box(arm_x, 23 + bob, 4, 2, STRAP, INK)
            p.px(arm_x + 1, 23 + bob, WATCH_BEZ)
            # Flap pouch on hip behind left arm
            p.rbox(18, 22 + bob, 5, 6, 1, STRAP, INK)
            p.box(19, 23 + bob, 3, 2, STRAP_HI)
            p.box(19, 25 + bob, 3, 2, BAG_DK)
        else:
            # Diagonal strap across right shoulder/torso when viewed from right
            p.box(12, 18 + bob, 2, 3, STRAP)

        # Clean side-profile Stardew head (same height y=3..17 as front!)
        p.box(14, 15 + bob, 4, 3, SKIN_SH)
        p.rbox(9, 5 + bob, 13, 12, 4, SKIN, INK)
        p.rbox(10, 7 + bob, 8, 8, 2, SKIN_HI)
        p.box(10, 15 + bob, 7, 1, SKIN_SH)
        # Side hair crown + smooth taper fade down back & sideburn
        p.rbox(10, 3 + bob, 12, 5, 3, HAIR_DK, INK)
        p.box(11, 2 + bob, 9, 2, HAIR_DK)
        p.box(17, 6 + bob, 5, 6, HAIR_DK, INK)
        p.px(13, 4 + bob, HAIR_HI); p.px(17, 4 + bob, HAIR_HI)
        p.box(15, 7 + bob, 3, 4, FADE_UP)
        p.box(16, 11 + bob, 5, 2, FADE_UP)
        p.box(15, 11 + bob, 2, 2, FADE_LO)
        p.box(17, 13 + bob, 4, 1, FADE_LO)
        # Ear
        p.box(16, 10 + bob, 2, 3, SKIN, INK)
        # Crisp side eye + subtle smile
        p.box(10, 9 + bob, 3, 1, '#4b3428')
        p.box(10, 10 + bob, 2, 2, INK)
        p.px(10, 10 + bob, '#fff9ee')
        p.box(10, 14 + bob, 2, 1, '#a96846')

        if direction == 2:
            p.im = p.im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)

    return p.im


def build_wan_sheet():
    sheet = Image.new('RGBA', (96, 160), (0, 0, 0, 0))
    for d in range(4):
        for s in range(3):
            sheet.paste(draw_wan_frame(d, s), (s * 32, d * 40))
    out_path = ROOT / 'characters' / 'wan.png'
    sheet.save(out_path)
    print(f'Wrote {out_path} ({sheet.size}, {out_path.stat().st_size} bytes)')


def build_wan_portrait():
    """Handsome, crisp 64x64 Stardew portrait harmonized with portrait-player / portrait-rider / portrait-tech
    while faithfully capturing Teacher Wan's turnaround look (U001)."""
    p = Pix(64, 64)
    # 1. Standard warm Stardew portrait frame & sunlit sky backdrop (matches all other portraits!)
    p.box(0, 0, 64, 64, '#5c4b39')
    p.box(1, 1, 62, 62, '#d9c59d')
    p.box(2, 2, 60, 60, '#b79e74')
    p.box(3, 3, 58, 58, '#f6ebd0')
    p.box(4, 4, 56, 56, '#efe1bf')
    p.box(4, 4, 56, 26, '#d9e7de')
    p.box(4, 28, 56, 6, '#e6e3ca')

    # 2. Broad rounded athletic shoulders & bare arms (harmonized Stardew bust curve, y=38..60)
    p.rbox(9, 41, 46, 22, 11, SKIN, INK)
    p.rbox(11, 43, 12, 18, 5, SKIN_HI)
    p.rbox(44, 43, 9, 18, 4, SKIN_SH)
    # Subtle inner-arm shadow separation
    p.box(18, 50, 1, 10, SKIN_SH)
    p.box(45, 50, 1, 10, SKIN_SH)

    # 3. Sleeveless deep-navy polo vest (y=39..60, clean rounded shoulders & cel shading)
    p.rbox(17, 39, 30, 22, 6, VEST, INK)
    p.box(19, 41, 8, 19, VEST_HI)
    p.box(41, 41, 4, 19, VEST_SH)

    # 4. Neck, folded polo collar & short placket
    p.box(27, 34, 10, 7, SKIN, INK)
    p.box(28, 35, 8, 2, SKIN_SH)  # soft jaw shadow on neck
    # Open V collar skin
    p.box(29, 40, 6, 4, SKIN)
    p.box(30, 44, 4, 2, SKIN_SH)
    # Folded navy polo collar flaps
    p.box(24, 39, 5, 5, VEST_HI, INK)
    p.box(35, 39, 5, 5, VEST, INK)
    p.box(25, 40, 3, 2, '#627db8')
    # Short 2-button placket
    p.box(30, 45, 4, 5, VEST_SH, INK)
    p.px(31, 46, VEST_HI); p.px(31, 48, VEST_HI)

    # 5. Crisp white H/X chest emblem on left chest (viewer's right: x=37..42, y=46..49)
    for dy, row in enumerate(['ww.ww', '.www.', 'ww.ww']):
        for dx, ch in enumerate(row):
            if ch == 'w':
                p.px(37 + dx, 46 + dy, '#ffffff' if dy == 1 else '#dbe4f5')

    # 6. Diagonal black crossbody strap (right shoulder x=20,y=40 -> left hip x=42,y=60)
    for i in range(21):
        sx = 20 + int(i * 1.0)
        sy = 40 + i
        p.px(sx - 1, sy, INK)
        p.box(sx, sy, 4, 1, STRAP)
        if i % 2 == 0:
            p.px(sx + 1, sy, STRAP_HI)
        p.px(sx + 4, sy, INK)
    # Top edge of black flap pouch peeking at bottom-right
    p.rbox(39, 55, 8, 6, 1, STRAP, INK)
    p.box(40, 56, 6, 2, STRAP_HI)
    p.box(40, 58, 6, 2, BAG_DK)

    # 7. Clean, handsome Stardew head (same 24px face scale as portrait-player/rider/tech!)
    # Ears
    p.rbox(17, 22, 4, 6, 1, SKIN, INK)
    p.box(18, 23, 2, 4, SKIN_SH)
    p.rbox(43, 22, 4, 6, 1, SKIN, INK)
    p.box(44, 23, 2, 4, SKIN_SH)
    # Smooth rounded face & jaw (x=20..43, y=13..35)
    p.rbox(20, 13, 24, 23, 6, SKIN, INK)
    p.rbox(21, 15, 22, 16, 4, SKIN_HI)
    p.box(21, 16, 2, 14, SKIN)
    p.box(41, 16, 2, 14, SKIN)
    # Subtle warm jawline & soft chin contour (NO dark beard bar!)
    p.box(24, 33, 16, 2, SKIN_SH)
    p.box(27, 34, 10, 1, '#a9623b')

    # 8. Clean short spiky black hair dome + soft side temple fade
    p.rbox(19, 8, 26, 9, 4, HAIR_DK, INK)
    p.box(22, 6, 20, 4, HAIR_DK)
    # Natural spiky silhouette along top crown
    for hx, hw in [(22, 3), (27, 3), (32, 4), (38, 3)]:
        p.box(hx, 5, hw, 2, INK)
        p.box(hx + 1, 6, max(1, hw - 1), 2, HAIR_DK)
    # Clean hair sheen clusters
    p.box(23, 9, 5, 2, HAIR_HI)
    p.box(31, 8, 6, 2, HAIR)
    p.box(36, 9, 4, 2, HAIR_HI)
    p.box(25, 11, 14, 2, HAIR)
    # Irregular organic hairline
    p.box(21, 15, 22, 1, HAIR_DK)
    p.box(24, 15, 4, 1, SKIN_HI)
    p.box(34, 15, 5, 1, SKIN_HI)
    # Smooth graduated temple fade on both sides
    p.box(20, 16, 2, 3, HAIR)
    p.box(42, 16, 2, 3, HAIR)
    p.box(20, 19, 2, 2, FADE_UP)
    p.box(42, 19, 2, 2, FADE_UP)
    p.box(20, 21, 1, 2, FADE_LO)
    p.box(43, 21, 1, 2, FADE_LO)

    # 9. Expressive, warm Stardew facial features (matching portrait-rider / portrait-tech!)
    # Clean brows
    p.box(23, 20, 5, 2, '#2a2224')
    p.box(36, 20, 5, 2, '#2a2224')
    # Bright crisp 4x3 eyes with white sclera + dark iris + sparkle!
    p.box(23, 23, 5, 3, '#fffaf2')
    p.box(25, 23, 3, 3, INK)
    p.px(25, 23, '#ffffff')
    p.box(36, 23, 5, 3, '#fffaf2')
    p.box(36, 23, 3, 3, INK)
    p.px(36, 23, '#ffffff')
    # Subtle warm cheeks
    p.box(22, 27, 3, 1, '#e89b78')
    p.box(39, 27, 3, 1, '#e89b78')
    # Clean nose
    p.box(31, 26, 2, 3, SKIN_SH)
    # Calm, friendly slight smile
    p.box(29, 31, 6, 1, '#9c5636')
    p.px(28, 30, '#c47b54'); p.px(35, 30, '#c47b54')

    # Clean bottom & side frame re-seal
    p.box(0, 60, 64, 1, '#f6ebd0')
    p.box(0, 61, 64, 1, '#b79e74')
    p.box(0, 62, 64, 2, '#5c4b39')
    p.box(0, 0, 1, 64, '#5c4b39'); p.box(63, 0, 1, 64, '#5c4b39')

    out_path = ROOT / 'ui' / 'portrait-wan.png'
    p.im.save(out_path)
    print(f'Wrote {out_path} ({p.im.size}, {out_path.stat().st_size} bytes)')


if __name__ == '__main__':
    build_wan_sheet()
    build_wan_portrait()
