import {useEffect,useState} from 'react'
import { ExternalLink,BookOpen,Flag,CheckCircle2 } from 'lucide-react'
import {eligible,isQuiz,names,noteFor} from './model'
import type {Bank,Doc,Question,Update,Vault} from './model'
export const go=(path:string)=>{location.hash=path}
export const urlFor=(d:Doc,n=1)=>'./'+d.asset.split('/').map(encodeURIComponent).join('/')+(d.ext==='pdf'?'#page='+n:'')
export const findDoc=(b:Bank,file:string)=>b.docs.find(d=>d.name===file)!
export function SourceLine({b,q}:{b:Bank,q:Question}){return <div className="sources">{q.sources.map((s,i)=>{const d=findDoc(b,s.file);return d?<a key={i} href={urlFor(d,s.n)} target="_blank" rel="noreferrer" title={d.name}>{s.school||d.school||d.name} · {(s.term||d.term)?(s.term||d.term)+' · ':''}{(s.examCode||d.examCode)?'Mã '+(s.examCode||d.examCode)+' · ':''}{s.number&&s.number!=='Chưa xác định'?'Câu '+s.number+' · ':''}{s.part?'Ý '+s.part+' · ':''}{d.ext==='pdf'?'Trang PDF ':'Ảnh '}{s.n}{s.end&&s.end>s.n?'–'+s.end:''}{s.printed?' · Trang in '+s.printed:''} <ExternalLink size={13}/></a>:null})}</div>}
export function Head({title,children}:{title:string,children?:React.ReactNode}){return <header className="page-head"><h1>{title}</h1>{children&&<p>{children}</p>}</header>}
export function Empty({children}:{children:React.ReactNode}){return <div className="empty"><BookOpen size={24}/><p>{children}</p></div>}
export function Pill({children}:{children:React.ReactNode}){return <span className="pill">{children}</span>}
export function QType({q}:{q:Question}){return <div className="tags"><Pill>{names[q.kind]||q.kind}</Pill><span>{q.chapter?'Bài '+String(q.chapter).padStart(2,'0'):'Ngoài phạm vi / chưa phân chương'}</span>{!eligible(q)&&<b>Cần kiểm tra</b>}</div>}
export function Notes({v,update,qid}:{v:Vault,update:Update,qid:string}){const saved=noteFor(v,qid);const [value,setValue]=useState(saved.text);useEffect(()=>setValue(saved.text),[saved.text,qid]);const set=(patch:{text?:string,flag?:boolean})=>update(v=>[{...noteFor(v,qid),...patch,id:'note:'+qid,type:'note',qid,updated:Date.now()}])
 return <details className="notes"><summary>Ghi chú và đánh dấu</summary><label>Ghi chú cá nhân<textarea value={value} maxLength={32000} onChange={e=>{setValue(e.target.value);void set({text:e.target.value})}}/></label><button aria-pressed={saved.flag} onClick={()=>set({flag:!saved.flag})}><Flag size={16}/>{saved.flag?'Bỏ đánh dấu':'Đánh dấu chưa hiểu'}</button></details>}
export function Solution({q}:{q:Question}){return <section className="solution"><h3><CheckCircle2 size={19}/> Lời giải tham khảo</h3><small>Biên soạn bằng AI · {q.answerStatus==='supported'?'Có bằng chứng đối chiếu':q.answerStatus==='conflict'?'Có mâu thuẫn':'Cần kiểm tra'}</small>
 {isQuiz(q)&&q.correct.length>0&&<p><b>Đáp án biên soạn</b> {q.correct.map(i=>String.fromCharCode(65+i)).join(', ')}</p>}
 {!!q.outline?.length&&<><h4>Dàn ý</h4><ul>{q.outline.map((x,i)=><li key={i}>{x}</li>)}</ul></>}
 <div className="verbatim">{q.explanation}</div>{!!q.analysis?.length&&<ol type="A">{q.analysis.map((x,i)=><li key={i}>{x}</li>)}</ol>}
 {!!q.pitfalls?.length&&<><h4>Lỗi thường gặp</h4><ul>{q.pitfalls.map((x,i)=><li key={i}>{x}</li>)}</ul></>}
 <details><summary>Đáp án trong nguồn và bằng chứng</summary><p>{q.sourceAnswer||'Chưa xác định đáp án trong nguồn.'}</p><ul>{[...q.evidence,...q.issues].map((x,i)=><li key={i}>{x}</li>)}</ul></details></section>}
