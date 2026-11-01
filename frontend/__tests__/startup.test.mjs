import {test} from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import http from 'node:http';
import {parsePort,findPort,healthy} from '../../scripts/runtime.mjs';
test('occupied ports are skipped and exhausted ranges fail',async()=>{const s=net.createServer();await new Promise(r=>s.listen(0,'0.0.0.0',r));try{const p=s.address().port;assert.notEqual(await findPort(p),p);await assert.rejects(findPort(p,1));}finally{s.close();}});
test('invalid ports fail explicitly',()=>{for(const p of ['abc','0','65536','3.5'])assert.throws(()=>parsePort(p,3000));assert.equal(parsePort(undefined,3000),3000)});
test('unrelated HTTP services are not reused as the backend',async()=>{const s=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status:'healthy',service:'Other app'}))});await new Promise(r=>s.listen(0,'127.0.0.1',r));try{assert.equal(await healthy(`http://127.0.0.1:${s.address().port}`),false)}finally{s.close();}});
