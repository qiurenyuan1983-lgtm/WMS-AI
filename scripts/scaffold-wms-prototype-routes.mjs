/**
 * Scaffold PRD prototype views + patch elegant-router files.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const viewsRoot = path.join(root, 'src/views');

const listPages = [
  { name: 'WmsInboundOrderList', route: 'wms_inbound-order', folder: 'wms/inbound-order', configKey: 'inbound-order' },
  { name: 'WmsPutawayTaskList', route: 'wms_putaway-task', folder: 'wms/putaway-task', configKey: 'putaway-task' },
  { name: 'WmsOperationOrderList', route: 'wms_operation-order', folder: 'wms/operation-order', configKey: 'operation-order' },
  { name: 'WmsVasTaskList', route: 'wms_vas-task', folder: 'wms/vas-task', configKey: 'vas-task' },
  { name: 'WmsStockPrepOrderList', route: 'wms_stock-prep-order', folder: 'wms/stock-prep-order', configKey: 'stock-prep-order' },
  { name: 'WmsStockPrepTaskList', route: 'wms_stock-prep-task', folder: 'wms/stock-prep-task', configKey: 'stock-prep-task' }
];

const listTpl = (name, configKey) => `<script setup lang="ts">
import WmsPrototypeList from '@/components/wms-prototype/WmsPrototypeList.vue';
import { PROTOTYPE_LIST_CONFIGS } from '@/views/wms/_prototype/configs';

defineOptions({ name: '${name}' });
</script>

<template>
  <WmsPrototypeList :config="PROTOTYPE_LIST_CONFIGS['${configKey}']" />
</template>
`;

for (const p of listPages) {
  const dir = path.join(viewsRoot, p.folder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.vue'), listTpl(p.name, p.configKey), 'utf8');
  console.log('view', p.folder);
}

const newRoutes = [
  { name: 'wms_inbound-order', path: '/wms/inbound-order', folder: 'wms/inbound-order' },
  { name: 'wms_inbound-task', path: '/wms/inbound-task', folder: 'wms/inbound-task', layout: 'blank' },
  { name: 'wms_putaway-task', path: '/wms/putaway-task', folder: 'wms/putaway-task' },
  { name: 'wms_putaway-pda', path: '/wms/putaway-pda', folder: 'wms/putaway-pda', layout: 'blank' },
  { name: 'wms_operation-order', path: '/wms/operation-order', folder: 'wms/operation-order' },
  { name: 'wms_vas-task', path: '/wms/vas-task', folder: 'wms/vas-task' },
  { name: 'wms_vas-work', path: '/wms/vas-work', folder: 'wms/vas-work', layout: 'blank' },
  { name: 'wms_stock-prep-order', path: '/wms/stock-prep-order', folder: 'wms/stock-prep-order' },
  { name: 'wms_stock-prep-task', path: '/wms/stock-prep-task', folder: 'wms/stock-prep-task' },
  { name: 'wms_stock-prep-exec', path: '/wms/stock-prep-exec', folder: 'wms/stock-prep-exec', layout: 'blank' },
  { name: 'wms_devanning-order-detail', path: '/wms/devanning-order/detail', folder: 'wms/devanning-order-detail' },
  { name: 'wms_devanning-work', path: '/wms/devanning-work', folder: 'wms/devanning-work', layout: 'blank' },
  { name: 'wms_devanning-work-exec', path: '/wms/devanning-work-exec', folder: 'wms/devanning-work-exec' },
  { name: 'wms_outbound-exec', path: '/wms/outbound-exec', folder: 'wms/outbound-exec', layout: 'blank' },
  { name: 'wms_outbound-loading', path: '/wms/outbound-loading', folder: 'wms/outbound-loading', layout: 'blank' },
  { name: 'pda_home', path: '/pda/home', folder: 'pda/home', layout: 'blank' },
  { name: 'pda_task', path: '/pda/task', folder: 'pda/task', layout: 'blank' }
];

function patchFile(filePath, patchFn) {
  const content = fs.readFileSync(filePath, 'utf8');
  const next = patchFn(content);
  if (next !== content) {
    fs.writeFileSync(filePath, next, 'utf8');
    console.log('patched', path.relative(root, filePath));
  }
}

// patch imports.ts
patchFile(path.join(root, 'src/router/elegant/imports.ts'), content => {
  let c = content;
  for (const r of newRoutes) {
    const key = r.name.includes('-') ? `"${r.name}"` : r.name;
    const line = `  ${key}: () => import("@/views/${r.folder}/index.vue"),`;
    if (c.includes(`"${r.name}"`) || c.includes(`${r.name}:`)) continue;
    c = c.replace(/\n};\s*$/, `\n${line}\n};`);
  }
  return c;
});

// patch transform.ts
patchFile(path.join(root, 'src/router/elegant/transform.ts'), content => {
  let c = content;
  for (const r of newRoutes) {
    const line = `  "${r.name}": "${r.path}",`;
    if (c.includes(`"${r.name}"`)) continue;
    c = c.replace(/\n};\s*$/, `\n${line}\n};`);
  }
  return c;
});

// patch routes.ts - insert before yard module
patchFile(path.join(root, 'src/router/elegant/routes.ts'), content => {
  if (content.includes("'wms_inbound-order'")) return content;
  const blocks = newRoutes
    .map(r => {
      const comp = r.layout === 'blank' ? `layout.blank$view.${r.name}` : `view.${r.name}`;
      return `      {
        name: '${r.name}',
        path: '${r.path}',
        component: '${comp}',
        meta: {
          title: '${r.name}',
          i18nKey: 'route.${r.name}',
          hideInMenu: ${r.name.includes('detail') || r.name.includes('work') || r.name.includes('exec') || r.name.includes('loading') || r.name.includes('pda') || r.name.includes('task') && r.name !== 'wms_putaway-task' && r.name !== 'wms_stock-prep-task' ? 'true' : 'false'}
        }
      }`;
    })
    .join(',\n');
  return content.replace(
    /(\s+{\s+name: 'wms_zone',[\s\S]*?}\s+)\n(\s+]\s+\n\s+},[\s\S]*?name: 'yard')/,
    `$1,\n${blocks}\n$2`
  );
});

console.log('done scaffold routes');
