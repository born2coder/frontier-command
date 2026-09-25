import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine} from '../src/engine/game-engine.ts';
import type {FactionId,UnitState} from '../src/shared/protocol.ts';

const engine=(count=2)=>{const e=new GameEngine('TEST01',12345,Array.from({length:count},(_,i)=>({name:`P${i+1}`,kind:i?'cpu':'human'} as const)));e.state.phase='playing';return e};

test('same seed produces the same fair four-corner map',()=>{
 const a=engine(4),b=engine(4);
 assert.deepEqual(a.state.map,b.state.map);
 assert.deepEqual([a.state.map.width,a.state.map.height],[3600,2400]);
 assert.equal(a.state.factions.length,4);
 assert.equal(a.state.buildings.filter(x=>x.kind==='town').length,4);
});

test('two-player online uses the original single-player world size and side placement',()=>{
 const e=engine(2),towns=e.state.buildings.filter(x=>x.kind==='town');
 assert.deepEqual([e.state.map.width,e.state.map.height],[2400,1600]);
 assert.deepEqual(towns.map(t=>[t.x,t.y]),[[420,760],[2000,760]]);
});

test('every faction starts with visible nearby food, wood and gold',()=>{
 const e=engine(2);for(const town of e.state.buildings.filter(x=>x.kind==='town'))for(const kind of ['food','wood','gold'] as const){const nearest=Math.min(...e.state.map.resources.filter(r=>r.kind===kind).map(r=>Math.hypot(r.x-town.x,r.y-town.y)));assert.ok(nearest<=430,`${kind} is too far from faction ${town.factionId}: ${nearest}`)}
});

test('ownership validation rejects moving an enemy unit',()=>{
 const e=engine(),enemy=e.state.units.find(x=>x.factionId===1)!;
 assert.deepEqual(e.command(0,{type:'MOVE',unitIds:[enemy.id],target:{x:500,y:500}}),{ok:false,reason:'INVALID_MOVE'});
});

test('house construction consumes resources and increases population only when complete',()=>{
 const e=engine(),f=e.state.factions[0],worker=e.state.units.find(x=>x.factionId===0)!,wood=f.wood;
 let result:{ok:boolean}={ok:false};for(const [x,y] of [[600,500],[520,650],[720,300],[360,650],[760,520]]){result=e.command(0,{type:'BUILD',builderIds:[worker.id],building:'house',x,y});if(result.ok)break}
 assert.equal(result.ok,true);assert.equal(f.wood,wood-80);assert.equal(f.popCap,10);
 for(let i=0;i<500;i++)e.tick(100);
 assert.equal(f.popCap,15);
});

test('other villagers can continue an unfinished building without paying twice',()=>{
 const e=engine(),workers=e.state.units.filter(x=>x.factionId===0&&x.kind==='villager'),f=e.state.factions[0];
 let placed=false;for(const [x,y] of [[600,500],[520,650],[720,300],[360,650]]){const result=e.command(0,{type:'BUILD',builderIds:[workers[0].id],building:'house',x,y});if(result.ok){placed=true;break}}
 assert.equal(placed,true);const building=e.state.buildings.find(x=>x.factionId===0&&x.kind==='house')!,wood=f.wood;
 assert.equal(e.command(0,{type:'CONTINUE_BUILD',builderIds:[workers[1].id,workers[2].id],buildingId:building.id}).ok,true);
 assert.equal(f.wood,wood);for(let i=0;i<350;i++)e.tick(100);assert.equal(building.progress,1);assert.equal(f.popCap,15);
});

test('training and research use faction resources and population',()=>{
 const e=engine(),f=e.state.factions[0],town=e.state.buildings.find(x=>x.factionId===0&&x.kind==='town')!;
 const before=e.state.units.length;assert.equal(e.command(0,{type:'TRAIN',buildingId:town.id,unit:'villager'}).ok,true);assert.equal(e.state.units.length,before+1);assert.equal(f.food,450);
 f.age=2;
 assert.equal(e.command(0,{type:'RESEARCH',buildingId:town.id,tech:'economy'}).ok,true);assert.equal(f.gatherBonus,.25);assert.equal(e.command(0,{type:'RESEARCH',buildingId:town.id,tech:'economy'}).ok,false);
});

