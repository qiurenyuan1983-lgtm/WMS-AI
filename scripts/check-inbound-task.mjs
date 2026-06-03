import fs from 'fs';
const s = fs.readFileSync('d:/wms-designFrontEnd/WMSruoyi-plus-soybean/src/views/wms/inbound-task/index.vue', 'utf8');
const inbound = '\u5165\u5e93\u6279\u6b21';
console.log('stagingDock:', s.includes('stagingDock'));
console.log('inbound label:', s.includes(inbound));
const m = s.match(/label="([^"]+)"/);
console.log('first label:', m ? [...m[1]].map(c => c.charCodeAt(0).toString(16)).join(' ') : 'none');
