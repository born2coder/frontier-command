import test from 'node:test';
import assert from 'node:assert/strict';
import {attackReach,combatSlotOffset,combatStandDistance,contactDistance,shouldRepathCombat,shouldTakeContactTarget} from '../src/combat-rules.ts';

test('melee units can attack while their bodies remain separated',()=>{
  const reach=attackReach(38,17);
  const bodyDistance=17+17+4;
  assert.ok(reach>=bodyDistance);
  assert.ok(combatStandDistance(17,17,reach)<=reach);
});

test('cavalry can attack infantry without overlapping it',()=>{
  const reach=attackReach(42,17);
  assert.ok(reach>=24+17+4);
  assert.ok(combatStandDistance(24,17,reach)<=reach);
});

test('archers stop inside their real firing range',()=>{
  const reach=attackReach(155,17);
  assert.equal(reach,172);
  assert.equal(combatStandDistance(17,17,reach),167);
});

test('physical contact is always inside melee attack reach',()=>{
  const contact=contactDistance(17,17);
  assert.ok(contact>=38);
  assert.ok(attackReach(38,17)>=17+17+4);
});

test('a nearby enemy replaces a distant or dead target',()=>{
  assert.equal(shouldTakeContactTarget(true,240,55,false),true);
  assert.equal(shouldTakeContactTarget(false,0,55,false),true);
});

test('a unit keeps an enemy it is already fighting',()=>{
  assert.equal(shouldTakeContactTarget(true,50,55,false),false);
  assert.equal(shouldTakeContactTarget(true,50,55,true),false);
});

test('attackers receive stable distributed approach slots',()=>{
  const offsets=new Set(Array.from({length:8},(_,i)=>combatSlotOffset(i+1,50)));
  assert.ok(offsets.size>=7);
  assert.equal(combatSlotOffset(4,50),combatSlotOffset(4,50));
});

test('combat paths survive unless the target has actually moved',()=>{
  assert.equal(shouldRepathCombat(true,0),false);
  assert.equal(shouldRepathCombat(true,37),false);
  assert.equal(shouldRepathCombat(true,39),true);
  assert.equal(shouldRepathCombat(false,0),true);
});
