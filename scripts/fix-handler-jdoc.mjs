import fs from 'fs';
const p = 'src/mock/handler.ts';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/\/\*\*\s*\n \*[^\n]+\n \*\//, '/**\n * \u89e3\u6790 Mock \u54cd\u5e94\uff08prototype \u6a21\u5f0f\u4e0b\u66ff\u4ee3 HTTP \u8bf7\u6c42\uff09\n */');
fs.writeFileSync(p, c, 'utf8');
console.log('done');
