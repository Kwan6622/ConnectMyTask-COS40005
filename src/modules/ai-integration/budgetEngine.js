const DISTRICT_ALIASES = [
  'district 1',
  'district 2',
  'district 3',
  'district 4',
  'district 5',
  'district 6',
  'district 7',
  'district 8',
  'district 9',
  'district 10',
  'district 11',
  'district 12',
  'thu duc',
  'phu nhuan',
  'binh thanh',
  'go vap',
  'tan binh',
  'tan phu',
  'nha be',
  'hoc mon',
  'binh chanh',
  'cu chi',
];

function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function roundVnd(value) {
  const step = value >= 1000000 ? 50000 : 10000;
  return Math.max(step, Math.round(value / step) * step);
}

function extractFirstNumber(text) {
  const match = text.match(/\b(\d{1,3})\b/);
  return match ? Number(match[1]) : null;
}

function detectUrgency(text) {
  const urgentKeywords = [
    'urgent',
    'asap',
    'today',
    'now',
    'immediately',
    'same day',
  ];
  return urgentKeywords.some((word) => text.includes(word));
}

function detectDistanceHint(locationText, descriptionText) {
  const merged = `${locationText} ${descriptionText}`;
  const districtMentions = DISTRICT_ALIASES.filter((district) => merged.includes(district));
  const kmMatch = merged.match(/(\d{1,2})\s?(km|kilometer|kilometre)/);
  if (kmMatch) {
    return Math.max(1, Math.min(30, Number(kmMatch[1])));
  }
  if (districtMentions.length >= 2) return 12;
  if (districtMentions.length === 1) return 5;
  return 6;
}

function estimateCleaningBudget({ titleText, descText }) {
  let min = 180000;
  let max = 350000;
  const factors = [];

  const roomCount = extractFirstNumber(`${titleText} ${descText}`);
  if (roomCount && roomCount >= 2) {
    const add = Math.min(roomCount, 6) * 70000;
    min += add;
    max += add + 70000;
    factors.push(`${roomCount} room(s) mentioned`);
  }

  if (titleText.includes('deep') || descText.includes('deep') || descText.includes('full')) {
    min += 180000;
    max += 350000;
    factors.push('deep/full cleaning scope');
  }

  if (descText.includes('kitchen') || descText.includes('bathroom')) {
    min += 90000;
    max += 170000;
    factors.push('kitchen/bathroom included');
  }

  return { min, max, factors };
}

function estimateDeliveryBudget({ titleText, descText, locationText, urgent }) {
  let min = 80000;
  let max = 180000;
  const factors = [];

  const distanceKm = detectDistanceHint(locationText, `${titleText} ${descText}`);
  min += distanceKm * 6000;
  max += distanceKm * 12000;
  factors.push(`estimated distance around ${distanceKm}km`);

  if (titleText.includes('document') || descText.includes('document')) {
    min += 20000;
    max += 50000;
    factors.push('document handling');
  }

  if (titleText.includes('heavy') || descText.includes('heavy') || descText.includes('fragile')) {
    min += 40000;
    max += 90000;
    factors.push('special package handling');
  }

  if (urgent) {
    min += 80000;
    max += 150000;
    factors.push('urgent delivery');
  }

  return { min, max, factors };
}

function estimateRepairBudget({ titleText, descText, isElectrical }) {
  let min = isElectrical ? 250000 : 220000;
  let max = isElectrical ? 600000 : 550000;
  const factors = [];

  const issueCount = extractFirstNumber(`${titleText} ${descText}`);
  if (issueCount && issueCount >= 2) {
    const add = Math.min(issueCount, 6) * 90000;
    min += add;
    max += add + 120000;
    factors.push(`${issueCount} issues/points mentioned`);
  }

  if (titleText.includes('install') || descText.includes('install')) {
    min += 80000;
    max += 170000;
    factors.push('installation work included');
  }

  if (titleText.includes('leak') || descText.includes('leak') || descText.includes('water')) {
    min += 60000;
    max += 130000;
    factors.push('technical troubleshooting required');
  }

  return { min, max, factors };
}

