"""Package only the production build, launcher and validated source documents."""
import hashlib
import json
import shutil
import tempfile
import unicodedata
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
release=ROOT/'release'
build=ROOT/'dist'
assert (build/'index.html').is_file(), 'Run npm run build first'
bank=json.loads((build/'data/bank.json').read_text())
version=json.loads((ROOT/'package.json').read_text())['version']
release.mkdir(exist_ok=True)
target=release/f'Vo-OOP-{version}.zip'
actual={unicodedata.normalize('NFC',p.relative_to(ROOT).as_posix()):p for p in (ROOT/'Materials').rglob('*') if p.is_file()}
with tempfile.TemporaryDirectory(dir=release) as tmp:
    ou=Path(tmp)/target.name
    with zipfile.ZipFile(ou,'w',zipfile.ZIP_DEFLATED,compresslevel=3) as z:
        assets=sorted(p for p in (build/'assets').iterdir() if p.suffix in {'.js','.css','.woff','.woff2','.svg','.png'} and p.is_file())
        for p in [build/'index.html',build/'book.svg',*(build/'data'/name for name in ('bank.json','pages.json','verification.json')),*assets]:
            z.write(p,'web/'+p.relative_to(build).as_posix())
        z.write(ROOT/'BAO-PHU.md','BAO-PHU.md')
        for p in sorted((ROOT/'distribution').iterdir()):
            if p.is_file():z.write(p,p.name)
        names=[]
        for d in bank['docs']:
            p=actual[d['asset']]
            with p.open('rb') as f:assert hashlib.file_digest(f,'sha256').hexdigest()==d['hash'],p
            z.write(p,'web/'+d['asset'])
            names.append(f"{d['pages']} trang/ảnh | {d['asset']} | SHA-256 {d['hash']}")
        z.writestr('DANH-MUC.txt',f'Ứng dụng {version} | Ngân hàng {bank["version"]}\n'+'\n'.join(names)+'\n')
        for name,path in [('Be-Vietnam-Pro','@fontsource/be-vietnam-pro'),('JetBrains-Mono','@fontsource/jetbrains-mono'),('React','react'),('ReactDOM','react-dom'),('Lucide','lucide-react'),('Zod','zod')]:
            for p in (ROOT/'node_modules'/path).glob('LICENSE*'):
                if p.is_file():z.write(p,'licenses/'+name+'.txt')
    with zipfile.ZipFile(ou) as z:assert not z.testzip()
    shutil.move(ou,target)
print(target,target.stat().st_size)
