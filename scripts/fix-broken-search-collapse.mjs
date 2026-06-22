import fs from 'node:fs';
import path from 'node:path';

const brokenPrefix =
  `<NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><div class="h-full flex flex-col gap-12px overflow-hidden">`;
const fixedPrefix = `<div class="h-full flex flex-col gap-12px overflow-hidden">`;

const files = [
  'src/views/oms/local-order/index.vue',
  'src/views/oms/ltl-order/index.vue',
  'src/views/oms/platform-order/index.vue',
  'src/views/tms/driver/index.vue',
  'src/views/tms/exception/index.vue',
  'src/views/tms/freight-settlement/index.vue',
  'src/views/tms/log/index.vue',
  'src/views/tms/pod/index.vue',
  'src/views/tms/vehicle/index.vue'
];

function wrapSearchDiv(content) {
  const marker = '<NButton type="primary" @click="handleSearch">搜索</NButton>';
  if (!content.includes(marker)) return content;

  const lines = content.split(/\r?\n/);
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.includes('<div class="') && line.includes('flex') && !line.includes('NCollapse')) {
      const block = [line];
      let j = i + 1;
      while (j < lines.length && !lines[j].includes(marker)) {
        block.push(lines[j]);
        j += 1;
      }
      if (j < lines.length) {
        block.push(lines[j]);
        j += 1;
        while (j < lines.length && !lines[j].trim().startsWith('</div>')) {
          block.push(lines[j]);
          j += 1;
        }
        if (j < lines.length) {
          block.push(lines[j]);
          const indent = line.match(/^(\s*)/)?.[1] ?? '';
          out.push(`${indent}<NCollapse default-expanded-names="['search']">`);
          out.push(`${indent}  <NCollapseItem title="搜索" name="search">`);
          out.push(...block);
          out.push(`${indent}  </NCollapseItem>`);
          out.push(`${indent}</NCollapse>`);
          i = j + 1;
          continue;
        }
      }
    }
    out.push(line);
    i += 1;
  }

  return out.join('\n');
}

let count = 0;
for (const file of files) {
  const full = path.resolve(file);
  let content = fs.readFileSync(full, 'utf8');
  if (!content.includes(brokenPrefix)) continue;

  content = content.split(brokenPrefix).join(fixedPrefix);
  content = wrapSearchDiv(content);
  fs.writeFileSync(full, content, 'utf8');
  count += 1;
  console.log('fixed:', file);
}

console.log(`done, fixed ${count} files`);
