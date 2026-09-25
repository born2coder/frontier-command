interface DurableObjectId {}
interface DurableObjectStub {fetch(request:Request):Promise<Response>}
interface DurableObjectNamespace {idFromName(name:string):DurableObjectId;get(id:DurableObjectId):DurableObjectStub}
interface DurableObjectStorage {get<T>(key:string):Promise<T|undefined>;put(key:string,value:unknown):Promise<void>}
interface DurableObjectState {storage:DurableObjectStorage;blockConcurrencyWhile<T>(callback:()=>Promise<T>):void;acceptWebSocket(socket:WebSocket,tags?:string[]):void;getWebSockets(tag?:string):WebSocket[]}
interface WebSocket {serializeAttachment(value:unknown):void;deserializeAttachment():unknown}
declare class WebSocketPair {0:WebSocket;1:WebSocket}
interface ResponseInit {webSocket?:WebSocket}
