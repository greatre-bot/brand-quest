"""Original raster recipes for the Indonesian field journal. Run with Pillow."""
import math
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1] / 'assets/pixel'
rng = random.Random(705)
INK = '#363a36'
CREAM = '#ffebba'
WOOD = '#945636'
LIGHT = '#dcab68'
RED = '#bf4143'
GREEN = '#39765b'


class Sprite:
    def __init__(self, w, h):
        self.im = Image.new('RGBA', (w, h))
        self.d = ImageDraw.Draw(self.im)
    def box(self, x, y, w, h, color, outline=None):
        self.d.rectangle((x, y, x+w-1, y+h-1), fill=color, outline=outline)
    def poly(self, pts, color, edge=None):
        self.d.polygon(pts, fill=color, outline=edge)
    def oval(self, x, y, w, h, color, edge=None):
        self.d.ellipse((x,y,x+w-1,y+h-1), fill=color, outline=edge)
    def line(self, pts, color, width=1):
        self.d.line(pts, fill=color, width=width)
    def sign(self, x, y, value, size, color=CREAM):
        font = ImageFont.truetype('arialbd.ttf',size) if Path('C:/Windows/Fonts/arialbd.ttf').exists() else ImageFont.load_default(size=size)
        self.d.fontmode='1'
        self.d.text((x,y),value,font=font,anchor='mm',fill=color)
    def save(self, folder, name):
        self.im.save(ROOT/folder/(name+'.png'))


def tiles():
    sheet=Sprite(32*8,32)
    for i,base in enumerate(['#d7ba90','#535c62','#a6b76d','#e9d8bc','#cbac87','#535c62','#a7aa83','#ac8060']):
        s=Sprite(32,32); s.box(0,0,32,32,base)
        if i in (0,3,4,7):
            for y in range(0,32,8 if i!=3 else 16):
                s.line([(0,y),(31,y)],'#bca384' if i!=3 else '#c6b99e')
                for x in range((y%16)*2,32,16):
                    s.box(x,y,1,8 if i!=3 else 16,'#baa084' if i!=3 else '#cebea5')
                    s.box(x+1,y+1,12,1,'#e0c69e' if i!=3 else '#f7e9d0')
        elif i in (1,5):
            for _ in range(22):
                s.box(rng.randrange(32),rng.randrange(32),rng.randint(1,3),1,rng.choice(['#5c6469','#48535a','#646b6c']))
            if i==5:s.box(4,14,24,2,'#cbbc92')
        else:
            for _ in range(22):
                x,y=rng.randrange(32),rng.randrange(32);s.line([(x,y),(x+2,y-2)],rng.choice(['#8da669','#b6bf76','#879964']))
        sheet.im.paste(s.im,(i*32,0))
    sheet.save('tilesets','ground')


