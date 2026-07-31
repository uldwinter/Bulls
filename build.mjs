import {mkdir,rm,copyFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const f of ['index.html','styles.css','app.js','favicon.svg','manifest.webmanifest']) await copyFile(f,`dist/${f}`);
console.log('AIDossier build ready');
