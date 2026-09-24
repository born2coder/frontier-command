export interface Point { x:number; y:number }

export class GridPathfinder {
  readonly cols:number;
  readonly rows:number;
  readonly width:number;
  readonly height:number;
  readonly cell:number;
  private blocked:(x:number,y:number)=>boolean;

  constructor(
    width:number,
    height:number,
    cell:number,
    blocked:(x:number,y:number)=>boolean,
  ) {
    this.width=width;
    this.height=height;
    this.cell=cell;
    this.blocked=blocked;
    this.cols=Math.ceil(width/cell);
    this.rows=Math.ceil(height/cell);
  }

  private key(x:number,y:number){return y*this.cols+x}
  private world(x:number,y:number):Point{return{x:(x+.5)*this.cell,y:(y+.5)*this.cell}}
  private cellOf(x:number,y:number){return{x:Math.max(0,Math.min(this.cols-1,Math.floor(x/this.cell))),y:Math.max(0,Math.min(this.rows-1,Math.floor(y/this.cell)))}}
  private cellBlocked(x:number,y:number){if(x<0||y<0||x>=this.cols||y>=this.rows)return true;const p=this.world(x,y);return this.blocked(p.x,p.y)}

  nearestOpen(x:number,y:number,maxRadius=7):Point|undefined{
    const start=this.cellOf(x,y);
    if(!this.cellBlocked(start.x,start.y))return this.world(start.x,start.y);
    for(let r=1;r<=maxRadius;r++)for(let oy=-r;oy<=r;oy++)for(let ox=-r;ox<=r;ox++){
      if(Math.max(Math.abs(ox),Math.abs(oy))!==r)continue;
      const cx=start.x+ox,cy=start.y+oy;
      if(!this.cellBlocked(cx,cy))return this.world(cx,cy);
    }
  }

  find(sx:number,sy:number,gx:number,gy:number):Point[]{
    const s=this.cellOf(sx,sy),rawGoal=this.nearestOpen(gx,gy),g=rawGoal?this.cellOf(rawGoal.x,rawGoal.y):undefined;
    if(!g)return[];
    const startKey=this.key(s.x,s.y),goalKey=this.key(g.x,g.y);
    if(startKey===goalKey)return[{x:gx,y:gy}];
    const open:number[]=[startKey],openSet=new Set(open),came=new Map<number,number>(),gScore=new Map<number,number>([[startKey,0]]),fScore=new Map<number,number>([[startKey,Math.hypot(g.x-s.x,g.y-s.y)]]);
    const dirs=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
    let guard=0;
    while(open.length&&guard++<this.cols*this.rows*2){
      let bestIndex=0;
      for(let i=1;i<open.length;i++)if((fScore.get(open[i])??Infinity)<(fScore.get(open[bestIndex])??Infinity))bestIndex=i;
      const current=open.splice(bestIndex,1)[0];openSet.delete(current);
      if(current===goalKey){
        const cells=[current];let cursor=current;
        while(came.has(cursor)){cursor=came.get(cursor)!;cells.push(cursor)}
        cells.reverse();
        const path=cells.slice(1).map(k=>this.world(k%this.cols,Math.floor(k/this.cols)));
        if(path.length)path[path.length-1]={x:gx,y:gy};
        return this.simplify(path);
      }
      const cx=current%this.cols,cy=Math.floor(current/this.cols);
      for(const [dx,dy,cost] of dirs){
        const nx=cx+dx,ny=cy+dy;
        if(this.cellBlocked(nx,ny))continue;
        if(dx&&dy&&(this.cellBlocked(cx+dx,cy)||this.cellBlocked(cx,cy+dy)))continue;
        const next=this.key(nx,ny),tentative=(gScore.get(current)??Infinity)+cost;
        if(tentative>=(gScore.get(next)??Infinity))continue;
        came.set(next,current);gScore.set(next,tentative);fScore.set(next,tentative+Math.hypot(g.x-nx,g.y-ny));
        if(!openSet.has(next)){open.push(next);openSet.add(next)}
      }
    }
    return[];
  }

  private simplify(path:Point[]){
    if(path.length<3)return path;
    const result=[path[0]];
    let lastDx=0,lastDy=0;
    for(let i=1;i<path.length;i++){
      const prev=path[i-1],cur=path[i],dx=Math.sign(cur.x-prev.x),dy=Math.sign(cur.y-prev.y);
      if(i>1&&(dx!==lastDx||dy!==lastDy))result.push(prev);
      lastDx=dx;lastDy=dy;
    }
    result.push(path[path.length-1]);return result;
  }
}
