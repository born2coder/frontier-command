import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine} from '../src/engine/game-engine.ts';
import {pickTapTarget} from '../src/client/input-targeting.ts';

const state=()=>{const e=new GameEngine('TAP001',77,[{name:'P1',kind:'human'},{name:'P2',kind:'cpu'}]);e.state.phase='playing';return e.state};

test('a tapped friendly villager wins over a nearby resource and building',()=>{
 const s=state(),villager=s.units.find(u=>u.factionId===0)!,resource=s.map.resources[0],town=s.buildings.find(b=>b.factionId===0)!;villager.x=resource.x;villager.y=resource.y;town.x=resource.x+30;town.y=resource.y;const target=pickTapTarget(s,0,{x:villager.x,y:villager.y},1,true);assert.equal(target?.type,'own-unit');assert.equal(target?.value.id,villager.id);
});

test('the closest friendly unit is selected in a dense group',()=>{
 const s=state(),units=s.units.filter(u=>u.factionId===0);units.forEach((u,i)=>{u.x=500+i*14;u.y=500});const wanted=units[2],target=pickTapTarget(s,0,{x:wanted.x+2,y:wanted.y},1,false);assert.equal(target?.type,'own-unit');assert.equal(target?.value.id,wanted.id);
});

test('resource and building taps still work away from friendly units',()=>{
 const s=state(),resource=s.map.resources[0],enemyTown=s.buildings.find(b=>b.factionId===1)!;s.units.filter(u=>u.factionId===0).forEach(u=>{u.x=100;u.y=100});assert.equal(pickTapTarget(s,0,{x:resource.x,y:resource.y},1,true)?.type,'resource');assert.equal(pickTapTarget(s,0,{x:enemyTown.x+60,y:enemyTown.y},1,false)?.type,'building');
});

test('an enemy villager wins over a resource at the same point',()=>{
 const s=state(),enemy=s.units.find(u=>u.factionId===1&&u.kind==='villager')!,resource=s.map.resources[0];enemy.x=resource.x;enemy.y=resource.y;s.units.filter(u=>u.factionId===0).forEach(u=>{u.x=100;u.y=100});const target=pickTapTarget(s,0,{x:resource.x,y:resource.y},1,true);assert.equal(target?.type,'enemy-unit');assert.equal(target?.value.id,enemy.id);
});
