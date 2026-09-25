export class SeededRandom{
 private state:number;
 constructor(seed:number){this.state=seed>>>0||0x9e3779b9}
 next(){let x=this.state;x^=x<<13;x^=x>>>17;x^=x<<5;this.state=x>>>0;return this.state/4294967296}
 between(min:number,max:number){return min+this.next()*(max-min)}
 pick<T>(values:T[]){return values[Math.floor(this.next()*values.length)]}
}
