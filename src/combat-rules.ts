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
