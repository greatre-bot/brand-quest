import { label as txt } from '../ui/panel.js';
export class IndustrialMap {
 constructor(scene){this.scene=scene;}
 draw(){
  const w=this.scene.world, g=this.scene.add.graphics().setDepth(-100);
  const outdoor=w.mode!=='interior';
  const base=w.mode==='factory'?0xb4c5aa:w.mode==='city'?0x84ab78:0xd5bd91;
  g.fillStyle(base);g.fillRect(0,0,w.mapW,w.mapH);
  // Ground grid; these tiles are developer-made placeholders, not sourced site photos.
  for(let y=0;y<w.mapH;y+=32)for(let x=0;x<w.mapW;x+=32){
    const seed=(x*13+y*71)%131;
    g.fillStyle((seed>65)?0xffffff:0x254a27, .02);g.fillRect(x,y,32,32);
  }
  if(outdoor){
   g.fillStyle(w.mode==='factory'?0xaab6b7:0x8c9294);g.fillRect(0,605,w.mapW,235);
   g.fillStyle(0xcfd4cb);g.fillRect(0,585,w.mapW,20);g.fillRect(0,840,w.mapW,25);
   for(let x=40;x<w.mapW;x+=135){g.fillStyle(0xe9e3bd);g.fillRect(x,712,65,5);}
   for(let x=120;x<w.mapW;x+=320){g.fillStyle(0xffffff,.28);g.fillRect(x,860,145,10);}
  } else {
   g.fillStyle(0xb89d79);g.fillRect(25,30,w.mapW-50,w.mapH-60);
   g.fillStyle(0xe7d0a8);g.fillRect(47,51,w.mapW-94,w.mapH-102);
   g.fillStyle(w.title.includes('蜜雪')?0xc7363d:0x506c75);
   g.fillRect(30,35,w.mapW-60,20);
   for(let y=80;y<w.mapH-30;y+=45){g.lineStyle(1,0xa57e58,.2);g.lineBetween(45,y,w.mapW-45,y);}
   for(let x=45;x<w.mapW-30;x+=45){g.lineStyle(1,0xa57e58,.2);g.lineBetween(x,50,x,w.mapH-40);}
   if(w.title.includes('蜜雪')){
     g.fillStyle(0xe7ece6);g.fillRoundedRect(200,198,570,157,8);
     g.fillStyle(0xc83d45);g.fillRect(195,190,580,18);
     g.fillStyle(0xf6eddf);g.fillRect(285,350,340,55);
   } else {
     g.fillStyle(0x627983);g.fillRoundedRect(190,210,560,180,5);
     for(let i=0;i<7;i++){g.fillStyle(0xb5b7a6);g.fillRect(220+i*70,230,43,130);}
   }
  }
  for(const b of w.buildings){
   const c=b.type==='mixue'?0xc93b3a:b.type==='sany'?0x758b91:b.type==='factory'?0x647e81:b.type==='workshop'?0x9b8f6f:0x826d57;
   g.fillStyle(0x2f3637,.24);g.fillRoundedRect(b.x+9,b.y+13,b.w,b.h,5);
   g.fillStyle(c);g.fillRoundedRect(b.x,b.y,b.w,b.h,4);
   g.fillStyle(0xe8e4d4,.74);g.fillRect(b.x+12,b.y+12,b.w-24,19);
   for(let winX=b.x+26;winX<b.x+b.w-40;winX+=93){
    g.fillStyle(0x9fd0d0,.55);g.fillRect(winX,b.y+b.h-64,57,35);
    g.lineStyle(3,0x28434a,.65);g.strokeRect(winX,b.y+b.h-64,57,35);
   }
   if(b.door){g.fillStyle(0x314c49);g.fillRect(b.door.x-21,b.y+b.h-33,42,33);g.fillStyle(0xe7d08e);g.fillRect(b.door.x+9,b.y+b.h-19,3,3);}
   const labelColor=b.type==='mixue'?'#ffffff':'#142c34';
   txt(this.scene,b.x+b.w/2,b.y+45,b.label,19,labelColor,{fontStyle:'bold',stroke:'#1c313a',strokeThickness:b.type==='mixue'?2:0}).setOrigin(.5).setDepth(2);
  }
  if(outdoor){
   for(let i=0;i<25;i++){
     const x=((i*227+107)%w.mapW),y=(i%2===0?75:900)+((i*47)%140);
     if(w.mode==='factory' && x>1000 && y<590)continue;
     this.drawTree(x,y);
   }
   if(w.mode==='factory'){
     for(let i=0;i<4;i++)this.drawMachinery(1400+i*92,570+(i%2)*22);
   } else {
     for(let i=0;i<7;i++) this.drawBike(145+i*207,865+(i%2)*16);
   }
  }
 }
 drawTree(x,y){
  const g=this.scene.add.graphics().setDepth(y);
  g.fillStyle(0x695340);g.fillRect(x-4,y+2,8,19);
  g.fillStyle(0x3b7760);g.fillCircle(x-12,y-8,18);g.fillStyle(0x457a4d);g.fillCircle(x+9,y-13,17);g.fillStyle(0x6f9d52);g.fillCircle(x,y-19,20);
 }
 drawBike(x,y){
  const g=this.scene.add.graphics().setDepth(y);
  g.lineStyle(3,0x263940);g.strokeCircle(x-11,y+9,9);g.strokeCircle(x+16,y+9,9);
  g.lineBetween(x-11,y+9,x+5,y-9);g.lineBetween(x+5,y-9,x+16,y+9);g.lineBetween(x-11,y+9,x+16,y+9);
  g.fillStyle(0xcb3e3c);g.fillRect(x-1,y-9,23,7);
 }
 drawMachinery(x,y){
  const g=this.scene.add.graphics().setDepth(y);
  g.fillStyle(0x363b40);g.fillRoundedRect(x-42,y+11,80,20,6);g.fillStyle(0xe4b945);g.fillRect(x-28,y-20,54,36);g.fillStyle(0x6d9c9e);g.fillRect(x-13,y-14,16,15);
  g.lineStyle(10,0xe0ad38);g.lineBetween(x+26,y-11,x+62,y-46);g.lineBetween(x+62,y-46,x+94,y-29);g.fillStyle(0x363b40);g.fillRect(x+86,y-28,22,16);
 }

}