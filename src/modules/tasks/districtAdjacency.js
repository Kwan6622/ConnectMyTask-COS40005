const DISTRICT_NEIGHBORS = {
  'district 1': ['district 3', 'district 4', 'district 5', 'binh thanh', 'phu nhuan'],
  'district 2': ['district 1', 'district 9', 'thu duc', 'binh thanh'],
  'district 3': ['district 1', 'district 10', 'phu nhuan', 'binh thanh'],
  'district 4': ['district 1', 'district 7', 'district 8'],
  'district 5': ['district 1', 'district 6', 'district 10', 'district 11'],
  'district 6': ['district 5', 'district 11', 'tan phu', 'district 8'],
  'district 7': ['district 4', 'district 8', 'nha be'],
  'district 8': ['district 4', 'district 6', 'district 7', 'binh chanh'],
  'district 9': ['district 2', 'thu duc', 'district 12'],
  'district 10': ['district 3', 'district 5', 'district 11', 'tan binh'],
  'district 11': ['district 5', 'district 6', 'district 10', 'tan phu'],
  'district 12': ['go vap', 'tan binh', 'district 9', 'thu duc'],
  'binh thanh': ['district 1', 'district 2', 'district 3', 'phu nhuan', 'go vap'],
  'phu nhuan': ['district 1', 'district 3', 'binh thanh', 'tan binh', 'go vap'],
  'go vap': ['phu nhuan', 'binh thanh', 'district 12', 'tan binh'],
  'tan binh': ['phu nhuan', 'go vap', 'district 10', 'district 12', 'tan phu'],
  'tan phu': ['tan binh', 'district 6', 'district 11'],
  'thu duc': ['district 2', 'district 9', 'district 12'],
  'nha be': ['district 7', 'binh chanh'],
  'binh chanh': ['district 8', 'nha be'],
};

function normalizeDistrict(value) {
  return String(value || '').toLowerCase().trim();
}

function isSameDistrict(a, b) {
  return normalizeDistrict(a) && normalizeDistrict(a) === normalizeDistrict(b);
}

function isNearbyDistrict(base, target) {
  const baseKey = normalizeDistrict(base);
  const targetKey = normalizeDistrict(target);
  if (!baseKey || !targetKey) return false;
  const neighbors = DISTRICT_NEIGHBORS[baseKey] || [];
  return neighbors.includes(targetKey);
}

module.exports = {
  DISTRICT_NEIGHBORS,
  normalizeDistrict,
  isSameDistrict,
  isNearbyDistrict,
};
