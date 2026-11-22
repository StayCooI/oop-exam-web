import {createServer} from 'node:http'
import {createReadStream} from 'node:fs'
import {realpath,stat} from 'node:fs/promises'
import {extname,resolve,sep} from 'node:path'
import {fileURLToPath} from 'node:url'
import {spawn} from 'node:child_process'

const host='127.0.0.1',port=47831,origin='http://'+host+':'+port
if(Number(process.versions.node.split('.')[0])<22){
 console.error('Cần Node.js 22 LTS hoặc mới hơn.');process.exit(1)
}
const root=await realpath(fileURLToPath(new URL('./web',import.meta.url)))
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.pdf':'application/pdf','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'}
function openBrowser(){
 if(!process.argv.includes('--open'))return
 const options={stdio:'ignore',detached:true}
 const cmd=process.platform==='win32'?['rundll32.exe','url.dll,FileProtocolHandler',origin]:[process.platform==='darwin'?'open':'xdg-open',origin]
 const child=spawn(cmd[0],cmd.slice(1),options)
 child.on('error',()=>console.log('Mở '+origin+' trong trình duyệt.'));child.unref()
}
const server=createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff')
 res.setHeader('Cache-Control','no-cache')
 const fail=(status)=>res.writeHead(status).end()
 if(req.headers.host!==host+':'+port)return fail(421)
 if(req.method!=='GET'&&req.method!=='HEAD')return fail(405)
 const raw=(req.url??'').split('?')[0]
 if(raw==='/__vo_oop')return res.writeHead(200,{'Content-Type':'application/json'}).end('{"app":"vo-oop-local"}')
 try{
  const pieces=decodeURIComponent(raw).split('/').slice(1)
  if(!raw.startsWith('/')||pieces.some(p=>p.startsWith('.')||/[\\:\u0000]/.test(p)))return fail(404)
  const path=await realpath(resolve(root,...(raw==='/'?['index.html']:pieces)))
  if(!path.startsWith(root+sep))return fail(404)
  const info=await stat(path),contentType=mime[extname(path).toLowerCase()]
  if(!info.isFile()||!contentType)return fail(404)
  const headers={'Content-Type':contentType,'Accept-Ranges':'bytes','Content-Length':info.size}
  let start=0,end=info.size-1
  const range=req.headers.range
  if(range){
   const m=/^bytes=(\d*)-(\d*)$/.exec(range)
   if(!m||!m[1]&&!m[2])return res.writeHead(416,{'Content-Range':'bytes */'+info.size}).end()
   if(m[1]){start=Number(m[1]);if(m[2])end=Math.min(Number(m[2]),end)}
   else start=Math.max(0,info.size-Number(m[2]))
   if(start>end||!Number.isSafeInteger(start))return res.writeHead(416,{'Content-Range':'bytes */'+info.size}).end()
   headers['Content-Range']='bytes '+start+'-'+end+'/'+info.size;headers['Content-Length']=end-start+1
  }
  res.writeHead(range?206:200,headers)
  if(req.method==='HEAD'||info.size===0)return res.end()
  const body=createReadStream(path,{start,end});body.on('error',()=>res.destroy());res.on('close',()=>body.destroy());body.pipe(res)
 }catch{if(!res.headersSent)fail(404);else res.end()}
})
server.on('error',async error=>{
 if(error.code==='EADDRINUSE'){
  try{const reply=await fetch(origin+'/__vo_oop',{signal:AbortSignal.timeout(1700)});if(reply.ok&&(await reply.json()).app==='vo-oop-local'){console.log('Vở OOP đang chạy tại '+origin);openBrowser();return}}catch{}
  console.error('Cổng '+port+' đang do chương trình khác dùng. Tắt chương trình đó theo cách của bạn rồi mở lại Vở OOP.')
 }else console.error(error.message)
 process.exitCode=1
})
server.listen(port,host,()=>{console.log('Vở OOP tại '+origin+' (Ctrl+C để tắt)');openBrowser()})
