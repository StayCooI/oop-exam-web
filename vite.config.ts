import {defineConfig} from 'vite'
import {createReadStream,statSync} from 'node:fs'
import {resolve} from 'node:path'
export default defineConfig({
 base:'./',
 plugins:[{name:'local-materials',configureServer(server){
  server.middlewares.use('/Materials',(req,res,next)=>{
   try{
    const path=resolve('Materials','.'+decodeURIComponent((req.url||'').split('?')[0]))
    if(!path.startsWith(resolve('Materials')+'/')||!statSync(path).isFile())return next()
    res.setHeader('Content-Type',path.toLowerCase().endsWith('.pdf')?'application/pdf':'image/jpeg')
    createReadStream(path).pipe(res)
   }catch{next()}
  })
 }}]
})
