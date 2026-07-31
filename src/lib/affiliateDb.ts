

export interface AffiliateProgramBenefits {
  benefits: string[];
}

export interface AffiliateProfile {
  id: string; // usually userId
  userId: string;
  email: string;
  fullName: string;
  couponCode: string;
  discountPercent: number; // E.g., 5% discount for users using this coupon
  commissionPerProduct: number; // E.g., 500 THB / USD fixed per product
  commissionPerOrder: number;   // E.g., 1000 THB / USD fixed per order
  commissionPercent: number;    // E.g., 5% of order subtotal
  status: 'Pending' | 'Active' | 'Declined';
  clicks: number;
  createdAt: string;
}

export interface AffiliateReferredOrder {
  id: string;
  affiliateId: string;
  orderId: string;
  customerName: string;
  orderTotal: number;
  discountAmount: number;
  commissionEarned: number;
  commissionBreakdown: {
    perProduct: number;
    perOrder: number;
    percent: number;
  };
  payoutStatus?: 'Unpaid' | 'Pending' | 'Paid';
  payoutDate?: string;
  payoutNotes?: string;
  createdAt: string;
}

// ---------------- DEFAULT DATA SEEDS ----------------
const DEFAULT_BENEFITS: string[] = [
  "Flexible Triple-tier Commission Structure (Combine Per-Order, Per-Product & Percentages!)",
  "Special Exclusive Discounts (Give 5% - 20% discount coupons to your clients & followers)",
  "Real-time Analytics Dashboard (Detailed clicks, usage, referred orders, and payout tracking)",
  "Instant Referral URL Generator with active source parameters tracking",
  "Dedicated Gemologist Concierge support for closing high-ticket diamond deals"
];

const DEFAULT_AFFILIATES: AffiliateProfile[] = [
  {
    id: 'user_aff_01',
    userId: 'user_01', // Example existing user
    email: 'affiliate1@phetmany.com',
    fullName: 'Aditya Varshney',
    couponCode: 'ADITYA10',
    discountPercent: 10,
    commissionPerProduct: 500,
    commissionPerOrder: 1000,
    commissionPercent: 5,
    status: 'Active',
    clicks: 142,
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'user_aff_02',
    userId: 'user_02',
    email: 'partner@wholesale.com',
    fullName: 'Sarah Jenkins (Diamond Broker)',
    couponCode: 'SARAHGLOW',
    discountPercent: 15,
    commissionPerProduct: 1000,
    commissionPerOrder: 2000,
    commissionPercent: 8,
    status: 'Active',
    clicks: 89,
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  }
];

const DEFAULT_REFERRED_ORDERS: AffiliateReferredOrder[] = [
  {
    id: 'ref_ord_101',
    affiliateId: 'user_aff_01',
    orderId: 'ord_5412',
    customerName: 'Chaiwat Mongkol',
    orderTotal: 450000,
    discountAmount: 45000,
    commissionEarned: 24000, // perProduct(1*500) + perOrder(1000) + percent(5% of 450k = 22.5k) = 24k
    commissionBreakdown: {
      perProduct: 500,
      perOrder: 1000,
      percent: 22500
    },
    payoutStatus: 'Paid',
    payoutDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    payoutNotes: 'Settle via Bank Transfer Ref #BT9921',
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'ref_ord_102',
    affiliateId: 'user_aff_01',
    orderId: 'ord_9872',
    customerName: 'Somchai Thani',
    orderTotal: 180000,
    discountAmount: 18000,
    commissionEarned: 10500, // perProduct(500) + perOrder(1000) + percent(9000) = 10.5k
    commissionBreakdown: {
      perProduct: 500,
      perOrder: 1000,
      percent: 9000
    },
    payoutStatus: 'Unpaid',
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  }
];

// ---------------- LOCAL STORAGE METHODS ----------------

// 1. BENEFITS
export async function getAffiliateBenefits(): Promise<string[]> {
  const local = localStorage.getItem('affiliate_benefits');
  if (local) {
    try { return JSON.parse(local); } catch (e) {}
  }
  localStorage.setItem('affiliate_benefits', JSON.stringify(DEFAULT_BENEFITS));
  return DEFAULT_BENEFITS;
}

