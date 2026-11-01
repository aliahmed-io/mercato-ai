import net from 'node:net';
export function parsePort(value, fallback) {
 const port = value === undefined ? fallback : Number(value);
 if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`Invalid port: ${value}`);
 return port;
}
export function available(port) {
 return new Promise(resolve => { const s=net.createServer(); s.once('error',()=>resolve(false)); s.listen(port,'0.0.0.0',()=>s.close(()=>resolve(true))); });
}
export async function findPort(start, attempts=100) {
 for(let p=start;p<=Math.min(65535,start+attempts-1);p++) if(await available(p)) return p;
 throw new Error(`No available port in range starting at ${start}`);
}
export async function healthy(base) {
 try {const r=await fetch(`${base}/health`,{signal:AbortSignal.timeout(1500)});const j=await r.json();return r.ok && j.status==='healthy' && j.service==='Mercato AI Backend';} catch {return false;}
}
