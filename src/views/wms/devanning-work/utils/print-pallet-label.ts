import type { PaperOrientation, PaperPresetKey } from '@/views/print/designer/utils/paper-size';
import { getDefaultElementsForPalletLabel } from '@/views/print/designer/utils/paper-size';
import {
  openPalletLabelProductionPrintWindow,
  type PalletLabelPreviewOptions
} from '@/views/print/designer/utils/preview-pallet-label';

export type PalletLabelPrintInput = {
  palletNo: string;
  groupCode?: string | null;
  orderCount?: number | null;
  boxQty?: number | null;
  weight?: number | null;
  weightKg?: number | null;
  cbm?: number | null;
  containerNo?: string | null;
  carriageNo?: string | null;
  devanningNo?: string | null;
  customerName?: string | null;
  platformName?: string | null;
  locationCode?: string | null;
  highValue?: boolean;
  items?: Array<{
    cargoOrderNo?: string;
    receiveQty?: number;
    receiveUnitLabel?: string;
    boxQty?: number;
  }>;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
};

function normalizePalletLabel(row: PalletLabelPrintInput | Api.Wms.DevanningWorkPallet): PalletLabelPrintInput {
  const weight = (row as PalletLabelPrintInput).weight ?? row.weightKg ?? null;
  return {
    palletNo: row.palletNo,
    groupCode: row.groupCode ?? '—',
    orderCount: row.orderCount ?? (row.items?.length || null),
    boxQty: row.boxQty ?? null,
    weightKg: weight,
    cbm: (row as PalletLabelPrintInput).cbm ?? null,
    items: row.items,
    lengthCm: row.lengthCm ?? null,
    widthCm: row.widthCm ?? null,
    heightCm: row.heightCm ?? null,
    containerNo: (row as PalletLabelPrintInput).containerNo ?? null,
    carriageNo: (row as PalletLabelPrintInput).carriageNo ?? null,
    devanningNo: (row as PalletLabelPrintInput).devanningNo ?? null,
    customerName:
      (row as PalletLabelPrintInput).customerName ?? row.items?.[0]?.customerName ?? null,
    platformName: (row as PalletLabelPrintInput).platformName ?? null,
    locationCode: (row as PalletLabelPrintInput).locationCode ?? null,
    highValue: (row as PalletLabelPrintInput).highValue ?? false
  };
}

/** 从拆柜会话补全板贴打印所需的柜号、客户、库位等上下文 */
export function enrichPalletForPrint(
  pallet: Api.Wms.DevanningWorkPallet,
  session?: Api.Wms.DevanningWorkSession | null
): PalletLabelPrintInput {
  const group = session?.groups.find(g => g.groupCode === pallet.groupCode);
  return {
    ...normalizePalletLabel(pallet),
    containerNo: session?.containerNo ?? null,
    customerName: session?.customerName ?? pallet.items?.[0]?.customerName ?? null,
    devanningNo: session?.devanningNo ?? null,
    locationCode: group?.recommendedLocations?.[0] ?? null
  };
}

export function mapPalletLabelToFieldData(row: PalletLabelPrintInput): Record<string, string> {
  const today = new Date().toISOString().slice(0, 10);
  const firstOrder = row.items?.[0]?.cargoOrderNo;
  const dim =
    row.lengthCm && row.widthCm && row.heightCm
      ? `${row.lengthCm} × ${row.widthCm} × ${row.heightCm} cm`
      : '';
  return {
    仓库名称: 'FOREST WAREHOUSE',
    卡板号: row.palletNo,
    目的地: row.groupCode || '—',
    箱数: row.boxQty != null ? `${row.boxQty} 箱` : '—',
    海柜号: row.containerNo || '—',
    重量: row.weightKg != null ? `${row.weightKg} kg` : '—',
    订单号: firstOrder || '—',
    唛头号: firstOrder || '—',
    打印日期: today,
    拆柜日期: today,
    DOCK号: 'DOCK-01',
    板数: '1',
    客户名称: row.customerName || '—',
    库位号: row.locationCode || '—',
    高货值标识: row.highValue ? '高货值货物 / HIGH VALUE' : '—',
    件数: row.boxQty != null ? String(row.boxQty) : '—',
    卡板尺寸: dim || '—'
  };
}

