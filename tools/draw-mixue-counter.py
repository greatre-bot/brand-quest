"""Draw a single continuous 240x58 Mixue Indonesia long counter grounded in M004 (kota_tua_interior.jpg):
- One seamless warm oak countertop spanning left COLLECT pickup zone and right ORDER HERE register zone
- Left tabletop: red/cream stacked cups & two tabletop menu standees (no duplicate cash register)
- Right tabletop: single POS cash register monitor, receipt printer, QRIS standee & sanitizer pump
- Unified continuous backlit ice-blue/cream front light-box panel across the entire width
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / 'assets/pixel/props/counter.png'
INK = (46, 36, 32, 255)


def rgba(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def main():
    w, h = 240, 58
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    def rect(x, y, rw, rh, fill, outline=None):
        fc = rgba(fill) if isinstance(fill, str) else fill
        oc = rgba(outline) if isinstance(outline, str) else outline
        d.rectangle((x, y, x + rw - 1, y + rh - 1), fill=fc, outline=oc)

    # Subtle floor contact shadow under entire continuous counter
    rect(2, 55, 236, 3, (34, 38, 32, 72))

    # Main continuous counter body frame (NO middle seam!)
    rect(4, 22, 232, 34, '#d9d0bd', INK)

    # Continuous backlit ice-blue-to-cream M004 front light-box panel
    rect(6, 24, 228, 28, '#eaf5f7', '#5a8ea3')
    rect(7, 25, 226, 7, '#64bedb')
    rect(7, 32, 226, 6, '#9edbef')
    rect(7, 38, 226, 6, '#d6f0f7')
    rect(7, 44, 226, 7, '#f6eed7')
    # Subtle snow/wave pixel accents across light box
    for wx in range(12, 224, 24):
        rect(wx, 43, 12, 2, '#ffffff')
        rect(wx + 8, 45, 10, 1, '#e8dbc0')

    # Cute miniature Snow King mascot motif on far left of light-box (M004 reference)
    rect(14, 31, 12, 16, '#fffdf5', INK)
    rect(16, 27, 8, 5, '#fffdf5', INK)
    rect(17, 25, 6, 3, '#e8b642', INK)  # crown
    rect(17, 29, 6, 2, '#2d333b')       # tiny sunglasses
    rect(14, 36, 12, 3, '#d43c41')      # red cape trim

    # Clean bold pixel banner bars & crisp 3x5 pixel letters "ICE REAL FRUIT TEA" centered cleanly
    FONT = {
        'I': ['111', '010', '010', '010', '111'],
        'C': ['011', '100', '100', '100', '011'],
        'E': ['111', '100', '110', '100', '111'],
        'R': ['110', '101', '110', '101', '101'],
        'A': ['010', '101', '111', '101', '101'],
        'L': ['100', '100', '100', '100', '111'],
        'F': ['111', '100', '110', '100', '100'],
        'U': ['101', '101', '101', '101', '111'],
        'T': ['111', '010', '010', '010', '010'],
        ' ': ['00', '00', '00', '00', '00'],
    }

    def draw_text(txt, x0, y0, col, shadow):
        cx = x0
        for ch in txt:
            g = FONT.get(ch, FONT[' '])
            for ry, row in enumerate(g):
                for rx, bit in enumerate(row):
                    if bit == '1':
                        im.putpixel((cx + rx + 1, y0 + ry + 1), rgba(shadow))
                        im.putpixel((cx + rx, y0 + ry), rgba(col))
            cx += len(g[0]) + 1

    # Centered cleanly in middle span (x=88..154, leaving x=60 & x=176 clear for ! and ◆ markers)
    rect(82, 28, 76, 19, '#fff7e2', '#c83c40')
    draw_text('ICE REAL', 96, 31, '#c83439', '#f2d0b6')
    draw_text('FRUIT TEA', 93, 39, '#2e7c99', '#cde8f0')

    # Decorative fruit/cup color pills flanking the banner
    rect(34, 34, 12, 10, '#f4c552', '#8f5f28')
    rect(36, 36, 8, 6, '#fff2b0')
    rect(210, 34, 14, 10, '#d84548', '#7d2428')
    rect(212, 36, 10, 6, '#ffe8d8')

    # Stainless baseboard kickplate along bottom
    rect(5, 52, 230, 4, '#9ea5a6', INK)
    rect(6, 53, 228, 1, '#c8cece')

    # Continuous seamless warm-oak countertop across full 240px width
    rect(2, 13, 236, 10, '#e3be84', INK)
    rect(3, 14, 234, 3, '#f7e0b2')
    rect(3, 20, 234, 2, '#be9359')

    # --- LEFT SIDE (COLLECT pickup zone): stacked cups + 2 tabletop menu standees (NO cash register!) ---
    # Red/cream stacked takeaway cups (left end)
    for cx in (12, 21, 30):
        rect(cx, 6, 7, 9, '#f8eed4', INK)
        rect(cx + 1, 7, 5, 2, '#d64549')
        rect(cx, 5, 7, 2, '#fff7e4', INK)
    # Two tabletop menu standees ("TOP PICKS" & drink card, directly from M004)
    rect(72, 4, 14, 12, '#f5ebd0', INK)
    rect(74, 6, 10, 4, '#4ea8c8')
    rect(74, 10, 10, 4, '#e6b14c')
    rect(90, 6, 11, 10, '#f8eed4', INK)
    rect(92, 8, 7, 6, '#d94c4c')
    # Pickup tray mat on left counter top
    rect(44, 15, 22, 5, '#c94346', '#7a2529')
    rect(46, 16, 18, 3, '#e86868')

    # --- RIGHT SIDE (ORDER HERE cashier zone): ONE single POS cash register + receipt printer + QRIS ---
    # Hand sanitizer pump & small QRIS tabletop stand (classic Indonesian counter touch)
    rect(136, 9, 5, 7, '#d8f2f7', INK)
    rect(137, 7, 3, 2, '#ffffff', INK)
    rect(146, 8, 9, 8, '#fff7e2', INK)
    rect(148, 10, 5, 4, '#364954')
    # Single POS cash register monitor facing cashier
    rect(182, 2, 22, 13, '#3b4a52', INK)
    rect(184, 4, 18, 9, '#64858d')
    rect(185, 5, 7, 3, '#8fb2ba')
    rect(190, 14, 6, 3, '#2d3940', INK)
    # Receipt printer + small red cup display on far right
    rect(208, 8, 10, 8, '#4e585c', INK)
    rect(210, 6, 6, 3, '#fff9e8', INK)
    rect(222, 8, 7, 8, '#f8eed4', INK)
    rect(223, 9, 5, 2, '#d64549')

    im.save(OUT)
    print(f'Wrote {OUT} ({im.size}, {OUT.stat().st_size} bytes)')


if __name__ == '__main__':
    main()
