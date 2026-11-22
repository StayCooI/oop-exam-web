"""Replay only the 48 reviewed, pinned language examples. Never execute PDF/import data."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[2]
CASES = Path(__file__).with_name("java-cases.json")
APPROVED_SHA256 = "840052113e39167e48d06bd734857f56b0bcc829cc1fa378192f88ba59baefa9"
TIME_LIMIT = 7

def execute(case, jdk):
    with tempfile.TemporaryDirectory(prefix='oop-language-') as temp:
        cwd=Path(temp)
        filename = case['className'] + '.java'
        (cwd / filename).write_text(case['code'], encoding='utf-8')
        env={k:v for k,v in os.environ.items() if k not in ('JDK_JAVA_OPTIONS','JAVA_TOOL_OPTIONS','_JAVA_OPTIONS','CLASSPATH')}
        def run(cmd):
            return subprocess.run(cmd,cwd=cwd,capture_output=True,text=True,timeout=TIME_LIMIT,env=env)
        flags=['-J-Duser.language=en','-J-Duser.country=US','-encoding','UTF-8','-proc:none','--release','17']
        comp=run([jdk/'javac',*flags,filename])
        expected=case['expected']
        result='Biên dịch thành công.'
        if expected.startswith('compile:'):
            why=expected.split(':',1)[1]
            assert (comp.returncode==0 if why=='ok' else comp.returncode!=0 and why in comp.stderr),(case['id'],expected,comp.stderr)
            if comp.returncode:result=next(line for line in comp.stderr.splitlines() if 'error:' in line)
        else:
            assert comp.returncode==0,(case['id'],comp.stderr)
            execution=run([jdk/'java','-Xmx48m',*case['args'],'-cp','.',case['className']])
            if expected.startswith('runtime:'):
                why=expected.split(':',1)[1]
                assert execution.returncode!=0 and why in execution.stderr,(case['id'],execution)
                result=execution.stderr.splitlines()[0]
            else:
                assert execution.returncode==0 and execution.stdout.rstrip('\n')==expected,(case['id'],expected,execution)
                result='stdout = '+json.dumps(execution.stdout.rstrip('\n'),ensure_ascii=False)
        return dict(id=case['id'],conditions=case['conditions'],flags=case['args'],result=result)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--jdk',required=True,type=Path,help='JDK 17 home')
    args=parser.parse_args()
    binaries=args.jdk/'bin'
    version=subprocess.check_output([binaries/'javac','-version'],text=True).strip()
    if not version.startswith('javac 17.'):raise ValueError('Use a JDK 17 runtime for this replay.')
    if hashlib.sha256(CASES.read_bytes()).hexdigest()!=APPROVED_SHA256:
        raise ValueError('The set of reviewed examples has changed. Review before executing.')
    cases=json.loads(CASES.read_text())
    with ThreadPoolExecutor(max_workers=3) as workers:
        results=list(workers.map(lambda case:execute(case,binaries),cases))
    output=dict(version=version,release=17,timeout=TIME_LIMIT,records=results)
    (ROOT/'data/mcq-java.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
    print(len(results),'cases passed with',version)
