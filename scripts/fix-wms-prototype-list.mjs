import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(__dirname, '../src/components/wms-prototype/WmsPrototypeList.vue');

let content = fs.readFileSync(target, 'utf8');

const PLACEHOLDER_STATUS = '\u8bf7\u9009\u62e9\u72b6\u6001';
const BTN_SEARCH = '\u67e5\u8be2';
const BTN_RESET = '\u91cd\u7f6e';

content = content.replace(
  /placeholder="\\u8bf7\\u9009\\u62e9\\u72b6\\u6001"/,
  `placeholder="${PLACEHOLDER_STATUS}"`
);
content = content.replace(
  /<NButton type="primary" @click="handleSearch">\\u67e5\\u8be2<\/NButton>/,
  `<NButton type="primary" @click="handleSearch">${BTN_SEARCH}</NButton>`
);
content = content.replace(
  /<NButton @click="resetSearch">\\u91cd\\u7f6e<\/NButton>/,
  `<NButton @click="resetSearch">${BTN_RESET}</NButton>`
);

fs.writeFileSync(target, content, 'utf8');
console.log('Fixed WmsPrototypeList.vue template Chinese text');
