import type {FactionId,GameCommand,ResourceKind,UnitState} from '../shared/protocol.ts';
import {GameEngine} from '../engine/game-engine.ts';

export class CpuController{
 private nextThink=0;
 factionId:FactionId;
 constructor(factionId:FactionId){this.factionId=factionId}
 update(engine:GameEngine){
  const s=engine.state;
  if(s.timeMs<this.nextThink||s.phase!=='playing'||s.factions.find(f=>f.id===this.factionId)!.defeated)return;
  this.nextThink=s.timeMs+1200;
  const f=s.factions.find(f=>f.id===this.factionId)!,workers=s.units.filter(u=>u.factionId===this.factionId&&u.kind==='villager'),army=s.units.filter(u=>u.factionId===this.factionId&&u.kind!=='villager'),town=s.buildings.find(b=>b.factionId===this.factionId&&b.kind==='town'),queued=s.buildings.filter(b=>b.factionId===this.factionId).flatMap(b=>b.trainingQueue??[]),unfinished=s.buildings.filter(b=>b.factionId===this.factionId&&b.progress<1),barracks=s.buildings.find(b=>b.factionId===this.factionId&&b.kind==='barracks'&&b.progress>=1),anyBarracks=s.buildings.some(b=>b.factionId===this.factionId&&b.kind==='barracks');
  const builders=new Set<UnitState>();
  for(const building of unfinished){const builder=[...workers].sort((a,b)=>Math.hypot(a.x-building.x,a.y-building.y)-Math.hypot(b.x-building.x,b.y-building.y))[0];if(builder){builders.add(builder);this.send(engine,{type:'CONTINUE_BUILD',builderIds:[builder.id],buildingId:building.id})}}
  for(const worker of workers.filter(w=>!builders.has(w))){const kind:ResourceKind=f.food<250?'food':f.wood<220?'wood':'gold',r=s.map.resources.filter(x=>x.kind===kind&&x.amount>0).sort((a,b)=>Math.hypot(a.x-worker.x,a.y-worker.y)-Math.hypot(b.x-worker.x,b.y-worker.y))[0];if(r)this.send(engine,{type:'GATHER',unitIds:[worker.id],targetId:r.id})}
  const reserved=queued.length,current=s.units.filter(u=>u.factionId===this.factionId).length;
  if(town&&workers.length+queued.filter(x=>x.kind==='villager').length<8&&current+reserved<f.popCap)this.send(engine,{type:'TRAIN',buildingId:town.id,unit:'villager'});
  if(f.popCap-current-reserved<3&&f.wood>=80&&workers[0]&&!unfinished.some(b=>b.kind==='house')){const p=this.site(engine,'house',town!);if(p)this.send(engine,{type:'BUILD',builderIds:[workers[0].id],building:'house',...p})}
  if(!anyBarracks&&f.wood>=140&&workers[1]){const p=this.site(engine,'barracks',town!);if(p)this.send(engine,{type:'BUILD',builderIds:[workers[1].id],building:'barracks',...p})}
  if(barracks&&army.length+queued.filter(x=>x.kind!=='villager').length<12)this.send(engine,{type:'TRAIN',buildingId:barracks.id,unit:f.age>=2?'archer':'soldier'});
  if(army.length>=2){const enemies=[...s.units,...s.buildings].filter(x=>x.factionId!==this.factionId&&!s.factions.find(f=>f.id===x.factionId)?.defeated),target=enemies.sort((a,b)=>Math.hypot(a.x-army[0].x,a.y-army[0].y)-Math.hypot(b.x-army[0].x,b.y-army[0].y))[0];if(target)this.send(engine,{type:'ATTACK',unitIds:army.map(x=>x.id),targetId:target.id})}
 }
 private site(engine:GameEngine,kind:'house'|'barracks',town:{x:number;y:number}){for(let ring=0;ring<4;ring++)for(let i=0;i<12;i++){const a=i*Math.PI/6,d=190+ring*75,x=town.x+Math.cos(a)*d,y=town.y+Math.sin(a)*d;if(engine.canBuildAt(kind,x,y))return{x,y}}}
 private send(engine:GameEngine,command:GameCommand){engine.command(this.factionId,command)}
}
