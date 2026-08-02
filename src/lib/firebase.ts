import { UserProfile } from '../types';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  getDoc 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Target Firestore Database ID
export const TARGET_DATABASE_ID = 'ai-studio-9d165634-d14e-4de4-a345-bb74bfdf950b';

// Initialize Firebase App and Firestore Instance with specified Database ID
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firestoreDb = getFirestore(app, TARGET_DATABASE_ID);

const SEED_USERS: UserProfile[] = [
  {
    id: 'admin_master_1',
    username: 'savji_phetmany',
    email: 'savjidholakia@phetmany.co',
    fullName: 'Savji Dholakia',
    role: 'AdminMaster',
    createdAt: '2026-01-01T09:00:00Z',
    lastLogin: '2026-07-05T10:15:00Z',
    status: 'Active',
  },
  {
    id: 'super_admin_1',
    username: 'ghanshyam_admin',
    email: 'ghanshyam@phetmany.co',
    fullName: 'Ghanshyam Dholakia',
    role: 'Super Administrator',
    createdAt: '2026-01-10T09:00:00Z',
    lastLogin: '2026-07-05T10:30:00Z',
    status: 'Active',
  },
  {
    id: 'store_manager_1',
    username: 'rajesh_mgr',
    email: 'rajesh.patel@phetmany.co',
    fullName: 'Rajesh Patel',
    role: 'Store Manager',
    createdAt: '2026-02-15T11:00:00Z',
    lastLogin: '2026-07-05T08:00:00Z',
    status: 'Active',
  },
  {
    id: 'tech_dev_1',
    username: 'kartik_dev',
    email: 'kartik.dev@phetmany.co',
    fullName: 'Kartik Kheni',
    role: 'Technical/Dev',
    createdAt: '2026-03-01T10:00:00Z',
    lastLogin: '2026-07-05T11:01:23Z',
    status: 'Active',
  },
  {
    id: 'content_editor_1',
    username: 'meera_editor',
    email: 'meera.shah@phetmany.co',
    fullName: 'Meera Shah',
    role: 'Content Editor',
    createdAt: '2026-03-20T14:00:00Z',
    lastLogin: '2026-07-04T16:45:00Z',
    status: 'Active',
  },
  {
    id: 'cust_support_1',
    username: 'amit_support',
    email: 'amit.sharma@phetmany.co',
    fullName: 'Amit Sharma',
    role: 'Customer Support',
    createdAt: '2026-04-05T09:30:00Z',
    lastLogin: '2026-07-05T09:12:00Z',
    status: 'Active',
  },
  {
    id: 'vip_customer_1',
    username: 'john_vip',
    email: 'john.smith@diamondtrade.com',
    fullName: 'John Smith (VIP)',
    role: 'VIP/Loyalty Member',
    createdAt: '2026-05-12T16:00:00Z',
    lastLogin: '2026-07-05T07:30:00Z',
    status: 'Active',
  },
  {
    id: 'b2b_partner_1',
    username: 'jewelry_traders_ltd',
    email: 'purchasing@jewelrytraders.com',
    fullName: 'Jewelry Traders Ltd',
    role: 'Wholesale/B2B Partner',
    createdAt: '2026-06-01T08:00:00Z',
    lastLogin: '2026-07-05T06:00:00Z',
    status: 'Active',
  }
];

function getLocalUsers(): UserProfile[] {
  const local = localStorage.getItem('phetmany_user_profiles');
  if (!local) {
    localStorage.setItem('phetmany_user_profiles', JSON.stringify(SEED_USERS));
    return SEED_USERS;
  }
  try {
    return JSON.parse(local);
  } catch (e) {
    return SEED_USERS;
  }
}

function setLocalUsers(users: UserProfile[]) {
  localStorage.setItem('phetmany_user_profiles', JSON.stringify(users));
}

// 1. Get All Users (Primary: Firestore)
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const usersCol = collection(firestoreDb, 'user_profiles');
    const snapshot = await getDocs(usersCol);
    if (!snapshot.empty) {
      const users: UserProfile[] = snapshot.docs.map(doc => doc.data() as UserProfile);
      setLocalUsers(users);
      return users;
    }

    // Seed Firestore if collection is empty
    console.log(`Firestore user_profiles empty. Seeding initial users into ${TARGET_DATABASE_ID}...`);
    for (const u of SEED_USERS) {
      await setDoc(doc(firestoreDb, 'user_profiles', u.id), u);
    }
    setLocalUsers(SEED_USERS);
    return SEED_USERS;
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded') || error?.message?.includes('Free daily read units')) {
      console.warn('⚠️ GCP Firestore free tier daily read quota limit reached. Falling back to local cached users:', error);
    } else {
      console.warn('Firestore user_profiles fetch failed, relying on local cache:', error);
    }
  }

  return getLocalUsers();
}

// 2. Get Single User Profile
export async function getUserProfile(id: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(firestoreDb, 'user_profiles', id);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
  } catch (error) {
    console.warn('Firestore getUserProfile error:', error);
  }

  const local = getLocalUsers();
  return local.find(u => u.id === id) || null;
}

// 3. Create User Profile (Firestore)
export async function createUserProfile(profile: UserProfile): Promise<UserProfile> {
  const local = getLocalUsers();
  const existingIndex = local.findIndex(u => u.id === profile.id || u.username.toLowerCase() === profile.username.toLowerCase());
  if (existingIndex > -1) {
    local[existingIndex] = profile;
  } else {
    local.push(profile);
  }
  setLocalUsers(local);

  // Firestore
  try {
    await setDoc(doc(firestoreDb, 'user_profiles', profile.id), profile);
  } catch (error) {
    console.error('Firestore createUserProfile failed:', error);
  }

  return profile;
}

// 4. Update User Profile
export async function updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<void> {
  const local = getLocalUsers();
  const index = local.findIndex(u => u.id === id);
  let updatedUser: UserProfile | null = null;
  if (index > -1) {
    updatedUser = { ...local[index], ...updates };
    local[index] = updatedUser;
    setLocalUsers(local);
  } else {
    const existing = await getUserProfile(id);
    if (existing) {
      updatedUser = { ...existing, ...updates };
    }
  }

  if (updatedUser) {
    // Firestore
    try {
      await setDoc(doc(firestoreDb, 'user_profiles', id), updatedUser, { merge: true });
    } catch (error) {
      console.error('Firestore updateUserProfile failed:', error);
    }
  }
}

// 5. Delete User Profile
export async function deleteUserProfile(id: string): Promise<void> {
  const local = getLocalUsers();
  const filtered = local.filter(u => u.id !== id);
  setLocalUsers(filtered);

  // Firestore
  try {
    await deleteDoc(doc(firestoreDb, 'user_profiles', id));
  } catch (error) {
    console.error('Firestore deleteUserProfile failed:', error);
  }
}


