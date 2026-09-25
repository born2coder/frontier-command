export const PROTOCOL_VERSION = 1;
export const FACTION_COLORS = ['#3b82f6','#ef4444','#22c55e','#eab308'] as const;
export type FactionId = 0|1|2|3;
export type SlotKind = 'OPEN'|'HUMAN'|'CPU'|'CLOSED';
export type UnitKind = 'villager'|'soldier'|'archer'|'cavalry';
export type BuildingKind = 'town'|'house'|'barracks';
export type ResourceKind = 'wood'|'food'|'gold';
export type EntityState = 'idle'|'moving'|'gathering'|'building'|'attacking'|'dead';
export interface Point {x:number;y:number}
export interface FactionState {id:FactionId;name:string;color:string;kind:'human'|'cpu';wood:number;food:number;gold:number;popCap:number;age:number;attackBonus:number;gatherBonus:number;armorBonus:number;research:string[];defeated:boolean}
export interface UnitState {id:number;factionId:FactionId;kind:UnitKind;x:number;y:number;hp:number;maxHp:number;state:EntityState;target?:Point;targetId?:number;cargo?:number;cargoKind?:ResourceKind;nextAttackAt:number}
export interface TrainingQueueItem {kind:UnitKind;readyAt:number}
export interface BuildingState {id:number;factionId:FactionId;kind:BuildingKind;x:number;y:number;hp:number;maxHp:number;progress:number;state:EntityState;trainingQueue?:TrainingQueueItem[]}
export interface ResourceState {id:number;kind:ResourceKind;x:number;y:number;amount:number}
export interface MapDefinition {seed:number;width:number;height:number;resources:ResourceState[]}
export interface GameState {roomId:string;seed:number;tick:number;timeMs:number;phase:'countdown'|'playing'|'ended';startAt:number;winner?:FactionId;factions:FactionState[];units:UnitState[];buildings:BuildingState[];map:MapDefinition;events:GameEvent[];fog:Partial<Record<FactionId,string[]>>}
export interface GameEvent {id:number;type:'hit'|'death'|'build'|'train'|'research'|'age'|'defeat'|'victory';x?:number;y?:number;factionId?:FactionId;entityId?:number}
export interface LobbySlot {index:FactionId;kind:SlotKind;playerId?:string;name?:string;ready:boolean;host:boolean;connected:boolean}
export interface LobbyState {roomId:string;phase:'lobby'|'countdown'|'playing'|'ended';slots:LobbySlot[];mapSeed:number;startAt?:number}
export type GameCommand =
 | {type:'MOVE';unitIds:number[];target:Point}
 | {type:'ATTACK';unitIds:number[];targetId:number}
 | {type:'GATHER';unitIds:number[];targetId:number}
 | {type:'BUILD';builderIds:number[];building:Exclude<BuildingKind,'town'>;x:number;y:number}
 | {type:'CONTINUE_BUILD';builderIds:number[];buildingId:number}
 | {type:'TRAIN';buildingId:number;unit:UnitKind}
 | {type:'RESEARCH';buildingId:number;tech:'attack'|'economy'|'armor'}
 | {type:'ADVANCE_AGE';buildingId:number}
 | {type:'STOP';unitIds:number[]};
export type ClientMessage =
 | {version:number;type:'HELLO';roomId:string;sequence:number;name:string;sessionToken?:string}
 | {version:number;type:'READY';roomId:string;playerId:string;sequence:number;ready:boolean}
 | {version:number;type:'SET_SLOT';roomId:string;playerId:string;sequence:number;slot:FactionId;kind:'OPEN'|'CPU'|'CLOSED'}
 | {version:number;type:'START';roomId:string;playerId:string;sequence:number}
 | {version:number;type:'COMMAND';roomId:string;playerId:string;sequence:number;command:GameCommand};
export type ServerMessage =
 | {version:number;type:'WELCOME';roomId:string;playerId:string;sessionToken:string;factionId:FactionId;lobby:LobbyState}
 | {version:number;type:'LOBBY';lobby:LobbyState}
 | {version:number;type:'SNAPSHOT';state:GameState;you:FactionId}
 | {version:number;type:'STATE';state:GameState;you:FactionId}
 | {version:number;type:'ERROR';code:string;message:string}
 | {version:number;type:'KICKED';message:string};
