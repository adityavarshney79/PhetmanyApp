export interface HomeBanner {
  id: string;
  image: string;
  title?: string;
  active: boolean;
  createdAt: string;
}

const DEFAULT_BANNERS: HomeBanner[] = [
  {
    id: 'banner_1',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=1200',
    title: 'VIEW OUR UNIQUELY MESMERISING TRAPEZOID CUT',
    active: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'banner_2',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1200',
    title: 'EXCLUSIVE DIAMOND NECKLACES & FINE JEWELRY',
    active: true,
    createdAt: '2026-01-02T00:00:00Z'
  },
  {
    id: 'banner_3',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200',
    title: 'COLLECTION OF HAND-PICKED EXQUISITE GEMSTONES',
    active: true,
    createdAt: '2026-01-03T00:00:00Z'
  }
];

export async function fetchBannersFromDb(): Promise<HomeBanner[]> {
  return getBanners();
}

// Backward compatibility alias
export const fetchBannersFromFirestore = fetchBannersFromDb;

export function getBanners(): HomeBanner[] {
  const local = localStorage.getItem('phetmany_home_banners');
  if (!local) {
    localStorage.setItem('phetmany_home_banners', JSON.stringify(DEFAULT_BANNERS));
    return DEFAULT_BANNERS;
  }
  try {
    return JSON.parse(local);
  } catch (e) {
    return DEFAULT_BANNERS;
  }
}

export function saveBanners(banners: HomeBanner[]): void {
  localStorage.setItem('phetmany_home_banners', JSON.stringify(banners));
}

export function addBanner(banner: HomeBanner): void {
  const banners = getBanners();
  banners.push(banner);
  saveBanners(banners);
}

export function deleteBanner(id: string): void {
  const banners = getBanners();
  const filtered = banners.filter(b => b.id !== id);
  localStorage.setItem('phetmany_home_banners', JSON.stringify(filtered));
}
