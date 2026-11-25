import fs from 'node:fs';
import {defineConfig} from 'vite';

const notices=[
  ...['phaser/LICENSE.md','eventemitter3/LICENSE'].map(file=>
    fs.readFileSync(new URL('./node_modules/'+file,import.meta.url),'utf8')
  ),
  fs.readFileSync(new URL('./assets/licenses/OFL-fusion-pixel-font.txt',import.meta.url),'utf8')
];
export default defineConfig({
  base:'./',
  publicDir:false,
  build:{
    sourcemap:false,outDir:'dist',assetsInlineLimit:2097152,modulePreload:false,
    rollupOptions:{output:{banner:'/*!\n'+notices.join('\n\n')+'\n*/'}}
  },
  server:{open:false}
});
