// Living street details: warm sunlight motes, storefront lantern warmth, scooter exhaust & yielding traffic.
export function streetLife(scene){
  const shadow=scene.add.graphics().setDepth(-90);
  for(const {key,x,y} of scene.world.props){
    if(['mixue','kopi','fruit'].includes(key)){
      const width=key==='mixue'?172:138;
      shadow.fillStyle(0x595747,.26).fillPoints([{x:x-width/2,y:y-6},{x:x+width/2-3,y:y-6},{x:x+width/2+14,y:y+6},{x:x-width/2+14,y:y+6}],true);
      // Warm storefront doorway pool of light
      shadow.fillStyle(0xffe7aa,.14).fillEllipse(x,y+4,key==='mixue'?56:42,14);
    }
  }
  const bike=scene.add.image(0,0,'scooter').setOrigin(.5,1);
  const rider=scene.add.sprite(-2,-10,'rider',6).setOrigin(.5,1).setScale(.76);
  const front=scene.add.image(0,0,'scooter').setOrigin(.5,1).setCrop(0,13,44,20);
  const traffic=scene.add.container(-44,288,[bike,rider,front]).setDepth(288);
  // Live dancing Snow King mascot right outside Mixue storefront (choreographed to 《甜蜜蜜》 beat)
  const skHome={x:426,y:232};
  const snowking=scene.add.sprite(skHome.x,skHome.y,'snowking',0).setOrigin(.5,.94).setDepth(skHome.y);
  scene.snowking=snowking;
  const skSeq=[0,1,0,2,3,4,3,4,5,0];
  const skNotes=scene.add.graphics().setDepth(skHome.y+8);
  const noteSeeds=[{ox:-14,phase:0,color:0xe2464b},{ox:14,phase:0.52,color:0xf2b949}];
  const flag=scene.add.graphics().setDepth(201);
  const atmosphere=scene.add.graphics().setDepth(920);
  const motes=Array.from({length:14},(_,i)=>({
    x:(i*67)%scene.world.mapW,
    y:75+(i*37)%340,
    vx:5+(i%3)*2.5,
    phase:i*0.9,
    size:i%3===0?2:1
  }));
  const puffs=[];
  let puffTimer=0;
  const update=(time,delta)=>{
    if(!scene.player)return;
    const dt=Math.min(delta,60);
    if(!scene.overlay||scene.overlay==='intro'){
      const pedestrian=scene.player;
      const gap=pedestrian.x-traffic.x;
      const moving=!(gap>-12&&gap<45&&Math.abs(pedestrian.y-traffic.y)<16);
      if(moving){
        traffic.x+=dt*.057;
        if(traffic.x>scene.world.mapW+60)traffic.x=-85;
        puffTimer+=dt;
        if(puffTimer>260){
          puffTimer=0;
          puffs.push({x:traffic.x-20,y:traffic.y-6,life:1});
          if(puffs.length>6)puffs.shift();
        }
      }
    }
    const flutter=Math.round(2*Math.sin(time/360));
    flag.clear();
    for(const [dy,color] of [[0,0xc25349],[4,0xf4e3bc]]){
      flag.fillStyle(color).fillPoints([{x:464,y:155+dy},{x:472,y:154+dy},{x:480,y:155+flutter+dy},{x:480,y:159+flutter+dy},{x:472,y:158+dy},{x:464,y:159+dy}],true);
    }
    // Snow King lively street dance animation + floating pixel music notes
    const beat=Math.floor(time/360);
    const skFrame=skSeq[beat%skSeq.length];
    const sub=(time%360)/360;
    const hop=Math.round(Math.sin(sub*Math.PI)*2.4);
    const sway=skFrame===3?-2:skFrame===4?2:0;
    snowking.setFrame(skFrame);
    snowking.setPosition(skHome.x+sway,skHome.y-hop).setDepth(skHome.y);
    skNotes.clear();
    for(const n of noteSeeds){
      const t=((time/1500)+n.phase)%1;
      const nx=Math.round(skHome.x+n.ox+Math.sin(t*Math.PI*2)*4);
      const ny=Math.round(skHome.y-46-t*16);
      const alpha=t<0.2?t/0.2:t>0.7?(1-t)/0.3:1;
      // Crisp 6x7 pixel eighth note ♪
      skNotes.fillStyle(0x2d1812,alpha*0.85)
        .fillRect(nx-1,ny+2,5,4).fillRect(nx+2,ny-3,2,6).fillRect(nx+3,ny-3,4,2);
      skNotes.fillStyle(n.color,alpha)
        .fillRect(nx,ny+3,3,2).fillRect(nx+2,ny-2,1,5).fillRect(nx+3,ny-2,3,1);
    }
    atmosphere.clear();
    // Subtle sunlit dust motes drifting across the warm Jakarta avenue
    for(const m of motes){
      m.x+=m.vx*(dt/1000);
      if(m.x>scene.world.mapW+10)m.x=-10;
      const my=m.y+Math.sin(time/900+m.phase)*6;
      const alpha=0.18+0.14*Math.sin(time/650+m.phase);
      atmosphere.fillStyle(0xfff1c4,alpha).fillRect(Math.round(m.x),Math.round(my),m.size,m.size);
    }
    for(let i=puffs.length-1;i>=0;i--){
      const pf=puffs[i];
      pf.x-=dt*0.015;pf.y-=dt*0.012;pf.life-=dt/700;
      if(pf.life<=0){puffs.splice(i,1);continue;}
      atmosphere.fillStyle(0xeae6d7,pf.life*0.35).fillRect(Math.round(pf.x),Math.round(pf.y),3,2);
    }
  };
  scene.events.on('update',update);scene.events.once('shutdown',()=>scene.events.off('update',update));
}