function estimatePlumbingBudget({ titleText, descText }) {
  let min = 260000;
  let max = 620000;
  const factors = [];

  const issueCount = extractFirstNumber(`${titleText} ${descText}`);
  if (issueCount && issueCount >= 2) {
    const add = Math.min(issueCount, 6) * 85000;
    min += add;
    max += add + 120000;
    factors.push(`${issueCount} plumbing issues/points mentioned`);
  } else {
    factors.push('single plumbing issue scope');
  }

  if (descText.includes('leak')) {
    min += 60000;
    max += 130000;
    factors.push('leak troubleshooting');
  }

  if (descText.includes('toilet') || descText.includes('sink')) {
    min += 40000;
    max += 90000;
    factors.push('fixture-specific repair');
  }

  return { min, max, factors };
}

function estimateInstallationBudget({ titleText, descText }) {
  let min = 220000;
  let max = 520000;
  const factors = [];

  const itemCount = extractFirstNumber(`${titleText} ${descText}`);
  if (itemCount && itemCount >= 2) {
    const add = Math.min(itemCount, 8) * 70000;
    min += add;
    max += add + 110000;
    factors.push(`${itemCount} installation items mentioned`);
  } else {
    factors.push('single installation item scope');
  }

  if (descText.includes('wall') || descText.includes('ceiling') || descText.includes('drill')) {
    min += 50000;
    max += 110000;
    factors.push('mounting/drilling complexity');
  }

  return { min, max, factors };
}

function detectSubServiceByKeywords(titleText, descText) {
  const title = normalizeText(titleText);
  const desc = normalizeText(descText);
  const combined = `${title} ${desc}`;

  const plumbingKeywords = [
    'pipe',
    'sink',
    'toilet',
    'leak',
    'water',
    'faucet',
    'drain',
  ];
  const electricalKeywords = [
    'switch',
    'outlet',
    'socket',
    'wiring',
    'wire',
    'fan',
    'light',
    'power',
  ];
  const installationKeywords = [
    'install',
    'mount',
    'assemble',
    'set up',
  ];

  const countMatches = (keywords) => keywords.reduce((acc, keyword) => acc + (combined.includes(keyword) ? 1 : 0), 0);
  const titleBoost = (keywords) => keywords.reduce((acc, keyword) => acc + (title.includes(keyword) ? 2 : 0), 0);

  const plumbingScore = countMatches(plumbingKeywords) + titleBoost(plumbingKeywords);
  const electricalScore = countMatches(electricalKeywords) + titleBoost(electricalKeywords);
  const installationScore = countMatches(installationKeywords) + titleBoost(installationKeywords);

  const scored = [
    { key: 'PLUMBING', score: plumbingScore },
    { key: 'ELECTRICAL', score: electricalScore },
    { key: 'INSTALLATION', score: installationScore },
  ].sort((a, b) => b.score - a.score);

  if (scored[0].score <= 0) return { key: 'GENERAL_REPAIR', reason: 'no strong title keywords matched' };
  return { key: scored[0].key, reason: `title/description keywords matched ${scored[0].key.toLowerCase()}` };
}

function estimateMovingBudget({ titleText, descText, locationText }) {
  let min = 300000;
  let max = 700000;
  const factors = [];

  const itemCount = extractFirstNumber(`${titleText} ${descText}`);
  if (itemCount && itemCount >= 3) {
    const add = Math.min(itemCount, 20) * 45000;
    min += add;
    max += add + 150000;
    factors.push(`${itemCount} items/furniture mentioned`);
  }

  const distanceKm = detectDistanceHint(locationText, `${titleText} ${descText}`);
  min += distanceKm * 12000;
  max += distanceKm * 22000;
  factors.push(`moving distance around ${distanceKm}km`);

  if (descText.includes('stairs') || descText.includes('no lift')) {
    min += 120000;
    max += 220000;
    factors.push('stairs/no-lift condition');
  }

  if (descText.includes('fragile') || descText.includes('heavy')) {
    min += 90000;
    max += 180000;
    factors.push('fragile/heavy handling');
  }

  return { min, max, factors };
}