test('server-side fog omits unseen enemy coordinates',()=>{
 const e=engine(4),enemy=e.state.units.find(x=>x.factionId===3)!;
 const view=e.visibleState(0);
 assert.equal(view.units.some(x=>x.id===enemy.id),false);
 assert.equal(JSON.stringify(view).includes(`\"id\":${enemy.id},\"factionId\":3`),false);
});

test('explored fog remains explored after a scout leaves',()=>{
 const e=engine(),scout=e.state.units.find(x=>x.factionId===0)!;scout.x=1200;scout.y=800;e.tick(100);const seen=new Set(e.visibleState(0).fog[0]);assert.ok(seen.has('10:6'));
 scout.x=360;scout.y=300;e.tick(100);assert.ok(new Set(e.visibleState(0).fog[0]).has('10:6'));
});

test('combat damages and destroys the enemy town, then declares a winner',()=>{
 const e=engine(),fighter=e.state.units.find(x=>x.factionId===0)!,town=e.state.buildings.find(x=>x.factionId===1&&x.kind==='town')!;fighter.kind='soldier';fighter.x=town.x+70;fighter.y=town.y;town.hp=10;
 assert.equal(e.command(0,{type:'ATTACK',unitIds:[fighter.id],targetId:town.id}).ok,true);e.tick(100);
 assert.equal(e.state.phase,'ended');assert.equal(e.state.winner,0);
});

test('a full match supports gathering, both buildings, age advancement, combat, victory and defeat',()=>{
 const e=engine(),f=e.state.factions[0],worker=e.state.units.find(x=>x.factionId===0&&x.kind==='villager')!,resource=e.state.map.resources[0];
 worker.x=resource.x;worker.y=resource.y;const gatheredBefore=f[resource.kind];
 assert.equal(e.command(0,{type:'GATHER',unitIds:[worker.id],targetId:resource.id}).ok,true);for(let i=0;i<300&&f[resource.kind]===gatheredBefore;i++)e.tick(100);assert.ok(f[resource.kind]>gatheredBefore,'gathering did not return resources to town');
 f.wood=1000;f.food=1000;f.gold=1000;
 const built=[] as Array<'house'|'barracks'>;for(const kind of ['house','barracks'] as const){let placed=false;for(let y=420;y<=1200&&!placed;y+=140)for(let x=300;x<=1100&&!placed;x+=140){if(e.command(0,{type:'BUILD',builderIds:[worker.id],building:kind,x,y}).ok){built.push(kind);placed=true;for(let i=0;i<300;i++)e.tick(100)}}}
 assert.deepEqual(built,['house','barracks']);assert.equal(f.popCap,15);
 const town=e.state.buildings.find(x=>x.factionId===0&&x.kind==='town')!;assert.equal(e.command(0,{type:'ADVANCE_AGE',buildingId:town.id}).ok,true);assert.equal(f.age,2);
 const barracks=e.state.buildings.find(x=>x.factionId===0&&x.kind==='barracks'&&x.progress===1)!;assert.equal(e.command(0,{type:'TRAIN',buildingId:barracks.id,unit:'soldier'}).ok,true);
 const fighter=e.state.units.find(x=>x.factionId===0&&x.kind==='soldier')!,enemyTown=e.state.buildings.find(x=>x.factionId===1&&x.kind==='town')!;fighter.x=enemyTown.x+70;fighter.y=enemyTown.y;enemyTown.hp=1;
 assert.equal(e.command(0,{type:'ATTACK',unitIds:[fighter.id],targetId:enemyTown.id}).ok,true);e.tick(100);assert.equal(e.state.phase,'ended');assert.equal(e.state.winner,0);assert.equal(e.state.factions[1].defeated,true);
});

for(const count of [2,3,4])test(`${count} active factions initialize independently`,()=>{const e=engine(count);for(let i=0;i<count;i++){assert.equal(e.state.units.filter(x=>x.factionId===i).length,5);assert.equal(e.state.buildings.filter(x=>x.factionId===i).length,1)}});

