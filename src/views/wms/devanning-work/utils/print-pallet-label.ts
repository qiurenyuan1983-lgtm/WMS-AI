/** 打印卡板/板贴标签（拆柜作业） */
export function printPalletLabel(row: Api.Wms.DevanningWorkPallet) {
  const win = window.open('', '_blank');
  if (!win) {
    window.$message?.error('打印失败，请允许弹窗');
    return;
  }
  const orderLines = (row.items || [])
    .map(
      item =>
        `<div class="row">${item.cargoOrderNo}：${item.receiveQty} ${item.receiveUnitLabel} / ${item.boxQty} 箱</div>`
    )
    .join('');
  const dimLine =
    row.lengthCm && row.widthCm && row.heightCm
      ? `<div class="row">尺寸：${row.lengthCm} × ${row.widthCm} × ${row.heightCm} cm</div>`
      : '';
  const weightLine = row.weightKg ? `<div class="row">重量：${row.weightKg} kg</div>` : '';
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>板贴 - ${row.palletNo}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, 'PingFang SC', sans-serif; padding: 24px; }
        .label { width: 320px; border: 2px solid #111; padding: 16px; }
        .no { font-size: 28px; font-weight: 700; margin-bottom: 12px; }
        .row { font-size: 14px; margin: 6px 0; color: #333; }
        .bar { height: 48px; background: #f0f0f0; margin-top: 12px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="no">${row.palletNo}</div>
        <div class="row">目的地：${row.groupCode}</div>
        <div class="row">订单数：${row.orderCount}</div>
        ${orderLines}
        <div class="row">合计：${row.boxQty} 箱</div>
        ${dimLine}
        ${weightLine}
        <div class="bar">${row.palletNo}</div>
      </div>
      <script>window.onload = () => window.print();<\/script>
    </body>
    </html>
  `);
  win.document.close();
}
