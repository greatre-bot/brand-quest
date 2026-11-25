"""Original icons for the field journal."""
from pathlib import Path
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parents[1]/'assets/pixel/ui'
out='#413f31'; green='#436751'; gold='#daac62'; pale='#ffebbd'
def icon(name,draw):
    im=Image.new('RGBA',(32,32));d=ImageDraw.Draw(im);draw(d);im.save(root/(name+'.png'))
def compass(d):
    d.rectangle((12,0,19,5),outline=gold,width=2)
    d.polygon([(9,4),(22,4),(29,11),(29,22),(22,29),(9,29),(2,22),(2,11)],fill=gold,outline=out,width=2)
    d.ellipse((5,6,26,27),fill='#f4e5bf',outline='#846642',width=2)
    d.polygon([(22,9),(17,18),(11,22),(15,14)],fill='#c4583f')
    d.polygon([(11,23),(15,14),(18,18)],fill=green)
    d.rectangle((15,16,16,17),fill=out)
def camera(d):
    d.rectangle((4,11,27,25),fill=gold,outline=out,width=2);d.rectangle((8,7,15,11),fill=green,outline=out)
    d.rectangle((6,13,25,21),fill=green);d.ellipse((12,12,22,22),fill=pale,outline=out);d.ellipse((15,15,19,19),fill=green)
    d.rectangle((22,10,25,12),fill=pale)
def book(d):
    d.polygon([(3,7),(12,6),(16,9),(21,6),(29,6),(29,25),(21,25),(16,28),(10,25),(3,25)],fill=gold,outline=out,width=2)
    d.polygon([(5,5),(12,5),(16,8),(16,24),(11,22),(5,22)],fill=pale,outline=out)
    d.polygon([(16,8),(22,4),(27,4),(27,21),(21,21),(16,24)],fill='#e9d39e',outline=out)
    for y in (10,14,18):d.line((7,y,12,y+1),fill='#b99e75');d.line((20,y,25,y-1),fill='#b99e75')
def mapicon(d):
    d.polygon([(2,7),(10,4),(20,7),(29,3),(29,25),(21,29),(11,26),(2,29)],fill='#edd5a0',outline=out,width=2)
    d.line((10,5,11,25),fill='#ab986d');d.line((20,8,21,27),fill='#ab986d')
    d.line([(4,22),(11,14),(17,17),(24,11)],fill=green,width=2);d.ellipse((19,8,25,14),fill='#bc573f')
def cup(d):
    d.polygon([(6,9),(25,9),(22,28),(10,28)],fill='#d89049',outline=out,width=2)
    d.rectangle((5,8,26,11),fill=pale,outline=out);d.line((18,9,20,3,25,2),fill=green,width=2);d.ellipse((12,14,20,22),fill='#ffe297',outline='#ae7f3c')
def lemon(d):
    d.ellipse((3,7,28,25),fill='#ecb94c',outline=out,width=2);d.ellipse((6,9,25,23),fill='#fff1ba',outline='#f2d276')
    for xy in [(11,10),(20,11),(23,18),(13,22),(7,17)]:d.line((16,16,*xy),fill='#d9a645')
    d.polygon([(18,7),(21,3),(28,3),(25,7)],fill=green)
