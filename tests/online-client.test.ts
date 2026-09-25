import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('every required online UI id exists in the generated markup',()=>{
 const source=readFileSync(new URL('../src/client/online-client.ts',import.meta.url),'utf8');
 const ids=new Set([...source.matchAll(/id="([\w-]+)"/g)].map(match=>match[1]));
 const queried=[...source.matchAll(/qs(?:<[^>]+>)?\('(?:#)([\w-]+)'\)/g)].map(match=>match[1]).filter(id=>!['startGame','app','networkCanvas'].includes(id));
 assert.deepEqual(queried.filter(id=>!ids.has(id)),[]);
});
