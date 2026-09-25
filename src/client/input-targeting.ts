import type {BuildingState,FactionId,GameState,Point,ResourceState,UnitState} from '../shared/protocol';

export type TapTarget=
 | {type:'own-unit';value:UnitState}
 | {type:'enemy-unit';value:UnitState}
 | {type:'resource';value:ResourceState}
 | {type:'building';value:BuildingState};

const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
const nearest=<T extends Point>(items:T[],point:Point)=>[...items].sort((a,b)=>distance(a,point)-distance(b,point))[0];

export function pickTapTarget(state:GameState,you:FactionId,point:Point,zoom:number,hasSelectedVillager:boolean):TapTarget|undefined{
 const own=nearest(state.units.filter(u=>u.factionId===you),point);
 if(own&&distance(own,point)<=34/zoom)return{type:'own-unit',value:own};
 const resource=nearest(state.map.resources,point);
 if(hasSelectedVillager&&resource&&distance(resource,point)<=42/zoom)return{type:'resource',value:resource};
 const enemy=nearest(state.units.filter(u=>u.factionId!==you),point);
 if(enemy&&distance(enemy,point)<=34/zoom)return{type:'enemy-unit',value:enemy};
 const building=nearest(state.buildings,point);
 if(building){const radius=building.kind==='town'?68:building.kind==='barracks'?56:42;if(distance(building,point)<=radius+14/zoom)return{type:'building',value:building}}
 return undefined;
}
