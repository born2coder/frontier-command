export function attackReach(baseRange:number,targetRadius:number){
  return baseRange+targetRadius;
}

export function contactDistance(attackerRadius:number,targetRadius:number){
  return attackerRadius+targetRadius+28;
}

export function combatStandDistance(attackerRadius:number,targetRadius:number,reach:number){
  return Math.max(attackerRadius+targetRadius+4,reach-5);
}

export function shouldTakeContactTarget(currentIsAlive:boolean,currentDistance:number,currentReach:number,isSameTarget:boolean){
  if(isSameTarget)return false;
  return !currentIsAlive||currentDistance>currentReach+8;
}

export function combatSlotOffset(attackerId:number,targetId:number){
  const slots=[0,-1,1,-2,2,-3,3,-4,4];
  return slots[(attackerId*7+targetId*3)%slots.length]*Math.PI/12;
}

export function shouldRepathCombat(hasPath:boolean,targetMoved:number){
  return !hasPath||targetMoved>38;
}
