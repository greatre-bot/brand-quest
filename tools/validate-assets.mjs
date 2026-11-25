import fs from 'node:fs';
import path from 'node:path';
const base=path.resolve(import.meta.dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(base,p),'utf8'));
const {assets}=read('data/asset-manifest.json'),{sources}=read('data/source-index.json');
const ids=new Set(sources.map(s=>s.id)),assetIds=new Set(),files=new Set(),errors=[];
if(ids.size!==sources.length)errors.push('Duplicate source IDs');
for(const s of sources){
  if(s.url&&!s.url.startsWith('https://'))errors.push('Invalid URL: '+s.id);
  for(const field of ['author','geography','checked','claims','rights_status','capture_year','publication_year'])
    if(!(field in s))errors.push(s.id+' missing '+field);
}
for(const a of assets){
  if(assetIds.has(a.id))errors.push('Duplicate asset: '+a.id);
  assetIds.add(a.id);
  for(const s of a.source_ids)if(!ids.has(s))errors.push('Unknown source '+s+' for '+a.id);
  if(a.file){
    const file=path.join(base,a.file);files.add(a.file);
    if(!fs.existsSync(file)){errors.push('Missing '+a.file);continue;}
    if(a.file.endsWith('.png')){
      const bytes=fs.readFileSync(file);
      if(bytes.readUInt32BE(16)!==a.resolution[0]||bytes.readUInt32BE(20)!==a.resolution[1])errors.push('PNG size mismatch '+a.id);
      if(a.asset_usage==='licensed_photo_adaptation' && (!a.license.includes('CC-BY-SA-4.0') || !a.source_ids.includes('M003')))errors.push('Missing photo attribution: '+a.id);
      if(!a.file.startsWith('assets/pixel/')||!['original_pixel_art','licensed_photo_adaptation'].includes(a.asset_usage))errors.push('Unexpected PNG use '+a.id);
    }
  }
}
for(const file of fs.readdirSync(path.join(base,'assets/pixel'),{recursive:true})){
  const portable='assets/pixel/'+file.split(path.sep).join('/');
  if(file.endsWith('.png')&&!files.has(portable))errors.push('Unindexed pixels: '+portable);
}
const props=read('src/data/pixel-props.json');
for(const [name,p] of Object.entries(props)){
  const a=assets.find(a=>a.file===p.file);
  if(!a||[p.footprint,p.anchor,p.size].some((v,i)=>JSON.stringify(v)!==JSON.stringify([a.collision,a.anchor,a.resolution][i])))errors.push('Prop metadata mismatch: '+name);
}
console.log(assets.length+' assets, '+sources.length+' sources, '+errors.length+' errors');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
