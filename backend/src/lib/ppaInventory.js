import env from 'var';

const DEFAULT_UNIT_CODE = 'C48480';
const DEFAULT_PHARMACY_ID = env.PHARMACY_ID || 'Pharmacy123';
const DEFAULT_PHARMACY_NAME = env.PHARMACY_NAME || 'PIMS Pharmacy';

const normalizeNdc = value => {
  if (value === null || value === undefined) return '';

  const raw = String(value).trim();
  const segments = raw.split('-').map(segment => segment.replace(/\D/g, ''));

  if (segments.length === 3) {
    const [labeler, product, packageCode] = segments;
    if (labeler.length === 4 && product.length === 4 && packageCode.length === 2) {
      return `${labeler.padStart(5, '0')}${product}${packageCode}`;
    }
    if (labeler.length === 5 && product.length === 3 && packageCode.length === 2) {
      return `${labeler}${product.padStart(4, '0')}${packageCode}`;
    }
    if (labeler.length === 5 && product.length === 4 && packageCode.length === 1) {
      return `${labeler}${product}${packageCode.padStart(2, '0')}`;
    }
  }

  return raw.replace(/[^0-9]/g, '');
};

const defaultInventory = [
  {
    pharmacyId: DEFAULT_PHARMACY_ID,
    pharmacyName: DEFAULT_PHARMACY_NAME,
    ndc: '65597-407-20',
    display: 'Turalio 200 MG Oral Capsule',
    quantityOnHand: 0,
    quantityUnitCode: DEFAULT_UNIT_CODE,
    equivalentGroup: 'pexidartinib-200mg-capsule',
    obtainable: true,
    refuseToAnswer: false,
    availabilityDate: '2026-07-01T14:30:00.0Z',
    remsAdminHint: 'REMS Prototype Admin 1'
  },
  {
    pharmacyId: DEFAULT_PHARMACY_ID,
    pharmacyName: DEFAULT_PHARMACY_NAME,
    ndc: '99999-407-20',
    display: 'Pexidartinib Hydrochloride 200 MG Oral Capsule',
    quantityOnHand: 120,
    quantityUnitCode: DEFAULT_UNIT_CODE,
    equivalentGroup: 'pexidartinib-200mg-capsule',
    obtainable: true,
    refuseToAnswer: false,
    availabilityDate: null,
    remsAdminHint: 'REMS Prototype Admin 2'
  },
  {
    pharmacyId: DEFAULT_PHARMACY_ID,
    pharmacyName: DEFAULT_PHARMACY_NAME,
    ndc: '0245-0571-01',
    display: 'Isotretinoin 20 MG Oral Capsule',
    quantityOnHand: 60,
    quantityUnitCode: DEFAULT_UNIT_CODE,
    equivalentGroup: 'isotretinoin-20mg-capsule',
    obtainable: true,
    refuseToAnswer: false,
    availabilityDate: null,
    remsAdminHint: 'REMS Prototype Admin 2'
  },
  {
    pharmacyId: DEFAULT_PHARMACY_ID,
    pharmacyName: DEFAULT_PHARMACY_NAME,
    ndc: '63459-502-30',
    display: 'TIRF 200 UG Oral Transmucosal Lozenge',
    quantityOnHand: 20,
    quantityUnitCode: 'C48506',
    equivalentGroup: 'tirf-200ug-lozenge',
    obtainable: true,
    refuseToAnswer: false,
    availabilityDate: null,
    remsAdminHint: 'REMS Prototype Admin 1'
  },
  {
    pharmacyId: DEFAULT_PHARMACY_ID,
    pharmacyName: DEFAULT_PHARMACY_NAME,
    ndc: '58604-214-30',
    display: 'Addyi 100 MG Oral Tablet',
    quantityOnHand: 90,
    quantityUnitCode: 'C48542',
    equivalentGroup: 'flibanserin-100mg-tablet',
    obtainable: true,
    refuseToAnswer: false,
    availabilityDate: null,
    remsAdminHint: 'REMS Prototype Admin 1'
  }
];