def ice(d):
    # Crisp 32x32 translucent 3D pixel ice cube pair with icy facets & specular glints
    edge = '#385669'
    def draw_cube(ox, oy, w=14, h=14, dtop=4):
        # 3D beveled ice cube: top parallelogram + front face + right side face
        top = [(ox+dtop, oy), (ox+w, oy), (ox+w-dtop, oy+dtop), (ox, oy+dtop)]
        front = [(ox, oy+dtop), (ox+w-dtop, oy+dtop), (ox+w-dtop, oy+h), (ox, oy+h)]
        side = [(ox+w-dtop, oy+dtop), (ox+w, oy), (ox+w, oy+h-dtop), (ox+w-dtop, oy+h)]
        d.polygon(front, fill='#a8e1f7')
        d.polygon(side, fill='#6fb5d9')
        d.polygon(top, fill='#eefcff')
        # Inner crystal bevel & translucent core
        d.rectangle((ox+2, oy+dtop+2, ox+w-dtop-2, oy+h-2), fill='#c6effd')
        d.rectangle((ox+3, oy+dtop+5, ox+w-dtop-2, oy+h-2), fill='#93d4f0')
        # Diagonal icy shine across front face
        d.line((ox+2, oy+dtop+2, ox+6, oy+dtop+2), fill='#ffffff')
        d.line((ox+2, oy+dtop+2, ox+2, oy+dtop+6), fill='#ffffff')
        d.line((ox+3, oy+dtop+7, ox+7, oy+dtop+3), fill='#ffffff')
        # Top inner gleam
        d.line((ox+dtop+1, oy+1, ox+w-3, oy+1), fill='#ffffff')
        # Crisp 1px facet & outer outlines
        d.line([(ox+dtop, oy), (ox+w, oy), (ox+w, oy+h-dtop), (ox+w-dtop, oy+h), (ox, oy+h), (ox, oy+dtop), (ox+dtop, oy)], fill=edge, width=1)
        d.line([(ox+1, oy+dtop), (ox+w-dtop, oy+dtop), (ox+w-1, oy+1)], fill='#5c93b0', width=1)
        d.line((ox+w-dtop, oy+dtop, ox+w-dtop, oy+h-1), fill='#5c93b0', width=1)
    # Back-left higher cube + front-right lower cube
    draw_cube(4, 4, w=15, h=15, dtop=4)
    draw_cube(13, 12, w=15, h=15, dtop=4)
    # Tiny crisp pixel chill sparkle (top-right & bottom-left)
    for sx, sy in [(25, 6), (6, 23)]:
        d.line((sx-2, sy, sx+2, sy), fill='#7cc6e8')
        d.line((sx, sy-2, sx, sy+2), fill='#7cc6e8')
        d.point((sx, sy), fill='#ffffff')
def boba(d):
    # Crisp 32x32 brown-sugar tapioca pearls clustered in amber syrup
    # Amber brown-sugar syrup puddle at base
    d.ellipse((3,16,28,28),fill='#c97a2e',outline=out,width=2)
    d.ellipse((6,18,25,26),fill='#e39b48')
    # Glossy tapioca pearls (back row -> front row)
    pearls = [
        (11,10,5), (20,10,5),
        (7,16,5), (16,15,5), (24,16,5),
        (11,21,5), (20,21,5)
    ]
    for cx, cy, r in pearls:
        d.ellipse((cx-r, cy-r, cx+r, cy+r), fill='#3c231a', outline='#21120c', width=1)
        d.ellipse((cx-r+1, cy-r+1, cx+r-2, cy+r-2), fill='#5a3627')
        # Warm caramel-cream specular dot
        d.rectangle((cx-2, cy-2, cx-1, cy-1), fill='#f7dfb2')
def strawberry(d):
    # Crisp 32x32 plump red pixel strawberry with green leaves & golden seeds
    # Berry body
    body = [(16,28),(10,25),(6,19),(5,13),(9,8),(23,8),(27,13),(26,19),(22,25)]
    d.polygon(body, fill='#d94348', outline=out, width=2)
    # Soft highlight & right shadow
    d.polygon([(9,11),(15,10),(13,20),(8,17)], fill='#f2686c')
    d.polygon([(20,11),(25,14),(23,21),(18,25)], fill='#ab2b34')
    d.rectangle((10,12,11,15), fill='#ffb0b0')
    # Golden seeds
    for sx, sy in [(11,17),(16,14),(21,15),(14,21),(19,20),(16,25)]:
        d.rectangle((sx, sy, sx+1, sy+1), fill='#ffe48f')
    # Leafy emerald calyx + stem
    d.rectangle((15,3,17,7), fill='#365942', outline=out, width=1)
    d.polygon([(7,10),(12,6),(16,11),(20,6),(25,10),(21,12),(16,9),(11,12)], fill='#589456', outline=out, width=1)
    d.line((11,8,14,8), fill='#84bd75')
    d.line((18,8,21,8), fill='#84bd75')
