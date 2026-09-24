import test from 'node:test';
import assert from 'node:assert/strict';
import {avoidanceTurns,separationOffsets} from '../src/movement-rules.ts';

test('moving friendly units separate radially without an orbiting force',()=>{
  const offset=separationOffsets(20,0,8,true,true,true,1,2);
  assert.ok(offset.ax<0);
  assert.ok(offset.bx>0);
  assert.equal(Math.abs(offset.ay),0);
  assert.equal(Math.abs(offset.by),0);
});

test('an idle friendly yields most of the space to a moving unit',()=>{
  const offset=separationOffsets(20,0,10,true,false,true,1,2);
  assert.ok(Math.abs(offset.ax)<Math.abs(offset.bx));
});

test('enemy units remain physically separated',()=>{
  const offset=separationOffsets(20,0,10,true,true,false,1,2);
  assert.ok(offset.ax<0);
  assert.ok(offset.bx>0);
});

test('opposing friendly traffic continues past each other without a head-on deadlock',()=>{
  const a={x:-30,y:-5},b={x:30,y:5};
  for(let frame=0;frame<30;frame++){
    a.x+=3;b.x-=3;
    const dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy),minimum=36;
    if(dist<minimum){
      const offset=separationOffsets(dx,dy,(minimum-Math.max(dist,.01))/2+.15,true,true,true,1,2);
      a.x+=offset.ax;a.y+=offset.ay;b.x+=offset.bx;b.y+=offset.by;
    }
  }
  assert.ok(a.x>20);
  assert.ok(b.x< -20);
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>36);
});

test('repeated overlap correction does not rotate a pair around each other',()=>{
  const a={x:0,y:0},b={x:10,y:4};
  const initialAngle=Math.atan2(b.y-a.y,b.x-a.x);
  for(let frame=0;frame<20;frame++){
    const dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy);
    if(dist>=38)break;
    const offset=separationOffsets(dx,dy,(38-dist)/2+.15,true,true,true,3,7);
    a.x+=offset.ax;a.y+=offset.ay;b.x+=offset.bx;b.y+=offset.by;
  }
  const finalAngle=Math.atan2(b.y-a.y,b.x-a.x);
  assert.ok(Math.abs(finalAngle-initialAngle)<1e-10);
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=38);
});

test('a blocked unit keeps the same preferred avoidance side',()=>{
  const first=avoidanceTurns(12,27);
  const second=avoidanceTurns(12,27);
  assert.deepEqual(first,second);
  assert.equal(Math.abs(first[0]),Math.PI/2);
  assert.equal(first[0],-first[1]);
});

test('opposite unit pairs do not all choose one global side',()=>{
  assert.notEqual(avoidanceTurns(2,7)[0],avoidanceTurns(3,7)[0]);
});