def building(kind,w,h,wall,roof,roof_light,awning):
    s=Sprite(w,h); base=h-7; eave=44
    s.box(8,31,w-12,base-27,(62,52,47,75))
    s.box(4,36,w-12,base-35,wall,INK)
    s.box(5,eave,w-14,7,'#92765e');s.box(w-18,eave,9,base-eave,'#a98a6c')
    # Repeating ceramic courses follow a shallow, symmetric roof pitch.
    for y in range(3,eave+1):
        inset=2+(eave-y)//4
        s.box(inset,y,w-2*inset,1,roof if y%7!=0 else '#775740')
        if y%7 in (1,2):s.box(inset+1,y,w-2*inset-2,1,roof_light)
        for x in range(inset+((y//7)%2)*4,w-inset-2,9):
            s.box(x,y,2,1,roof_light if y%7<5 else roof)
    s.box(1,44,w-2,5,INK);s.box(0,44,w,2,roof_light)
    # Small louvered upper windows and painted lintels.
    for x in range(14,w-30,31):
        s.box(x,54,22,14,'#735a46');s.box(x+2,56,18,10,'#77897f')
        for yy in (57,60,63):s.box(x+3,yy,16,1,'#abb4a1')
        s.box(x-2,67,26,2,CREAM)
    cols=3; bay=(w-36)//cols
    for i in range(cols):
        x=14+bay*i;y=base-43
        s.oval(x,y-6,bay-3,23,CREAM);s.box(x,y+4,bay-3,38,CREAM)
        s.oval(x+3,y-3,bay-9,18,INK);s.box(x+3,y+7,bay-9,34,INK)
        s.box(x+5,y+8,bay-13,29,'#64817d')
        s.poly([(x+6,y+10),(x+17,y+10),(x+7,y+24)],'#a2b9a5')
        s.box(x+bay//2-2,y+5,3,33,'#504f43')
        s.box(x+4,y+22,bay-11,2,'#bca97e')
        if i!=1:
            for j in range(3):
                s.box(x+7+j*7,y+29-j%2*2,4,7+j%2*2,['#d99e55','#f2dca7','#c96b48'][j])
        else:
            s.box(x+bay//2+3,y+26,2,5,CREAM)
        s.box(x-3,base-4,bay,3,'#b39a78')
    if kind=='mixue':
        s.box(22,64,w-44,31,'#813b39',INK);s.box(24,65,w-48,27,RED);s.box(24,65,w-48,2,'#f38a6d')
        # Abstract soft serve cone and lettered sign, original bitmap lettering.
        cone(s,36,68,.8)
        s.sign(w//2+9,75,'MIXUE',21,'#fff2cc');s.sign(w//2+9,87,'ICE CREAM & TEA',6)
    else:
        s.box(13,66,w-26,20,awning,INK);s.sign(w//2,76,'KOPI SORE' if kind=='kopi' else 'TOKO BUAH',12)
    y=base-51
    s.poly([(8,y),(w-12,y),(w-6,y+12),(1,y+12)],awning,INK)
    for x in range(8,w-16,14):
        s.poly([(x,y+1),(x+6,y+1),(x+4,y+11),(x-3,y+11)],'#f1d7a6')
    for x in range(2,w-8,7):
        s.box(x,y+12,7,4,awning if (x//7)%2 else '#efcf9c');s.box(x+1,y+16,5,1,'#896849')
    s.box(2,base,w-7,5,'#9f866b');s.box(2,base,w-7,2,'#f1d6a7')
    s.save('buildings',kind)


def cone(s,x,y,k=1):
    s.poly([(x,y+13),(x+11,y+13),(x+6,y+24)],'#c88349','#805341')
    s.oval(x-1,y+8,15,8,'#f9dcad','#a57658');s.oval(x+1,y+4,12,8,'#fff0cd')
    s.poly([(x+4,y+5),(x+9,y),(x+10,y+6)],'#fff2d3')


def flora():
    s=Sprite(42,42)
    s.oval(6,32,33,9,(39,52,41,65));s.poly([(12,24),(31,24),(28,38),(16,38)],'#b46a46',INK)
    s.box(11,24,22,5,'#d38b58',INK);s.box(16,30,2,6,'#eca473')
    for _ in range(28):
        x=rng.randrange(3,39);y=rng.randrange(2,24)
        s.poly([(21,26),(x-2,y+3),(x,y),(x+2,y+6)],rng.choice(['#376450','#477b50','#5c9256','#88aa60']))
    s.save('props','planter')
    s=Sprite(102,110)
    s.oval(33,90,62,17,(35,49,40,64))
    s.poly([(43,103),(47,84),(50,57),(47,32),(52,30),(57,57),(53,89),(53,104)],'#967447','#574f3b')
    for y in range(43,99,6):
        x=50+int(math.sin((y-40)/59*math.pi)*3);s.line([(x-2,y),(x+4,y-2)],'#c0975d',2)
    for dx,dy in [(-39,-15),(34,-20),(22,-29),(-16,-30),(-47,5),(48,8),(-32,28),(31,29),(-6,32)]:
        for j in range(12):
            t=j/12; x=50+dx*t;y=35+dy*t-12*math.sin(t*math.pi);l=12*(1-t)+3
            col=['#305e4d','#427854','#568755','#76a05a','#9ab766']
            s.poly([(x,y),(x+dx*.14,y+dy*.07),(x+dx*.1-3,y+l)],col[(j//4+int(dx>0))%4])
            s.line([(x,y-1),(x+dx*.12,y+dy*.08-1)],col[4 if dx<0 else 3],2)
    s.save('props','palm')
    s=Sprite(84,81);s.oval(14,66,64,12,(49,58,45,70));s.box(36,43,8,31,'#745540');s.box(38,49,3,25,'#aa7851')
    clusters=[(37,18,17),(20,28,15),(52,29,22),(16,42,13),(36,40,22),(60,42,18)]
    for x,y,r in clusters:
        s.oval(x-r,y-r,2*r,2*r,'#365e4a');s.oval(x-r,y-r,2*r-4,2*r-6,'#4f8054')
        for _ in range(r*2):
            a=rng.random()*6.28;v=rng.random()*r*.83
            xx=x+math.cos(a)*v-3;yy=y+math.sin(a)*v-4
            s.box(int(xx),int(yy),rng.randint(2,5),2,rng.choice(['#689450','#80a558','#48774f']))
    s.save('props','shade-tree')


def props():
    for name,color in [('scooter','#3f8d89'),('vespa','#c66146')]:
        s=Sprite(44,33);s.oval(2,25,41,6,(43,49,43,70))
        for x in (3,29):
            s.oval(x,18,12,12,INK);s.oval(x+3,21,6,6,'#aba99a');s.box(x+5,22,2,3,'#545953')
        s.poly([(3,18),(8,13),(19,13),(22,21),(27,20),(30,9),(35,8),(38,20),(33,20),(29,24),(12,24)],color,INK)
        s.box(4,15,12,2,'#e6cba3');s.box(6,11,15,4,'#503e37');s.box(8,10,11,1,'#c4a789')
        s.box(31,6,5,5,'#f9d68b',INK);s.line([(31,9),(28,3),(25,3)],INK,2);s.box(23,1,5,3,'#bbcdc2')
        s.save('props',name)
    s=Sprite(30,40);s.box(7,13,4,24,WOOD);s.box(22,13,4,24,WOOD);s.box(4,4,22,28,'#a6774e',INK)
    s.box(7,7,16,22,'#355b50');s.sign(15,12,'ES',7)
    for y in (18,22,25):s.box(9,y,9-y%3,1,'#e6d7ad')
    s.save('props','chalkboard')
    s=Sprite(64,62)
    for x in (8,48):s.oval(x,45,10,12,INK);s.oval(x+3,49,4,5,'#acaa8f')
    s.box(6,27,52,23,'#bb8b51',INK);s.box(9,32,45,11,'#60958a');s.box(8,45,47,2,CREAM)
    for x in (7,54):s.box(x,8,3,22,'#75563d')
    for i in range(8):s.box(5+i*6,23-i%3,5,6,['#d87d43','#dfbd5e','#97a553'][i%3])
    s.poly([(6,4),(54,4),(62,16),(0,16)],'#e5aa55',INK)
    for x in range(8,55,12):s.poly([(x,5),(x+5,5),(x+4,15),(x-3,15)],'#579385')
    s.box(0,16,62,3,'#9e6947');s.save('props','cart')
    s=Sprite(54,27);s.box(5,19,4,7,INK);s.box(44,19,4,7,INK)
    for y in (4,9,16):s.box(2,y,49,4,'#a86642',INK);s.box(3,y,47,1,'#daa56c')
    s.save('props','bench')
    s=Sprite(71,68);s.box(7,4,4,59,'#645b4b');s.box(60,4,4,59,'#645b4b')
    s.box(2,4,66,14,'#3a6858',INK);s.sign(35,10,'HALTE',9);s.box(13,21,45,28,'#dbc89d',INK)
    s.line([(19,41),(26,30),(38,35),(49,26)],GREEN,2)
    for x,y in ((19,41),(38,35),(49,26)):s.oval(x-2,y-2,5,5,RED)
    s.save('props','halte')
    s=Sprite(52,42)
    for x in (5,34):s.box(x,29,5,10,'#78573d')
    s.oval(1,10,47,24,'#9b704e',INK);s.oval(1,7,47,22,'#cfaa77',INK)
    s.oval(18,13,9,6,'#fae7bd');s.box(20,10,5,6,RED);s.save('props','table')
    s=Sprite(32,36);cone(s,8,2);s.box(6,26,17,5,'#bd7747',INK);s.save('props','cone')
    s=Sprite(120,58);s.box(3,19,114,34,'#ad353d',INK);s.box(5,22,110,4,'#d65353')
    for x in range(9,110,18):s.box(x,28,1,20,'#c54a49')
    s.box(1,15,118,9,'#dec8a3',INK);s.box(3,16,114,4,'#fdf0d7')
    for x in (8,19,30):
        s.box(x,8,7,8,'#ddaa61',INK);s.box(x-1,7,9,2,CREAM)
    s.box(77,4,16,11,'#395653',INK);s.box(79,5,11,6,'#93b5a1');s.box(82,14,7,3,INK)
    s.sign(59,37,'COLLECT',8);s.save('props','counter')
    s=Sprite(96,53);s.box(2,2,92,47,'#bfac89',INK)
    for i in range(3):
        x=5+i*29;s.box(x,5,27,39,'#fff0cf','#874e41');s.box(x+1,6,25,6,RED);cone(s,x+6,15);s.box(x+17,33,6,2,WOOD)
    s.save('props','menu-board')
    s=Sprite(40,32);s.box(2,4,36,25,'#c39a69',INK);s.box(3,4,34,5,'#dfb583')
    s.box(17,4,6,25,'#ead1a0');s.box(6,14,8,7,'#fff2c9');s.save('props','crate')


def people():
    colors={'player':('#477b84','#cfaa68'),'student':('#c17b49','#463d37'),'vendor':('#8d634e','#e0bc7d'),'rider':('#487a5f','#386a58'),'clerk':('#c55050','#d6504d'),'wan':('#354555','#393b3d'),'engineer':('#747c81','#d2a850')}
    for who,(shirt,cap) in colors.items():
        sheet=Sprite(96,160)
        for direction in range(4): # down, left, right, up
            for step in range(3):
                s=Sprite(32,40); lift=int(step!=0);side=direction in (1,2)
                s.oval(5,34,23,5,(42,45,39,65))
                for leg in range(2):
                    dx=(10+leg*7) if not side else (12+leg*3)
                    dy=(0 if step==0 else (2 if leg==step-1 else -2))
                    s.box(dx,26+dy,6,9,'#415761',INK);s.box(dx-1,34+dy,7,3,'#5b483c',INK);s.box(dx,34+dy,4,1,'#b78c62')
                s.box(8+int(side)*2,17-lift,16-int(side)*4,13,shirt,INK)
                s.box(11,18-lift,4,8,shirt);s.box(12,18-lift,7,2,'#e4b082')
                for i in (0,1):
                    x=(7+17*i if not side else 11+7*i)
                    y=20-lift+(1 if step==i+1 else 0);s.box(x,y,4,7,shirt,INK);s.box(x,y+6,4,4,'#d8a078',INK)
                s.oval(8,4-lift,17,17,'#dfa47a',INK);s.oval(8,3-lift,18,12,cap,INK)
                if direction!=3:
                    s.box(10 if not side else 9,11-lift,13 if not side else 9,6,'#e8b288')
                    s.box(11,12-lift,2,2,INK)
                    if not side:s.box(20,12-lift,2,2,INK)
                    s.box(14 if not side else 9,17-lift,4,1,'#ad7555')
                if who=='player':
                    s.box(6,8-lift,21,3,'#f2ce85',INK);s.box(11,3-lift,12,6,'#dcb576',INK);s.box(10,7-lift,14,2,'#91593d')
                    s.line([(10,19-lift),(21,29-lift)],'#d8a45e',2)
                    s.box(16,26-lift,8,6,'#a56d45',INK)
                elif who in ('clerk','rider','engineer'):
                    s.box(7,8-lift,19,3,cap,INK)
                    if who=='clerk' and direction!=3:s.box(13,20,8,9,'#efe3ba')
                elif who=='wan':
                    s.line([(10,19),(21,27)],'#222e39',2);s.box(18,24,7,5,'#283739');s.box(20,25,3,2,'#99ada7')
                if direction==2:s.im=s.im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                sheet.im.paste(s.im,(step*32,direction*40))
        sheet.save('characters',who)


if __name__=='__main__':
    tiles()
    building('mixue',176,153,'#e9d7b8','#aa6152','#d18c70','#bd5150')
    building('kopi',144,144,'#e4b77c','#7a8075','#a4a88b','#396d60')
    building('fruit',144,139,'#efd1a1','#9b7356','#cc9871','#bc7d39')
    flora()
    props()
    people()

    import runpy
    runpy.run_path(str(Path(__file__).with_name('facade-details.py')))
    runpy.run_path(str(Path(__file__).with_name('draw-characters.py')))
    runpy.run_path(str(Path(__file__).with_name('polish-art.py')))
