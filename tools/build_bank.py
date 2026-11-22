"""Validate and assemble release data. Never edits input materials."""
import json,re,hashlib,unicodedata
from collections import Counter,defaultdict
from pathlib import Path
from ingest import CACHE, ROOT, write

OUT=ROOT/'public/data'
def read(path):return json.loads(path.read_text())
def tidy(s):return ' '.join(s.split())
def valid(q,docs):
    assert re.fullmatch(r'[A-Za-z0-9_.:-]+',q['id']),q['id']
    assert q['stem'].strip() and q['sources'] and 0<=q['chapter']<=12,q['id']
    for s in q['sources']:
        d=docs[s['file']]; assert 1<=s['n']<=s.get('end',s['n'])<=d['pages'],(q['id'],s)
    quiz=q['kind'] in ['single','multi']
    assert quiz or q['kind'] in ['theory','parts','write','read']
    assert q['transcript'] in ['checked','review'] and q['answerStatus'] in ['supported','review','conflict']
    if q['transcript']=='checked' and q['answerStatus']=='supported':
        assert q['evidence'] and q['explanation'].strip(),q['id']
        if quiz:
            assert len(q['options'])>=2 and all(x.strip() for x in q['options']) and q['correct'],q['id']
            assert len(set(q['correct']))==len(q['correct']) and all(0<=i<len(q['options']) for i in q['correct']),q['id']
            assert q['kind']!='single' or len(q['correct'])==1,q['id']
        else: assert q.get('rubric') and q.get('hints'),q['id']
    return q


def report(docs,questions):
    exams=[d for d in docs if d['group']!='slide']
    graded=lambda q:q['transcript']=='checked' and q['answerStatus']=='supported'
    isquiz=lambda q:q['kind'] in ('single','multi')
    counts=Counter(s['file'] for q in questions for s in q['sources'])
    lines=['# Bao phủ ngân hàng 1.0.0','',
      f"- {len(docs)} tệp, {sum(d['pages'] for d in docs)} trang hoặc ảnh. Gồm {len(exams)} tệp đề và {len(docs)-len(exams)} slide.",
      f"- {sum(d['ocr'] for d in docs)} trang hoặc ảnh đã OCR. {sum(d['counts'].get('unclear',0) for d in docs)} trang có rất ít chữ đọc được. {sum(d['counts'].get('error',0) for d in docs)} trang gặp lỗi xử lý.",
      f"- {sum(bool(counts[d['name']]) for d in exams)}/{len(exams)} tệp đề có câu biên tập; {sum(not counts[d['name']] for d in exams)} tệp có chỉ mục trang và còn chờ biên tập câu.",
      f"- {sum(isquiz(q) for q in questions)} trắc nghiệm, {sum(not isquiz(q) for q in questions)} tự luận. {sum(graded(q) and isquiz(q) for q in questions)} chấm tự động, {sum(graded(q) and not isquiz(q) for q in questions)} có rubric dùng ngay.",
      f"- {sum(not graded(q) for q in questions)} câu chưa đủ điều kiện; {sum(q['transcript']!='checked' for q in questions)} bản chép cần xem lại, {sum(q['answerStatus']=='review' for q in questions)} đáp án cần kiểm tra, {sum(q['answerStatus']=='conflict' for q in questions)} mâu thuẫn.",
      '', '| Bài | Trắc nghiệm | Tự luận | Đủ điều kiện |','|---|---:|---:|---:|']
    for i in [*range(1,13),0]:
        group=[q for q in questions if q['chapter']==i]
        lines.append(f"| {i if i else 'Ngoài phạm vi hoặc chờ phân loại'} | {sum(isquiz(q) for q in group)} | {sum(not isquiz(q) for q in group)} | {sum(graded(q) for q in group)} |")
    lines+=['','| Tệp đề | Trang / ảnh | OCR | Câu gắn nguồn | Trạng thái |','|---|---:|---:|---:|---|']
    for d in exams:
        state='Đủ dữ liệu nguyên đề' if d['complete'] else 'Biên tập một phần hoặc còn vướng đáp án' if counts[d['name']] else 'Chỉ mục trang · còn chờ biên tập'
        lines.append(f"| {d['name']} | {d['pages']} | {d['ocr']} | {counts[d['name']]} | {state} |")
    lines+=['','SHA-256 và dấu vân tay render nằm trong data/inventory.json. Hai bản 2024.1 trùng hình render từng trang. Các tệp 117 trang có ảnh và nội dung tương tự vẫn giữ riêng cho đến khi xác nhận mọi trang tương ứng. OCR là bước đọc máy. Câu số hóa và số câu có thể chấm được thống kê riêng.']
    (ROOT/'BAO-PHU.md').write_text('\n'.join(lines)+'\n')

