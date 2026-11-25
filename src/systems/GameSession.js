export const SESSION_KEY='brandquest-v1-save';
const defaultMetrics=()=>({
  totalMs:0,moveMs:0,panelMs:0,minigameMs:0,idleMs:0,
  mapMs:{jakarta:0,mixue_shop:0,karawang:0,sany_workshop:0},
  milestones:{}
});
export class GameSession {
  constructor(){
    this.guide=true;this.world='jakarta';this.flags={};this.photos=[];this.snapshots={};this.visited=[];this.history=[];this.startAt=Date.now();
    this.metrics=defaultMetrics();
  }
  ensureMetrics(){
    if(!this.metrics||typeof this.metrics!=='object')this.metrics=defaultMetrics();
    const base=defaultMetrics();
    for(const key of ['totalMs','moveMs','panelMs','minigameMs','idleMs']){
      if(typeof this.metrics[key]!=='number'||!Number.isFinite(this.metrics[key]))this.metrics[key]=0;
    }
    this.metrics.mapMs={...base.mapMs,...(this.metrics.mapMs||{})};
    this.metrics.milestones={...(this.metrics.milestones||{})};
    return this.metrics;
  }
  tick(worldId,deltaMs,bucket){
    const dt=Math.max(0,Math.min(250,deltaMs||0));
    if(!dt)return;
    const m=this.ensureMetrics();
    m.totalMs+=dt;
    if(worldId&&worldId in m.mapMs)m.mapMs[worldId]+=dt;
    if(bucket==='move')m.moveMs+=dt;
    else if(bucket==='minigame')m.minigameMs+=dt;
    else if(bucket==='panel')m.panelMs+=dt;
    else m.idleMs+=dt;
  }
  markMilestone(id){
    const m=this.ensureMetrics();
    if(!(id in m.milestones))m.milestones[id]=Math.round(m.totalMs);
  }
  flag(id,value=true){
    this.flags[id]=value;
    if(value&&['mixue_order','sany_service','dance_video_done','field_pair','service_ticket','service_parts'].includes(id)){
      this.markMilestone(id);
    }
  }
  has(id){return Boolean(this.flags[id]);}
  photo(id,image){
    if(!this.photos.includes(id)){
      this.photos.push(id);
      this.markMilestone('photo_'+id);
    }
    if(image)this.snapshots[id]=image;
  }
  move(id){
    this.world=id;
    if(!this.visited.includes(id)){
      this.visited.push(id);
      this.markMilestone('visit_'+id);
    }
  }
  addLog(message){this.history.unshift({message,at:new Date().toISOString()});this.history=this.history.slice(0,30);}
  get done(){return this.has('mixue_order')&&this.has('sany_service');}
  save(){try{localStorage.setItem(SESSION_KEY,JSON.stringify(this));}catch{/* In-memory play remains available in private mode. */}}
  static load(){
    try{
      const s=JSON.parse(localStorage.getItem(SESSION_KEY));
      if(!s||!Array.isArray(s.photos)||!s.flags)return null;
      const session=Object.assign(new GameSession(),s);
      if(typeof session.guide!=='boolean')session.guide=session.mode!=='free';
      session.ensureMetrics();
      return session;
    }catch{return null;}
  }
}
