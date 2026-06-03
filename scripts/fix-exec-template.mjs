import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const u = (...c) => c.map(x => String.fromCharCode(x)).join('');
const root = path.dirname(fileURLToPath(import.meta.url));

const execPath = path.join(root, '../src/views/wms/devanning-work/execute.vue');
let s = fs.readFileSync(execPath, 'utf8');

s = s.replace(/[\uFFFD]+/g, '\uFF1A');
s = s.replace(/…®ø’¬Î\/ ‰»Î\uFF1Aªıº˛\/œ‰∫≈\uFF1A'/g, `${u(0x626b, 0x7801, 0x7801)}\/${u(0x8f93, 0x5165)}\uFF08${u(0x8d27, 0x4ef6)}\/${u(0x7bb1, 0x53f7)}\uFF09'`);
s = s.replace(/πÒ∫≈\uFF1A\uFF1A/g, '\u67dc\u53f7\uFF1A');

fs.writeFileSync(execPath, s, 'utf8');

const dockPath = path.join(root, '../src/views/wms/devanning-work/dock-task-list.vue');
let d = fs.readFileSync(dockPath, 'utf8');
d = d.replace(/[\uFFFD]+/g, '\uFF1A');
d = d.replace(/label="\uFF1A Dock"/, `label="${u(0x5207, 0x6362)} Dock"`);
d = d.replace(/\uFF1A\uFF1A/g, '\uFF1A');
fs.writeFileSync(dockPath, d, 'utf8');
console.log('fixed');
