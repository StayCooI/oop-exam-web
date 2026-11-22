import React,{useEffect,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {BookOpen,LayoutDashboard,LibraryBig,NotebookPen,Timer,Archive,Moon,Sun,Menu,ArrowRight,Check,ChartNoAxesColumn,FileQuestion,Type,Minus,Plus} from 'lucide-react'
import './style.css'
import type {Bank,Entry,Update,Vault,Session} from './model'
import {eligible,historic,isQuiz,validateBackup,planMerge,finish} from './model'
import {transact} from './storage'
import {Head,go,Empty} from './shared'
import {ChapterView,Learn} from './Learn'
import {Library,Editor} from './Library'
import SessionView from './Session'
const links=[['home','Tổng quan',LayoutDashboard],['practice','Luyện tập',NotebookPen],['exam','Thi thử',Timer],['review','Sổ ôn tập',BookOpen],['library','Thư viện đề',LibraryBig],['backup','Sao lưu',Archive]] as const

function Backup({bank,v,update}:{bank:Bank,v:Vault,update:Update}){
 const [incoming,I]=useState<Entry[]>(),[message,M]=useState('')
 const download=()=>{const a=document.createElement('a');const u=URL.createObjectURL(new Blob([JSON.stringify({app:'vo-oop',schema:1,bank:bank.version,records:Object.values(v)},null,2)],{type:'application/json'}));a.href=u;a.download='vo-oop-sao-luu.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
 return <><Head title="Sao lưu tiến độ">Tiến độ được lưu theo trình duyệt, hồ sơ và địa chỉ localhost.</Head><section className="paper"><h2>Xuất bản sao</h2><p>{Object.keys(v).length} bản ghi gồm buổi học, lịch sử, nháp, ghi chú và hiệu đính.</p><button className="primary" onClick={download}>Tải bản sao JSON</button></section><section className="paper"><h2>Nhập bản sao</h2><p>Bản nhập được gộp theo ID. Khi trùng ID, bản có thời điểm cập nhật mới hơn được giữ.</p><label>Chọn tệp JSON<input type="file" accept=".json,application/json" onChange={async e=>{I(undefined);M('');try{const f=e.target.files?.[0];if(!f)return;if(f.size>30_000_000)throw Error();I(validateBackup(JSON.parse(await f.text()),bank).records)}catch{M('Tệp không hợp lệ, sai phiên bản hoặc vượt 30 MB.')}}}/></label>
 {incoming&&<div className="notice"><p>{incoming.length} bản ghi trong tệp · {planMerge(v,incoming).filter(e=>!v[e.id]).length} thêm mới · {planMerge(v,incoming).filter(e=>v[e.id]).length} cập nhật · {incoming.length-planMerge(v,incoming).length} giữ bản hiện tại.</p><div className="actions"><button onClick={()=>I(undefined)}>Hủy</button><button className="primary" onClick={async()=>{try{await update(live=>planMerge(live,incoming));M('Đã gộp bản sao.');I(undefined)}catch{M('Chưa lưu được bản nhập.')}}}>Xác nhận gộp</button></div></div>}<p role="status">{message}</p></section></>
}

function Home({b,v}:{b:Bank,v:Vault}){
 const history=historic(v,b.aliases),last=new Map(history.map(a=>[a.qid,a]))
 const sessions=Object.values(v).filter((x):x is Session=>x.type==='session').sort((a,b)=>b.updated-a.updated)
 const resume=sessions.find(s=>s.done===null&&s.bank===b.version)
 const focus=b.chapters.find(c=>!v['read:'+c.id])??b.chapters[0]
 const docs=b.docs.filter(d=>d.group!=='slide')
 const supported=b.questions.filter(eligible)
 const covered=new Set(b.questions.flatMap(q=>q.sources.map(s=>s.file)))
 const marked=Object.values(v).filter(e=>e.type==='note'&&e.flag).length
 const attempted=new Set(history.filter(a=>!['skipped','seen'].includes(a.result)).map(a=>a.qid))
 const first=new Map<string,string>();for(const a of history){if(!first.has(a.qid)&&!['skipped','seen'].includes(a.result))first.set(a.qid,a.result)}
 const chapterCount=(id:number)=>{const qs=supported.filter(q=>q.chapter===id);return [qs.filter(q=>attempted.has(q.id)).length,qs.length]}
 return <><Head title="Bàn học OOP">Ôn thi cuối kỳ · Lập trình hướng đối tượng bằng Java</Head>
 <section className="hero"><div><span className="hero-label"><BookOpen size={17}/> {resume?'Buổi học đang mở':'Lộ trình bài giảng'}</span><h2>{resume?resume.title:focus.title}</h2><p>{resume?'Câu '+(resume.pos+1)+' trong '+resume.ids.length:focus.summary}</p><button onClick={()=>go(resume?'session/'+resume.id:'chapter/'+focus.id)}>{resume?'Tiếp tục buổi học':'Mở bài '+String(focus.id).padStart(2,'0')} <ArrowRight size={16}/></button></div></section>
 <div className="metrics">{[[attempted.size,'Câu đã làm',NotebookPen],[[...last.values()].filter(x=>x.result==='wrong').length,'Sai lần gần nhất',FileQuestion],[marked,'Đã đánh dấu',Archive],[Object.values(v).filter(x=>x.type==='read').length+' / '+b.chapters.length,'Chương đã đọc',BookOpen]].map(([n,label,Icon])=>{const I=Icon as typeof BookOpen;return <div key={String(label)}><I size={19}/><strong>{String(n)}</strong><span>{String(label)}</span></div>})}</div>
 <div className="homegrid"><section><div className="section-title"><h2>Lộ trình theo slide</h2><small>{b.chapters.length} bài</small></div><div className="chapter-list">{b.chapters.map(c=>{const [done,count]=chapterCount(c.id);return <a key={c.id} href={'#chapter/'+c.id}><span className="chapter-number">{String(c.id).padStart(2,'0')}</span><span><b>{c.short}</b><small>{count?done+' / '+count+' câu đã luyện':'Chưa có câu đủ điều kiện'}</small></span>{v['read:'+c.id]?<Check size={17}/>:<ArrowRight size={16}/>}</a>})}</div></section>
 <aside><section className="paper coverage"><h2><ChartNoAxesColumn size={20}/> Ngân hàng câu hỏi</h2><dl><div><dt>Tệp đề có câu đã biên tập</dt><dd>{docs.filter(d=>covered.has(d.name)).length}/{docs.length}</dd></div><div><dt>Trắc nghiệm chấm được</dt><dd>{supported.filter(isQuiz).length}</dd></div><div><dt>Tự luận có rubric</dt><dd>{supported.filter(q=>!isQuiz(q)).length}</dd></div><div><dt>Câu cần kiểm tra</dt><dd>{b.questions.length-supported.length}</dd></div></dl><a href="#library">Mở thư viện đề</a></section>
 <section className="paper coverage"><h2>Lịch sử học</h2><p>Trắc nghiệm đúng lần đầu <b>{[...first.values()].filter(r=>r==='right').length}/{[...first.values()].filter(r=>r==='right'||r==='wrong').length}</b></p>{sessions.slice(0,5).map(s=><p key={s.id}><a href={'#session/'+s.id}>{s.title}</a> <small>{s.done===null?'Đang làm':'Đã nộp'}</small></p>)}</section>
 <section className="paper coverage"><h2>Câu theo chương</h2><p>Số câu biên tập từ {docs.filter(d=>covered.has(d.name)).length} tệp đề.</p><dl>{b.chapters.map(c=><div key={c.id}><dt>{c.short}</dt><dd>{b.questions.filter(q=>q.chapter===c.id).length}</dd></div>)}</dl></section></aside></div></>
}
function App(){
 const [b,B]=useState<Bank>(),[v,V]=useState<Vault>(),[error,E]=useState(''),[save,S]=useState(''),[route,R]=useState(location.hash.slice(1)||'home'),[dark,D]=useState(()=>localStorage.getItem('vo-oop-theme')==='dark'),[menu,M]=useState(false),[fontSize,FS]=useState(()=>{const n=Number(localStorage.getItem('vo-oop-font-size'));return [17,18,19,20].includes(n)?n:18}),[focusMode,FM]=useState(false)
 useEffect(()=>{let live=true;const refresh=()=>transact().then(state=>{if(live)V(state)}).catch(()=>E('Không mở được kho tiến độ của trình duyệt.'));const changed=()=>{R(location.hash.slice(1)||'home');M(false);window.scrollTo(0,0)};window.addEventListener('hashchange',changed);window.addEventListener('focus',refresh);fetch('./data/bank.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(B).catch(()=>E('Không tải được ngân hàng câu hỏi.'));void refresh();return()=>{live=false;window.removeEventListener('hashchange',changed);window.removeEventListener('focus',refresh)}},[])
 useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light';localStorage.setItem('vo-oop-theme',dark?'dark':'light')},[dark])
 useEffect(()=>{document.documentElement.style.setProperty('--study-font-size',fontSize+'px');localStorage.setItem('vo-oop-font-size',String(fontSize))},[fontSize])
 const update:Update=async fn=>{S('Đang lưu…');try{const data=await transact(fn);V(data);S('Đã lưu trên máy')}catch{S('Lưu thất bại. Kiểm tra dung lượng hoặc quyền lưu trữ.');throw Error('Lưu thất bại')}}
 useEffect(()=>{if(!b||!v)return;const expired=Object.values(v).filter((s):s is Session=>s.type==='session'&&s.bank===b.version&&s.done===null&&s.end!==null&&s.end<=Date.now());if(expired.length)void update(state=>expired.flatMap(s=>finish(state,s.id,b)))},[b,v])
 if(error)return <main className="startup" role="alert">{error} <button onClick={()=>location.reload()}>Tải lại</button></main>
 if(!b||!v)return <main className="startup" role="status">Đang mở bàn học…</main>
 const [section,key='']=route.split('/'), session=v[key]
 const start=async(s:Session)=>{await update(()=>[s]);go('session/'+s.id)}
 return <div className={'layout'+(focusMode&&section==='session'?' focus-layout':'')}><a className="skip" href="#main" onClick={e=>{e.preventDefault();document.getElementById('main')?.focus()}}>Đến nội dung</a>
 <aside className={'sidebar '+(menu?'open':'')}><a className="brand" href="#home"><span><BookOpen size={24}/></span><div><b>Vở OOP</b><small>Ôn thi Java</small></div></a><nav aria-label="Điều hướng chính">{links.map(([id,title,Icon])=><a key={id} href={'#'+id} aria-current={section===id?'page':undefined}><Icon size={18}/>{title}</a>)}</nav><nav className="sidechapters" aria-label="Lộ trình chương"><h2>Bài giảng</h2>{b.chapters.map(c=><a key={c.id} href={'#chapter/'+c.id} aria-current={section==='chapter'&&+key===c.id?'page':undefined}><span>{String(c.id).padStart(2,'0')}</span>{c.short}</a>)}</nav></aside>
 <div className="workspace"><header className="topbar"><button className="mobile-menu" aria-expanded={menu} onClick={()=>M(!menu)} aria-label="Mục lục"><Menu size={20}/></button><span>{links.find(x=>x[0]===section)?.[1]??(section==='chapter'?'Bài giảng':section==='edit'?'Hiệu đính':'Buổi học')}</span><div>{['session','practice'].includes(section)&&<div className="text-size" aria-label="Cỡ chữ phần học"><Type size={17}/><button aria-label="Giảm cỡ chữ phần học" title="Giảm cỡ chữ" disabled={fontSize<=17} onClick={()=>FS(x=>Math.max(17,x-1))}><Minus size={14}/></button><span>{fontSize}</span><button aria-label="Tăng cỡ chữ phần học" title="Tăng cỡ chữ" disabled={fontSize>=20} onClick={()=>FS(x=>Math.min(20,x+1))}><Plus size={14}/></button></div>}<small role="status">{save||'Học trên máy này'}</small><button className="iconbtn" onClick={()=>D(!dark)} aria-label={dark?'Đổi sang giao diện sáng':'Đổi sang giao diện tối'}>{dark?<Sun size={19}/>:<Moon size={19}/>}</button></div></header>
 <main id="main" tabIndex={-1}>{section==='chapter'?<ChapterView b={b} v={v} id={+key} update={update}/>:['practice','exam','review'].includes(section)?<Learn key={route} b={b} v={v} start={start} route={section} initial={key}/>:section==='library'?<Library key={route} b={b} initial={key}/>:section==='edit'?<Editor b={b} v={v} update={update} target={key}/>:section==='session'?session?.type==='session'?session.bank===b.version?<SessionView key={key} b={b} v={v} s={session} update={update} focusMode={focusMode} toggleFocus={()=>FM(x=>!x)}/>:<Empty>Phiên thuộc ngân hàng {session.bank}. Lịch sử và bài làm được giữ trong bản sao lưu.</Empty>:<Empty>Không tìm thấy buổi học.</Empty>:section==='backup'?<Backup bank={b} v={v} update={update}/>:<Home b={b} v={v}/>}</main>
 </div></div>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