function estimateTechSupportBudget({ titleText, descText }) {
  let min = 150000;
  let max = 400000;
  const factors = [];

  const issueCount = extractFirstNumber(`${titleText} ${descText}`);
  if (issueCount && issueCount >= 2) {
    const add = Math.min(issueCount, 5) * 60000;
    min += add;
    max += add + 90000;
    factors.push(`${issueCount} issues to fix`);
  }

  if (descText.includes('hardware') || descText.includes('install') || descText.includes('replace')) {
    min += 70000;
    max += 150000;
    factors.push('hardware-level support');
  }

  if (descText.includes('onsite') || descText.includes('at home')) {
    min += 50000;
    max += 90000;
    factors.push('onsite support required');
  }

  return { min, max, factors };
}

function estimateOtherBudget({ titleText, descText }) {
  let min = 180000;
  let max = 450000;
  const factors = [];

  if ((titleText + descText).length > 180) {
    min += 50000;
    max += 120000;
    factors.push('detailed scope indicates medium-high complexity');
  }

  return { min, max, factors };
}

function categoryEstimator(category, context) {
  const value = String(category || '').toUpperCase();
  if (value === 'CLEANING') return estimateCleaningBudget(context);
  if (value === 'DELIVERY') return estimateDeliveryBudget(context);
  if (value === 'MOVING') return estimateMovingBudget(context);
  if (value === 'IT_SUPPORT' || value === 'TECH_SUPPORT') return estimateTechSupportBudget(context);
  if (value === 'HOME_REPAIR') return estimateRepairBudget({ ...context, isElectrical: false });
  if (value === 'ELECTRICAL') return estimateRepairBudget({ ...context, isElectrical: true });
  if (value === 'PLUMBING') return estimatePlumbingBudget(context);
  if (value === 'INSTALLATION') return estimateInstallationBudget(context);
  return estimateOtherBudget(context);
}

function buildBudgetSuggestion(payload, aiRecommendation) {
  const titleText = normalizeText(payload.title);
  const descText = normalizeText(payload.description);
  const locationText = normalizeText(payload.location);
  const urgent = detectUrgency(`${titleText} ${descText}`);

  const category = String(payload.category || '').toUpperCase();
  const subService = category === 'HOME_REPAIR'
    ? detectSubServiceByKeywords(titleText, descText)
    : null;

  const effectiveCategory =
    subService?.key === 'GENERAL_REPAIR'
      ? category
      : (subService?.key || category);

  const base = categoryEstimator(effectiveCategory, {
    titleText,
    descText,
    locationText,
    urgent,
  });

  let min = base.min;
  let max = base.max;
  const factorsUsed = [
    `category input: ${category || 'OTHER'}`,
    `pricing logic used: ${effectiveCategory || 'OTHER'}`,
    ...base.factors,
  ];

  if (subService) {
    factorsUsed.push(`sub-service detection: ${subService.reason}`);
  }

  if (urgent) {
    min += 60000;
    max += 120000;
    factorsUsed.push('urgent keyword detected in title/description');
  }

  if (aiRecommendation && Number.isFinite(aiRecommendation.suggestedPrice)) {
    const aiVnd = Math.max(100000, aiRecommendation.suggestedPrice * 26000);
    const ruleMid = (min + max) / 2;
    const blendedMid = ruleMid * 0.8 + aiVnd * 0.2;
    const spread = Math.max(60000, (max - min) * 0.6);
    min = blendedMid - spread / 2;
    max = blendedMid + spread / 2;
    factorsUsed.push('blended with existing AI model signal');
  }

  const suggestedMin = roundVnd(min);
  const suggestedMax = roundVnd(Math.max(suggestedMin + 20000, max));
  const suggestedBudget = roundVnd((suggestedMin + suggestedMax) / 2);

  return {
    suggestedMin,
    suggestedMax,
    suggestedBudget,
    currency: 'VND',
    factorsUsed,
    explanation: `Suggested from ${effectiveCategory || 'OTHER'} job type detected mainly from title, then refined by description${urgent ? ', including urgency' : ''}.`,
  };
}

module.exports = {
  buildBudgetSuggestion,
};