const readInventoryFromEnv = () => {
  if (!env.PHARMACY_INVENTORY_JSON) {
    return null;
  }

  try {
    const parsed = JSON.parse(env.PHARMACY_INVENTORY_JSON);
    return Array.isArray(parsed) ? parsed : parsed.inventory;
  } catch (error) {
    console.log('Failed to parse PHARMACY_INVENTORY_JSON:', error.message);
    return null;
  }
};

let inventory = (readInventoryFromEnv() || defaultInventory).map(item => ({
  ...item,
  pharmacyId: item.pharmacyId || DEFAULT_PHARMACY_ID,
  pharmacyName: item.pharmacyName || DEFAULT_PHARMACY_NAME,
  quantityOnHand: Number(item.quantityOnHand || 0),
  quantityUnitCode: item.quantityUnitCode || DEFAULT_UNIT_CODE,
  obtainable: item.obtainable !== false,
  refuseToAnswer: item.refuseToAnswer === true,
  normalizedNdc: normalizeNdc(item.ndc)
}));

export function getInventory() {
  return inventory.map(({ normalizedNdc, ...item }) => ({ ...item }));
}

export function updateInventory(nextInventory) {
  if (!Array.isArray(nextInventory)) {
    throw new Error('Inventory payload must be an array or { inventory: [] }');
  }

  inventory = nextInventory.map(item => ({
    ...item,
    pharmacyId: item.pharmacyId || DEFAULT_PHARMACY_ID,
    pharmacyName: item.pharmacyName || DEFAULT_PHARMACY_NAME,
    quantityOnHand: Number(item.quantityOnHand || 0),
    quantityUnitCode: item.quantityUnitCode || DEFAULT_UNIT_CODE,
    obtainable: item.obtainable !== false,
    refuseToAnswer: item.refuseToAnswer === true,
    normalizedNdc: normalizeNdc(item.ndc)
  }));

  return getInventory();
}

export function resolveAvailability({ ndc, quantityRequested, substitutionAllowed }) {
  const normalizedNdc = normalizeNdc(ndc);
  const requestedQuantity = Number(quantityRequested || 0);
  const exact = inventory.find(item => item.normalizedNdc === normalizedNdc);
  const candidates = [];

  if (exact) {
    candidates.push({ item: exact, substitution: false });
  }

  if (substitutionAllowed && exact?.equivalentGroup) {
    inventory
      .filter(
        item =>
          item.normalizedNdc !== normalizedNdc && item.equivalentGroup === exact.equivalentGroup
      )
      .forEach(item => candidates.push({ item, substitution: true }));
  }

  if (candidates.length === 0) {
    return {
      status: 'DENIED',
      reasonCode: 'KC',
      selectedItem: null,
      quantityAvailable: 0,
      substitution: false
    };
  }

  const refused = candidates.find(({ item }) => item.refuseToAnswer);
  if (refused) {
    return {
      status: 'DENIED',
      reasonCode: 'KD',
      selectedItem: refused.item,
      quantityAvailable: refused.item.quantityOnHand,
      substitution: refused.substitution
    };
  }

  const inStock = candidates.find(({ item }) => item.quantityOnHand >= requestedQuantity);
  if (inStock) {
    return {
      status: 'APPROVED',
      reasonCode: 'KA',
      selectedItem: inStock.item,
      quantityAvailable: inStock.item.quantityOnHand,
      substitution: inStock.substitution
    };
  }

  const partial = candidates
    .filter(({ item }) => item.quantityOnHand > 0)
    .sort((a, b) => b.item.quantityOnHand - a.item.quantityOnHand)[0];

  if (partial) {
    return {
      status: 'APPROVED',
      reasonCode: 'KB',
      selectedItem: partial.item,
      quantityAvailable: partial.item.quantityOnHand,
      substitution: partial.substitution
    };
  }

  const obtainable = candidates.find(({ item }) => item.obtainable);
  if (obtainable) {
    return {
      status: 'DENIED',
      reasonCode: 'BJ',
      selectedItem: obtainable.item,
      quantityAvailable: 0,
      substitution: obtainable.substitution
    };
  }

  return {
    status: 'DENIED',
    reasonCode: 'KC',
    selectedItem: exact,
    quantityAvailable: 0,
    substitution: false
  };
}
