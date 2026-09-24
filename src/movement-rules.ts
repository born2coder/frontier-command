export interface SeparationOffset{ax:number;ay:number;bx:number;by:number}

export function separationOffsets(dx:number,dy:number,push:number,aMoving:boolean,bMoving:boolean,sameOwner:boolean,aId:number,bId:number):SeparationOffset{
  const distance=Math.max(.01,Math.hypot(dx,dy));
  const nx=dx/distance,ny=dy/distance;
  if(sameOwner&&aMoving&&bMoving){
    const side=((aId+bId)&1)?1:-1,px=-ny*push*side,py=nx*push*side;
    return{ax:px,ay:py,bx:-px,by:-py};
  }
  const aWeight=aMoving&&!bMoving?.15:!aMoving&&bMoving?.85:.5;
  const bWeight=1-aWeight;
  return{ax:-nx*push*aWeight*2,ay:-ny*push*aWeight*2,bx:nx*push*bWeight*2,by:ny*push*bWeight*2};
}
