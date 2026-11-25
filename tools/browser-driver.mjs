// Minimal Chrome DevTools Protocol driver for the classroom smoke test (Node 22+).
import fs from 'node:fs/promises';
export const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function connect(port=9367){
  const tab=await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'}).then(r=>r.json());
  const ws=new WebSocket(tab.webSocketDebuggerUrl),pending=new Map(),errors=[],requests=[];
  await new Promise(resolve=>ws.onopen=resolve);
  let id=0;
  ws.onmessage=e=>{
    const m=JSON.parse(e.data);
    if(m.id){const pair=pending.get(m.id);if(pair){pending.delete(m.id);m.error?pair.reject(Error(m.error.message)):pair.resolve(m.result);}}
    if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
    if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url);
  };
  function call(method,params={}){
    return new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  }
  async function read(expression){
    const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
    return r.result.value;
  }
  async function key(name,down=true){
    const table={Escape:['Escape',27],Tab:['Tab',9],Enter:['Enter',13],ArrowUp:['ArrowUp',38],ArrowDown:['ArrowDown',40],ArrowRight:['ArrowRight',39],ArrowLeft:['ArrowLeft',37],' ':['Space',32]};
    const [code,virtual]=table[name]||['Key'+name.toUpperCase(),name.toUpperCase().charCodeAt(0)];
    await call('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:name,code,windowsVirtualKeyCode:virtual,nativeVirtualKeyCode:virtual});
  }
  async function tap(name){await key(name);await wait(60);await key(name,false);await wait(100);}
  async function until(expression,ms=4500){const start=Date.now();while(Date.now()-start<ms){if(await read(expression))return;await wait(45);}throw Error('Timed out: '+expression+' '+errors.join('\n'));}
  async function shot(name){await fs.mkdir('docs/screenshots',{recursive:true});const result=await call('Page.captureScreenshot',{format:'png'});await fs.writeFile('docs/screenshots/'+name+'.png',Buffer.from(result.data,'base64'));}
  await Promise.all(['Page.enable','Runtime.enable','Network.enable'].map(m=>call(m)));
  await call('Page.bringToFront');
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:810,deviceScaleFactor:1,mobile:false});
  return {read,call,until,key,tap,shot,errors,requests,close:()=>call('Page.close')};
}
