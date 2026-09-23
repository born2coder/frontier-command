import Phaser from 'phaser';
import './style.css';

type Kind = 'villager' | 'soldier' | 'enemy';
type ResourceKind = 'wood' | 'food' | 'gold';
type BuildingKind = 'town' | 'house' | 'barracks';

interface Unit { id:number; kind:Kind; x:number; y:number; hp:number; maxHp:number; speed:number; damage:number; range:number; selected:boolean; target?:{x:number;y:number}; gather?:ResourceNode; attack?:Unit; build?:Building; shape:Phaser.GameObjects.Arc; ring:Phaser.GameObjects.Arc; hpBar:Phaser.GameObjects.Rectangle; }
interface ResourceNode { id:number; kind:ResourceKind; x:number; y:number; amount:number; shape:Phaser.GameObjects.Shape; label:Phaser.GameObjects.Text; }
interface Building { id:number; kind:BuildingKind; x:number; y:number; hp:number; maxHp:number; progress:number; shape:Phaser.GameObjects.Rectangle; label:Phaser.GameObjects.Text; }

const WORLD_W=2400, WORLD_H=1600, UI_TOP=58;
const state={wood:240,food:180,gold:120,popCap:10};

document.querySelector<HTMLDivElement>('#app')!.innerHTML=`
<div id="topbar"><div class="brand">FRONTIER COMMAND</div><div class="res wood"><i></i>木 <span id="wood">0</span></div><div class="res food"><i></i>食 <span id="food">0</span></div><div class="res gold"><i></i>金 <span id="gold">0</span></div><div class="res pop"><i></i>人口 <span id="pop">0</span></div></div>
<div id="help">左ドラッグ：範囲選択<br>右クリック：移動 / 採集 / 攻撃<br>WASD・画面端：カメラ移動　ホイール：拡大縮小</div>
<div id="objective"><strong>目標</strong><span id="goal">兵舎を建て、兵士を生産して敵を倒す</span></div><div id="status"></div>
<div id="actions"><button id="house">家を建てる<small>木材 80 / 人口 +5</small></button><button id="barracks">兵舎を建てる<small>木材 140</small></button><button id="train">兵士を生産<small>食料 60・金 30</small></button></div>`;

class GameScene extends Phaser.Scene {
  units:Unit[]=[]; resources:ResourceNode[]=[]; buildings:Building[]=[]; fog:Phaser.GameObjects.Rectangle[]=[];
  nextId=1; selectStart?:Phaser.Math.Vector2; selectBox?:Phaser.GameObjects.Rectangle; placing?:BuildingKind;
  keys!:Record<string,Phaser.Input.Keyboard.Key>; lastFog=0; lastAi=0; result=''; statusTimer?:number;

