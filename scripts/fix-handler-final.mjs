import fs from 'fs';

const p = 'src/mock/handler.ts';
let c = fs.readFileSync(p, 'utf8');

// Remove replacement chars only in comment lines, then rewrite all comments from anchors
const commentFixes = [
  [/^\/\*\*[\s\S]*?\*\/\s*\nconst EXACT_HANDLERS/m, '/** \u7cbe\u786e URL \u5904\u7406\u5668 */\nconst EXACT_HANDLERS'],
  [/^  \/\/[^\n]*\n  '\/auth\/login'/m, "  // ---------- \u8ba4\u8bc1 ----------\n  '/auth/login'"],
  [/^  \/\/[^\n]*\n  '\/system\/user\/getInfo'/m, "  // ---------- \u7cfb\u7edf ----------\n  '/system/user/getInfo'"],
  [/^  \/\/[^\n]*\n  '\/system\/dict\/type\/optionselect'/m, "  // ---------- \u5b57\u5178 ----------\n  '/system/dict/type/optionselect'"],
  [/^  \/\/[^\n]*\n  '\/system\/org-scope\/companies'/m, "  // ---------- \u7ec4\u7ec7\u6570\u636e\u57df ----------\n  '/system/org-scope/companies'"],
  [/^  \/\/[^\n]*\n  const dictMatch = url\.match/m, '  // \u5b57\u5178\u6309\u7c7b\u578b\n  const dictMatch = url.match'],
  [/^  \/\/[^\n]*\n  const configKeyMatch = url\.match/m, '  // \u914d\u7f6e\u9879 key\n  const configKeyMatch = url.match'],
  [/^  \/\/[^\n]*\n  const detailMatch = url\.match/m, '  // \u8be6\u60c5\u63a5\u53e3 GET /module/resource/:id\n  const detailMatch = url.match'],
  [/remark: 'Mock [^']*'/, "remark: 'Mock \u8be6\u60c5'"],
  [/^  \/\/[^\n]*\n  if \(method === 'get' && \(url\.includes\('\/items'\)/m, "  // \u5b50\u8d44\u6e90\u5217\u8868 GET\n  if (method === 'get' && (url.includes('/items')"],
  [/^  \/\/[^\n]*\n  if \(url\.includes\('status-count'\)/m, "  // \u72b6\u6001\u7edf\u8ba1\n  if (url.includes('status-count')"],
  [/^  \/\/[^\n]*\n  if \(url\.endsWith\('\/board'\)/m, "  // board \u7c7b\u63a5\u53e3\uff08\u770b\u677f\u7b49\u7279\u6b8a\u7ed3\u6784\uff09\n  if (url.endsWith('/board')"],
  [/^  \/\/[^\n]*\n  if \(url\.endsWith\('\/list'\)/m, "  // \u5206\u9875\u5217\u8868\n  if (url.endsWith('/list')"],
  [/^  \/\/[^\n]*\n  if \(url\.endsWith\('\/export'\)/m, "  // \u5bfc\u51fa\u63a5\u53e3\n  if (url.endsWith('/export')"],
  [
    /^  \/\/[^\n]*\n  if \(\['post', 'put', 'delete', 'patch'\]\.includes\(method\)\) \{\s*\n    if \(url\.includes\('\/upload'\)/m,
    "  // POST/PUT/DELETE \u5199\u64cd\u4f5c\u9ed8\u8ba4\u54cd\u5e94\n  if (['post', 'put', 'delete', 'patch'].includes(method)) {\n    if (url.includes('/upload')"
  ],
  [/\/\*\*\s*\n \*[\s\S]*?\n \*\/\s*\nexport async function resolveMockResponse/m, '/**\n * \u89e3\u6790 Mock \u54cd\u5e94\uff08prototype \u6a21\u5f0f\u4e0b\u66ff\u4ee3 HTTP \u8bf7\u6c42\uff09\n */\nexport async function resolveMockResponse'],
  [/^  \/\/[^\n]*\n  const exactHandler = EXACT_HANDLERS/m, '  // \u7cbe\u786e\u5339\u914d\u8def\u7531\n  const exactHandler = EXACT_HANDLERS'],
  [/^  \/\/[^\n]*\n  const patternResult = matchPattern/m, '  // \u6a21\u5f0f\u5339\u914d\n  const patternResult = matchPattern'],
  [
    /^  \/\/[^\n]*\n  if \(\['post', 'put', 'delete', 'patch'\]\.includes\(method\)\) \{\s*\n    return getBody\(config\)\?\.id/m,
    "  // \u5199\u64cd\u4f5c / \u515c\u5e95\u54cd\u5e94\n  if (['post', 'put', 'delete', 'patch'].includes(method)) {\n    return getBody(config)?.id"
  ],
  [/console\.warn\(`\[Mock\][^`]+`\)/, 'console.warn(`[Mock] \u672a\u5339\u914d\u5230\u5904\u7406\u5668: ${method.toUpperCase()} ${url}`)']
];

for (const [re, rep] of commentFixes) {
  c = c.replace(re, rep);
}

// error messages
c = c.replace(
  /if \(!session\) throw new Error\('[^']*'\);\s*\n    return session;\s*\n  \},\s*\n  '\/wms\/inbound-order\/list'/,
  "if (!session) throw new Error('\u62c6\u67dc\u4f5c\u4e1a\u4f1a\u8bdd\u4e0d\u5b58\u5728');\n    return session;\n  },\n  '/wms/inbound-order/list'"
);
c = c.replace(
  /if \(!session\) throw new Error\('[^']*'\);\s*\n    return session;\s*\n  \}\s*\n\s*if \(method === 'post' && url === '\/wms\/devanning-work\/receive\/box'/,
  "if (!session) throw new Error('\u6309\u7bb1\u6536\u8d27\u5931\u8d25');\n    return session;\n  }\n\n  if (method === 'post' && url === '/wms/devanning-work/receive/box'"
);

fs.writeFileSync(p, c, 'utf8');
const bad = c.split(/\r?\n/).filter(l => /\/\/|\/\*\*|\* /.test(l) && /[\uFFFD]/.test(l));
console.log('fffd in comments', bad.length);
console.log('total fffd', (c.match(/\uFFFD/g) || []).length);
