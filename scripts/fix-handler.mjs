import fs from 'fs';

const p = 'src/mock/handler.ts';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/[\uFFFD]/g, '');
c = c.replace(
  /if \(!session\) throw new Error\('[^']*'\);\s*\n    return session;\s*\n  \},\s*\n  '\/wms\/inbound-order\/list'/,
  "if (!session) throw new Error('\u62c6\u67dc\u4f5c\u4e1a\u4f1a\u8bdd\u4e0d\u5b58\u5728');\n    return session;\n  },\n  '/wms/inbound-order/list'"
);
c = c.replace(
  /if \(!session\) throw new Error\('[^']*'\);\s*\n    return session;\s*\n  \}\s*\n\s*if \(method === 'post' && url === '\/wms\/devanning-work\/receive\/box'/,
  "if (!session) throw new Error('\u6309\u7bb1\u6536\u8d27\u5931\u8d25');\n    return session;\n  }\n\n  if (method === 'post' && url === '/wms/devanning-work/receive/box'"
);
c = c.replace(/\/\/[^\n]*\n  const dictMatch = url\.match/, '// \u5b57\u5178\u6309\u7c7b\u578b\n  const dictMatch = url.match');
c = c.replace(/\/\/[^\n]*\n  if \(url\.endsWith\('\/board'\)/, '// board \u7c7b\u63a5\u53e3\uff08\u770b\u677f\u7b49\u7279\u6b8a\u7ed3\u6784\uff09\n  if (url.endsWith(\'/board\')');
c = c.replace(/\/\/[^\n]*\n  const exactHandler = EXACT_HANDLERS/, '// \u7cbe\u786e\u5339\u914d\u8def\u7531\n  const exactHandler = EXACT_HANDLERS');
c = c.replace(/\/\/[^\n]*\n  if \(\['post', 'put', 'delete', 'patch'\]\.includes\(method\)\) \{\s*\n    return getBody\(config\)\?\.id/, '// \u5199\u64cd\u4f5c / \u515c\u5e95\u54cd\u5e94\n  if ([\'post\', \'put\', \'delete\', \'patch\'].includes(method)) {\n    return getBody(config)?.id');
c = c.replace(/console\.warn\(`\[Mock\][^`]+`\)/, 'console.warn(`[Mock] \u672a\u5339\u914d\u5230\u5904\u7406\u5668: ${method.toUpperCase()} ${url}`)');
fs.writeFileSync(p, c, 'utf8');
console.log('handler fixed, fffd', (c.match(/\uFFFD/g) || []).length);
