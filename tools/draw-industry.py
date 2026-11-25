"""Draw original industrial scenery. See the Karawang section of ASSET_AUDIT."""
import runpy
from pathlib import Path
from random import Random

Sprite = runpy.run_path(str(Path(__file__).with_name('draw-pixels.py')))['Sprite']
INK, STEEL, WHITE = '#303d43', '#799097', '#dce1ce'
rng = Random(74)


def roof(s, w, h):
    s.poly([(1,h),(12,2),(w-15,2),(w-2,h)], '#adb9b5', INK)
    for x in range(14,w-18,9):
        s.line([(x,4),(x-6,h-2)], '#d1d5c8')
        s.line([(x+2,4),(x-4,h-2)], '#8e9fa0')
    for x in range(28,w-50,80):
        s.poly([(x,11),(x+42,11),(x+39,20),(x-3,20)],'#627e89',INK)
        for dx in range(0,40,8):s.line([(x+dx,12),(x+dx-2,19)], '#c2d3c7')


def glazing(s,x,y,w,h):
    s.box(x,y,w,h,'#35576a',INK)
    for xx in range(x+2,x+w-2,12):
        s.box(xx,y+2,10,h-4,'#51768a')
        s.poly([(xx,y+3),(xx+8,y+3),(xx,y+13)],'#74969e')
        s.box(xx,y+int(h*.57),10,2,'#364d59')
        s.box(xx,y+h-7,10,3,'#476577')


