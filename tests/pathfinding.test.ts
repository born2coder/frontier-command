import test from 'node:test';
import assert from 'node:assert/strict';
import {GridPathfinder} from '../src/pathfinding.ts';

test('pathfinding preserves an exact valid interaction point beside a large building',()=>{
  const building={x:600,y:600,radius:80};
  const blocked=(x:number,y:number)=>Math.hypot(x-building.x,y-building.y)<building.radius;
  const pathfinder=new GridPathfinder(1200,1200,60,blocked);
  const goal={x:building.x-102,y:building.y};
  const path=pathfinder.find(250,600,goal.x,goal.y);
  assert.ok(path.length>0);
  assert.deepEqual(path.at(-1),goal);
  assert.equal(blocked(goal.x,goal.y),false);
});
