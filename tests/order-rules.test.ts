import test from 'node:test';
import assert from 'node:assert/strict';
import {canContinueConstruction,isBuilderUnit,shouldResumeConstructionOnTap} from '../src/order-rules.ts';

test('an unfinished friendly building accepts more builders',()=>{
  assert.equal(canContinueConstruction('player',.45,30,46),true);
});

test('a completed building cannot receive a construction order',()=>{
  assert.equal(canContinueConstruction('player',1,30,46),false);
});

test('enemy buildings cannot receive player builders',()=>{
  assert.equal(canContinueConstruction('enemy',.45,30,46),false);
});

test('only villagers are assigned as builders',()=>{
  assert.equal(isBuilderUnit('villager'),true);
  assert.equal(isBuilderUnit('soldier'),false);
  assert.equal(isBuilderUnit('archer'),false);
  assert.equal(isBuilderUnit('cavalry'),false);
});

test('tapping an unfinished building keeps villager selection and issues construction',()=>{
  assert.equal(shouldResumeConstructionOnTap('player',.35,['villager']),true);
  assert.equal(shouldResumeConstructionOnTap('player',.35,['soldier']),false);
  assert.equal(shouldResumeConstructionOnTap('player',1,['villager']),false);
});
