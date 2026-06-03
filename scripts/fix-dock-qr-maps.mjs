import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const u = (...c) => c.map(x => String.fromCharCode(x)).join('');
const p = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/views/wms/devanning-dock-qr/index.vue');
let s = fs.readFileSync(p, 'utf8');

const statusBlock = `const DOCK_STATUS_MAP: Record<string, { label: string; type: 'default' | 'success' | 'warning' | 'error' }> = {
  IDLE: { label: '${u(0x7a7a, 0x95f2)}', type: 'success' },
  OCCUPIED: { label: '${u(0x5360, 0x7528)}', type: 'warning' },
  DISABLED: { label: '${u(0x505c, 0x7528)}', type: 'default' }
};

const DOCK_TYPE_MAP: Record<string, string> = {
  DEVANNING: '${u(0x62c6, 0x67dc, 0x53e3)}',
  LOADING: '${u(0x88c5, 0x8f66, 0x53e3)}',
  MIXED: '${u(0x6df7, 0x5408)}'
};`;

s = s.replace(/const DOCK_STATUS_MAP[\s\S]*?MIXED: '[^']*'\s*\};/, statusBlock.trim());

s = s.replace(
  /message\.success\([^)]+\)/,
  `message.success('${u(0x94fe, 0x63a5, 0x5df2, 0x590d, 0x5236)}')`
);
s = s.replace(
  /message\.error\('请允许弹出窗口后重试'\)/,
  `message.error('${u(0x8bf7, 0x5141, 0x8bb8, 0x5f39, 0x51fa, 0x7a97, 0x53e3, 0x540e, 0x91cd, 0x8bd5)}')`
);
const copyFail = u(0x590d, 0x5236, 0x5931, 0x8d25, 0xff0c, 0x8bf7, 0x624b, 0x52a8, 0x590d, 0x5236);
let errCount = 0;
s = s.replace(/message\.error\([^)]+\)/g, () => {
  errCount++;
  return errCount === 1 ? `message.error('${copyFail}')` : `message.error('${u(0x8bf7, 0x5141, 0x8bb8, 0x5f39, 0x51fa, 0x7a97, 0x53e3, 0x540e, 0x91cd, 0x8bd5)}')`;
});

s = s.replace(
  /a\.download = `[^`]+`/,
  `a.download = \`${u(0x62c6, 0x67dc, 0x4f5c, 0x4e1a)}_\${d.dockCode}.png\``
);

fs.writeFileSync(p, s, 'utf8');
console.log('fixed maps in dock-qr');
