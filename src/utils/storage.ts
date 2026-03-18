import type { DataStoreState } from '../contexts/DataStoreContext';

const STORAGE_KEY = 'transeurop-data';

// Strip base64 photo data before saving to localStorage to avoid exceeding 5-10MB limit
// A single photo can be 500KB-2MB in base64
function stripPhotos(state: DataStoreState): DataStoreState {
  return {
    ...state,
    orders: state.orders.map(o => ({
      ...o,
      photos: o.photos?.map(() => '[photo]'),
    })),
    deliveryProofs: state.deliveryProofs.map(p => ({
      ...p,
      photos: p.photos.map(() => '[photo]'),
      signature: p.signature ? '[signature]' : undefined,
    })),
    pickupProofs: state.pickupProofs.map(p => ({
      ...p,
      photos: p.photos.map(() => '[photo]'),
    })),
    damageReports: state.damageReports.map(r => ({
      ...r,
      photos: r.photos.map(() => '[photo]'),
    })),
    // Also strip settings logo if it's base64
    settings: state.settings ? {
      ...state.settings,
      logo: state.settings.logo?.startsWith('data:') ? '[logo]' : state.settings.logo,
    } : state.settings,
  };
}

export function saveState(state: DataStoreState): void {
  try {
    const stripped = stripPhotos(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function loadState(): Partial<DataStoreState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Filter out placeholder photos — they'll show as empty
    if (parsed.orders) {
      parsed.orders = parsed.orders.map((o: any) => ({
        ...o,
        photos: o.photos?.filter((p: string) => p !== '[photo]') ?? [],
      }));
    }
    if (parsed.deliveryProofs) {
      parsed.deliveryProofs = parsed.deliveryProofs.map((p: any) => ({
        ...p,
        photos: p.photos.filter((ph: string) => ph !== '[photo]'),
        signature: p.signature === '[signature]' ? undefined : p.signature,
      }));
    }
    if (parsed.pickupProofs) {
      parsed.pickupProofs = parsed.pickupProofs.map((p: any) => ({
        ...p,
        photos: p.photos.filter((ph: string) => ph !== '[photo]'),
      }));
    }
    if (parsed.damageReports) {
      parsed.damageReports = parsed.damageReports.map((r: any) => ({
        ...r,
        photos: r.photos.filter((ph: string) => ph !== '[photo]'),
      }));
    }
    if (parsed.settings?.logo === '[logo]') {
      parsed.settings.logo = null;
    }
    return parsed;
  } catch {
    return null;
  }
}
