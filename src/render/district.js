import {paintIndustry} from './industry.js';
import {streetLife} from './streetLife.js';
import propTypes from '../data/pixel-props.json';

const art = import.meta.glob('../../assets/pixel/**/*.png',{eager:true,query:'?url',import:'default'});
export function preloadPixels(scene) {
  for (const [file,url] of Object.entries(art)) {
    const key = file.split('/').pop().slice(0,-4);
    if(file.includes('/characters/')) {
      const size=key.startsWith('ride-')?{frameWidth:48,frameHeight:48}:{frameWidth:32,frameHeight:40};
      scene.load.spritesheet(key,url,size);
    }
    else scene.load.image(key,url);
  }
}

function street(scene,g) {
  const {mapW:w} = scene.world;
  const rect = (x,y,width,height,color) => g.fillStyle(color).fillRect(x,y,width,height);
  for(const y of [251,352]){
    rect(0,y,w,5,0x927f6e);
    for(let x=0;x<w;x+=25)rect(x,y,24,3,x%2 ? 0xd9c7ab : 0xbca88b);
  }
  for(let y=265;y<347;y+=13)rect(342,y,36,6,0xddcfaf);
  for(let x=42;x<w;x+=144){
    rect(x,253,21,3,0x62645b);
    for(let k=0;k<19;k+=4)rect(x+k,253,1,3,0xb4a085);
  }
  for(let x=0;x<w;x+=12){
    rect(x,49,10,18,0xad936b);rect(x+1,49,8,2,0xd5bb85);
  }
  // A second row of foliage silhouettes gives the street a bounded northern edge.
  for(let i=0;i<21;i++)scene.add.image(i*44,52+(i%3)*7,'shade-tree').setOrigin(.5,1).setTint(0xbdc895).setDepth(-10);
  for(let i=0;i<11;i++){
    const x=34+i*77, y=i%2?455:471;
    for(let k=0;k<10;k++){
      const dx=(k*17)%29, dy=(k*11)%9;
      rect(x+dx,y+dy,2,4,0x678555);
      rect(x+dx-1,y+dy,3,2,k%2 ? 0xffdc96 : 0xd18a69);
    }
  }
  // Utility poles and the red-over-white flag are individual street silhouettes.
  const wires=scene.add.graphics().setDepth(65);
  for(let x=18;x<w+180;x+=212){
    wires.fillStyle(0x775f49).fillRect(x,29,4,67);
    wires.fillStyle(0xa08a66).fillRect(x,29,1,67);
    wires.fillStyle(0x65594b).fillRect(x-6,28,17,3);
    for(let line=0;line<2;line++){
      wires.lineStyle(1,0x5b5950,.85).beginPath().moveTo(x,29+line*4);
      for(let n=1;n<=16;n++)wires.lineTo(x+212*n/16,29+Math.round(12*Math.sin(Math.PI*n/16))+line*4);
      wires.strokePath();
    }
  }
  rect(462,154,2,48,0x78674f);
}

