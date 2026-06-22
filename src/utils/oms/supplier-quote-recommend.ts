export type SupplierQuoteRecommendContext = {
  destination?: string | null;
  warehouseName?: string | null;
  transportType?: string | null;
  loadingType?: string | null;
};

export type SupplierQuoteRecommendCandidate = {
  supplierId: CommonType.IdType;
  supplierName: string;
  quoteId: CommonType.IdType;
  feeType: string;
  feeTypeLabel: string;
  unitPrice: number;
  currency: string;
  matchScore: number;
  matchReason: string;
  recommended: boolean;
};

const FBA_CODE_PATTERN = /\b[A-Z]{3,4}\d{1,2}\b/g;

function extractDestinationCodes(destination?: string | null) {
  if (!destination?.trim()) return [];
  const upper = destination.toUpperCase().trim();
  const codes = upper.match(FBA_CODE_PATTERN) || [];
  return [...new Set(codes)];
}

function isQuoteEffective(quote: Api.Oms.SupplierQuote, now = Date.now()) {
  if (quote.status !== 'ACTIVE') return false;
  const from = Date.parse(`${quote.effectiveFrom}T00:00:00`);
  if (!Number.isNaN(from) && now < from) return false;
  if (quote.effectiveTo) {
    const to = Date.parse(`${quote.effectiveTo}T23:59:59`);
    if (!Number.isNaN(to) && now > to) return false;
  }
  return true;
}

function scoreQuote(quote: Api.Oms.SupplierQuote, ctx: SupplierQuoteRecommendContext) {
  let score = 0;
  const reasons: string[] = [];
  const destCodes = extractDestinationCodes(ctx.destination);
  const quoteDest = quote.destination?.toUpperCase().trim() || '';

  if (quoteDest) {
    if (destCodes.includes(quoteDest)) {
      score += 120;
      reasons.push(`目的地 ${quoteDest} 精确匹配`);
    } else if (ctx.destination?.toUpperCase().includes(quoteDest)) {
      score += 80;
      reasons.push(`目的地含 ${quoteDest}`);
    } else {
      return { score: -1, reason: '' };
    }
  } else if (destCodes.length) {
    score += 20;
    reasons.push('通用线路报价');
  } else {
    score += 10;
    reasons.push('无目的地约束');
  }

  if (ctx.warehouseName && quote.warehouseName) {
    if (quote.warehouseName === ctx.warehouseName) {
      score += 30;
      reasons.push('出库仓匹配');
    } else {
      score -= 10;
    }
  }

  const transport = (ctx.transportType || 'FTL').toUpperCase();
  if (transport === 'LTL') {
    if (quote.feeType.includes('LTL') || quote.remark?.toUpperCase().includes('LTL')) {
      score += 25;
      reasons.push('LTL 报价');
    }
  } else if (quote.feeType === 'LINEHAUL' || quote.feeTypeLabel.includes('卡派')) {
    score += 15;
    reasons.push('FTL 卡派');
  }

  return {
    score,
    reason: reasons.join(' · ') || '有效报价'
  };
}

/** 按报价匹配并排序候选供应商（Mock / 前端均可复用） */
export function rankSupplierQuoteCandidates(
  quotes: Api.Oms.SupplierQuote[],
  ctx: SupplierQuoteRecommendContext
): SupplierQuoteRecommendCandidate[] {
  const linehaulQuotes = quotes.filter(
    quote => quote.supplierType === 'LINEHAUL' && quote.feeType === 'LINEHAUL' && isQuoteEffective(quote)
  );

  const grouped = new Map<string, { quote: Api.Oms.SupplierQuote; score: number; reason: string }>();

  for (const quote of linehaulQuotes) {
    const { score, reason } = scoreQuote(quote, ctx);
    if (score < 0) continue;
    const key = String(quote.supplierId);
    const existing = grouped.get(key);
    if (!existing || score > existing.score || (score === existing.score && quote.unitPrice < existing.quote.unitPrice)) {
      grouped.set(key, { quote, score, reason });
    }
  }

  const candidates = [...grouped.values()]
    .map(({ quote, score, reason }) => ({
      supplierId: quote.supplierId,
      supplierName: quote.supplierName,
      quoteId: quote.id,
      feeType: quote.feeType,
      feeTypeLabel: quote.feeTypeLabel,
      unitPrice: quote.unitPrice,
      currency: quote.currency,
      matchScore: score,
      matchReason: reason,
      recommended: false
    }))
    .sort((a, b) => b.matchScore - a.matchScore || a.unitPrice - b.unitPrice);

  if (candidates.length) candidates[0].recommended = true;
  return candidates;
}

export function buildSupplierQuoteRecommendResult(
  quotes: Api.Oms.SupplierQuote[],
  ctx: SupplierQuoteRecommendContext
): Api.Oms.SupplierQuoteRecommendResult {
  const candidates = rankSupplierQuoteCandidates(quotes, ctx).map(item => ({
    supplierId: item.supplierId,
    supplierName: item.supplierName,
    quoteId: item.quoteId,
    feeTypeLabel: item.feeTypeLabel,
    unitPrice: item.unitPrice,
    currency: item.currency,
    matchReason: item.matchReason,
    recommended: item.recommended
  }));
  const top = candidates.find(item => item.recommended) ?? candidates[0] ?? null;
  return {
    recommendedSupplierId: top?.supplierId ?? null,
    recommendedQuoteId: top?.quoteId ?? null,
    recommendedSupplierName: top?.supplierName ?? null,
    unitPrice: top?.unitPrice ?? null,
    currency: top?.currency ?? null,
    matchReason: top?.matchReason ?? null,
    candidates
  };
}
