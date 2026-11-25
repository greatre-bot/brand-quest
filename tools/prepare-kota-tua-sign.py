"""Turn the licensed M003 shop sign into a flat pixel sign.

Input: Fikri RA's Jan 25, 2023 exterior at any original aspect-ratio size
(the 960x720 Commons preview was used). No network or whole image embedding.
The CC BY-SA attribution also appears inside the game's field manual.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

im=Image.open(sys.argv[1]).convert('RGB')
# QUAD takes upper left, lower left, lower right, upper right.
quad=[(137.4,37.1),(136.4,80.3),(252.9,74.5),(253.6,26.8)]
coords=[v*im.width/400 for xy in quad for v in xy]
sign=im.transform((272,104),Image.Transform.QUAD,coords,Image.Resampling.BICUBIC)
silhouette=Image.new('1',sign.size)
ImageDraw.Draw(silhouette).polygon([(18,32),(22,16),(27,19),(32,31),(29,48),(30,54),(34,51),(35,39),(39,31),(44,28),(41,21),(43,18),(48,20),(51,17),(54,20),(57,20),(61,24),(58,28),(64,34),(67,42),(66,50),(66,54),(70,62),(75,78),(72,82),(60,84),(52,88),(40,86),(34,82),(30,86),(26,82),(24,55),(22,50)],fill=1)
for y in range(sign.height):
    for x in range(sign.width):
        r,g,b=sign.getpixel((x,y))
        color=(200,39,57)
        if silhouette.getpixel((x,y)):
            if min(r,g,b)>144 and max(r,g,b)-min(r,g,b)<57:color=(255,249,229)
            elif r>147 and g>108 and b<g*.9:color=(241,192,87)
            elif max(r,g,b)<135 or (r<g*1.08 and min(r,g,b)<130):color=(63,49,55)
            elif (31<x<68 and 46<y<57 or 60<x<72 and 68<y<80) and b>g*1.1:color=(219,99,146)
        elif 81<x<252 and 20<y<89:
            if 85<x<247 and 71<y<87:color=(182,32,51)
            if min(r,g,b)>147 and max(r,g,b)-min(r,g,b)<65:color=(255,249,235)
            elif r<135 and g<72:color=(144,35,53)
        sign.putpixel((x,y),color)
details=ImageDraw.Draw(sign)
details.ellipse((44,35,46,39),fill='#464955')
details.ellipse((53,35,55,39),fill='#464955')
details.line([(46,44),(49,46),(52,46),(55,44)],fill='#9c7364')
details.ellipse((49,40,54,42),fill='#efa953')
sign.save(Path(__file__).resolve().parents[1]/'assets/pixel/buildings/mixue-sign.png')
