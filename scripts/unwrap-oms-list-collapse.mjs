import fs from 'node:fs';
import path from 'node:path';

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, files);
    else if (name.endsWith('.vue')) files.push(full);
  }
  return files;
}

const openWrap =
  `<NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search">`;
const closeWrap = `</NCollapseItem></NCollapse>`;

let count = 0;
for (const file of walk('src/views')) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('OmsListPage') || !content.includes(openWrap)) continue;
  const next = content.split(openWrap).join('').split(closeWrap).join('');
  if (next !== content) {
    fs.writeFileSync(file, next, 'utf8');
    count += 1;
    console.log('unwrapped:', path.relative(process.cwd(), file));
  }
}
console.log(`done, unwrapped ${count} files`);
