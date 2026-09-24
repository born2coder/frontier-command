export function canContinueConstruction(owner:string,progress:number,clickDistance:number,buildingRadius:number){
  return owner==='player'&&progress<1&&clickDistance<buildingRadius+18;
}

export function isBuilderUnit(type:string){
  return type==='villager';
}

export function shouldResumeConstructionOnTap(owner:string,progress:number,selectedTypes:string[]){
  return owner==='player'&&progress<1&&selectedTypes.some(isBuilderUnit);
}
