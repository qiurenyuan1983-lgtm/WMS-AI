import fs from 'fs';
import path from 'path';

const root = path.resolve('src');

function fix(rel, fn) {
  const fp = path.join(root, rel);
  let c = fs.readFileSync(fp, 'utf8');
  const o = c;
  c = fn(c);
  if (c !== o) {
    fs.writeFileSync(fp, c, 'utf8');
    console.log('fixed', rel);
  }
}

function rep(c, from, to) {
  return c.split(from).join(to);
}

// --- small files ---
fix('mock/enable.ts', c =>
  c.replace(/^\/\*\*[^*]*\*\//m, '/** \u662f\u5426\u542f\u7528\u524d\u7aef Mock\uff08\u539f\u578b\u6a21\u5f0f\uff0c\u4e0d\u8bf7\u6c42\u540e\u7aef\uff09 */')
);

fix('mock/auth-routes.ts', c =>
  c.replace(
    /^(\s*)\/\/[^\n]*/m,
    '$1// hiddenNames \u4e00\u5e76\u6302\u8f7d\u4e3a\u5b50\u8def\u7531\uff0c\u8be6\u60c5\u9875\u8d70 Tab \u4e14\u9ad8\u4eae\u5bf9\u5e94\u83dc\u5355\u9879'
  )
);

fix('views/wms/_prototype/configs.ts', c =>
  c.replace(
    /^\/\*\* PRD V1\.0 .*\*\//m,
    '/** PRD V1.0 \u4ed3\u5e93\u6a21\u5757\u5217\u8868\u9875\u539f\u578b\u914d\u7f6e\uff08Mock \u7528\uff09 */'
  )
);

fix('mock/utils.ts', c => {
  let r = c;
  r = r.replace(/(\/\*\*)[^*]+(\*\/\s*\nexport function mockPage)/, '$1 \u5206\u9875\u5217\u8868\u6570\u636e $2');
  r = r.replace(/(\/\*\*)[^*]+(\*\/\s*\nexport function mockEmptyPage)/, '$1 \u7a7a\u5206\u9875 $2');
  r = r.replace(/(\/\*\*)[^*]+(\*\/\s*\nexport function mockTree)/, '$1 \u6811\u5f62\u5217\u8868\uff08\u90e8\u95e8/\u83dc\u5355\u7b49\uff09 $2');
  r = r.replace(/(\/\*\*)[^*]+(\*\/\s*\nexport function mockExportBlob)/, '$1 \u5bfc\u51fa\u6587\u4ef6 Blob $2');
  r = r.replace(/(\/\*\*)[^*]+(\*\/\s*\nexport function mockDelay)/, '$1 \u6a21\u62df\u7f51\u7edc\u5ef6\u8fdf $2');
  return r;
});

// --- wms.ts mock data ---
fix('mock/data/wms.ts', c => {
  let r = c;
  const pairs = [
    ["'FedEx??'", "'FedEx\u533a'"],
    ["'A??'", "'A\u533a'"],
    ["'???????'", "'\u5f02\u5e38\u6682\u5b58\u533a'"],
    ["'?????????'", "'\u5feb\u9012\u5730\u9762\u6682\u5b58\u533a'"],
    ["'???????'", "'\u5f02\u5e38\u8d27\u7269\u6682\u5b58'"],
    ["'?????? A'", "'\u6f14\u793a\u5ba2\u6237 A'"],
    ["'?????? B'", "'\u6f14\u793a\u5ba2\u6237 B'"],
    ["'?????? C'", "'\u6f14\u793a\u5ba2\u6237 C'"],
    ["'?????? D'", "'\u6f14\u793a\u5ba2\u6237 D'"],
    ["'????????'", "'\u53c9\u8f66\u62c6\u67dc\u8fdb\u884c\u4e2d'"],
    ["'??????'", "'\u6574\u67dc\u6d77\u8fd0'"],
    ["'????'", "'\u5f20\u5ba2\u670d'"],
    ["'?????????'", "'\u90e8\u5206\u7bb1\u91cf\u5f02\u5e38'"],
    ["'???????????'", "'\u5df2\u5206\u914d\u5f85\u51fa\u5e93'"]
  ];
  for (const [a, b] of pairs) r = rep(r, a, b);
  r = r.replace(/\/\*\* Mock[^*]+\*\//, '/** Mock \u5185\u5b58\u62c6\u67dc\u5355\u72b6\u6001\u6d41\u8f6c\uff08\u539f\u578b\u6f14\u793a\u7528\uff09 */');
  // context-specific remarks still using generic placeholder
  r = r.replace("id: 60404,\n    orderNo: 'DV-2026-0004'", m => m); // noop anchor
  r = r.replace(/(id: 60404,[\s\S]*?)remark: '\u6574\u67dc\u6d77\u8fd0'/, '$1remark: \'\u5f85\u5b89\u6392\u63d0\u67dc\'');
  r = r.replace(/(id: 60405,[\s\S]*?)remark: '\u6574\u67dc\u6d77\u8fd0'/, '$1remark: \'\u62c6\u67dc\u5df2\u5b8c\u6210\'');
  r = r.replace(/(id: 60406,[\s\S]*?)remark: '\u6574\u67dc\u6d77\u8fd0'/, '$1remark: \'\u62c6\u67dc\u8fc7\u7a0b\u6709\u5f02\u5e38\'');
  r = r.replace(/(id: 60407,[\s\S]*?)remark: '\u6574\u67dc\u6d77\u8fd0'/, '$1remark: \'\u5ba2\u6237\u53d6\u6d88\u8ba2\u5355\'');
  // fix FFFD corrupted strings from prior bad fix
  r = r.replace(/[\uFFFD]+/g, '');
  r = r.replace(/zoneName: 'FedEx\u533a'/g, "zoneName: 'FedEx\u533a'");
  return r;
});

// --- handler.ts ---
fix('mock/handler.ts', c => {
  let r = c.replace(/[\uFFFD]+/g, '');
  r = r.replace('/** ??? URL ???? */', '/** \u7cbe\u786e URL \u5904\u7406\u5668 */');
  let n = 0;
  r = r.replace(/\/\/ ---------- \?+ ----------/g, () => {
    n += 1;
    if (n === 1) return '// ---------- \u8ba4\u8bc1 ----------';
    if (n === 2) return '// ---------- \u7cfb\u7edf ----------';
    if (n === 3) return '// ---------- \u5b57\u5178 ----------';
    return '// ---------- \u7ec4\u7ec7\u6570\u636e\u57df ----------';
  });
  r = rep(r, '// ---------- ??????? ----------', '// ---------- \u7ec4\u7ec7\u6570\u636e\u57df ----------');
  r = rep(r, "throw new Error('????????????')", "throw new Error('\u62c6\u67dc\u4f5c\u4e1a\u4f1a\u8bdd\u4e0d\u5b58\u5728')");
  r = rep(r, "throw new Error('??????')", "throw new Error('\u6309\u7bb1\u6536\u8d27\u5931\u8d25')");
  r = rep(r, '// ???????', '// \u5b57\u5178\u6309\u7c7b\u578b');
  r = rep(r, '// ???? key', '// \u914d\u7f6e\u9879 key');
  r = rep(r, '// ???? GET /module/resource/:id', '// \u8be6\u60c5\u63a5\u53e3 GET /module/resource/:id');
  r = rep(r, "remark: 'Mock ????'", "remark: 'Mock \u8be6\u60c5'");
  r = rep(r, '// ????? GET', '// \u5b50\u8d44\u6e90\u5217\u8868 GET');
  r = rep(r, '// ?????', '// \u72b6\u6001\u7edf\u8ba1');
  r = rep(r, '// board??????????????????', '// board \u7c7b\u63a5\u53e3\uff08\u770b\u677f\u7b49\u7279\u6b8a\u7ed3\u6784\uff09');
  // two list/export comments
  let m = 0;
  r = r.replace(/\/\/ \?\?\?\?/g, () => {
    m += 1;
    return m === 1 ? '// \u5206\u9875\u5217\u8868' : '// \u5bfc\u51fa\u63a5\u53e3';
  });
  r = rep(r, '// POST/PUT/DELETE ???????', '// POST/PUT/DELETE \u5199\u64cd\u4f5c\u9ed8\u8ba4\u54cd\u5e94');
  r = rep(
    r,
    '* ???? Mock ??????????? HTTP ????',
    '* \u89e3\u6790 Mock \u54cd\u5e94\uff08prototype \u6a21\u5f0f\u4e0b\u66ff\u4ee3 HTTP \u8bf7\u6c42\uff09'
  );
  r = rep(r, '// ??????????', '// \u7cbe\u786e\u5339\u914d\u8def\u7531');
  r = rep(r, '// ?????', '// \u6a21\u5f0f\u5339\u914d');
  r = rep(r, '// ??????????? / ??????', '// \u5199\u64cd\u4f5c / \u515c\u5e95\u54cd\u5e94');
  r = rep(
    r,
    'console.warn(`[Mock] ??????????????: ${method.toUpperCase()} ${url}`);',
    'console.warn(`[Mock] \u672a\u5339\u914d\u5230\u5904\u7406\u5668: ${method.toUpperCase()} ${url}`);'
  );
  return r;
});

// --- vue files ---
fix('components/wms-prototype/WmsPrototypeList.vue', c => {
  let r = c.replace(/[\uFFFD]+/g, '');
  r = rep(r, 'protoMsg(`${btn}??${row.orderNo || row.taskNo || row.id}`);', 'protoMsg(`${btn} \u00b7 ${row.orderNo || row.taskNo || row.id}`);');
  r = rep(r, 'protoMsg(`${btn}  ${row.orderNo || row.taskNo || row.id}`);', 'protoMsg(`${btn} \u00b7 ${row.orderNo || row.taskNo || row.id}`);');
  r = r.replace(/@click="handleSearch">[^<]*<\/NButton>/, '@click="handleSearch">\u67e5\u8be2</NButton>');
  r = r.replace(/@click="resetSearch">[^<]*<\/NButton>/, '@click="resetSearch">\u91cd\u7f6e</NButton>');
  r = rep(r, "title: '²Ù×÷',", "title: '\u64cd\u4f5c',");
  r = r.replace(/placeholder="[^"]*"/, 'placeholder="\u8bf7\u9009\u62e9"');
  r = rep(r, '`[Ô­ÐÍ] ${msg}`', '`[\u539f\u578b] ${msg}`');
  r = rep(r, '`[] ${msg}`', '`[\u539f\u578b] ${msg}`');
  return r;
});

fix('views/wms/devanning-dock-qr/index.vue', c => {
  let r = c.replace(/[\uFFFD]+/g, '');
  r = r.replace(/\?\? \{\{ d\.zoneCode \}\}/g, '\u00b7 {{ d.zoneCode }}');
  r = rep(r, '\u4eba\u5de5\u62c6\u67dc ?? Dock', '\u4eba\u5de5\u62c6\u67dc \u00b7 Dock');
  return r;
});

fix('views/wms/devanning-order/modules/devanning-order-detail-drawer.vue', c => {
  let r = c.replace(/[\uFFFD]+/g, '');
  r = rep(r, '\u62c6\u67dc\u5355\u53f7', '\u62c6\u67dc\u5355\u53f7\uff1a');
  r = rep(r, '\u67dc\u53f7', '\u67dc\u53f7\uff1a');
  return r;
});

fix('views/wms/devanning-work/modules/pallet-history-drawer.vue', c => {
  let r = c;
  const pairs = [
    ["window.$message?.error('');", "window.$message?.error('\u6258\u76d8\u4e0d\u5b58\u5728\u6216\u5df2\u5220\u9664');"],
    ['<title> - ${row.palletNo}</title>', '<title>\u6258\u76d8\u6807\u7b7e - ${row.palletNo}</title>'],
    ['<div class="row">${row.cargoOrderNo}</div>', '<div class="row">\u8d27\u7269\u5355\uff1a${row.cargoOrderNo}</div>'],
    ['<div class="row">${row.groupCode}</div>', '<div class="row">\u5206\u7ec4\uff1a${row.groupCode}</div>'],
    ['<div class="row">${row.receiveQty}', '<div class="row">\u6536\u8d27\uff1a${row.receiveQty}'],
    ["window.$message?.success('');", "window.$message?.success('\u5df2\u5220\u9664\u6258\u76d8\uff0c\u6536\u8d27\u6570\u91cf\u5df2\u56de\u9000\uff0c\u53ef\u91cd\u65b0\u6536\u8d27');"],
    ["{ title: '', key: 'palletNo'", "{ title: '\u6258\u76d8\u53f7', key: 'palletNo'"],
    ["{ title: '', key: 'cargoOrderNo'", "{ title: '\u8d27\u7269\u5355', key: 'cargoOrderNo'"],
    ["{ title: '', key: 'groupCode'", "{ title: '\u5206\u7ec4', key: 'groupCode'"],
    ["title: '',", "title: '\u6536\u8d27\u91cf',"],
    ["{ title: '', key: 'boxQty'", "{ title: '\u7bb1\u6570', key: 'boxQty'"],
    ["{ title: '', key: 'createTime'", "{ title: '\u65f6\u95f4', key: 'createTime'"],
    ["title: '',", "title: '\u64cd\u4f5c',"],
  ];
  // strip FFFD and apply known replacements via regex
  r = r.replace(/[\uFFFD]+/g, '');
  r = r.replace(/window\.\$message\?\.error\('[^']*'\)/, "window.$message?.error('\u6258\u76d8\u4e0d\u5b58\u5728\u6216\u5df2\u5220\u9664')");
  r = r.replace(/<title>[^<]* - \$\{row\.palletNo\}<\/title>/, '<title>\u6258\u76d8\u6807\u7b7e - ${row.palletNo}</title>');
  r = r.replace(/<div class="row">[^<]*\$\{row\.cargoOrderNo\}<\/div>/, '<div class="row">\u8d27\u7269\u5355\uff1a${row.cargoOrderNo}</div>');
  r = r.replace(/<div class="row">[^<]*\$\{row\.groupCode\}<\/div>/, '<div class="row">\u5206\u7ec4\uff1a${row.groupCode}</div>');
  r = r.replace(/<div class="row">[^<]*\$\{row\.receiveQty\}/, '<div class="row">\u6536\u8d27\uff1a${row.receiveQty}');
  r = r.replace(/\/ \$\{row\.boxQty\} [^<]*<\/div>/, ' / ${row.boxQty} \u7bb1</div>');
  r = r.replace(/window\.\$message\?\.success\('[^']*'\)/, "window.$message?.success('\u5df2\u5220\u9664\u6258\u76d8\uff0c\u6536\u8d27\u6570\u91cf\u5df2\u56de\u9000\uff0c\u53ef\u91cd\u65b0\u6536\u8d27')");
  r = r.replace(/\{ title: '[^']*', key: 'palletNo'/, "{ title: '\u6258\u76d8\u53f7', key: 'palletNo'");
  r = r.replace(/\{ title: '[^']*', key: 'cargoOrderNo'/, "{ title: '\u8d27\u7269\u5355', key: 'cargoOrderNo'");
  r = r.replace(/\{ title: '[^']*', key: 'groupCode'/, "{ title: '\u5206\u7ec4', key: 'groupCode'");
  r = r.replace(/title: '[^']*',\s*\n\s*key: 'receiveQty'/, "title: '\u6536\u8d27\u91cf',\n    key: 'receiveQty'");
  r = r.replace(/\{ title: '[^']*', key: 'boxQty'/, "{ title: '\u7bb1\u6570', key: 'boxQty'");
  r = r.replace(/\{ title: '[^']*', key: 'createTime'/, "{ title: '\u65f6\u95f4', key: 'createTime'");
  r = r.replace(/>\s*[^<\n]+\s*<\/NButton>\s*\n\s*<NPopconfirm/g, '>\u6253\u5370\u6807\u7b7e</NButton>\n        <NPopconfirm');
  r = r.replace(/trigger:\s*\(\)\s*=>\s*'[^']*'/, "trigger: () => '\u5220\u9664'");
  r = r.replace(/default: \(\) => '[^']*'/, "default: () => '\u5220\u9664\u540e\u5bf9\u5e94\u6536\u8d27\u6570\u91cf\u5c06\u56de\u9000\uff0c\u53ef\u91cd\u65b0\u6536\u8d27'");
  r = r.replace(/:title="'[^']* \(' \+ palletList\.length/, ":title=\"'\u6258\u76d8\u5386\u53f2 (' + palletList.length");
  r = r.replace(/<div class="text-12px[^"]*">[^<]+<\/div>/, '<div class="text-12px text-gray-500 mb-12px">\u6536\u8d27\u540e\u81ea\u52a8\u751f\u6210\u6258\u76d8\uff0c\u53ef\u6253\u5370\u6807\u7b7e\u3001\u5220\u9664\uff08\u5bf9\u5e94\u6536\u8d27\u6570\u5c06\u56de\u9000\uff09\u3002</div>');
  return r;
});

fix('mock/data/yms.ts', c => {
  let r = c.replace(/[\uFFFD]+/g, '');
  r = r.replace(/remark: '[^']*'/, "remark: '\u7b49\u5f85\u88c5\u8f66\u53f8\u673a'");
  r = r.replace(/remark: '[^']*'\s*\n\s*\}\),\s*\n\s*task\(\{\s*\n\s*id: 100003/, "remark: '\u9662\u5185\u642c\u8fd0'\n  }),\n  task({\n    id: 100003");
  r = rep(r, "statusLabel: '\u5f85\u53d6'", "statusLabel: '\u5f85\u63a5\u5355'");
  r = rep(r, "statusLabel: '\u5df2\u63a5\u5355'", "statusLabel: '\u5df2\u63a5\u5355'");
  r = rep(r, "statusLabel: '\u6267\u884c\u4e2d'", "statusLabel: '\u6267\u884c\u4e2d'");
  r = rep(r, "statusLabel: '\u5931\u8d25'", "statusLabel: '\u5931\u8d25'");
  r = r.replace(/statusLabel: '[^']*', count: pending/, "statusLabel: '\u5f85\u63a5\u5355', count: pending");
  r = r.replace(/statusLabel: '[^']*', count: 0, tasks: \[\] \},/, "statusLabel: '\u5df2\u63a5\u5355', count: 0, tasks: [] },");
  r = r.replace(/statusLabel: '[^']*', count: 0, tasks: \[\] \}\n\]/, "statusLabel: '\u6267\u884c\u4e2d', count: 0, tasks: [] }\n]");
  return r;
});

console.log('fix pass 1 complete');