def cone(d):
    # Crisp 32x32 Mixue soft-serve waffle cone
    # Golden waffle cone
    d.polygon([(9,15),(23,15),(16,30)], fill='#df9d4b', outline=out, width=1)
    d.polygon([(11,16),(21,16),(16,28)], fill='#ebb05c')
    d.line((12,18,17,26), fill='#b87830')
    d.line((20,18,15,26), fill='#b87830')
    d.line((11,20,21,20), fill='#b87830')
    d.line((13,24,19,24), fill='#b87830')
    # Creamy soft-serve swirl (unified silhouette with soft warm inner creases)
    d.rounded_rectangle((7,11,25,17), radius=3, fill='#fff5dc', outline=out, width=1)
    d.rounded_rectangle((9,7,23,13), radius=3, fill='#fffaf0', outline=out, width=1)
    d.polygon([(16,2),(11,8),(21,8)], fill='#ffffff', outline=out, width=1)
    # Blend inner swirl layers smoothly
    d.rectangle((10,11,22,15), fill='#fff7e4')
    d.rectangle((12,7,20,10), fill='#fffcf5')
    d.line((9,13,23,13), fill='#e8d5b0')
    d.line((11,9,21,9), fill='#eedec0')
    d.rectangle((11,12,15,12), fill='#ffffff')
    d.rectangle((12,8,15,8), fill='#ffffff')
def boba_sundae(d):
    # Crisp 32x32 Boba Sundae cup with creamy swirl + dark pearls + caramel drizzle
    # Clear sundae cup
    d.polygon([(7,13),(25,13),(22,29),(10,29)], fill='#eef7f4', outline=out, width=2)
    # Soft-serve inside cup & rising above rim
    d.polygon([(9,15),(23,15),(21,27),(11,27)], fill='#fff6df')
    d.rounded_rectangle((8,8,24,15), radius=3, fill='#fffaf0', outline=out, width=2)
    d.polygon([(16,3),(11,9),(21,9)], fill='#ffffff', outline=out, width=1)
    # Brown-sugar drizzle wave
    d.line([(10,12),(14,14),(18,11),(22,13)], fill='#9e521e', width=2)
    # Dark brown boba pearls nestled at bottom & side
    for px, py in [(12,24),(16,25),(20,24),(14,21),(18,21),(11,17)]:
        d.ellipse((px-2,py-2,px+2,py+2), fill='#3c231a', outline='#21120c')
        d.point((px-1,py-1), fill='#f2d4a2')
def mango_sundae(d):
    # Crisp 32x32 Mango Sundae cup with creamy swirl + golden mango jam & cubes
    d.polygon([(7,13),(25,13),(22,29),(10,29)], fill='#eef7f4', outline=out, width=2)
    d.polygon([(9,15),(23,15),(21,27),(11,27)], fill='#fff6df')
    # Golden mango puree layer
    d.polygon([(10,21),(22,21),(21,27),(11,27)], fill='#f2a732')
    d.rounded_rectangle((8,8,24,15), radius=3, fill='#fffaf0', outline=out, width=2)
    d.polygon([(16,3),(11,9),(21,9)], fill='#ffffff', outline=out, width=1)
    # Bright golden mango cubes on top & side
    for mx, my in [(10,11),(17,11),(14,15),(19,16)]:
        d.rectangle((mx,my,mx+4,my+4), fill='#ffbe3b', outline='#b36b14', width=1)
        d.point((mx+1,my+1), fill='#fff1a8')
def badge(d):
    d.rectangle((6,3,25,28),fill='#aa714c',outline=out,width=2);d.rectangle((9,6,22,25),fill=pale)
    d.rectangle((12,2,19,6),fill=gold,outline=out)
    for y in (11,16,21):d.rectangle((11,y,13,y+1),fill=green);d.line((16,y,21,y),fill='#9a865b')
