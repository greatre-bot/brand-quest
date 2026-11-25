// Industrial yard & workshop markings, grounded shadows, drifting clouds, safety beacon & skylight beams.
export function paintIndustry(scene,g){
  const box=(x,y,w,h,color)=>g.fillStyle(color).fillRect(x,y,w,h);
  const text=(x,y,str,size=12)=>scene.add.text(x,y,str,{fontFamily:'"FusionPixel",monospace',fontSize:size+'px',color:'#475c58'}).setDepth(-85);
  if(scene.worldId==='karawang'){
    box(0,215,800,6,0xcbd2ba);box(0,288,800,4,0xe0ddbf);
    for(let x=8;x<800;x+=46)box(x,255,23,2,0xe0d8ad);
    for(let y=228;y<286;y+=10)box(200,y,44,5,0xdfddc3);
    for(let i=0;i<14;i++)box(51+i*19,178,18,4,i%2?0xd4b55b:0x475552);
    box(355,195,150,2,0xe7c367);box(354,123,2,73,0xe7c367);box(505,124,2,73,0xe7c367);
    text(368,198,'DISPLAY  /  01');
    // Grounded architectural cast shadows
    const cast=scene.add.graphics().setDepth(-91);
    cast.fillStyle(0x3a4745,.18).fillPoints([{x:52,y:178},{x:312,y:178},{x:326,y:192},{x:66,y:192}],true);
    cast.fillStyle(0x3a4745,.16).fillPoints([{x:620,y:186},{x:758,y:186},{x:770,y:198},{x:632,y:198}],true);
    for(const x of [32,348,557,769])scene.add.image(x,64,'shade-tree').setOrigin(.5,1).setDepth(40);
    for(let x=25;x<780;x+=23){box(x,73,2,17,0x82938b);box(x,74,23,2,0x97a499);}
    text(95,382,'HALTE');text(637,196,'SERVICE  >');

    // Live atmospheric pass: soft drifting cloud shadows + pulsing amber beacon at service bay
    const fx=scene.add.graphics().setDepth(900);
    const clouds=[{x:120,y:110,w:170,h:54,spd:7},{x:520,y:270,w:210,h:60,spd:5.5}];
    const update=(time,delta)=>{
      const dt=Math.min(delta,60)/1000;
      fx.clear();
      for(const c of clouds){
        c.x+=c.spd*dt;
        if(c.x>scene.world.mapW+120)c.x=-c.w-40;
        fx.fillStyle(0x2d3e3f,0.045).fillEllipse(c.x,c.y,c.w,c.h);
      }
      const pulse=0.35+0.45*(0.5+0.5*Math.sin(time/380));
      fx.fillStyle(0xf8cf64,pulse*0.42).fillRect(710,100,12,12);
      fx.fillStyle(0xfff1ba,pulse*0.85).fillRect(714,104,4,4);
    };
    scene.events.on('update',update);scene.events.once('shutdown',()=>scene.events.off('update',update));
    return;
  }
  for(let x=32;x<608;x+=35)box(x,82,24,2,0xdac382);
  for(const [x,y,w,h] of [[44,171,100,74],[476,203,111,75],[287,318,57,25]]){
    g.lineStyle(2,0xf0cd72).strokeRect(x,y,w,h);
    for(let i=0;i<5;i++)box(x+4+i*6,y+h-4,3,3,0x727e74);
  }
  for(let y=110;y<312;y+=16){box(288,y,2,8,0xe1d7aa);box(391,y,2,8,0xe1d7aa);}
  text(48,248,'DISPATCH');text(486,282,'HANDOVER');text(282,345,'KELUAR  /  EXIT');
  for(const [x,y] of [[154,157],[382,207],[152,267]])box(x,y,108,2,0xd5bc72);
  text(36,66,'KARAWANG  /  SERVICE WORKSHOP',12);

  // Diagonal soft skylight beams & subtle monitor status LEDs inside workshop
  const beams=scene.add.graphics().setDepth(-88);
  for(const sx of [120,295,470]){
    beams.fillStyle(0xfff2c7,0.06).fillPoints([{x:sx,y:76},{x:sx+56,y:76},{x:sx+84,y:176},{x:sx+26,y:176}],true);
  }
  const leds=scene.add.graphics().setDepth(500);
  const blink=(time)=>{
    leds.clear();
    const on=Math.sin(time/450)>-0.2;
    if(on){
      leds.fillStyle(0x7be090,0.9).fillRect(88,187,2,2);
      leds.fillStyle(0x7be090,0.9).fillRect(548,223,2,2);
    }
  };
  scene.events.on('update',blink);scene.events.once('shutdown',()=>scene.events.off('update',blink));
}
