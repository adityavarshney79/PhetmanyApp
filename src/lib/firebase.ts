import { UserProfile } from '../types';

// Hostinger MySQL user profile service

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

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const users: UserProfile[] = await res.json();
      if (Array.isArray(users) && users.length > 0) {
        setLocalUsers(users);
        return users;
      }
      // Seed Hostinger MySQL database if empty
      console.log('MySQL users empty. Seeding initial users...');
      for (const u of SEED_USERS) {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(u)
        }).catch(() => {});
      }
      return SEED_USERS;
    }
  } catch (error) {
    console.warn('MySQL user fetch error, using local fallback:', error);
  }
  return getLocalUsers();
}

export async function getUserProfile(id: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (res.ok) {
      const user = await res.json();
      return user;
    }
  } catch (error) {
    console.warn('MySQL getUserProfile error:', error);
  }
  const local = getLocalUsers();
  return local.find(u => u.id === id) || null;
}

export async function createUserProfile(profile: UserProfile): Promise<UserProfile> {
  const local = getLocalUsers();
  const existingIndex = local.findIndex(u => u.id === profile.id || u.username.toLowerCase() === profile.username.toLowerCase());
  if (existingIndex > -1) {
    local[existingIndex] = profile;
  } else {
    local.push(profile);
  }
  setLocalUsers(local);

  try {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
  } catch (error) {
    console.error('MySQL createUserProfile failed:', error);
  }
  return profile;
}

export async function updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<void> {
  const local = getLocalUsers();
  const index = local.findIndex(u => u.id === id);
  let updatedUser: UserProfile | null = null;
  if (index > -1) {
    updatedUser = { ...local[index], ...updates };
    local[index] = updatedUser;
    setLocalUsers(local);
  }

  if (updatedUser) {
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
    } catch (error) {
      console.error('MySQL updateUserProfile failed:', error);
    }
  }
}

export async function deleteUserProfile(id: string): Promise<void> {
  const local = getLocalUsers();
  const filtered = local.filter(u => u.id !== id);
  setLocalUsers(filtered);

  try {
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
  } catch (error) {
    console.error('MySQL deleteUserProfile failed:', error);
  }
}
