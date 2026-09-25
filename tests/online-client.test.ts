import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('every required online UI id exists in the generated markup',()=>{
 const source=readFileSync(new URL('../src/client/online-client.ts',import.meta.url),'utf8');
 const ids=new Set([...source.matchAll(/id="([\w-]+)"/g)].map(match=>match[1]));
 const queried=[...source.matchAll(/qs(?:<[^>]+>)?\('(?:#)([\w-]+)'\)/g)].map(match=>match[1]).filter(id=>!['startGame','app','networkCanvas'].includes(id));
 assert.deepEqual(queried.filter(id=>!ids.has(id)),[]);
});

test('touch gestures pan the map while range mode enables touch box selection',()=>{
 const source=readFileSync(new URL('../src/client/online-client.ts',import.meta.url),'utf8');
 assert.match(source,/e\.pointerType==='touch'/);
 assert.match(source,/view\.x=touchPanStart\.viewX-/);
 assert.match(source,/networkRangeSelect/);
 assert.match(source,/!rangeSelecting/);
 assert.match(source,/selectBox\(start,current\)/);
 assert.match(source,/pointers\.size===2&&gestureStart/);
});
