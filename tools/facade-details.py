"""Finish individual storefront sprites after the common masonry pass."""
from PIL import Image
from pathlib import Path
import sys
sys.dont_write_bytecode=True
from random import Random
from importlib.util import spec_from_file_location, module_from_spec

spec=spec_from_file_location('pixels',Path(__file__).with_name('draw-pixels.py'))
p=module_from_spec(spec);spec.loader.exec_module(p)
rng=Random(267)
def facade(kind):
    path=p.ROOT/'buildings'/(kind+'.png')
    im=Image.open(path).convert('RGBA');w,h=im.size
    s=p.Sprite(w,h);s.im.paste(im);base=h-7
    # A shaded reveal behind each arcade bay. Lit display shelves stay visible from the street.
    bay=(w-36)//3
    for i in range(3):
        x=14+bay*i;y=base-36
        if i==1:
            s.box(x+4,y+1,bay-12,33,'#634b3e','#444a40')
            s.box(x+7,y+4,bay-19,29,'#a98764');s.box(x+9,y+4,bay-23,11,'#6b8b82')
            s.poly([(x+10,y+5),(x+18,y+5),(x+10,y+12)],'#b3c9a8')
            s.box(x+8,y+18,bay-21,14,'#755643');s.box(x+bay-17,y+20,2,3,'#f0ca7e')
            s.box(x+3,base-3,bay-10,2,'#dbc5a1')
        else:
            s.box(x+5,y+1,bay-13,29,'#51645b')
            s.box(x+7,y+2,bay-18,12,'#8d9d82')
            s.poly([(x+8,y+2),(x+17,y+2),(x+8,y+12)],'#bdc7a3')
            s.box(x+bay//2-1,y+1,2,28,'#796851')
            for j in range(4):
                xx=x+7+j*max(4,(bay-19)//4);yy=y+19+(j%2)
                s.box(xx,yy,4,7,['#d79c53','#f0c87e','#d18b68','#c0ad79'][j]);s.box(xx+1,yy-2,2,2,'#f8e0ad')
            s.box(x+4,y+27,bay-11,2,'#b79568');s.box(x+3,y+30,bay-8,3,'#d4b78b')
    if kind=='mixue':
        # Kota Tua arcade: ivory upper storey, charcoal stone piers and pale arches.
        s.box(0,0,w,119,(0,0,0,0))
        s.poly([(3,29),(12,4),(w-14,4),(w-4,29)],'#a99b87','#6f6a5b')
        for yy in range(7,28,4):
            s.line([(13,yy),(w-15,yy)],'#b8afa0')
        s.box(4,27,w-9,61,'#e2dbc4','#746f61')
        for xx in (13,65,119):
            s.box(xx,36,38,34,'#c9c1ac','#958e7d');s.box(xx+3,39,32,25,'#5b6760')
            s.box(xx+5,41,12,19,'#d2b990');s.box(xx+18,41,13,19,'#8e9485')
            s.box(xx+17,40,2,23,'#e5d6b8')
        s.box(1,27,w-3,5,'#e8e0cb','#837f70');s.box(2,27,w-5,1,'#fff2d8')
        s.box(2,22,10,62,'#d6cdb7','#948c7c');s.box(w-13,22,10,62,'#d6cdb7','#948c7c')
        s.box(4,79,w-8,base-78,'#4a5050','#3a4240')
        for n in range(85):
            x=rng.randrange(5,w-9);y=rng.randrange(82,base-4)
            s.line([(x,y),(x+3,y-1),(x+5,y)],rng.choice(['#606662','#555d59','#747770']))
        for x in [12,65,118]:
            s.oval(x,83,46,29,'#e7dfc9')
            s.box(x,96,46,base-96,'#e7dfc9');s.oval(x+3,86,40,23,'#404b45')
            s.box(x+3,98,40,base-98,'#504d41')
            s.box(x+6,101,34,base-102,'#937d62')
            s.box(x+8,103,13,base-109,'#928f76')
            s.box(x+23,103,13,base-109,'#738579')
            s.poly([(x+8,104),(x+17,104),(x+8,117)],'#b6b6a0')
            s.box(x+20,98,3,base-99,'#594939')
            if x==65:
                s.box(x+22,101,14,base-101,'#79543f');s.box(x+24,105,10,19,'#b68463');s.box(x+23,128,2,4,'#f3d6a2')
            else:
                for j,c in enumerate(['#dea553','#edc590','#c06a45','#d5b778']):
                    s.box(x+9+j*6,131-j%2*2,4,6,c);s.box(x+10+j*6,129-j%2*2,2,2,'#ffdab0')
            s.box(x-2,base-4,50,3,'#c2b69d')
        s.box(0,78,w,5,'#e9e1cc','#77786b')
        s.box(18,31,140,52,'#865950','#695549')
        s.box(18,31,139,1,'#f2c5a6')
    elif kind=='kopi':
        # A roof vent and timber frontage distinguish the coffee kiosk.
        s.box(15,13,25,11,'#4e625b','#44493f')
        for xx in range(18,37,4):s.box(xx,15,2,7,'#97a494')
        for x in (6,w-15):s.box(x,52,6,base-51,'#866443');s.box(x,53,2,base-55,'#bb9265')
        s.box(12,62,w-24,24,'#314f46','#574c3b');s.box(14,64,w-28,20,'#3c6759','#bba276');s.sign(w//2,74,'KOPI SORE',13)
        for i in range(80):
            x=rng.randrange(5,44);y=46+int(18*(1-(x-5)/40))*rng.random()
            s.box(x,int(y),rng.randint(2,5),2,rng.choice(['#547347','#68874c','#909e55']))
    else:
        s.box(11,14,44,17,'#bca88c','#685e50');s.box(14,17,24,10,'#89938a')
        for yy in range(18,27,3):s.box(15,yy,21,1,'#566967')
        s.oval(41,16,11,11,'#5d726b');s.oval(44,19,5,5,'#aab1a1')
        s.box(13,66,w-26,16,'#ad753e','#72523d');s.sign(w//2,73,'TOKO BUAH',12)
        for j in range(3):
            x=10+j*19;s.box(x,base-13,18,11,'#ac7c51','#674e39')
            for i in range(5):s.oval(x+1+i*3,base-14-i%2,5,5,['#b3ae58','#e7a148','#c76947'][j],'#8b733f')
            s.box(x+1,base-5,16,2,'#d4a56c')
    s.save('buildings',kind)

for name in ('mixue','kopi','fruit'):facade(name)
