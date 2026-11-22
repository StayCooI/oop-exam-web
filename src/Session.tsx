import {useEffect,useState} from 'react'
import {ChevronLeft,ChevronRight,Clock,Flag,Check,BookOpen,PanelLeftClose,PanelLeftOpen} from 'lucide-react'
import type {Bank,Entry,Response,Session,Update,Vault} from './model'
import {emptyResponse,isQuiz,score,attemptFor,finish} from './model'
import {go,SourceLine,QType,Solution,Notes} from './shared'
const isJavaCode=(text:string)=>/\b(?:class|interface|public|private|protected|static|final|abstract|void|int|String|boolean|new|return|extends|implements|System\.out)\b|[{}]\s*;?/.test(text)

export default function SessionView({b,v,s,update,focusMode,toggleFocus}:{b:Bank,v:Vault,s:Session,update:Update,focusMode:boolean,toggleFocus:()=>void}){
 const [now,setNow]=useState(Date.now()),[confirm,setConfirm]=useState(false)
 useEffect(()=>{if(s.done!==null||s.end===null)return;const tick=()=>{const n=Date.now();setNow(n);if(n>=s.end!)void update(v=>finish(v,s.id,b,n))};tick();const t=setInterval(tick,500);window.addEventListener('focus',tick);return()=>{clearInterval(t);window.removeEventListener('focus',tick)}},[s.id,s.done,s.end])
 const q=b.questions.find(x=>x.id===s.ids[s.pos]);const r=s.responses[s.ids[s.pos]]??emptyResponse()
 const [draft,setDraft]=useState(r.text)
 useEffect(()=>setDraft(r.text),[s.id,s.pos])
 const ended=s.done!==null,exam=s.mode==='exam',quiz=q&&isQuiz(q),locked=ended||r.submitted
 const edit=(fn:(live:Session)=>Entry[],after=false)=>update(v=>{const live=v[s.id];if(live?.type!=='session')return [];if(live.done===null&&live.end!==null&&Date.now()>=live.end)return finish(v,s.id,b);if(live.done!==null&&!after)return [];return fn(live)})
 const move=(pos:number)=>{setConfirm(false);void edit(l=>[{...l,pos,updated:Date.now()}],true)}
 const patch=(f:(r:Response)=>Partial<Response>,allowAfter=false)=>edit(l=>{
  if(!q)return [];const old=l.responses[q.id]??emptyResponse();const updated={...old,...f(old)}
  const next={...l,responses:{...l.responses,[q.id]:updated},updated:Date.now()}
  const rows:Entry[]=[next]
  if(updated.submitted&&!old.submitted||allowAfter&&l.done!==null)rows.push(attemptFor(l,q,updated,v['a:'+l.id+':'+q.id]?.type==='attempt'?(v['a:'+l.id+':'+q.id] as {at:number}).at:Date.now()))
  return rows
 },allowAfter)
 const answers=Object.values(s.responses).filter(r=>r.text.trim()||r.choices.length).length
 const attempts=Object.values(v).filter(e=>e.type==='attempt'&&e.sid===s.id)
 const left=Math.max(0,Math.ceil(((s.end??now)-now)/1000))
 return <div className="session-page"><div className="page-head"><div><p>{exam?'Thi thử':'Buổi luyện'} · {ended?'Đã kết thúc':'Đang làm'}</p><h1>{s.title}</h1></div><button className="focus-toggle" aria-pressed={focusMode} onClick={toggleFocus}>{focusMode?<PanelLeftOpen size={17}/>:<PanelLeftClose size={17}/>} {focusMode?'Hiện mục lục':'Chế độ tập trung'}</button></div>
 {ended&&<section className="result"><h2>Kết quả lượt làm</h2><p>Trắc nghiệm đúng <b>{attempts.filter(e=>e.type==='attempt'&&e.result==='right').length} / {s.ids.filter(id=>b.questions.some(q=>q.id===id&&isQuiz(q))).length}</b>. Tự luận tự chấm <b>{attempts.reduce((n,e)=>n+(e.type==='attempt'&&e.result==='self'?e.marks.length:0),0)} / {s.ids.reduce((n,id)=>n+(b.questions.find(q=>q.id===id)?.rubric?.length??0),0)}</b> tiêu chí.</p><small>Mỗi câu trắc nghiệm đúng trọn bộ được 1 điểm luyện tập. Mỗi tiêu chí tự luận được 1 điểm tự chấm.</small></section>}
 <div className="sessionbar"><strong>Câu {s.pos+1} / {s.ids.length}</strong><span>{answers} đã trả lời</span>{!ended&&s.end!==null&&<span><Clock size={16}/>{Math.floor(left/60)}:{String(left%60).padStart(2,'0')}</span>}</div>
 {q?<article className="paper"><QType q={q}/><h2 className={'stem'+(isJavaCode(q.stem)?' code-text':'')}>{q.stem}</h2><SourceLine b={b} q={q}/>
 {quiz?<fieldset className="choices" disabled={locked}><legend>{q.kind==='multi'?'Chọn tất cả phương án đúng':'Chọn một phương án'}</legend>{q.options.map((x,i)=>{
  const selected=r.choices.includes(i),correct=q.correct.includes(i),revealed=ended||r.submitted
  const state=!revealed?(selected?'is-selected':''):correct?(selected?'is-correct-selected':'is-correct-missed'):(selected?'is-incorrect-selected':'')
  const status=revealed?(correct?(q.kind==='multi'?'✓ Đáp án đúng · '+(selected?'Đã chọn':'Chưa chọn'):'✓ Đáp án đúng'):selected?(q.kind==='single'?'✕ Bạn chọn chưa đúng':'✕ Bạn chọn phương án sai.'):''):''
  return <label key={i} className={'choice-option '+state}><input type={q.kind==='multi'?'checkbox':'radio'} name={q.id} checked={selected} onChange={()=>patch(old=>({choices:q.kind==='single'?[i]:old.choices.includes(i)?old.choices.filter(j=>j!==i):[...old.choices,i]}))}/><span className="letter">{String.fromCharCode(65+i)}</span><span className={'verbatim'+(isJavaCode(x)?' code-option':'')}>{x}</span>{status&&<span className="choice-status">{status}</span>}</label>
 })}</fieldset>:<label className="longanswer">Bài làm của bạn<textarea className="code-input" key={q.id} aria-label="Bài làm tự luận" readOnly={ended} maxLength={32000} value={draft} placeholder="Nhập lời giải hoặc code Java…" onChange={e=>{const text=e.target.value;setDraft(text);void patch(()=>({text}))}}/></label>}
 <div className="actions">{!ended&&<button aria-pressed={r.flag} onClick={()=>patch(old=>({flag:!old.flag}))}><Flag size={16}/>{r.flag?'Đã đánh dấu':'Đánh dấu câu'}</button>}
 {!ended&&!exam&&s.immediate&&quiz&&!r.submitted&&<button className="primary" disabled={!r.choices.length} onClick={()=>patch(()=>({submitted:true,shown:true}))}>Nộp câu trả lời</button>}
 {!exam&&!ended&&!quiz&&r.hints<(q.hints?.length??0)&&<button onClick={()=>patch(old=>({hints:old.hints+1}))}>Mở gợi ý {r.hints+1}</button>}
 {!quiz&&!r.shown&&(!exam||ended)&&<button onClick={()=>patch(()=>({shown:true}),ended)}><BookOpen size={16}/> Xem lời giải</button>}</div>
 {!quiz&&!exam&&(q.hints??[]).slice(0,r.hints).map((h,i)=><p className="hint" key={i}>Gợi ý {i+1}. {h}</p>)}
 {quiz&&(ended||r.submitted)&&<p className={'verdict '+(score(r.choices,q.correct)?'is-positive':'is-negative')} role="status" aria-live="polite">{score(r.choices,q.correct)?'Chính xác!':q.kind==='single'?(r.choices.length?'Chưa chính xác. ':'Chưa chọn đáp án. ')+'Đáp án đúng là '+q.correct.map(i=>String.fromCharCode(65+i)).join(', ')+'.':'Chưa chính xác. Đáp án đúng: '+q.correct.map(i=>String.fromCharCode(65+i)).join(', ')+'.'}</p>}
 {(quiz&&(ended||r.submitted)||!quiz&&r.shown)&&<Solution q={q}/>}
 {!quiz&&r.shown&&(!exam||ended)&&<fieldset className="rubric"><legend>Tiêu chí tự chấm · AI biên soạn</legend>{q.rubric?.map((x,i)=><label key={i}><input type="checkbox" checked={r.marks.includes(i)} onChange={()=>patch(old=>({marks:old.marks.includes(i)?old.marks.filter(j=>j!==i):[...old.marks,i]}),ended)}/>{x}</label>)}</fieldset>}
 {(!exam||ended)&&<Notes qid={q.id} v={v} update={update}/>}</article>:<p>Câu này thuộc bản ngân hàng cũ. Bài làm vẫn có trong bản sao lưu.</p>}
 <div className="actions spread"><button disabled={!s.pos} onClick={()=>move(s.pos-1)}><ChevronLeft size={16}/>Câu trước</button>{s.pos+1<s.ids.length&&<button onClick={()=>move(s.pos+1)}>Câu sau <ChevronRight size={16}/></button>}{!ended&&<button onClick={()=>setConfirm(true)}>Kết thúc lượt</button>}</div>
 {confirm&&!ended&&<section className="notice" role="alert"><b>Nộp bài với {answers}/{s.ids.length} câu đã trả lời?</b><div className="actions"><button onClick={()=>setConfirm(false)}>Làm tiếp</button><button className="primary" onClick={()=>{setConfirm(false);void update(v=>finish(v,s.id,b))}}><Check size={16}/>Xác nhận nộp</button></div></section>}
 <details className="paper"><summary>Danh sách câu và đánh dấu</summary><div className="question-grid">{s.ids.map((id,i)=><button key={id} aria-current={i===s.pos?'step':undefined} onClick={()=>move(i)}>{i+1}{s.responses[id]?.flag?' ⚑':''}{(s.responses[id]?.choices.length||s.responses[id]?.text)?' ✓':''}</button>)}</div></details>
 <button onClick={()=>go('home')}>Về bàn học</button></div>
}
