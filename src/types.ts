export type UserRole =
  | 'Super Administrator'
  | 'Store Manager'
  | 'Content Editor'
  | 'Customer Support'
  | 'Technical/Dev'
  | 'AdminMaster'
  | 'Guest'
  | 'Registered Customer'
  | 'VIP/Loyalty Member'
  | 'Wholesale/B2B Partner';

export interface RoleDetail {
  role: UserRole;
  accessLevel: 'Full' | 'High' | 'Medium' | 'Restricted' | 'Controlled' | 'Master' | 'None';
  responsibilities: string;
  isCustomerFacing: boolean;
  color: string; // for UI badge styling
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  fullName: string;
  createdAt: string;
  lastLogin?: string;
  status: 'Active' | 'Inactive';
  walletBalance?: number;
}

export const ROLE_DETAILS: Record<UserRole, RoleDetail> = {
  'Super Administrator': {
    role: 'Super Administrator',
    accessLevel: 'Full',
    responsibilities: 'Full Access. Can manage all settings, plugins, themes, and other user accounts. Holds the "keys to the kingdom."',
    isCustomerFacing: false,
    color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  },
  'AdminMaster': {
    role: 'AdminMaster',
    accessLevel: 'Master',
    responsibilities: 'Access to all settings, user permissions, and billing history.',
    isCustomerFacing: false,
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
  },
  'Store Manager': {
    role: 'Store Manager',
    accessLevel: 'High',
    responsibilities: 'Manages inventory, processes orders, updates product pricing, and views sales reports. Cannot change core security settings.',
    isCustomerFacing: false,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  },
  'Technical/Dev': {
    role: 'Technical/Dev',
    accessLevel: 'Controlled',
    responsibilities: 'Access to code, database, and server settings. Restricted from viewing sensitive customer payment details.',
    isCustomerFacing: false,
    color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  },
  'Content Editor': {
    role: 'Content Editor',
    accessLevel: 'Medium',
    responsibilities: 'Updates product descriptions, writes blog posts (for SEO), manages media/images, and monitors customer reviews.',
    isCustomerFacing: false,
    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  'Customer Support': {
    role: 'Customer Support',
    accessLevel: 'Restricted',
    responsibilities: 'Access to the order management dashboard to issue refunds, update shipping status, and respond to customer queries.',
    isCustomerFacing: false,
    color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  },
  'Wholesale/B2B Partner': {
    role: 'Wholesale/B2B Partner',
    accessLevel: 'High',
    responsibilities: 'Jewelry traders and bulk dealers. Access to bulk pricing tiers, bulk-order forms, and tax-exempt checkout options.',
    isCustomerFacing: true,
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
  },
  'VIP/Loyalty Member': {
    role: 'VIP/Loyalty Member',
    accessLevel: 'Medium',
    responsibilities: 'Special tier for high-frequency or high-value shoppers. Access to exclusive pricing, early access to collections, or specialized concierge support.',
    isCustomerFacing: true,
    color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  },
  'Registered Customer': {
    role: 'Registered Customer',
    accessLevel: 'Restricted',
    responsibilities: 'Saved account. Tracks orders, saves shipping addresses, maintains Wishlist, and accesses order history.',
    isCustomerFacing: true,
    color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
  },
  'Guest': {
    role: 'Guest',
    accessLevel: 'None',
    responsibilities: 'Unauthenticated user. Browses products and adds items to cart. Must register or log in during checkout to proceed.',
    isCustomerFacing: true,
    color: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
  },
};

export interface Product {
  id: string;
  name: string;
  cut: string; // E.g., 'Excellent', 'EX', 'Very Good', 'VG', etc.
  color: string; // E.g., 'D', 'E', 'F', etc.
  clarity: string; // E.g., 'FL', 'IF', 'VVS1', etc.
  carat: number;
  certification: string; // E.g., 'GIA', 'IGI', etc.
  certId: string;
  price: number;
  stock: number;
  image: string; // main image
  images: string[]; // secondary gallery images
  video360?: string; // 360° product video or interactive view url
  description: string;
  status: 'In Stock' | 'Out of Stock' | 'On Hold';
  isFeatured?: boolean;
  isExclusive?: boolean;
  isStoneOfTheDay?: boolean;

  // Sample Diamond Wholesale Specific Fields
  Sr_No_?: number;
  Stock_NO?: string;
  Shape?: string;
  Color_Shade?: string;
  Rap_Rate?: number;
  Rap_Vlu?: number;
  Rap__?: number;
  Pr_Ct?: number;
  Amount?: number;
  TD_?: number;
  Tab_?: number;
  Polish?: string;
  Symmetry?: string;
  Fluorescent?: string;
  Measurement?: string;
  Lab?: string;
  H_A?: string;
  CUL?: string;
  Girdle?: string;
  Girdle_?: number;
  BIT?: string;
  BIC?: string;
  WIT?: string;
  WIC?: string;
  MILKY?: string;
  LIns?: string;
  LUS?: string;
  OPPV?: string;
  OPTA?: string;
  OPCR?: string;
  CA?: number;
  CH?: number;
  PA?: number;
  PHP?: number;
  CERT_NO?: string;
  Location?: string;
  RO?: string;
  EC?: string;
  Keytosymbol?: string;
  FancyColorDescription?: string;
  ImageLink?: string;
  CertificateLink?: string;
  VideoLink?: string;
  Videomp4Link?: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'PromptPay' | 'TrueMoney' | 'Credit Card';
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  shippingStatus: 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered';
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  invoiceNumber: string;
  createdAt: string;
  trackingNumber?: string;
  trackingHistory: {
    status: string;
    timestamp: string;
    note: string;
  }[];
}

export interface SupportMessage {
  id: string;
  sender: 'user' | 'support';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  status: 'Open' | 'Pending' | 'Resolved';
  createdAt: string;
  messages: SupportMessage[];
}

export interface WalletTransaction {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  amount: number;
  paymentGateway: 'UPI' | 'Wire Transfer';
  status: 'Pending' | 'Approved' | 'Rejected';
  paymentSlipUrl?: string;
  upiTransactionId?: string;
  notes?: string;
  adminFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

