import { WORLDS } from '../src/data/worlds.js';
import { BRAND_FACTS } from '../src/data/facts.js';
import { EVIDENCE_LABELS, TASKS } from '../src/data/content.js';
import fs from 'node:fs';
const sources=JSON.parse(fs.readFileSync(new URL('../data/source-index.json',import.meta.url),'utf8')).sources;
const sourceIds=new Set(sources.map(x=>x.id));
let errors=[];
if(Object.keys(WORLDS).length<4)errors.push('Expected at least 4 maps');
for(const [id,w] of Object.entries(WORLDS)){
 if(!(w.mapW>0&&w.mapH>0))errors.push(`${id}: bad size`);
 if(!w.start || w.start.x<0 || w.start.y<0)errors.push(`${id}: bad start`);
 const ids=new Set();
 for(const i of w.interactables){
  if(ids.has(i.id))errors.push(`${id}: duplicate ${i.id}`);ids.add(i.id);
  if(i.x<0||i.x>w.mapW||i.y<0||i.y>w.mapH)errors.push(`${id}: ${i.id} out of bounds`);
  if(['door','transport'].includes(i.kind)&&!WORLDS[i.to])errors.push(`${id}: ${i.id} unknown destination ${i.to}`);
  if(i.kind==='minigame'&&!TASKS[i.task])errors.push(`${id}: ${i.id} unknown task ${i.task}`);
  if(i.kind==='evidence'&&(!EVIDENCE_LABELS[i.key]||!BRAND_FACTS[i.fact]))errors.push(`${id}: ${i.id} evidence missing label/fact`);
 }
}
for(const [id,f] of Object.entries(BRAND_FACTS))for(const s of f.sources)if(!sourceIds.has(s))errors.push(`${id}: unknown source ${s}`);
console.log(`Worlds checked: ${Object.keys(WORLDS).length}; brand facts: ${Object.keys(BRAND_FACTS).length}; errors: ${errors.length}`);
for(const e of errors)console.error(e);
if(errors.length)process.exit(1);
