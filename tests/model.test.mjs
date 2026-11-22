import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {score,makeSession,emptyResponse,finish,planMerge,validateBackup,eligible} from '../src/model.ts'
const bank=JSON.parse(readFileSync(new URL('../public/data/bank.json',import.meta.url)))
const quiz=bank.questions.find(q=>eligible(q)&&q.kind==='multi')
const essay=bank.questions.find(q=>eligible(q)&&q.rubric?.length)
test('Chấm đúng bộ đáp án, giữ nguyên thứ tự hiển thị',()=>{
 assert.equal(score([2,0],[0,2]),true)
 assert.equal(score([0],[0,2]),false)
 assert.equal(score([0,0],[0,2]),false)
 assert.equal(score([2],[2]),true)
})
test('Nộp đúng hạn một lần, lưu điểm riêng và khóa câu cần đối chiếu',()=>{
 const s=makeSession([quiz.id,essay.id],bank.version,'Thi thử','exam',30)
 s.responses[quiz.id]={...emptyResponse(),choices:[...quiz.correct]}
 s.responses[essay.id]={...emptyResponse(),text:'Bài làm của học viên'}
 const rows=finish({[s.id]:s},s.id,bank,s.end+100)
 assert.equal(rows[0].done,s.end)
 assert.equal(rows[1].result,'right')
 assert.equal(rows[2].result,'self')
 assert.equal(rows[2].text,'Bài làm của học viên')
 assert.deepEqual(finish({[s.id]:rows[0]},s.id,bank,s.end+200),[])
 assert(bank.questions.filter(q=>q.answerStatus==='conflict').every(q=>!eligible(q)))
})
test('Sao lưu đúng schema, xem trước gộp và từ chối chỉnh sửa sai kiểu',()=>{
 const s=makeSession([quiz.id],bank.version,'Luyện','practice',5)
 const backup={app:'vo-oop',schema:1,bank:bank.version,records:[s]}
 assert.deepEqual(validateBackup(backup,bank).records,[s])
 assert.deepEqual(planMerge({[s.id]:s},[s]),[])
 assert.equal(planMerge({[s.id]:s},[{...s,updated:s.updated+1}]).length,1)
 assert.throws(()=>validateBackup({...backup,schema:14},bank))
 assert.throws(()=>validateBackup({...backup,records:[s,s]},bank))
 assert.throws(()=>validateBackup({...backup,records:[{...s,pos:1}]},bank))
})