def build():
    docs=read(ROOT/'data/inventory.json')
    chapters=read(ROOT/'data/chapters.json')
    byname={d['name']:d for d in docs}
    meta_path=ROOT/'data/source-metadata.json'
    metadata=read(meta_path) if meta_path.exists() else {}
    banks=['mcq','hust','essays','essay-extra-mcq','additional','approved']
    questions=[];ids=set(); bycontent=defaultdict(list);aliases={}
    for name in banks:
        path=ROOT/'data'/f'{name}.json'
        for q in read(path) if path.exists() else []:
            assert q['id'] not in ids,q['id']
            ids.add(q['id'])
            for alias in q.get('aliases',[]):
                assert alias not in aliases and alias not in ids,alias
                aliases[alias]=q['id']
            for s in q['sources']:
                s['file']=unicodedata.normalize('NFC',s['file'])
                if 'number' in s:s['number']=str(s['number'])
            q=valid(q,byname)
            # Full match includes punctuation, indentation, answer and grading state.
            key=(q['kind'],q['stem'].strip(),tuple(q['options']),tuple(q['correct']),q['transcript'],q['answerStatus'],q['sourceAnswer'])
            if bycontent[key]:
                original=bycontent[key][0]
                original['sources'].extend(s for s in q['sources'] if s not in original['sources'])
                aliases[q['id']]=original['id']
            else:
                questions.append(q);bycontent[key].append(q)
    pages={};readiness=read(ROOT/'data/complete.json') if (ROOT/'data/complete.json').exists() else {}
    for d in docs:
        d.update(dict(asset=d['path'],school='',term='',complete=False),**{})
        d.update(metadata.get(d['name'],{}))
        d['duplicates']=[other['name'] for other in docs if other['id']!=d['id'] and (other['hash']==d['hash'] or d['fingerprint'] and d['fingerprint']==other['fingerprint'])]
        numbered=set()
        for q in questions:
            for s in q['sources'][:]:
                if s['file'] in d['duplicates'] and not any(other['file']==d['name'] and other['n']==s['n'] for other in q['sources']):
                    q['sources'].append({**s,'file':d['name']})
                if s['file']==d['name'] and q['transcript']=='checked' and q['answerStatus']=='supported':
                    numbered.add(str(s.get('number','')))
        if d['name'] in readiness and numbered==set(map(str,readiness[d['name']])):d['complete']=True
        entries=[]
        for n in range(1,d['pages']+1):
            row=read(CACHE/d['cache']/f'{n:04}.json')
            m=row['meta']; content=row['layout'] if len(row['native'].strip())>=35 else row['ocr'] or row['retry'] or row['native']
            # Search-only derivative; no coordinates, model files or OCR checkpoints shipped.
            search=tidy(content)
            if m['mode']=='mixed' and row['ocr']:search+=' '+tidy(row['ocr'])
            search=re.sub(r'(?i)Downloaded by[^\n]*?lOMoARcPSD\|\d+',' ',search)
            anchors=[tidy(a)[:100] for a in re.findall(r'(?im)^\s*((?:Câu\s*\d+|Bài\s+\d+|Question\s*#[\da-f]+|Q\d+:|\d+\))[^\n]{0,100})',content)]
            entries.append({**{k:m[k] for k in ['n','status','mode','warn','ocr']},'text':search,'anchors':list(dict.fromkeys(anchors))[:60]})
        pages[d['id']]=entries
    assert [c['id'] for c in chapters]==list(range(1,13))
    for c in chapters:
        assert all(1<=r['n']<=byname[c['file']]['pages'] for r in c['refs'])
    verification=ROOT/'verification'
    write(OUT/'verification.json',{'hust':read(verification/'hust-java.json'),'mcq':read(ROOT/'data/mcq-java.json')} if (ROOT/'data/mcq-java.json').exists() else {})
    bank=dict(version='1.0.0',chapters=chapters,docs=docs,questions=questions,aliases=aliases)
    write(OUT/'bank.json',bank);write(OUT/'pages.json',pages)
    report(docs,questions)
    print('Documents',len(docs),'pages',sum(d['pages'] for d in docs),'questions',len(questions),'aliases',len(aliases))
    return bank
if __name__=='__main__':build()