test('200 units tick without a fatal stall',()=>{
 const e=engine(4),template=e.state.units[0],units:UnitState[]=[];for(let faction=0;faction<4;faction++)for(let i=0;i<50;i++)units.push({...template,id:2000+faction*50+i,factionId:faction as FactionId,kind:'soldier',x:200+faction*550+(i%10)*31,y:500+Math.floor(i/10)*31,hp:120,maxHp:120,state:'idle',nextAttackAt:0});e.state.units=units;
 const started=performance.now();for(let i=0;i<100;i++)e.tick(100);const elapsed=performance.now()-started;
 assert.equal(e.state.units.length,200);assert.ok(elapsed<2000,`100 ticks took ${elapsed}ms`);
});

test('server pathing moves around a completed building instead of getting stuck in it',()=>{
 const e=engine(),unit=e.state.units.find(x=>x.factionId===0)!;unit.x=220;unit.y=300;
 const town=e.state.buildings.find(x=>x.factionId===0&&x.kind==='town')!;
 assert.equal(e.command(0,{type:'MOVE',unitIds:[unit.id],target:{x:520,y:300}}).ok,true);
 let closest=Infinity;for(let i=0;i<80;i++){e.tick(100);closest=Math.min(closest,Math.hypot(unit.x-town.x,unit.y-town.y))}
 assert.ok(closest>76,`unit entered town collision radius: ${closest}`);assert.ok(unit.x>470,`unit did not get around the town: ${unit.x}`);
});

test('idle soldiers automatically retaliate against a nearby enemy',()=>{
 const e=engine(),a=e.state.units.find(x=>x.factionId===0)!,b=e.state.units.find(x=>x.factionId===1)!;
 a.kind='soldier';a.hp=a.maxHp=120;b.kind='soldier';b.hp=b.maxHp=120;a.x=900;a.y=700;b.x=950;b.y=700;
 const before=b.hp;for(let i=0;i<12;i++)e.tick(100);assert.ok(b.hp<before,'nearby enemy was never attacked');
});

for(const kind of ['soldier','archer','cavalry'] as const){
 test(`${kind} attacks enemy units and buildings`,()=>{
  const e=engine(),attacker=e.state.units.find(x=>x.factionId===0)!,defender=e.state.units.find(x=>x.factionId===1)!,town=e.state.buildings.find(x=>x.factionId===1&&x.kind==='town')!;attacker.kind=kind;attacker.hp=attacker.maxHp=kind==='cavalry'?165:kind==='archer'?78:120;defender.x=900;defender.y=700;attacker.x=kind==='archer'?760:850;attacker.y=700;let before=defender.hp;assert.equal(e.command(0,{type:'ATTACK',unitIds:[attacker.id],targetId:defender.id}).ok,true);for(let i=0;i<20&&defender.hp===before;i++)e.tick(100);assert.ok(defender.hp<before,`${kind} did not damage a unit`);
  attacker.x=kind==='archer'?town.x-210:town.x-105;attacker.y=town.y;before=town.hp;assert.equal(e.command(0,{type:'ATTACK',unitIds:[attacker.id],targetId:town.id}).ok,true);for(let i=0;i<30&&town.hp===before;i++)e.tick(100);assert.ok(town.hp<before,`${kind} did not damage a building`);
 });
 test(`idle ${kind} automatically engages a nearby attacker`,()=>{
  const e=engine(),a=e.state.units.find(x=>x.factionId===0)!,b=e.state.units.find(x=>x.factionId===1)!;a.kind=kind;a.hp=a.maxHp=kind==='cavalry'?165:kind==='archer'?78:120;b.kind='soldier';b.hp=b.maxHp=120;a.x=900;a.y=700;b.x=kind==='archer'?1040:950;b.y=700;const before=b.hp;for(let i=0;i<20&&b.hp===before;i++)e.tick(100);assert.ok(b.hp<before,`${kind} did not auto-engage`);
 });
}

test('active movement orders survive a Durable Object snapshot restore',()=>{
 const e=engine(),unit=e.state.units.find(x=>x.factionId===0)!;
 assert.equal(e.command(0,{type:'MOVE',unitIds:[unit.id],target:{x:1000,y:900}}).ok,true);e.tick(100);
 const restored=GameEngine.restore(e.snapshot()),copy=restored.state.units.find(x=>x.id===unit.id)!,before={x:copy.x,y:copy.y};
 for(let i=0;i<10;i++)restored.tick(100);const after=restored.state.units.find(x=>x.id===unit.id)!;
 assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>20,'movement order was lost after restore');
});
