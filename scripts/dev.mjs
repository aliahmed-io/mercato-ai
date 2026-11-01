#!/usr/bin/env node
import { spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePort, findPort, healthy } from './runtime.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const frontend=path.join(root,'frontend');
const next=path.join(frontend,'node_modules/next/dist/bin/next');
const production=process.argv.includes('--production');
const children=new Set();let stopping=false;
function cleanup(){if(stopping)return;stopping=true;for(const c of children){try{if(process.platform==='win32')execFileSync('taskkill',['/pid',String(c.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});else c.kill('SIGTERM');}catch{}}}
process.on('SIGINT',()=>{cleanup();process.exit(0)});process.on('SIGTERM',()=>{cleanup();process.exit(0)});process.on('exit',cleanup);
function launch(bin,args,cwd,env){const c=spawn(bin,args,{cwd,env,stdio:'inherit',shell:false,windowsHide:true});children.add(c);c.on('exit',()=>children.delete(c));c.on('error',e=>{console.error(e.message);cleanup();process.exit(1)});return c;}
async function main(){
 if(!existsSync(next))throw new Error('Frontend dependencies are missing. Run npm --prefix frontend install first.');
 const args=process.argv.slice(2);const flag=args.findIndex(x=>x==='--port'||x==='-p');
 if(flag>=0 && !args[flag+1])throw new Error('--port requires a port number');
 const positional=args.find(x=>/^\d+$/.test(x));
 const preferred=parsePort(flag>=0?args[flag+1]:positional || process.env.PORT,3000);
 let backend=process.env.BACKEND_URL?.replace(/\/$/,'');
 if(backend){if(!await healthy(backend))throw new Error(`Configured backend is unavailable: ${backend}`);}
 else {
  const preferredBackend=parsePort(process.env.BACKEND_PORT,8008);backend=`http://127.0.0.1:${preferredBackend}`;
  if(!await healthy(backend)){
   const port=await findPort(preferredBackend);backend=`http://127.0.0.1:${port}`;
   const venv=path.join(root,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
   const python=process.env.PYTHON || (existsSync(venv)?venv:process.platform==='win32'?'python':'python3');
   const child=launch(python,['backend/run.py'],root,{...process.env,PORT:String(port),BACKEND_PORT:String(port),RELOAD:production?'0':'1',PYTHONUNBUFFERED:'1'});
   let ready=false;
   for(let i=0;i<60;i++){if(child.exitCode!==null)throw new Error('Backend exited during startup. Check Python dependencies.');if(await healthy(backend)){ready=true;break;}await new Promise(r=>setTimeout(r,500));}
   if(!ready)throw new Error('Backend did not become healthy within the startup timeout.');
   child.on('exit',code=>{if(!stopping){console.error('Backend stopped unexpectedly.');cleanup();process.exit(code||1);}});
  }
 }
 // Rebuild against the resolved backend: Next rewrites are baked into the production build.
 const env={...process.env,BACKEND_URL:backend,NEXT_PUBLIC_API_URL:'/api/v1'};
 if(production){console.log('[Mercato] Building production app...');const build=launch(process.execPath,[next,'build'],frontend,env);const code=await new Promise(r=>build.once('exit',r));if(code!==0)throw new Error('Production build failed.');}
 const port=await findPort(preferred);
 console.log(`[Mercato] Backend: ${backend}\n[Mercato] Open http://localhost:${port}${port!==preferred?` (port ${preferred} was occupied)`:''}`);
 const app=launch(process.execPath,[next,production?'start':'dev','--hostname','0.0.0.0','--port',String(port)],frontend,{...env,PORT:String(port)});
 app.on('exit',code=>{cleanup();process.exit(code??1)});
}
main().catch(e=>{console.error(`[Mercato] ${e.message}`);cleanup();process.exit(1)});