function buildFallbackLabelHtml(row: PalletLabelPrintInput) {
  const orderLines = (row.items || [])
    .map(
      item =>
        `<div class="row">${item.cargoOrderNo}：${item.receiveQty ?? '—'} ${item.receiveUnitLabel || ''} / ${item.boxQty ?? '—'} 箱</div>`
    )
    .join('');
  const dimLine =
    row.lengthCm && row.widthCm && row.heightCm
      ? `<div class="row">卡板尺寸：${row.lengthCm} × ${row.widthCm} × ${row.heightCm} cm</div>`
      : '';
  const weightLine = row.weightKg != null ? `<div class="row">重量：${row.weightKg} kg</div>` : '';

  return `
    <div class="label">
      <div class="no">${row.palletNo}</div>
      <div class="row">目的地：${row.groupCode || '—'}</div>
      ${row.orderCount != null ? `<div class="row">订单数：${row.orderCount}</div>` : ''}
      ${orderLines}
      ${row.boxQty != null ? `<div class="row">合计：${row.boxQty} 箱</div>` : ''}
      ${dimLine}
      ${weightLine}
    </div>
  `;
}

const FALLBACK_PRINT_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: 100mm 150mm; margin: 0; }
  body { font-family: -apple-system, 'PingFang SC', sans-serif; padding: 16px; }
  .label { width: 100mm; height: 150mm; border: 2px solid #111; padding: 16px; page-break-after: always; }
  .no { font-size: 28px; font-weight: 700; margin-bottom: 12px; }
  .row { font-size: 14px; margin: 6px 0; color: #333; }
`;

async function resolvePrintPlan(row: PalletLabelPrintInput) {
  const { matchPrintRule, getPrintTemplateDesign } = await import('@/mock/data/print-center');
  const match = matchPrintRule({
    docType: 'pallet_label',
    triggerEvent: 'DEVANNING_PALLET_COMPLETE',
    groupCode: row.groupCode,
    customerName: row.customerName,
    highValue: row.highValue,
    platformName: row.platformName
  });

  if (!match) return null;

  const design = getPrintTemplateDesign(match.template.id);
  const paperSize = (match.rule.paperSize || match.template.paperSize || '100x150mm') as PaperPresetKey;
  const orientation = (design?.orientation || match.template.orientation || 'portrait') as PaperOrientation;
  const elements = design?.elements?.length
    ? design.elements
    : getDefaultElementsForPalletLabel(280, 420);

  return {
    match,
    previewOptions: {
      elements,
      paperSize,
      orientation,
      dataOverrides: mapPalletLabelToFieldData(row)
    } satisfies PalletLabelPreviewOptions,
    copies: match.rule.printQty,
    previewMode: match.rule.printMode === 'preview',
    templateCode: match.rule.templateCode,
    printerName: match.rule.printerName
  };
}

async function openFallbackPrint(row: PalletLabelPrintInput) {
  const copies = 4;
  const labelsHtml = Array.from({ length: copies }, () => buildFallbackLabelHtml(row)).join('');
  const win = window.open('', '_blank');
  if (!win) {
    window.$message?.error('导出失败，请允许弹窗');
    return false;
  }
  win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8" /><title>板贴 - ${row.palletNo}</title>
<style>${FALLBACK_PRINT_STYLES}</style></head><body>
<p style="text-align:center;margin-bottom:12px;font-size:13px;color:#666">未匹配打印规则，使用默认布局 · 100×150mm · ${copies} 份</p>
${labelsHtml}
<button style="display:block;margin:16px auto;padding:8px 20px" onclick="handleConfirmPrint()">确认打印</button>
<script>
function handleConfirmPrint() {
  const closeWindow = () => { try { window.close(); } catch (e) {} };
  window.onafterprint = closeWindow;
  window.print();
  setTimeout(closeWindow, 1500);
}
</script>
</body></html>`);
  win.document.close();
  return true;
}

/** 按打印规则预览/打印板贴（默认 PLT-STD · 4份 · 100×150mm） */
export async function printPalletLabel(row: PalletLabelPrintInput | Api.Wms.DevanningWorkPallet) {
  const normalized = normalizePalletLabel(row);
  const plan = await resolvePrintPlan(normalized);

  if (!plan) {
    await openFallbackPrint(normalized);
    return;
  }

  const ok = await openPalletLabelProductionPrintWindow({
    ...plan.previewOptions,
    copies: plan.copies,
    previewMode: plan.previewMode,
    title: `板贴 · ${normalized.palletNo}`,
    templateCode: plan.templateCode,
    printerName: plan.printerName
  });

  if (ok) {
    window.$message?.success(
      `已打开板贴预览打印：${plan.templateCode} · ${plan.copies} 份 · ${plan.previewOptions.paperSize}`
    );
  }
}

/** 批量板贴打印 */
export async function printPalletLabels(rows: Array<PalletLabelPrintInput | Api.Wms.DevanningWorkPallet>) {
  if (!rows.length) {
    window.$message?.warning('暂无可导出的板贴');
    return;
  }
  for (const row of rows) {
    await printPalletLabel(row);
  }
}
