import { z } from 'zod'
export type Source = {file:string,n:number,end?:number,number?:string,printed?:string,part?:string,term?:string,examCode?:string,school?:string}
export type Question = {id:string,kind:string,stem:string,options:string[],correct:number[],chapter:number,topics:string[],sources:Source[],transcript:string,answerStatus:string,sourceAnswer:string|null,explanation:string,analysis?:string[],hints?:string[],outline?:string[],rubric?:string[],pitfalls?:string[],issues:string[],evidence:string[],raw?:string}
export type Chapter = {id:number,title:string,short:string,topics:string[],goals:string[],summary:string,prerequisites:number[],file:string,refs:{n:number,label:string}[]}
export type Doc = {id:string,name:string,group:string,school:string,term:string,pages:number,asset:string,ext:string,counts:Record<string,number>,modes:Record<string,number>,warnings:number,ocr:number,duplicates:string[],complete:boolean,examCode?:string}
export type Bank = {version:string,docs:Doc[],chapters:Chapter[],questions:Question[],aliases:Record<string,string>}
export const names:Record<string,string>={single:'Một đáp án',multi:'Nhiều đáp án',theory:'Tự luận lý thuyết',read:'Phân tích code',write:'Viết code',parts:'Tự luận nhiều ý'}
export const isQuiz=(q:Question)=>q.kind==='single'||q.kind==='multi'
export const eligible=(q:Question)=>q.transcript==='checked'&&q.answerStatus==='supported'&&(isQuiz(q)?q.correct.length>0:!!q.rubric?.length)
export const norm=(s:string)=>s.normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/gi,'d').toLowerCase()
export const score=(actual:number[],key:number[])=>actual.length===key.length&&new Set(actual).size===actual.length&&key.every(x=>actual.includes(x))
const id=z.string().regex(/^[a-zA-Z0-9_.:-]{1,160}$/).refine(s=>!['__proto__','constructor','prototype'].includes(s))
const stamp=z.number().finite().safe().nonnegative()
const indexes=z.array(z.number().int().min(0).max(255)).max(256).refine(a=>new Set(a).size===a.length)
const capped=z.string().max(32000)
export const responseSchema=z.object({choices:indexes,text:capped,marks:indexes,hints:z.number().int().min(0).max(100),shown:z.boolean(),submitted:z.boolean(),flag:z.boolean()}).strict()
export type Response=z.infer<typeof responseSchema>
export const emptyResponse=():Response=>({choices:[],text:'',marks:[],hints:0,shown:false,submitted:false,flag:false})
const base={id,updated:stamp}
const session=z.object({...base,type:z.literal('session'),mode:z.enum(['practice','exam']),title:z.string().min(1).max(300),bank:id,ids:z.array(id).min(1).max(5000).refine(a=>new Set(a).size===a.length),pos:z.number().int().nonnegative(),start:stamp,end:stamp.nullable(),done:stamp.nullable(),immediate:z.boolean(),responses:z.record(id,responseSchema)}).strict()
const attempt=z.object({...base,type:z.literal('attempt'),qid:id,sid:id,at:stamp,bank:id,choices:indexes,text:capped,marks:indexes,total:z.number().int().nonnegative(),result:z.enum(['right','wrong','self','seen','skipped']),hinted:z.boolean()}).strict()
const note=z.object({...base,type:z.literal('note'),qid:id,flag:z.boolean(),text:capped}).strict()
const correction=z.object({...base,type:z.literal('edit'),qid:id,bank:id,stem:capped,options:z.array(capped).max(256),correct:indexes,chapter:z.number().int().min(0).max(12),file:capped,n:z.number().int().positive(),reason:capped}).strict()
const read=z.object({...base,type:z.literal('read'),chapter:z.number().int().min(1).max(12)}).strict()
export const recordSchema=z.discriminatedUnion('type',[session,attempt,note,correction,read])
export type Entry=z.infer<typeof recordSchema>
export type Session=Extract<Entry,{type:'session'}>
export type Attempt=Extract<Entry,{type:'attempt'}>
export type Edit=Extract<Entry,{type:'edit'}>
export type Vault=Record<string,Entry>
export type Update=(fn:(v:Vault)=>Entry[])=>Promise<void>
export const backupSchema=z.object({app:z.literal('vo-oop'),schema:z.literal(1),bank:id,records:z.array(recordSchema).max(150000)}).strict()
export function validateBackup(input:unknown,bank:Bank){
 const result=backupSchema.parse(input)
 const seen=new Set<string>()
 for(const e of result.records){
  if(seen.has(e.id))throw Error('Bản sao có ID bị lặp.')
  seen.add(e.id)
  if(e.type==='session'&&(e.pos>=e.ids.length||Object.keys(e.responses).some(k=>!e.ids.includes(k))||(e.end!==null&&e.end<e.start)))throw Error('Phiên học có vị trí hoặc thời hạn sai.')
  if(e.type==='note'&&e.id!=='note:'+e.qid||e.type==='read'&&e.id!=='read:'+e.chapter||e.type==='session'&&!e.id.startsWith('s:')||e.type==='attempt'&&e.id!=='a:'+e.sid+':'+e.qid||e.type==='edit'&&!e.id.startsWith('edit:'))throw Error('ID không khớp loại bản ghi.')
  if(e.type==='edit'&&(e.correct.some(x=>x>=e.options.length)||!e.stem.trim()||!e.reason.trim()))throw Error('Hiệu đính thiếu nội dung hoặc sai đáp án.')
  if(e.type==='session'&&e.bank===bank.version){for(const qid of e.ids){const q=bank.questions.find(q=>q.id===qid), r=e.responses[qid]; if(q&&r&&(r.choices.some(x=>x>=q.options.length)||r.marks.some(x=>x>=(q.rubric?.length??0))))throw Error('Lựa chọn vượt số phương án.')}}
 }
 return result
}
export function planMerge(v:Vault,entries:Entry[]){return entries.filter(e=>!v[e.id]||e.updated>v[e.id].updated)}
export function historic(v:Vault,aliases:Bank['aliases']={}):Attempt[]{
 return Object.values(v).filter((e):e is Attempt=>e.type==='attempt')
  .map(e=>({...e,qid:aliases[e.qid]??e.qid})).sort((a,b)=>a.at-b.at)
}
export const noteFor=(v:Vault,id:string)=>{const e=v['note:'+id];return e?.type==='note'?e:{text:'',flag:false}}
export function makeSession(ids:string[],bank:string,title:string,mode:'practice'|'exam',minutes:number,immediate=true):Session{
 const now=Date.now()
 return {id:'s:'+crypto.randomUUID(),type:'session',updated:now,mode,title,bank,ids,pos:0,start:now,end:mode==='exam'?now+minutes*60000:null,done:null,immediate:mode==='practice'&&immediate,responses:{}}
}
export function attemptFor(s:Session,q:Question,r:Response,at:number):Attempt{
 const quiz=isQuiz(q)
 const result=quiz?(r.choices.length?(r.shown&&!r.submitted?'seen':score(r.choices,q.correct)?'right':'wrong'):'skipped'):(r.text.trim()||r.marks.length?'self':'skipped')
 return {id:'a:'+s.id+':'+q.id,type:'attempt',updated:at,at,qid:q.id,sid:s.id,bank:s.bank,choices:r.choices,text:r.text,marks:r.marks,total:quiz?1:q.rubric?.length??0,result,hinted:r.hints>0||r.shown&&!quiz}
}
export function finish(v:Vault,sid:string,bank:Bank,now=Date.now()):Entry[]{
 const s=v[sid];if(s?.type!=='session'||s.done!==null)return []
 const at=s.end===null?now:Math.min(now,s.end)
 return [{...s,updated:now,done:at},...s.ids.flatMap(id=>{
  const q=bank.questions.find(x=>x.id===id)
  return q&&!v['a:'+sid+':'+id]?[attemptFor(s,q,s.responses[id]??emptyResponse(),at)]:[]
 })]
}