function shop(scene,g) {
  const rect=(x,y,w,h,c)=>g.fillStyle(c).fillRect(x,y,w,h);
  // Compact Kota Tua urban shophouse room (grounded in M004): 344x284 interior cutaway.
  rect(0,0,640,384,0x27211d);
  rect(144,22,352,292,0x6e5441);
  rect(152,28,336,278,0xf4ebd6);
  const floor=scene.textures.get('floor-tiles');
  if(!floor.has('floor'))floor.add('floor',0,96,0,32,32);
  scene.add.tileSprite(156,122,328,180,'floor-tiles','floor').setOrigin(0).setDepth(-96);

  const trim=scene.add.graphics().setDepth(-95);
  // Signature M004 red-and-white overhead canopy valance beam across the counter bay
  trim.fillStyle(0xc43137).fillRect(152,28,336,11);
  trim.fillStyle(0xfdf5e2).fillRect(152,39,336,6);
  trim.fillStyle(0xd5c5a8).fillRect(152,45,336,2);
  // Glossy Mixue red back wall behind the work counter (M004)
  trim.fillStyle(0xba3138).fillRect(156,94,328,32);
  for(let x=176;x<480;x+=44)trim.fillStyle(0x9b262d).fillRect(x,96,2,28);
  trim.fillStyle(0xd9595a).fillRect(156,94,328,2);
  // Left architectural red pillar matching M004 left column
  trim.fillStyle(0xb02e34).fillRect(152,47,16,79);
  trim.fillStyle(0x8e2228).fillRect(166,47,2,79);
  // Subtle recessed ceiling spotlights
  for(const sx of [205,320,435]){
    trim.fillStyle(0xfff1c4,0.6).fillCircle(sx,34,3);
    trim.fillStyle(0xffeaa8,0.08).fillTriangle(sx,45,sx-42,140,sx+42,140);
  }
  // Row of 4 stainless drink barrels with red caps lined behind the counter (M004)
  for(let i=0;i<4;i++){
    const x=252+i*30;
    trim.fillStyle(0x9ba29f).fillRect(x,104,16,18);
    trim.fillStyle(0xd04044).fillRect(x,104,16,5);
    trim.fillStyle(0xf8e7c2).fillRect(x+3,111,8,5);
    trim.fillStyle(0x464f4d).fillRect(x+7,118,3,4);
  }
  // Entrance welcome mat & compact pixel side stools beside the single waiting table
  trim.fillStyle(0xb54b42).fillRect(292,282,56,18);
  for(let y=285;y<299;y+=4)trim.fillStyle(0xdc8566).fillRect(296,y,48,1);
  for(const [x,y] of [[224,230],[190,198]]){
    trim.fillStyle(0x72513f).fillRect(x-5,y,2,5).fillRect(x+4,y,2,5);
    trim.fillStyle(0x8c3b2f).fillRect(x-7,y-4,14,7);
    trim.fillStyle(0xbb5d4a).fillRect(x-6,y-3,12,5);
    trim.fillStyle(0xdc846b).fillRect(x-5,y-3,10,1);
  }

  // Hanging COLLECT (left) & ORDER HERE (right) pixel signage plaques from M004
  const signs=scene.add.graphics().setDepth(95);
  for(const [x,w] of [[214,64],[356,84]]){
    signs.fillStyle(0x7c7568).fillRect(x+12,45,1,37).fillRect(x+w-13,45,1,37);
    signs.fillStyle(0x8e282e).fillRect(x,80,w,16);
    signs.fillStyle(0xfff5dc).fillRect(x+2,82,w-4,12);
    signs.fillStyle(0xead4a8).fillRect(x+2,92,w-4,2);
  }
  const signStyle={fontFamily:'"FusionPixel",monospace',fontSize:'12px',color:'#a82b31'};
  scene.add.text(246,88,'COLLECT',signStyle).setOrigin(.5).setDepth(96);
  scene.add.text(398,88,'ORDER HERE',signStyle).setOrigin(.5).setDepth(96);
}

export function drawDistrict(scene) {
  const {map,props} = scene.world;
  const tm=scene.make.tilemap({data:Array.from({length:map.height},(_,i)=>map.layers[0].data.slice(i*map.width,(i+1)*map.width).map(n=>n-1)),tileWidth:32,tileHeight:32});
  const tiles=map.tilesets[0].name;
  const set=tm.addTilesetImage(tiles,tiles,32,32,0,0,0);
  tm.createLayer(0,set,0,0).setDepth(-100);
  const g=scene.add.graphics().setDepth(-98);
  if(scene.worldId==='jakarta'){street(scene,g);streetLife(scene);}
  else if(scene.worldId==='mixue_shop'){
    if(!scene.textures.exists('floor-tiles'))scene.textures.addImage('floor-tiles',scene.textures.get('ground').getSourceImage());
    shop(scene,g);
  } else paintIndustry(scene,g);
  for(const prop of props){
    const [ax,ay]=propTypes[prop.key].anchor;
    scene.add.image(prop.x,prop.y,prop.key).setOrigin(ax,ay).setDepth(prop.y-3);
    if(prop.key==='mixue')scene.add.image(prop.x,prop.y-95,'mixue-sign').setDisplaySize(136,52).setDepth(prop.y-2.9);
  }
}

export function face(sprite,dx,dy,time) {
  if(Math.abs(dx)+Math.abs(dy)<.05){sprite.setFrame((sprite.facing||0)*3);return;}
  sprite.facing=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);
  sprite.setFrame(sprite.facing*3+[0,1,0,2][Math.floor(time/122)%4]);
}
