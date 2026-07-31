import { WalletTransaction } from '../types';
import { updateUserProfile, getUserProfile } from './firebase';

// High-fidelity pre-seeded mock transactions for initial display & local fallback
const SEED_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx_seed_1',
    userId: 'vip_customer_1',
    username: 'john_vip',
    userEmail: 'john.smith@diamondtrade.com',
    amount: 150000,
    paymentGateway: 'Wire Transfer',
    status: 'Approved',
    paymentSlipUrl: 'https://raavsolutions.com/phetmanyapp/images/sample_receipt_1.jpg',
    notes: 'Premium Diamond Wire transfer - invoice PM-2026-99',
    adminFeedback: 'Verified with Siam Commercial Bank bank statement.',
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'tx_seed_2',
    userId: 'b2b_partner_1',
    username: 'jewelry_traders_ltd',
    userEmail: 'purchasing@jewelrytraders.com',
    amount: 500000,
    paymentGateway: 'Wire Transfer',
    status: 'Pending',
    paymentSlipUrl: 'https://raavsolutions.com/phetmanyapp/images/sample_receipt_2.jpg',
    notes: 'Bulk deposit for upcoming diamond auctions',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'tx_seed_3',
    userId: 'guest_demo_user',
    username: 'demo_shopper',
    userEmail: 'shopper@phetmany.co',
    amount: 45000,
    paymentGateway: 'UPI',
    status: 'Pending',
    upiTransactionId: 'UPI-9921-8812-7721',
    notes: 'Quick wallet credit for ring setting',
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
  },
  {
    id: 'tx_seed_4',
    userId: 'vip_customer_1',
    username: 'john_vip',
    userEmail: 'john.smith@diamondtrade.com',
    amount: 80000,
    paymentGateway: 'Wire Transfer',
    status: 'Rejected',
    paymentSlipUrl: 'https://raavsolutions.com/phetmanyapp/images/sample_receipt_3.jpg',
    notes: 'Adding money for side stones',
    adminFeedback: 'Discrepancy: Uploaded receipt is from July 2025 (stale date) and doesn\'t match current ledger amount.',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 23 * 3600 * 1000).toISOString()
  }
];

function getLocalTransactions(): WalletTransaction[] {
  const local = localStorage.getItem('phetmany_wallet_transactions');
  if (!local) {
    localStorage.setItem('phetmany_wallet_transactions', JSON.stringify(SEED_TRANSACTIONS));
    return SEED_TRANSACTIONS;
  }
  try {
    return JSON.parse(local);
  } catch (e) {
    return SEED_TRANSACTIONS;
  }
}

function setLocalTransactions(txs: WalletTransaction[]) {
  localStorage.setItem('phetmany_wallet_transactions', JSON.stringify(txs));
}

// 1. Fetch All Transactions (Admin Audit Ledger)
export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  const txs = getLocalTransactions();
  return txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// 2. Submit a New Top-up Transaction Request
export async function createWalletTransaction(
  userId: string,
  username: string,
  userEmail: string,
  amount: number,
  gateway: 'UPI' | 'Wire Transfer',
  details: {
    paymentSlipUrl?: string;
    upiTransactionId?: string;
    notes?: string;
  }
): Promise<WalletTransaction> {
  const newTx: WalletTransaction = {
    id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    userId,
    username,
    userEmail,
    amount,
    paymentGateway: gateway,
    status: 'Pending',
    paymentSlipUrl: details.paymentSlipUrl,
    upiTransactionId: details.upiTransactionId,
    notes: details.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const current = getLocalTransactions();
  current.unshift(newTx);
  setLocalTransactions(current);

  return newTx;
}

// 3. Admin: Approve or Reject Wallet Top-up with Discrepancy details
export async function updateWalletTransactionStatus(
  transactionId: string,
  status: 'Approved' | 'Rejected',
  adminFeedback?: string
): Promise<void> {
  const current = getLocalTransactions();
  const txIndex = current.findIndex(tx => tx.id === transactionId);
  if (txIndex === -1) return;

  const tx = current[txIndex];
  if (tx.status !== 'Pending') {
    throw new Error('This transaction is already processed!');
  }

  tx.status = status;
  tx.adminFeedback = adminFeedback || '';
  tx.updatedAt = new Date().toISOString();
  setLocalTransactions(current);

  if (status === 'Approved') {
    await incrementUserWalletBalance(tx.userId, tx.amount);
  }
}

// Helper: increment user wallet balance safely
export async function incrementUserWalletBalance(userId: string, amount: number): Promise<number> {
  const profile = await getUserProfile(userId);
  const currentBalance = profile?.walletBalance || 0;
  const newBalance = currentBalance + amount;
  
  await updateUserProfile(userId, { walletBalance: newBalance });
  return newBalance;
}

// Helper: deduct user wallet balance safely (for checking out)
export async function deductUserWalletBalance(userId: string, amount: number): Promise<number> {
  const profile = await getUserProfile(userId);
  const currentBalance = profile?.walletBalance || 0;
  if (currentBalance < amount) {
    throw new Error('Insufficient wallet balance!');
  }
  const newBalance = currentBalance - amount;
  
  await updateUserProfile(userId, { walletBalance: newBalance });
  return newBalance;
}
