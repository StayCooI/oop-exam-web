"""Rebuild the three text-native, keyed MCQ sources; run from project root."""
from pathlib import Path
import re
import argparse
import hashlib
from collections import defaultdict
import json
import unicodedata
import pymupdf

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
FILES = {"int1332": "*Bộ-100*", "it3100-02": "*13_01*", "it3100-06": "*14_01*"}
SOURCE_DIGESTS = {
    "int1332": "ce8c2acf0e96a24fc7f4e8b0d2446de07f8018592e85423eac4da1137c19b6f8",
    "it3100-02": "1bc3d246defa7a68a5ff3f533e5f2560b8fb1d82309824e193684fabd515f060",
    "it3100-06": "b59f7fa6ad2c1c47c0993f97aad106cd73800d79d045cd379313aed1dfa10fbb",
}
KEYS = {
    "it3100-02": "_ B A A I A D A C D F A B A B A|D A A A C B A A B E B B B D _ A B C C C D B B|D F F",
    "it3100-06": "A B D B C C E B E A D B B D C B D B C C D A E B A B A A A F D D F C A C B C A|D C",
}

def clean(s):
    # PDF tabs are encoded as zero-width spaces on some exam pages.
    lines = [x.rstrip().replace('\u200b', '  ') for x in s.splitlines()]
    return '\n'.join(re.sub(r'[^\S\n]{3,}', '  ', l.strip()) if not l.strip().startswith(('/', '{', '}')) and
                     not any(v in l for v in (';', '{', '}', '//')) else l.rstrip()
                     for l in lines if l.strip()).strip()

def compact(s):
    return ' '.join(s.split())

def geometric_text(pg):
    # Start at the printed left margin and restore indentation at PDF tab stops.
    base=28.0
    result=[]
    last_y=0
    last_x=0
    for b in pg.get_text('dict',flags=pymupdf.TEXTFLAGS_TEXT)['blocks']:
        for line in b['lines']:
            s=''.join(span['text'] for span in line['spans'])
            if not s.replace('\u200b','').strip():continue
            x,y,x1,y1=line['bbox']
            if result and abs(y-last_y)<1.7 and x>=last_x-1:
                result[-1]+=' ' * max(1,min(8,round((x-last_x)/4)))+s.strip()
            else:
                indent=max(0,min(24,round((x-base)/9))) if x<230 else 0
                result.append(' '*indent+s)
            last_y=y
            last_x=x1
    return '\n'.join(result)


def records(series, geometric=True):
    f = next((ROOT / 'Materials').rglob(FILES[series]))
    with pymupdf.open(f) as doc:
        if hashlib.sha256(f.read_bytes()).hexdigest() != SOURCE_DIGESTS[series]:
            raise ValueError(f"Changed source: {f.name}. Compare the new edition with its keys before reuse.")
        pages = []
        for page in doc:
            raw = page.get_text()
            layout = geometric_text(page) if geometric else raw
            assert re.sub(r'[\s\u200b]','',raw)==re.sub(r'[\s\u200b]','',layout)
            pages.append(layout if geometric and series!='int1332' else raw)
        if series == "int1332":
            key = dict((int(n), a) for n,a in re.findall(r'(\d+)\s+([A-D])\b',doc[-1].get_text(sort=True)))
            pages = pages[:-1]
        else:
            key = dict(enumerate(KEYS[series].split(),1))
        text = ''
        offsets = []
        for page in pages:
            offsets.append(len(text))
            text += page + '\n'
        def page_at(offset):
            return sum(pos <= offset for pos in offsets)
        pat = r'(?m)^[ \t]*(?:Câu |Q)(\d+)\s*:\s*'
        marks = list(re.finditer(pat,text))
        assert len(marks)==len(key)
        for i,m in enumerate(marks):
            n = i+1
            assert int(m[1])==n
            end = marks[i+1].start() if n<len(marks) else len(text)
            raw = text[m.end():end]
            tail = re.search(r'(?m)^\s*(?:Chương \d|Câu hỏi tổng hợp &)',raw)
            if tail:raw = raw[:tail.start()]
            end = m.end() + len(raw.rstrip()) - 1
            body = clean(raw)
            # Two split tables have left-column code on the following page.
            if (series,n)==('it3100-02',5):
                a = body.index('A. Chương trình')
                mid = body.index('return 0;',a)
                b = body.index('hàm plus(int arr)',mid)
                body = body[:a] + body[mid:b] + '\n' + body[a:mid] + body[b:]
            if (series,n)==('it3100-02',23):
                a=body.index('A. Cả hai')
                b=body.index('public static void main',a)
                body=body[:a]+body[b:]+'\n'+body[a:b]
            choices = r'(?:(?<=\s)|^)([a-d])\.\s*' if series=="int1332" else r'(?:(?<=\s)|^)([A-J])[.)]\s+'
            seg=re.split(choices,body)
            stem=seg[0].strip()
            opts=[s.strip() if any(x in s for x in ['{','\n//']) else compact(s) for s in seg[2::2]]
            labels=''.join(seg[1::2]).upper()
            assert labels == 'ABCDEFGHIJ'[:len(opts)] and len(opts)>=2, (series,n,labels)
            src=dict(file=unicodedata.normalize('NFC',f.name), n=page_at(m.start()),number=str(n))
            if page_at(end)!=src['n']:src['end']=page_at(end)
            if series!='int1332':src.update(term='20251',code=series[-1],period='Giữa kỳ')
            yield n, dict(id=f'{series}-q{n:03}',stem=stem,options=opts,raw=raw.strip(),sources=[src],key=key[n])

