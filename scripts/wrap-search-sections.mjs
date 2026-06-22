import fs from 'node:fs';
import path from 'node:path';

const viewsDir = path.resolve('src/views');

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, files);
    else if (name.endsWith('.vue')) files.push(full);
  }
  return files;
}

function shouldSkip(content) {
  if (content.includes('CollapsibleSearchCard')) return true;
  if (
    content.includes('NCollapseItem') &&
    (content.includes("$t('common.search')") || content.includes('title="搜索"'))
  ) {
    return true;
  }
  return false;
}

function hasCustomCollapse(content) {
  if (content.includes('OmsListPage')) return true;
  if (content.includes('searchCollapsed')) return true;
  if (content.includes('filterCollapsed')) return true;
  if (content.includes('展开筛选') && content.includes('收起筛选')) return true;
  if (content.includes('collapsed') && content.includes('展开筛选')) return true;
  return false;
}

function isInsideTag(content, offset, tagName) {
  const before = content.slice(0, offset);
  const lastOpen = before.lastIndexOf(`<${tagName}`);
  const lastClose = before.lastIndexOf(`</${tagName}`);
  return lastOpen > lastClose;
}

const searchFormRegex =
  /<NForm\b[^>]*>[\s\S]*?(?:>搜索<\/NButton>|\{\{\s*\$t\('common\.search'\)\s*\}\})[\s\S]*?<\/NForm>/g;

function wrapWithCollapse(content, match, offset) {
  if (isInsideTag(content, offset, 'NCollapseItem')) return match;
  if (isInsideTag(content, offset, 'CollapsibleSearchCard')) return match;
  return `<NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search">${match}</NCollapseItem></NCollapse>`;
}

function wrapSearchForms(content) {
  if (shouldSkip(content) || hasCustomCollapse(content)) return content;

  let result = content.replace(searchFormRegex, (match, offset) => wrapWithCollapse(content, match, offset));

  return result;
}

function patchFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const buttonPatched = content.replace(/>(\s*)查询(\s*)<\/NButton>/g, () => {
    changed = true;
    return '>搜索</NButton>';
  });
  content = buttonPatched;

  const confirmPatched = content.replace(/确认查询/g, () => {
    changed = true;
    return '确认搜索';
  });
  content = confirmPatched;

  const wrapped = wrapSearchForms(content);
  if (wrapped !== content) {
    changed = true;
    content = wrapped;
  }

  if (changed) fs.writeFileSync(file, content, 'utf8');
  return changed;
}

const files = walk(viewsDir);
let count = 0;
for (const file of files) {
  if (patchFile(file)) {
    count += 1;
    console.log('patched:', path.relative(process.cwd(), file));
  }
}
console.log(`done, patched ${count} files`);
