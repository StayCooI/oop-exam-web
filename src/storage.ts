import type {Entry,Vault} from './model'
let openDB:Promise<IDBDatabase>|undefined
function database(){
 if(!openDB)openDB=new Promise((resolve,reject)=>{
  const req=indexedDB.open('vo-oop-study',1)
  req.onupgradeneeded=()=>req.result.createObjectStore('records',{keyPath:'id'})
  req.onsuccess=()=>resolve(req.result)
  req.onerror=()=>reject(req.error)
 })
 return openDB
}
export async function transact(fn?:(v:Vault)=>Entry[]):Promise<Vault>{
 const db=await database()
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('records',fn?'readwrite':'readonly')
  const store=tx.objectStore('records')
  const request=store.getAll()
  let state:Vault={},failure:unknown
  request.onsuccess=()=>{
   try{
    state=Object.fromEntries(request.result.map((e:Entry)=>[e.id,e]))
    for(const e of fn?.(state)??[]){store.put(e);state[e.id]=e}
   }catch(e){failure=e;tx.abort()}
  }
  tx.oncomplete=()=>resolve(state)
  tx.onabort=()=>reject(failure??tx.error??Error('Không thể lưu dữ liệu.'))
  tx.onerror=()=>reject(tx.error)
 })
}