def build(partial=False):
    all_questions = []
    checks=defaultdict(list)
    check_file=ROOT/'data/mcq-java.json'
    if check_file.exists():
        runs=json.loads(check_file.read_text())
        for run in runs['records']:
            flags=' '.join(run['flags']) or 'tham số JVM mặc định'
            checks[run['id']].append(f"{runs['version']}, --release 17, {flags}, giới hạn {runs['timeout']} giây. {run['conditions']} {run['result']}")
    for series in FILES:
        notes_path = HERE / (series+'.txt')
        if partial and not notes_path.exists(): continue
        comments = {int(row.split('|')[0]): row.split('|')[1:] for row in notes_path.read_text().splitlines() if row and not row.startswith('#')}
        native=dict(records(series,geometric=False))
        for n,q in records(series):
            original=native[n]
            assert all(re.sub(r'\s+', '', a)==re.sub(r'\s+', '', b) for a,b in zip([q['stem'],*q['options']],[original['stem'],*original['options']],strict=True)), (series,n)
            q['raw']=original['raw']
            if partial and n not in comments: continue
            chapter_ref,topic, verdict, *analysis = comments[n]
            chapter, _, page = chapter_ref.partition(':')
            key=q.pop('key')
            source = key if key!='_' else None
            evidence=[f"Bảng đáp án trong tài liệu, trang PDF {21 if series=='int1332' else 1}, ô câu {n}"+(f" ghi {key.replace('|',' | ')}." if source else " để trống.")]
            evidence.append("Đối chiếu lớp chữ và các dòng theo tọa độ PDF, các ký tự ngoài khoảng trắng và thứ tự phương án khớp.")
            if page: evidence.append(f"Slide Bài {int(chapter):02}, trang PDF {page}.")
            official={
                ('int1332',19):'https://docs.oracle.com/javase/specs/jls/se17/html/jls-6.html#jls-6.6.2',
                ('int1332',45):'https://docs.oracle.com/javase/specs/jls/se17/html/jls-14.html#jls-14.20',
                ('int1332',48):'https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Thread.UncaughtExceptionHandler.html',
                ('int1332',65):'https://docs.oracle.com/javase/specs/jls/se25/html/jls-8.html#jls-8.8.7',
                ('int1332',86):'https://docs.oracle.com/javase/specs/jls/se17/html/jls-5.html#jls-5.1.7',
                ('int1332',100):'https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Collections.html',
            }
            if (series,n) in official: evidence.append('Tham chiếu '+official[series,n])
            if series=='int1332' and 51<=n<=59:
                evidence.append('Java SE 17 API: https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/io/package-summary.html')
            assert len(analysis)==len(q['options']), (series,n,len(analysis),len(q['options']))
            status,_,why=verdict.partition('~')
            status_map={'ok':'supported','conflict':'conflict','review':'review','ai':'supported'}
            letters = (why.split('~',1)[0] if status=='ai' else key).replace('|','').replace('_','')
            correct=[ord(a)-65 for a in letters] if status in ('ok','ai') else []
            assert all(0<=i<len(analysis) for i in correct)
            why=why.split('~',1)[-1] if why else ''
            expl=why or ' '.join(analysis[i] for i in correct)
            q.update(kind='multi' if ('chọn nhiều' in compact(q['stem']).lower() or 'lựa chọn nào' in q['stem'].lower() or len(correct)>1) else 'single',
                     chapter=int(chapter),topics=[topic],transcript='checked',answerStatus=status_map[status],
                     sourceAnswer=source.replace('|',' | ') if source else None,correct=correct,explanation=expl,
                     analysis=analysis,evidence=evidence,issues=[why] if status in ('review','conflict') else [])
            if (series,n) in [('it3100-02',5),('it3100-02',23)]:
                q['evidence'].append("Đối chiếu ảnh hai trang liên tiếp: nối mã ở cột trái rồi đọc phương án cột phải. Bản trích đầu giữ thứ tự khối PDF.")
            if (series,n)==('it3100-02',1):
                q['transcript']='review'
                q['evidence'].append('Hình trang 1 chỉ cho thấy vị trí thụt lề, không phân biệt U+2002 với khoảng trắng ASCII.')
            q['evidence'].extend(checks[q['id']])
            all_questions.append(q)
    # Merge only equivalent stem + all options (same order) + corroborating key.
    merged = {}
    for q in all_questions:
        k=tuple(compact(s) for s in [q['stem'],*q['options']])
        old=merged.get(k)
        if old and (old['sourceAnswer'],old['answerStatus'],old['correct'])==(q['sourceAnswer'],q['answerStatus'],q['correct']):
            old['sources'].extend(q['sources'])
            old.setdefault('otherTranscriptions',[]).append({'source':q['sources'][0], 'raw':q['raw'], 'sourceAnswer':q['sourceAnswer']})
            old.setdefault('aliases',[]).append(q['id'])
        else: merged[(k if old is None else (k,q['id']))]=q
    out=ROOT/'data/mcq.json'
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(list(merged.values()),ensure_ascii=False,indent=2)+'\n')
    print(len(all_questions),'source records;',len(merged),'unique records')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--partial',action='store_true',help='export only already reviewed source rows')
    build(parser.parse_args().partial)
