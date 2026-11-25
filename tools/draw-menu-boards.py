"""Draw the two distinct 96x53 backlit Mixue wall menu screens (6 unique products total):
- assets/pixel/props/menu-board.png        (Ice Cream & Sundaes: Cone, Boba Sundae, Mango Sundae)
- assets/pixel/props/menu-board-drinks.png (Fruit Tea & Milk Tea: Lemonade, Boba Milk Tea, Strawberry Shake)
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / 'assets/pixel/props'
INK = '#3a2c22'
FRAME = '#bfac89'
FRAME_HI = '#d9c9a8'
CARD = '#fff2d2'
CARD_BORDER = '#874e41'
RED = '#bf373a'
RED_HI = '#dc5754'
PRICE = '#8a5838'


def make_board():
    im = Image.new('RGBA', (96, 53), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # Outer metallic/warm-wood lightbox frame
    d.rectangle((2, 2, 93, 48), fill=FRAME, outline=INK, width=1)
    d.line((3, 3, 92, 3), fill=FRAME_HI)
    for i in range(3):
        x = 5 + i * 29
        d.rectangle((x, 5, x + 26, 43), fill=CARD, outline=CARD_BORDER, width=1)
        d.rectangle((x + 1, 6, x + 25, 11), fill=RED)
        d.line((x + 1, 6, x + 25, 6), fill=RED_HI)
        # Tiny white menu header bar & bottom price bar
        d.rectangle((x + 5, 8, x + 15, 9), fill='#fff5dc')
        d.rectangle((x + 16, 39, x + 23, 40), fill=PRICE)
        d.rectangle((x + 4, 39, x + 13, 40), fill='#c9ad7f')
    return im, d


def draw_cone(d, cx, top_y):
    # Waffle cone
    d.polygon([(cx - 5, top_y + 11), (cx + 5, top_y + 11), (cx, top_y + 23)], fill='#df9d4b', outline=INK)
    d.line((cx - 3, top_y + 14, cx + 2, top_y + 18), fill='#a66a28')
    d.line((cx + 3, top_y + 14, cx - 2, top_y + 18), fill='#a66a28')
    # Creamy vanilla soft-serve swirl
    d.rounded_rectangle((cx - 7, top_y + 7, cx + 7, top_y + 12), radius=2, fill='#fff5dc', outline=INK)
    d.rounded_rectangle((cx - 5, top_y + 3, cx + 5, top_y + 8), radius=2, fill='#fffaf0', outline=INK)
    d.polygon([(cx, top_y), (cx - 3, top_y + 4), (cx + 3, top_y + 4)], fill='#ffffff', outline=INK)
    d.rectangle((cx - 4, top_y + 7, cx + 4, top_y + 10), fill='#fff8e8')
    d.line((cx - 5, top_y + 9, cx + 5, top_y + 9), fill='#e8d5b0')


def draw_boba_sundae(d, cx, top_y):
    # Clear sundae cup
    d.polygon([(cx - 6, top_y + 10), (cx + 6, top_y + 10), (cx + 4, top_y + 23), (cx - 4, top_y + 23)], fill='#eef7f4', outline=INK)
    d.polygon([(cx - 5, top_y + 11), (cx + 5, top_y + 11), (cx + 3, top_y + 22), (cx - 3, top_y + 22)], fill='#fff6df')
    # Creamy swirl top
    d.rounded_rectangle((cx - 6, top_y + 5, cx + 6, top_y + 11), radius=2, fill='#fffaf0', outline=INK)
    d.polygon([(cx, top_y + 1), (cx - 3, top_y + 6), (cx + 3, top_y + 6)], fill='#ffffff', outline=INK)
    # Brown sugar drizzle
    d.line([(cx - 4, top_y + 9), (cx - 1, top_y + 11), (cx + 2, top_y + 8), (cx + 4, top_y + 10)], fill='#9e521e', width=1)
    # Dark brown boba pearls at cup base
    for px, py in [(cx - 3, top_y + 19), (cx, top_y + 20), (cx + 3, top_y + 19), (cx - 2, top_y + 16), (cx + 2, top_y + 16)]:
        d.rectangle((px - 1, py - 1, px + 1, py + 1), fill='#3c231a')
        d.point((px - 1, py - 1), fill='#f2d4a2')


def draw_mango_sundae(d, cx, top_y):
    # Clear sundae cup with golden mango layer
    d.polygon([(cx - 6, top_y + 10), (cx + 6, top_y + 10), (cx + 4, top_y + 23), (cx - 4, top_y + 23)], fill='#eef7f4', outline=INK)
    d.polygon([(cx - 5, top_y + 11), (cx + 5, top_y + 11), (cx + 3, top_y + 22), (cx - 3, top_y + 22)], fill='#fff6df')
    d.polygon([(cx - 4, top_y + 16), (cx + 4, top_y + 16), (cx + 3, top_y + 22), (cx - 3, top_y + 22)], fill='#f2a732')
    # Creamy swirl top
    d.rounded_rectangle((cx - 6, top_y + 5, cx + 6, top_y + 11), radius=2, fill='#fffaf0', outline=INK)
    d.polygon([(cx, top_y + 1), (cx - 3, top_y + 6), (cx + 3, top_y + 6)], fill='#ffffff', outline=INK)
    # Bright golden mango cubes
    for mx, my in [(cx - 5, top_y + 9), (cx + 1, top_y + 9), (cx - 2, top_y + 12)]:
        d.rectangle((mx, my, mx + 3, my + 3), fill='#ffbe3b', outline='#b36b14')
        d.point((mx + 1, my + 1), fill='#fff1a8')


def draw_cup_drink(d, cx, top_y, liq, foam, straw_col, style):
    # Straw poking up from Mixue red lid
    d.line((cx + 2, top_y + 6, cx + 4, top_y + 1), fill=straw_col, width=2)
    # Tall clear drink cup
    d.polygon([(cx - 6, top_y + 7), (cx + 6, top_y + 7), (cx + 5, top_y + 23), (cx - 5, top_y + 23)], fill='#eef7f4', outline=INK)
    d.polygon([(cx - 5, top_y + 10), (cx + 5, top_y + 10), (cx + 4, top_y + 22), (cx - 4, top_y + 22)], fill=liq)
    d.line((cx - 5, top_y + 10, cx + 5, top_y + 10), fill=foam)
    # Signature topping details inside cup
    if style == 'lemon':
        # Floating lemon wheel + crystal ice cubes
        d.ellipse((cx - 4, top_y + 12, cx + 2, top_y + 18), fill='#fff1ba', outline='#d4992e')
        d.rectangle((cx + 1, top_y + 11, cx + 4, top_y + 14), fill='#c8f0ff', outline='#5b98b8')
    elif style == 'boba':
        # Dark boba pearls settled at bottom + caramel streaks
        for px, py in [(cx - 3, top_y + 20), (cx, top_y + 20), (cx + 3, top_y + 20), (cx - 2, top_y + 17), (cx + 2, top_y + 17)]:
            d.rectangle((px - 1, py - 1, px + 1, py + 1), fill='#3c231a')
            d.point((px - 1, py - 1), fill='#f2d4a2')
    elif style == 'strawberry':
        # Refreshing translucent strawberry fruit tea with ice cube + ruby strawberry chunks
        d.rectangle((cx + 1, top_y + 11, cx + 4, top_y + 14), fill='#c8f0ff', outline='#5b98b8')
        for sx, sy in [(cx - 3, top_y + 13), (cx + 1, top_y + 16), (cx - 2, top_y + 19)]:
            d.rectangle((sx, sy, sx + 2, sy + 2), fill='#c72c38')
            d.point((sx, sy), fill='#ffb8be')
    # Iconic Mixue red cup lid
    d.rectangle((cx - 7, top_y + 5, cx + 7, top_y + 7), fill=RED, outline=INK)
    # Glass vertical shine
    d.line((cx - 4, top_y + 11, cx - 4, top_y + 20), fill='#ffffff')


# Board 1 (Left): Ice Cream & Sundaes
im1, d1 = make_board()
draw_cone(d1, 18, 14)
draw_boba_sundae(d1, 47, 14)
draw_mango_sundae(d1, 76, 14)
im1.save(ROOT / 'menu-board.png')

# Board 2 (Right): Fruit Tea & Milk Tea
im2, d2 = make_board()
draw_cup_drink(d2, 18, 14, '#efd968', '#fff6bd', '#3a7a4c', 'lemon')
draw_cup_drink(d2, 47, 14, '#d6a066', '#f7dfbc', '#3a2618', 'boba')
draw_cup_drink(d2, 76, 14, '#eb727e', '#ffd4da', '#3a7a4c', 'strawberry')
im2.save(ROOT / 'menu-board-drinks.png')
print('Generated menu-board.png & menu-board-drinks.png (6 distinct Mixue items)')
