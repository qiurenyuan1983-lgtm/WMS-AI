import fs from 'fs';

const p = 'src/mock/handler.ts';
let c = fs.readFileSync(p, 'utf8');

const replacements = [
  ['/** ??? URL ?????? */', '/** \u7cbe\u786e URL \u5904\u7406\u5668 */'],
  ['/** \u7cbe\u786e URL \u5904\u7406\u5668 */', '/** \u7cbe\u786e URL \u5904\u7406\u5668 */'],
  ['// ---------- ??? ----------', '// ---------- \u8ba4\u8bc1 ----------'],
  ['// ---------- ?? ----------', '// ---------- \u7cfb\u7edf ----------'],
  ['// ---------- ??? ----------', '// ---------- \u5b57\u5178 ----------'],
  ['// ---------- ????????? ----------', '// ---------- \u7ec4\u7ec7\u6570\u636e\u57df ----------'],
  ["throw new Error('\u62c6\u67dc\u4f5c\u4e1a\u4f1a\u8bdd\u4e0d\u5b58\u5728')", "throw new Error('\u62c6\u67dc\u4f5c\u4e1a\u4f1a\u8bdd\u4e0d\u5b58\u5728')"],
  ["throw new Error('\u6309\u7bb1\u6536\u8d27\u5931\u8d25')", "throw new Error('\u6309\u7bb1\u6536\u8d27\u5931\u8d25')"],
  ['// ???????', '// \u5b57\u5178\u6309\u7c7b\u578b'],
  ['// ?????? key', '// \u914d\u7f6e\u9879 key'],
  ['// ?????? GET /module/resource/:id', '// \u8be6\u60c5\u63a5\u53e3 GET /module/resource/:id'],
  ["remark: 'Mock ????'", "remark: 'Mock \u8be6\u60c5'"],
  ['// ????????? GET', '// \u5b50\u8d44\u6e90\u5217\u8868 GET'],
  ['// ?????', '// \u72b6\u6001\u7edf\u8ba1'],
  ['// board ?????????????????', '// board \u7c7b\u63a5\u53e3\uff08\u770b\u677f\u7b49\u7279\u6b8a\u7ed3\u6784\uff09'],
  ['// ???????', '// \u5206\u9875\u5217\u8868'],
  ['// ???????', '// \u5bfc\u51fa\u63a5\u53e3'],
  ['// POST/PUT/DELETE ????????????', '// POST/PUT/DELETE \u5199\u64cd\u4f5c\u9ed8\u8ba4\u54cd\u5e94'],
  [
    '* ???? Mock ?????prototype ??????? HTTP ????',
    '* \u89e3\u6790 Mock \u54cd\u5e94\uff08prototype \u6a21\u5f0f\u4e0b\u66ff\u4ee3 HTTP \u8bf7\u6c42\uff09'
  ],
  ['// ??????????', '// \u7cbe\u786e\u5339\u914d\u8def\u7531'],
  ['// ?????', '// \u6a21\u5f0f\u5339\u914d'],
  ['// ?????? / ???????', '// \u5199\u64cd\u4f5c / \u515c\u5e95\u54cd\u5e94'],
  [
    'console.warn(`[Mock] ???????????: ${method.toUpperCase()} ${url}`);',
    'console.warn(`[Mock] \u672a\u5339\u914d\u5230\u5904\u7406\u5668: ${method.toUpperCase()} ${url}`);'
  ]
];

// Replace broken comment lines by regex anchors
c = c.replace(/^\/\*\*[^*]+\*\/\s*\nconst EXACT_HANDLERS/m, '/** \u7cbe\u786e URL \u5904\u7406\u5668 */\nconst EXACT_HANDLERS');
c = c.replace(/^  \/\/ ----------[^\n]+\n  '\/auth\/login'/m, "  // ---------- \u8ba4\u8bc1 ----------\n  '/auth/login'");
c = c.replace(/^  \/\/ ----------[^\n]+\n  '\/system\/user\/getInfo'/m, "  // ---------- \u7cfb\u7edf ----------\n  '/system/user/getInfo'");
c = c.replace(/^  \/\/ ----------[^\n]+\n  '\/system\/dict\/type\/optionselect'/m, "  // ---------- \u5b57\u5178 ----------\n  '/system/dict/type/optionselect'");
c = c.replace(/^  \/\/ ----------[^\n]+\n  '\/system\/org-scope\/companies'/m, "  // ---------- \u7ec4\u7ec7\u6570\u636e\u57df ----------\n  '/system/org-scope/companies'");

