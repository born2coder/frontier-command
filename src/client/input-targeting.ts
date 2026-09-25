import type {BuildingState,FactionId,GameState,Point,ResourceState,UnitState} from '../shared/protocol';

export type TapTarget=
 | {type:'own-unit';value:UnitState}
 | {type:'enemy-unit';value:UnitState}
 | {type:'resource';value:ResourceState}
 | {type:'building';value:BuildingState};

const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
const nearest=<T extends Point>(items:T[],point:Point)=>[...items].sort((a,b)=>distance(a,point)-distance(b,point))[0];

export function pickTapTarget(state:GameState,you:FactionId,point:Point,zoom:number,hasSelectedVillager:boolean,hasSelectedUnits=false):TapTarget|undefined{
 const own=nearest(state.units.filter(u=>u.factionId===you),point);
 const enemy=nearest(state.units.filter(u=>u.factionId!==you),point);
 const ownDistance=own?distance(own,point):Infinity,enemyDistance=enemy?distance(enemy,point):Infinity;
 if(hasSelectedUnits&&enemy&&enemyDistance<=44/zoom)return{type:'enemy-unit',value:enemy};
 if(own&&ownDistance<=30/zoom&&ownDistance<=enemyDistance)return{type:'own-unit',value:own};
 if(enemy&&enemyDistance<=38/zoom)return{type:'enemy-unit',value:enemy};
 const resource=nearest(state.map.resources.filter(r=>r.amount>0),point);
 if(hasSelectedVillager&&resource&&distance(resource,point)<=42/zoom)return{type:'resource',value:resource};
 const building=nearest(state.buildings,point);
 if(building){const radius=building.kind==='town'?68:building.kind==='barracks'?56:42;if(distance(building,point)<=radius+14/zoom)return{type:'building',value:building}}
 return undefined;
}
