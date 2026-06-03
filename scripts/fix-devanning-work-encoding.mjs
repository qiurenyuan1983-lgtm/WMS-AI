import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const u = (...c) => c.map(x => String.fromCharCode(x)).join('');

const dockPath = path.join(root, 'src/views/wms/devanning-work/dock-task-list.vue');
let dock = fs.readFileSync(dockPath, 'utf8');
dock = dock
  .replace(/render: row => row\.devanningStartTime \|\| '[^']*'/g, "render: row => row.devanningStartTime || '\u2014'")
  .replace(/render: row => row\.devanningFinishTime \|\| '[^']*'/g, "render: row => row.devanningFinishTime || '\u2014'")
  .replace(/label: '[^']*详情'/, `label: '${u(0x67e5, 0x770b, 0x8be6, 0x60c5)}'`)
  .replace(/Dock.{0,4}\{\{ dockLabel \}\}/, `Dock\uFF1A{{ dockLabel }}`)
  .replace(/label="[^"]*Dock"/, `label="${u(0x5207, 0x6362)} Dock"`)
  .replace(/条任务.{0,4}双击/, `${u(0x6761, 0x4efb, 0x52a1)}\uFF1B${u(0x53cc, 0x51fb, 0x8fdb, 0x5165)}`);
fs.writeFileSync(dockPath, dock, 'utf8');

const execPath = path.join(root, 'src/views/wms/devanning-work/execute.vue');
let exec = fs.readFileSync(execPath, 'utf8');
exec = exec
  .replace(/window\.\$message\?\.warning\('[^']+'\)/, `window.$message?.warning('${u(0x8bf7, 0x626b, 0x7f29, 0x6216, 0x8f93, 0x5165, 0x7bb1, 0x53f7, 0x6216, 0x8d27, 0x4ef6, 0x53f7)}')`)
  .replace(/柜号.{0,4}\{\{ session/, `柜号\uFF1A{{ session`)
  .replace(/分组.{0,4}' \+ currentGroup/, `分组\uFF1A' + currentGroup`)
  .replace(/货物订单号.{0,4}<\/span>/, `货物订单号\uFF1A</span>`)
  .replace(/货件号.{0,4}<\/span>/, `货件号\uFF1A</span>`)
  .replace(/join\('[^']{1,4}'\)/g, "join('\u3001')")
  .replace(/\|\| '[^']{1,2}'/g, "|| '\u2014'")
  .replace(/扫空码\/输入.{0,8}货件/, `${u(0x626b, 0x7801, 0x7801)}\/${u(0x8f93, 0x5165)}\uFF08${u(0x8d27, 0x4ef6)}\/${u(0x7bb1, 0x53f7)}\uFF09`);
fs.writeFileSync(execPath, exec, 'utf8');
console.log('fixed encoding');