def halls():
    for name,w,h in [('sany-hall',262,141),('service-bay',138,114)]:
        s=Sprite(w,h);eave=34
        s.box(7,42,w-9,h-42,(44,51,47,64))
        roof(s,w,eave)
        s.box(3,eave,w-10,h-eave-6,'#c1c8c0',INK)
        for y in range(eave+3,h-7,4):s.box(5,y,w-14,1,'#a4b2b1')
        s.box(1,eave-1,w-3,4,'#e2e3d1',INK)
        if name=='sany-hall':
            glazing(s,12,54,92,58);glazing(s,119,55,48,56)
            s.box(172,39,47,92,'#cbd0c6')
            for x in range(0,11):s.box(209+x,41,1,87,['#c7cec4','#c1c9c1','#b6c1bc','#aab8b6'][min(3,x//3)])
            s.sign(192,55,'SANY',13,'#b62f3b')
            glazing(s,178,85,33,44);glazing(s,224,53,23,67)
            s.box(13,116,150,3,'#829499');s.box(9,124,158,7,'#a8b6ae')
        else:
            s.box(11,52,w-27,49,'#485a61',INK)
            for x in (15,74):
                s.box(x,56,51,43,'#819496',INK)
                for y in range(59,97,4):s.box(x+2,y,47,1,'#b9c3b8')
                s.box(x+8,68,35,8,'#4d6c74',INK)
            s.box(27,38,81,13,'#41575b');s.sign(67,44,'SERVICE',11,'#f4d18a')
            s.box(75,83,48,18,'#35464a');s.box(82,86,30,14,'#536764')
        s.box(3,h-8,w-7,4,'#9a9f90');s.box(4,h-7,w-10,1,'#e1d9b6')
        s.save('buildings',name)


def machine():
    s=Sprite(146,92)
    s.oval(6,73,127,14,(40,52,48,65))
    s.oval(9,64,79,21,INK);s.box(18,64,59,21,INK)
    s.oval(13,68,70,12,'#677175')
    for x in range(20,78,9):s.oval(x,69,7,8,'#39474c');s.box(x+2,71,2,2,'#879093')
    for x in range(17,80,5):s.box(x,82,3,2,'#707677')
    s.box(26,58,43,7,'#526166',INK)
    s.poly([(8,37),(36,32),(64,33),(78,44),(76,60),(14,61),(6,54)],'#d7a23a',INK)
    s.box(10,42,28,14,'#e6b242');s.box(12,51,22,4,'#575a4c');s.sign(25,46,'SANY',7,INK)
    s.poly([(40,22),(58,20),(67,25),(69,53),(41,54)],'#374a55',INK)
    s.poly([(43,24),(57,23),(59,41),(43,43)],'#80a4b0');s.line([(45,26),(52,25),(45,35)],'#bad0c8',2)
    s.box(60,28,5,14,'#628697');s.box(45,47,9,2,'#bfc5ad')
    s.poly([(64,47),(69,34),(97,7),(107,7),(120,16),(120,23),(108,19),(103,17),(75,51)],'#dca22c',INK)
    s.line([(72,38),(99,11),(105,11)],'#f5cb62',3)
    s.poly([(112,18),(120,15),(135,51),(131,58),(124,54)],'#e1a835',INK)
    s.line([(117,21),(128,49)],'#f3c75c',3)
    s.line([(71,49),(96,21)],'#657179',4);s.line([(82,36),(96,21)],'#d2d9cf',2)
    s.line([(110,23),(124,52)],'#515b58',3);s.line([(116,36),(124,52)],'#d1d9ca',1)
    s.poly([(126,50),(133,51),(139,63),(137,70),(126,75),(112,69),(118,65),(127,63)],'#4b5050',INK)
    for x in (114,118,122):s.line([(x,69),(x-4,66)],'#7f8074',2)
    for x,y in [(70,46),(104,13),(117,19),(130,54)]:s.oval(x-2,y-2,5,5,'#8c774c',INK)
    s.save('props','excavator')


def fixtures():
    for idx,code in enumerate(['A1','B2','C3']):
        s=Sprite(100,67)
        for x in [4,90]:s.box(x,5,5,57,STEEL,INK);s.box(x-2,61,10,3,INK)
        for y in [24,51]:
            for i in range(5):
                x=9+i*16;h=10+(i+idx)%3*3
                s.box(x,y-h,15,h,['#bf945c','#708f83','#aa7857'][(i+idx)%3],INK);s.box(x+6,y-h+1,3,h-2,'#d3bb87');s.box(x+2,y-6,4,3,'#f0d8a4')
            s.box(2,y,96,5,'#b77349',INK);s.box(4,y+1,92,1,'#e3a363')
        s.box(34,0,30,13,'#e7c480',INK);s.sign(49,6,code,10,INK)
        s.save('props','rack-'+code.lower())
    s=Sprite(67,52);s.box(7,32,4,17,INK);s.box(55,32,4,17,INK)
    s.box(3,25,60,11,'#a4ac9f',INK);s.box(5,26,56,3,'#e3d9bd')
    s.box(13,5,28,19,'#4b5f66',INK);s.box(16,8,22,12,'#8fb3a9');s.box(25,23,4,4,INK)
    for i in range(3):s.box(18,10+i*3,12-i*2,1,'#475f61')
    s.box(44,21,12,5,'#eeddb6',INK);s.save('props','dispatch')
    s=Sprite(32,30);s.oval(4,23,7,6,INK);s.oval(23,23,7,6,INK)
    s.box(3,19,26,5,'#829390',INK);s.box(3,7,3,13,STEEL,INK)
    s.box(8,6,18,14,'#c3925c',INK);s.box(16,7,4,12,'#ecd29a');s.save('props','handcart')
    s=Sprite(238,77);s.box(1,4,235,68,'#899da0',INK)
    for x in range(6,229,18):glazing(s,x,12,17,23)
    for x in range(1,235,40):s.box(x,36,4,34,'#6c8286');s.box(x+1,37,1,32,WHITE)
    s.box(0,6,238,6,'#ac5642',INK);s.box(1,6,236,2,'#cd8060');s.box(0,68,238,5,'#5b7075')
    s.save('buildings','shop-wall')
    s=Sprite(64,32)
    for i in (0,1):
        off=i*32;s.box(off,0,32,32,['#a6b1ac','#839295'][i]);s.box(off,31,32,1,['#99a59e','#788a8c'][i])
        for j in range(9):s.box(off+rng.randrange(28),rng.randrange(30),rng.randint(1,3),1,['#b1bab1','#909d9c'][i])
    s.save('tilesets','yard-ground')


if __name__=='__main__':
    halls()
    machine()
    fixtures()
    runpy.run_path(str(Path(__file__).with_name('polish-art.py')))