c = c.replace(/^  \/\/[^\n]*\n  const dictMatch = url\.match/m, '  // \u5b57\u5178\u6309\u7c7b\u578b\n  const dictMatch = url.match');
c = c.replace(/^  \/\/[^\n]* key\n  const configKeyMatch/m, '  // \u914d\u7f6e\u9879 key\n  const configKeyMatch');
c = c.replace(
  /^  \/\/[^\n]*\n  const detailMatch = url\.match/m,
  '  // \u8be6\u60c5\u63a5\u53e3 GET /module/resource/:id\n  const detailMatch = url.match'
);
c = c.replace(/remark: 'Mock [^']*'/, "remark: 'Mock \u8be6\u60c5'");
c = c.replace(/^  \/\/[^\n]* GET\n  if \(method === 'get' && \(url\.includes\('\/items'\)/m, "  // \u5b50\u8d44\u6e90\u5217\u8868 GET\n  if (method === 'get' && (url.includes('/items')");
c = c.replace(/^  \/\/[^\n]*\n  if \(url\.includes\('status-count'\)/m, "  // \u72b6\u6001\u7edf\u8ba1\n  if (url.includes('status-count')");
c = c.replace(/^  \/\/[^\n]*\n  if \(url\.endsWith\('\/board'\)/m, "  // board \u7c7b\u63a5\u53e3\uff08\u770b\u677f\u7b49\u7279\u6b8a\u7ed3\u6784\uff09\n  if (url.endsWith('/board')");
c = c.replace(/^  \/\/[^\n]*\n  if \(url\.endsWith\('\/list'\)/m, "  // \u5206\u9875\u5217\u8868\n  if (url.endsWith('/list')");
c = c.replace(/^  \/\/[^\n]*\n  if \(url\.endsWith\('\/export'\)/m, "  // \u5bfc\u51fa\u63a5\u53e3\n  if (url.endsWith('/export')");
c = c.replace(/^  \/\/ POST\/PUT\/DELETE[^\n]*\n  if \(\['post'/m, "  // POST/PUT/DELETE \u5199\u64cd\u4f5c\u9ed8\u8ba4\u54cd\u5e94\n  if (['post'");
c = c.replace(/^\ \*[^\n]+\n \*\/\nexport async function resolveMockResponse/m, ' * \u89e3\u6790 Mock \u54cd\u5e94\uff08prototype \u6a21\u5f0f\u4e0b\u66ff\u4ee3 HTTP \u8bf7\u6c42\uff09\n */\nexport async function resolveMockResponse');
c = c.replace(/^  \/\/[^\n]*\n  const exactHandler = EXACT_HANDLERS/m, '  // \u7cbe\u786e\u5339\u914d\u8def\u7531\n  const exactHandler = EXACT_HANDLERS');
c = c.replace(/^  \/\/[^\n]*\n  const patternResult = matchPattern/m, '  // \u6a21\u5f0f\u5339\u914d\n  const patternResult = matchPattern');
c = c.replace(/^  \/\/[^\n]*\n  if \(\['post', 'put', 'delete', 'patch'\]\.includes\(method\)\) \{\s*\n    return getBody\(config\)\?\.id/m, "  // \u5199\u64cd\u4f5c / \u515c\u5e95\u54cd\u5e94\n  if (['post', 'put', 'delete', 'patch'].includes(method)) {\n    return getBody(config)?.id");
c = c.replace(/console\.warn\(`\[Mock\][^`]+`\)/, 'console.warn(`[Mock] \u672a\u5339\u914d\u5230\u5904\u7406\u5668: ${method.toUpperCase()} ${url}`)');

fs.writeFileSync(p, c, 'utf8');
const lines = c.split(/\r?\n/);
console.log(lines[28]);
console.log(lines[30]);
console.log('bad comment lines', lines.filter(l => /\/\/|\/\*\*/.test(l) && /[^\x00-\x7F]/.test(l) && !/[\u4e00-\u9fff]/.test(l)).length);