  create(){
    this.cameras.main.setBounds(0,0,WORLD_W,WORLD_H).setZoom(.85).centerOn(550,760);
    this.input.mouse?.disableContextMenu(); this.drawMap();
    this.addBuilding('town',420,760,1);
    [[500,700],[505,760],[500,820],[565,735],[565,795]].forEach(p=>this.addUnit('villager',p[0],p[1]));
    for(let i=0;i<18;i++)this.addResource('wood',700+Math.random()*850,170+Math.random()*400);
    for(let i=0;i<12;i++)this.addResource('food',680+Math.random()*750,850+Math.random()*500);
    for(let i=0;i<10;i++)this.addResource('gold',1250+Math.random()*580,600+Math.random()*650);
    [[1920,620],[2010,700],[1940,790],[2100,740],[2050,870]].forEach(p=>this.addUnit('enemy',p[0],p[1]));
    this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<string,Phaser.Input.Keyboard.Key>;
    this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>this.onDown(p)); this.input.on('pointermove',(p:Phaser.Input.Pointer)=>this.onMove(p)); this.input.on('pointerup',(p:Phaser.Input.Pointer)=>this.onUp(p));
    this.input.on('wheel',(_p:Phaser.Input.Pointer,_o:unknown,_dx:number,dy:number)=>this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom-dy*.0005,.55,1.25)));
    document.querySelector('#house')!.addEventListener('click',()=>this.beginPlace('house'));
    document.querySelector('#barracks')!.addEventListener('click',()=>this.beginPlace('barracks'));
    document.querySelector('#train')!.addEventListener('click',()=>this.train());
    this.createFog(); this.refreshUi();
  }

  drawMap(){
    this.add.rectangle(WORLD_W/2,WORLD_H/2,WORLD_W,WORLD_H,0x75875d).setDepth(-20);
    const g=this.add.graphics().setDepth(-19); g.fillStyle(0x687b55,.7);
    for(let i=0;i<220;i++)g.fillCircle(Math.random()*WORLD_W,Math.random()*WORLD_H,2+Math.random()*7);
    g.fillStyle(0x365f66,.9); g.fillEllipse(1160,780,520,170); g.fillEllipse(1500,450,300,110);
    g.lineStyle(5,0xb69b68,.55); const path=new Phaser.Curves.Path(0,1150); path.splineTo([new Phaser.Math.Vector2(400,1050),new Phaser.Math.Vector2(900,1120),new Phaser.Math.Vector2(1400,980),new Phaser.Math.Vector2(1900,1080),new Phaser.Math.Vector2(2400,900)]); path.draw(g,64);
  }

  addUnit(kind:Kind,x:number,y:number){
    const enemy=kind==='enemy', soldier=kind==='soldier'; const color=enemy?0xa64038:soldier?0x4e78a6:0xd9b878;
    const ring=this.add.circle(x,y,soldier?18:16).setStrokeStyle(2,0xf2d66d).setVisible(false).setDepth(9);
    const shape=this.add.circle(x,y,soldier?13:11,color).setStrokeStyle(2,enemy?0x54201e:0x263126).setDepth(10);
    const hp=this.add.rectangle(x,y-20,28,3,0x56c65e).setOrigin(0,.5).setDepth(11).setVisible(enemy||soldier);
    this.units.push({id:this.nextId++,kind,x,y,hp:soldier?110:enemy?95:70,maxHp:soldier?110:enemy?95:70,speed:soldier?105:enemy?72:88,damage:soldier?18:enemy?10:3,range:soldier?38:enemy?34:22,selected:false,shape,ring,hpBar:hp});
  }
  addResource(kind:ResourceKind,x:number,y:number){
    const color=kind==='wood'?0x315d35:kind==='food'?0xa9483d:0xc9a43d;
    const shape=kind==='wood'?this.add.star(x,y,7,12,25,color):this.add.circle(x,y,kind==='gold'?20:16,color); shape.setStrokeStyle(2,0x263425).setDepth(3);
    const label=this.add.text(x,y+24,kind==='wood'?'木':kind==='food'?'食':'金',{fontSize:'11px',color:'#f1e8cf',backgroundColor:'#1118',padding:{x:3,y:1}}).setOrigin(.5,0).setDepth(4);
    this.resources.push({id:this.nextId++,kind,x,y,amount:kind==='wood'?420:300,shape,label});
  }
  addBuilding(kind:BuildingKind,x:number,y:number,progress=0){
    const size=kind==='town'?120:kind==='barracks'?100:74, color=kind==='town'?0x8b7651:kind==='house'?0xb18b5a:0x6f6658;
    const shape=this.add.rectangle(x,y,size,size*.72,color,progress<1?.38:1).setStrokeStyle(3,0x3c3023).setDepth(5);
    const names={town:'町の中心',house:'家',barracks:'兵舎'}; const label=this.add.text(x,y,names[kind],{fontSize:'13px',fontStyle:'bold',color:'#fff4d3',stroke:'#201a13',strokeThickness:3}).setOrigin(.5).setDepth(6);
    const building={id:this.nextId++,kind,x,y,hp:progress<1?1:500,maxHp:500,progress,shape,label};
    this.buildings.push(building); return building;
  }
  createFog(){
    for(let y=60;y<WORLD_H;y+=100)for(let x=50;x<WORLD_W;x+=100)this.fog.push(this.add.rectangle(x,y,102,102,0x080c09,.91).setDepth(50));
  }
  screenWorld(p:Phaser.Input.Pointer){return new Phaser.Math.Vector2(p.worldX,p.worldY)}
  onDown(p:Phaser.Input.Pointer){
    if(p.y<UI_TOP)return; const w=this.screenWorld(p);
    if(p.rightButtonDown()){this.command(w.x,w.y);return}
    if(this.placing){this.place(w.x,w.y);return}
    this.selectStart=w; this.selectBox=this.add.rectangle(w.x,w.y,1,1,0x8fb7d0,.18).setStrokeStyle(2,0xd3e9f5).setOrigin(0).setDepth(45);
  }
  onMove(p:Phaser.Input.Pointer){if(!this.selectStart||!this.selectBox)return; const w=this.screenWorld(p),x=Math.min(w.x,this.selectStart.x),y=Math.min(w.y,this.selectStart.y); this.selectBox.setPosition(x,y).setSize(Math.abs(w.x-this.selectStart.x),Math.abs(w.y-this.selectStart.y));}
  onUp(p:Phaser.Input.Pointer){
    if(!this.selectStart)return; const w=this.screenWorld(p), d=Phaser.Math.Distance.Between(w.x,w.y,this.selectStart.x,this.selectStart.y);
    this.units.filter(u=>u.kind!=='enemy').forEach(u=>{u.selected=d<8?Phaser.Math.Distance.Between(u.x,u.y,w.x,w.y)<24:u.x>=Math.min(w.x,this.selectStart!.x)&&u.x<=Math.max(w.x,this.selectStart!.x)&&u.y>=Math.min(w.y,this.selectStart!.y)&&u.y<=Math.max(w.y,this.selectStart!.y);u.ring.setVisible(u.selected)});
    this.selectStart=undefined;this.selectBox?.destroy();this.selectBox=undefined;
  }
  command(x:number,y:number){
    const selected=this.units.filter(u=>u.selected&&u.kind!=='enemy'); if(!selected.length)return;
    const enemy=this.units.find(u=>u.kind==='enemy'&&Phaser.Math.Distance.Between(u.x,u.y,x,y)<30);
    const res=this.resources.find(r=>Phaser.Math.Distance.Between(r.x,r.y,x,y)<35);
    selected.forEach((u,i)=>{u.build=undefined;u.attack=enemy;u.gather=u.kind==='villager'?res:undefined; const t=enemy??res; u.target=t?{x:t.x,y:t.y}:{x:x+(i%3)*24,y:y+Math.floor(i/3)*24};});
    this.say(enemy?'敵を攻撃します':res?`${res.kind==='wood'?'木材':res.kind==='food'?'食料':'金'}を採集します`:'移動します');
  }
  beginPlace(kind:BuildingKind){const cost=kind==='house'?80:140;if(state.wood<cost){this.say('木材が足りません');return}if(!this.units.some(u=>u.selected&&u.kind==='villager')){this.say('建設する村人を選択してください');return}this.placing=kind;this.say('建設場所を左クリックしてください');}
  place(x:number,y:number){const kind=this.placing!;const cost=kind==='house'?80:140;if(x<80||y<100||x>WORLD_W-80||y>WORLD_H-80)return;state.wood-=cost;const building=this.addBuilding(kind,x,y,0);const builders=this.units.filter(u=>u.selected&&u.kind==='villager');builders.forEach((u,i)=>{u.attack=undefined;u.gather=undefined;u.build=building;u.target={x:x+((i%3)-1)*24,y:y+55+Math.floor(i/3)*22};});this.placing=undefined;this.refreshUi();this.say(`${kind==='house'?'家':'兵舎'}の建設を開始します`);}
  train(){const barracks=this.buildings.find(b=>b.kind==='barracks'&&b.progress>=1);if(!barracks){this.say('完成した兵舎が必要です');return}if(state.food<60||state.gold<30){this.say('食料または金が足りません');return}if(this.units.filter(u=>u.kind!=='enemy').length>=state.popCap){this.say('人口上限です。家を建ててください');return}state.food-=60;state.gold-=30;this.refreshUi();this.say('兵士を訓練中…');this.time.delayedCall(2300,()=>{this.addUnit('soldier',barracks.x+70,barracks.y+40);this.refreshUi();this.say('兵士が完成しました');});}
  say(message:string){const el=document.querySelector<HTMLElement>('#status')!;el.textContent=message;el.style.opacity='1';if(this.statusTimer)clearTimeout(this.statusTimer);this.statusTimer=window.setTimeout(()=>el.style.opacity='0',1800);}
  refreshUi(){(document.querySelector('#wood')!).textContent=Math.floor(state.wood)+'';(document.querySelector('#food')!).textContent=Math.floor(state.food)+'';(document.querySelector('#gold')!).textContent=Math.floor(state.gold)+'';(document.querySelector('#pop')!).textContent=`${this.units.filter(u=>u.kind!=='enemy').length} / ${state.popCap}`;}

  update(time:number,delta:number){
    if(this.result)return; const dt=delta/1000; this.moveCamera(dt); this.updateBuildings(dt); this.updateUnits(time,dt);
    if(time-this.lastFog>240){this.updateFog();this.lastFog=time}if(time-this.lastAi>1700){this.enemyAi();this.lastAi=time}
    const enemies=this.units.filter(u=>u.kind==='enemy').length;if(!enemies){this.finish('勝利！ 辺境の敵をすべて倒しました')}else if(!this.units.some(u=>u.kind!=='enemy'))this.finish('敗北 — 集落を守れませんでした');
    this.refreshUi();
  }
  moveCamera(dt:number){const c=this.cameras.main,p=this.input.activePointer,s=520*dt/c.zoom;let dx=0,dy=0;if(this.keys.A.isDown||this.keys.LEFT.isDown||p.x<8)dx=-s;if(this.keys.D.isDown||this.keys.RIGHT.isDown||p.x>this.scale.width-8)dx=s;if(this.keys.W.isDown||this.keys.UP.isDown||p.y<UI_TOP+4)dy=-s;if(this.keys.S.isDown||this.keys.DOWN.isDown||p.y>this.scale.height-8)dy=s;c.scrollX+=dx;c.scrollY+=dy;}
  updateBuildings(dt:number){for(const b of this.buildings){if(b.progress>=1)continue;const builders=this.units.filter(u=>u.kind==='villager'&&u.build===b&&Phaser.Math.Distance.Between(u.x,u.y,b.x,b.y)<85);if(builders.length){b.progress=Math.min(1,b.progress+dt*.18*Math.min(builders.length,3));b.hp=b.maxHp*b.progress;b.shape.setAlpha(.38+.62*b.progress);b.label.setText(`${b.kind==='house'?'家':'兵舎'} ${Math.floor(b.progress*100)}%`);if(b.progress>=1){b.label.setText(b.kind==='house'?'家':'兵舎');if(b.kind==='house')state.popCap+=5;for(const u of this.units)if(u.build===b){u.build=undefined;u.target=undefined}this.refreshUi();this.say(`${b.kind==='house'?'家':'兵舎'}が完成しました。${b.kind==='house'?'人口上限 +5':''}`)}}}}
  updateUnits(time:number,dt:number){
    for(const u of [...this.units]){
      if(u.attack&&!this.units.includes(u.attack)){u.attack=undefined;u.target=undefined}
      const target=u.attack??u.gather; if(target)u.target={x:target.x,y:target.y};
      if(u.target){const dist=Phaser.Math.Distance.Between(u.x,u.y,u.target.x,u.target.y);const stop=target?(u.attack?u.range:30):4;if(dist>stop){const a=Phaser.Math.Angle.Between(u.x,u.y,u.target.x,u.target.y);u.x+=Math.cos(a)*u.speed*dt;u.y+=Math.sin(a)*u.speed*dt}else if(!target)u.target=undefined;}
      if(u.gather&&Phaser.Math.Distance.Between(u.x,u.y,u.gather.x,u.gather.y)<34){const qty=10*dt;u.gather.amount-=qty;state[u.gather.kind]+=qty;if(u.gather.amount<=0){u.gather.shape.destroy();u.gather.label.destroy();this.resources=this.resources.filter(r=>r!==u.gather);u.gather=undefined;u.target=undefined}}
      if(u.attack&&Phaser.Math.Distance.Between(u.x,u.y,u.attack.x,u.attack.y)<=u.range&&time%(u.kind==='villager'?900:650)<35){u.attack.hp-=u.damage;if(u.attack.hp<=0)this.removeUnit(u.attack)}
      u.shape.setPosition(u.x,u.y);u.ring.setPosition(u.x,u.y);u.hpBar.setPosition(u.x-14,u.y-20).setScale(Math.max(0,u.hp/u.maxHp),1);
    }
  }
  removeUnit(u:Unit){u.shape.destroy();u.ring.destroy();u.hpBar.destroy();this.units=this.units.filter(x=>x!==u);for(const x of this.units)if(x.attack===u){x.attack=undefined;x.target=undefined}}
  enemyAi(){for(const e of this.units.filter(u=>u.kind==='enemy')){if(e.attack)return;let closest:Unit|undefined,dist=Infinity;for(const u of this.units.filter(u=>u.kind!=='enemy')){const d=Phaser.Math.Distance.Between(e.x,e.y,u.x,u.y);if(d<dist){dist=d;closest=u}}if(closest&&dist<520){e.attack=closest;e.target={x:closest.x,y:closest.y}}}}
  updateFog(){const visible=[...this.units.filter(u=>u.kind!=='enemy'),...this.buildings.filter(b=>b.progress>=1)];for(const f of this.fog){let d=Infinity;for(const v of visible)d=Math.min(d,Phaser.Math.Distance.Between(f.x,f.y,v.x,v.y));f.setAlpha(d<230?0:d<330?.5:.91);f.setVisible(f.alpha>.02)}}
  finish(text:string){this.result=text;document.querySelector('#goal')!.textContent=text;this.say(text);for(const u of this.units)u.target=undefined;}
}

new Phaser.Game({type:Phaser.AUTO,parent:'app',backgroundColor:'#111713',scale:{mode:Phaser.Scale.RESIZE,width:window.innerWidth,height:window.innerHeight},render:{antialias:true,pixelArt:false},scene:GameScene});