def trophy(d):
    # Crisp 32x32 golden pixel trophy cup on dark walnut pedestal
    # Side handles
    d.rectangle((3,7,9,15),outline=out,width=2)
    d.rectangle((22,7,28,15),outline=out,width=2)
    d.rectangle((5,9,8,13),outline=gold,width=1)
    d.rectangle((23,9,26,13),outline=gold,width=1)
    # Main chalice body
    d.polygon([(7,4),(24,4),(22,17),(18,20),(13,20),(9,17)],fill=gold,outline=out,width=2)
    d.rectangle((9,6,14,15),fill=pale)
    d.rectangle((19,6,21,15),fill='#b5833d')
    d.rectangle((6,2,25,6),fill=pale,outline=out,width=1)
    d.rectangle((7,5,24,5),fill=gold)
    # Stem
    d.rectangle((13,19,18,24),fill=gold,outline=out,width=1)
    d.rectangle((14,20,15,23),fill=pale)
    # Stepped wooden base with gold plaque
    d.rectangle((9,24,22,27),fill='#8e5732',outline=out,width=1)
    d.rectangle((7,26,24,30),fill='#6b4022',outline=out,width=1)
    d.rectangle((11,27,20,29),fill=pale,outline='#996e35',width=1)
for name,func in [('compass',compass),('camera',camera),('journal',book),('atlas',mapicon),('cup',cup),('lemon',lemon),('ice',ice),('boba',boba),('strawberry',strawberry),('cone',cone),('boba-sundae',boba_sundae),('mango-sundae',mango_sundae),('tasks',badge),('trophy',trophy)]:icon(name,func)

def icon16(name, grid, palette):
    im=Image.new('RGBA',(16,16),(0,0,0,0))
    px=im.load()
    for y,row in enumerate(grid):
        for x,ch in enumerate(row):
            if ch in palette:
                px[x,y]=palette[ch]
    im.save(root/(name+'.png'))

pal_hud={
    'k':(38,29,22,255),
    'g':(226,184,104,255),
    'p':(255,242,206,255),
    's':(168,128,72,255),
    'm':(175,161,132,255),
    'r':(232,104,88,255),
    'h':(255,196,178,255),
}

sound_on_grid=[
    '................',
    '.......k........',
    '......kpk..k....',
    '.....kppk.kpk...',
    '..kkkkpgk..kpk..',
    '.kpppgpgk.k.kpk.',
    '.kppggggk.kpkpk.',
    '.kggggsgk..kpkpk',
    '.kggggsgk..kpkpk',
    '.ksssssgk.kpkpk.',
    '..kkkkssk.k.kpk.',
    '.....kssk..kpk..',
    '......ksk.kpk...',
    '.......k...k....',
    '................',
    '................',
]

sound_off_grid=[
    '................',
    '.......k........',
    '......kmk.......',
    '.....kmmk.......',
    '..kkkkmmk.......',
    '.kmmmmmmk.kr.rk.',
    '.kmmmmmmk.krrrk.',
    '.kmmmmssk..krk..',
    '.kssssssk..krk..',
    '.kssssssk.krrrk.',
    '..kkkkssk.kr.rk.',
    '.....kssk.......',
    '......ksk.......',
    '.......k........',
    '................',
    '................',
]

fullscreen_grid=[
    '................',
    '.kkkkkk..kkkkkk.',
    '.kpppgk..kgpppk.',
    '.kpkkk....kkkpk.',
    '.kpk........kpk.',
    '.kgk........kgk.',
    '.kkk........kkk.',
    '................',
    '................',
    '.kkk........kkk.',
    '.kgk........kgk.',
    '.kpk........kpk.',
    '.kpkkk....kkkpk.',
    '.kpppgk..kgpppk.',
    '.kkkkkk..kkkkkk.',
    '................',
]

gear_grid=[
    '................',
    '......kkkk......',
    '.....kpppgk.....',
    '..kk.kpgsgk.kk..',
    '.kppkkggggkkppk.',
    '.kpgppggggppgpk.',
    '..kggkppppkggk..',
    '.kkggkpkkpkggkk.',
    '.kppgkpkkpkgppk.',
    '.kssgksssskgssk.',
    '..kggksssskggk..',
    '.ksskksssskkssk.',
    '.ksskksssskkssk.',
    '..kk.kssssk.kk..',
    '.....kssssk.....',
    '......kkkk......',
]

icon16('sound-on', sound_on_grid, pal_hud)
icon16('sound-off', sound_off_grid, pal_hud)
icon16('fullscreen', fullscreen_grid, pal_hud)
icon16('gear', gear_grid, pal_hud)
