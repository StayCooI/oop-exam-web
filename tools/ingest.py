"""Read-only source inventory and atomic per-page checkpoints. Run from repository root."""
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
from collections import Counter
import hashlib
import json
import os
import re
import unicodedata
import pymupdf as pdf

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.cache' / 'pages-v2'
DATA = ROOT / 'data'
MODELS = str(ROOT / '.venv/share/tessdata')
NFC = lambda s: unicodedata.normalize('NFC', s)


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix('.new')
    temp.write_text(json.dumps(value, ensure_ascii=False), encoding='utf-8')
    temp.replace(path)


def examine(path):
    sha = hashlib.file_digest(path.open('rb'), 'sha256').hexdigest()
    key = 'd-' + sha[:16]
    cache = CACHE / key
    pdf.TOOLS.mupdf_display_errors(False)
    pdf.TOOLS.mupdf_display_warnings(False)
    group = 'slide' if path.parent.name == 'Slide' else path.parent.name
    doc = dict(id=key, name=NFC(path.name), path=NFC(path.relative_to(ROOT).as_posix()),
               group=group, hash=sha, size=path.stat().st_size, ext=path.suffix.lower()[1:])
    summaries = []
    with pdf.open(path) as opened:
        for num in range(len(opened)):
            record = cache / f'{num+1:04}.json'
            if record.exists():
                previous = json.loads(record.read_text())
                if previous['status'] != 'error':
                    summaries.append(previous['meta'])
                    continue
            pdf.TOOLS.mupdf_warnings()
            raw = layout = ocr = retry = ''
            try:
                page = opened[num]
                raw = page.get_text()
                layout = page.get_text(sort=True)
                sig = hashlib.sha256(page.get_pixmap(matrix=pdf.Matrix(.4,.4), colorspace=pdf.csGRAY).samples).hexdigest()
                area = max(1, page.rect.get_area())
                images = page.get_image_info()
                ratio = sum((pdf.Rect(i['bbox']) & page.rect).get_area() / area for i in images)
                native = len(raw.strip())
                bad = '\ufffd' in raw and raw.count('\ufffd') > native * .01
                masked = len(re.findall(r'\(cid:\d+\)', raw)) > 2
                # Photographs, tiled scans and rasterised code/answer choices need a separate reading.
                needs_ocr = native < 35 or bad or masked or (group != 'slide' and ratio > .09 and bool(images))
                if needs_ocr:
                    scale = min(235, int(2700*72/max(page.rect.width,page.rect.height)))
                    layer = page.get_textpage_ocr(language='vie+eng', full=True, dpi=max(72,scale), tessdata=MODELS)
                    ocr = page.get_text(textpage=layer, sort=True)
                    if len(ocr.strip()) < 20 and native < 35 and images:
                        pix = page.get_pixmap(matrix=pdf.Matrix(min(2,1800/max(page.rect)),min(2,1800/max(page.rect))),colorspace=pdf.csGRAY)
                        pix.gamma_with(.7)
                        pix = pdf.Pixmap(pdf.csRGB, pix)
                        with pdf.open(stream=pix.pdfocr_tobytes(language='vie+eng', tessdata=MODELS),filetype='pdf') as extra:
                            retry = extra[0].get_text(sort=True)
                mode = 'scan' if native < 35 and images else 'mixed' if needs_ocr and images else 'text' if native else 'empty'
                status = 'ok' if max(len(raw.strip()),len(ocr.strip()),len(retry.strip())) >= 15 else 'unclear'
                words = [list(w[:5]) for w in page.get_text('words')]
                notes = pdf.TOOLS.mupdf_warnings()[:600]
                meta = dict(n=num+1,mode=mode,status=status,ocr=needs_ocr,warn=bool(notes),visual=sig)
                write(record,dict(status=status,meta=meta,native=raw,layout=layout,ocr=ocr,retry=retry,words=words,warning=notes))
            except Exception as exc:
                meta = dict(n=num+1,mode='error',status='error',ocr=False,warn=True,visual='')
                write(record,dict(status='error',meta=meta,native=raw,layout=layout,ocr=ocr,retry=retry,words=[],warning=str(exc)))
            summaries.append(meta)
    doc['pages']=len(summaries)
    doc['fingerprint']=hashlib.sha256(''.join(i['visual'] for i in summaries).encode()).hexdigest() if all(i['visual'] for i in summaries) else None
    doc['modes']=dict(Counter(i['mode'] for i in summaries))
    doc['counts']=dict(Counter(i['status'] for i in summaries))
    doc['ocr']=sum(i['ocr'] for i in summaries)
    doc['warnings']=sum(i['warn'] for i in summaries)
    print(doc['name'],doc['pages'],doc['modes'],flush=True)
    return doc


if __name__ == '__main__':
    paths=sorted(p for p in (ROOT/'Materials').rglob('*') if p.suffix.lower() in ('.pdf','.jpg','.jpeg','.png'))
    # A given hash has a single writer even when the same bytes appear at two paths.
    groups={}
    for path in paths:
        with path.open('rb') as f: sha=hashlib.file_digest(f,'sha256').hexdigest()
        groups.setdefault(sha,[]).append(path)
    with ProcessPoolExecutor(max_workers=min(5,os.cpu_count() or 1)) as pool:
        canonical=list(pool.map(examine,(members[0] for members in groups.values()),chunksize=1))
    docs=[]
    for doc,paths in zip(canonical,groups.values()):
        for i,path in enumerate(paths):
            clone={**doc,'id':doc['id'] if not i else doc['id']+'-'+hashlib.sha256(NFC(path.name).encode()).hexdigest()[:6],
                   'cache':doc['id'],'name':NFC(path.name),'path':NFC(path.relative_to(ROOT).as_posix())}
            docs.append(clone)
    write(DATA/'inventory.json',docs)
    print('Inventory',len(docs),'files',sum(d['pages'] for d in docs),'pages')