export async function saveAffiliateBenefits(benefits: string[]): Promise<void> {
  localStorage.setItem('affiliate_benefits', JSON.stringify(benefits));
}

// 2. AFFILIATES LIST
export async function getAffiliates(): Promise<AffiliateProfile[]> {
  const local = localStorage.getItem('affiliates_list');
  if (local) {
    try { return JSON.parse(local); } catch (e) {}
  }
  localStorage.setItem('affiliates_list', JSON.stringify(DEFAULT_AFFILIATES));
  return DEFAULT_AFFILIATES;
}

export async function saveAffiliateProfile(profile: AffiliateProfile): Promise<void> {
  const affiliates = await getAffiliates();
  const updated = affiliates.filter(a => a.id !== profile.id);
  updated.push(profile);
  localStorage.setItem('affiliates_list', JSON.stringify(updated));
}

// 3. REFERRED ORDERS
export async function getReferredOrders(): Promise<AffiliateReferredOrder[]> {
  const local = localStorage.getItem('referred_orders_list');
  if (local) {
    try { return JSON.parse(local); } catch (e) {}
  }
  localStorage.setItem('referred_orders_list', JSON.stringify(DEFAULT_REFERRED_ORDERS));
  return DEFAULT_REFERRED_ORDERS;
}

export async function addReferredOrder(ord: AffiliateReferredOrder): Promise<void> {
  const currentOrders = await getReferredOrders();
  currentOrders.push(ord);
  localStorage.setItem('referred_orders_list', JSON.stringify(currentOrders));
}

// 4. COUPON SEARCH FUNCTION
export async function findAffiliateByCoupon(code: string): Promise<AffiliateProfile | null> {
  const codeClean = code.trim().toUpperCase();
  const affiliates = await getAffiliates();
  const found = affiliates.find(a => a.couponCode.toUpperCase() === codeClean && a.status === 'Active');
  return found || null;
}

// 5. HELPER TO RECORD REFERRED ORDER COMMISSIONS DURING CHECKOUT
export async function recordCommissionForOrder(
  orderId: string,
  couponCode: string,
  orderTotal: number,
  customerName: string,
  itemCount: number
): Promise<{ discountPercent: number; discountAmount: number; commissionEarned: number } | null> {
  const aff = await findAffiliateByCoupon(couponCode);
  if (!aff) return null;

  // Calculate discount applied to order
  const discountAmount = Math.round(orderTotal * (aff.discountPercent / 100));

  // Compute three-tier flexible commission: perProduct, perOrder, and percent
  const commPerProductTotal = aff.commissionPerProduct * itemCount;
  const commPerOrderTotal = aff.commissionPerOrder;
  const commPercentTotal = Math.round((orderTotal - discountAmount) * (aff.commissionPercent / 100));
  const totalCommission = commPerProductTotal + commPerOrderTotal + commPercentTotal;

  const refOrd: AffiliateReferredOrder = {
    id: `ref_ord_${Date.now()}_${Math.floor(Math.random() * 900 + 100)}`,
    affiliateId: aff.id,
    orderId,
    customerName,
    orderTotal,
    discountAmount,
    commissionEarned: totalCommission,
    commissionBreakdown: {
      perProduct: commPerProductTotal,
      perOrder: commPerOrderTotal,
      percent: commPercentTotal
    },
    payoutStatus: 'Unpaid',
    createdAt: new Date().toISOString()
  };

  await addReferredOrder(refOrd);
  return {
    discountPercent: aff.discountPercent,
    discountAmount,
    commissionEarned: totalCommission
  };
}

// 6. UPDATE PAYOUT STATUS FOR ADMIN LEDGER
export async function updatePayoutStatus(
  referredOrderId: string,
  status: 'Unpaid' | 'Pending' | 'Paid',
  notes?: string
): Promise<void> {
  const currentOrders = await getReferredOrders();
  const idx = currentOrders.findIndex(o => o.id === referredOrderId);
  if (idx !== -1) {
    currentOrders[idx].payoutStatus = status;
    currentOrders[idx].payoutNotes = notes || '';
    if (status === 'Paid') {
      currentOrders[idx].payoutDate = new Date().toISOString();
    }
    localStorage.setItem('referred_orders_list', JSON.stringify(currentOrders));
  }
}
