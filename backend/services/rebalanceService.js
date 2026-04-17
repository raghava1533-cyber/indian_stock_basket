// ─── Compute quality-proportional weights (min 5%, sum = 100%) ────────────────
const computeQualityWeights = (sortedStocks) => {
  const totalScore = sortedStocks.reduce((sum, s) => sum + (s.score || 1), 0);
  let weights = sortedStocks.map(s =>
    totalScore > 0 ? Math.round((s.score / totalScore) * 1000) / 10 : 10
  );
  // Apply 5% floor
  const MIN_WEIGHT = 5;
  let excess = 0;
  weights = weights.map(w => {
    if (w < MIN_WEIGHT) { excess += MIN_WEIGHT - w; return MIN_WEIGHT; }
    return w;
  });
  // Redistribute excess from top stocks
  if (excess > 0) {
    for (let i = 0; i < weights.length && excess > 0; i++) {
      if (weights[i] > MIN_WEIGHT) {
        const reduction = Math.min(weights[i] - MIN_WEIGHT, excess);
        weights[i] = Math.round((weights[i] - reduction) * 10) / 10;
        excess = Math.round((excess - reduction) * 10) / 10;
      }
    }
  }
  // Fix rounding so weights sum to 100
  const weightSum = Math.round(weights.reduce((s, w) => s + w, 0) * 10) / 10;
  const diff = Math.round((100 - weightSum) * 10) / 10;
  if (diff !== 0) weights[0] = Math.round((weights[0] + diff) * 10) / 10;
  return weights;
};

const top10 = scored.slice(0, 10);
const qualityWeights = computeQualityWeights(top10);
return top10.map((stock, idx) => ({
  ticker:        stock.ticker,
  companyName:   stock.companyName,
  symbol:        stock.ticker,
  currentPrice:  stock.currentPrice,
  high52Week:    stock.high52Week,
  low52Week:     stock.low52Week,
  marketCap:     stock.marketCapCr ? `${stock.marketCapCr} Cr` : null,
  peRatio:       stock.peRatio,
  weight:        qualityWeights[idx],
}));

const top10 = scored.slice(0, 10);
const qualityWeights = computeQualityWeights(top10);
basket.minimumInvestment = Math.ceil(newStocks.reduce((sum, s) => sum + (s.currentPrice * (s.weight / 100)), 0));
