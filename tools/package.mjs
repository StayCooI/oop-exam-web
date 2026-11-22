import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const localPython = process.platform === 'win32'
  ? resolve(root, '.venv', 'Scripts', 'python.exe')
  : resolve(root, '.venv', 'bin', 'python');
const candidates = [
  ...(existsSync(localPython) ? [[localPython, []]] : []),
  ...(process.platform === 'win32' ? [['py', ['-3']]] : [['python3', []]]),
  ['python', []],
];

for (const [command, prefix] of candidates) {
  const result = spawnSync(command, [...prefix, 'tools/package_release.py'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.error?.code === 'ENOENT') continue;
  if (result.error) {
    console.error(`Không chạy được ${command}: ${result.error.message}`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

console.error('Cần Python 3 để tạo ZIP. Cài Python 3 rồi chạy lại npm run package.');
process.exit(1);
