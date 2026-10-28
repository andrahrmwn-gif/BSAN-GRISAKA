import { UserAccount, UserRole } from '../types/auth';

const STORAGE_KEYS = {
  ACCOUNTS: 'bsan_grisaka_accounts_v1',
  CURRENT_USER_ID: 'bsan_grisaka_current_user_v1',
};

export const MAX_ACCOUNTS = 20;

export const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr-001',
    name: 'Yuliana Dewi Marithawati, S.Pd., M.Pd.',
    username: 'kepsek',
    role: 'Kepala Sekolah',
    nip: '19740512 199802 2 003',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: true,
    canManageSettings: true,
    avatarColor: '#0B231E',
  },
  {
    id: 'usr-002',
    name: 'Andi Prasetyo, S.Pd.',
    username: 'wakasek.kesiswaan',
    role: 'Wakasek Kesiswaan',
    nip: '19800315 200604 1 007',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: true,
    canManageSettings: true,
    avatarColor: '#1E3A8A',
  },
  {
    id: 'usr-003',
    name: 'Sri Wahyuni, S.Pd., M.Si.',
    username: 'bk.sriwahyuni',
    role: 'Guru BK',
    nip: '19780824 200501 2 008',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#6D28D9',
  },
  {
    id: 'usr-004',
    name: 'Drs. Subagyo, M.Pd.',
    username: 'bk.subagyo',
    role: 'Guru BK',
    nip: '19720410 199703 1 004',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#4C1D95',
  },
  {
    id: 'usr-005',
    name: 'Nurlaila Hanum, S.Pd.',
    username: 'bk.nurlaila',
    role: 'Guru BK',
    nip: '19850912 201001 2 015',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#7C3AED',
  },
  {
    id: 'usr-006',
    name: 'Bambang Triyono, S.Pd.',
    username: 'tim.ketertiban1',
    role: 'Tim Kesiswaan & Ketertiban',
    nip: '19810214 200801 1 009',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#9A3412',
  },
  {
    id: 'usr-007',
    name: 'Rina Kusuma Dewi, S.Pd.',
    username: 'tim.ketertiban2',
    role: 'Tim Kesiswaan & Ketertiban',
    nip: '19860620 201101 2 012',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#C2410C',
  },
  {
    id: 'usr-008',
    name: 'Eko Wahyudi, S.Pd.',
    username: 'tim.ketertiban3',
    role: 'Tim Kesiswaan & Ketertiban',
    nip: '19890105 201402 1 003',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#EA580C',
  },
  {
    id: 'usr-009',
    name: 'Siti Aminah, S.Pd.',
    username: 'piket.senin',
    role: 'Guru Piket',
    nip: '19840311 200902 2 006',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#047857',
  },
  {
    id: 'usr-010',
    name: 'Hadi Sucipto, S.Pd.',
    username: 'piket.selasa',
    role: 'Guru Piket',
    nip: '19871109 201001 1 011',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#059669',
  },
  {
    id: 'usr-011',
    name: 'Dewi Lestari, S.Pd.',
    username: 'piket.rabu',
    role: 'Guru Piket',
    nip: '19900814 201503 2 004',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#10B981',
  },
  {
    id: 'usr-012',
    name: 'Joko Susilo, S.Pd.',
    username: 'piket.kamis',
    role: 'Guru Piket',
    nip: '19820516 200801 1 014',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#0D9488',
  },
  {
    id: 'usr-013',
    name: 'Tri Haryanti, S.Pd.',
    username: 'piket.jumat',
    role: 'Guru Piket',
    nip: '19890422 201402 2 008',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#0284C7',
  },
  {
    id: 'usr-014',
    name: 'Supriyanto, S.Pd.',
    username: 'piket.sabtu',
    role: 'Guru Piket',
    nip: '19850730 201101 1 007',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#0369A1',
  },
  {
    id: 'usr-015',
    name: 'Nurul Hidayati, S.Pd.',
    username: 'wali.7a',
    role: 'Wali Kelas',
    nip: '19910118 201903 2 018',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#2563EB',
  },
  {
    id: 'usr-016',
    name: 'Agus Santoso, S.Pd.',
    username: 'wali.8a',
    role: 'Wali Kelas',
    nip: '19880212 201201 1 005',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#1D4ED8',
  },
  {
    id: 'usr-017',
    name: 'Endang Purwanti, S.Pd.',
    username: 'wali.9a',
    role: 'Wali Kelas',
    nip: '19790903 200604 2 011',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#1E40AF',
  },
  {
    id: 'usr-018',
    name: 'Kurniawan Dwi, A.Md.',
    username: 'tu.admin1',
    role: 'Tata Usaha (Admin)',
    nip: '19930615 202012 1 004',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: true,
    canManageSettings: true,
    avatarColor: '#374151',
  },
  {
    id: 'usr-019',
    name: 'Maya Indriani, S.Kom.',
    username: 'tu.admin2',
    role: 'Tata Usaha (Admin)',
    nip: '19951025 202203 2 009',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: true,
    avatarColor: '#4B5563',
  },
  {
    id: 'usr-020',
    name: 'Drs. Hendro Wibowo',
    username: 'kesiswaan.cadangan',
    role: 'Tim Kesiswaan & Ketertiban',
    nip: '19760812 200212 1 002',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#15803D',
  },
];

export const getStoredAccounts = (): UserAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    return parsed.slice(0, MAX_ACCOUNTS); // Enforce max 20
  } catch (err) {
    console.error('Failed reading user accounts', err);
    return DEFAULT_ACCOUNTS;
  }
};

export const saveAccounts = (accounts: UserAccount[]): boolean => {
  try {
    if (accounts.length > MAX_ACCOUNTS) {
      console.warn(`Cannot save more than ${MAX_ACCOUNTS} accounts! Truncating.`);
      accounts = accounts.slice(0, MAX_ACCOUNTS);
    }
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    return true;
  } catch (err) {
    console.error('Failed saving accounts', err);
    return false;
  }
};

export const getCurrentUserId = (): string => {
  try {
    // Default to first account or stored user. If 'guest', it's Guest Mode.
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'usr-001';
  } catch {
    return 'usr-001';
  }
};

export const setCurrentUserId = (userId: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  } catch (err) {
    console.error('Failed setting current user id', err);
  }
};

export const getCurrentUser = (): UserAccount | null => {
  const currentId = getCurrentUserId();
  if (currentId === 'guest') {
    return null; // Guest mode
  }
  const accounts = getStoredAccounts();
  const found = accounts.find((a) => a.id === currentId && a.isActive);
  return found || null;
};

export const isGuestMode = (): boolean => {
  return getCurrentUserId() === 'guest' || getCurrentUser() === null;
};

export const canUserModify = (): boolean => {
  const user = getCurrentUser();
  if (!user || !user.isActive) return false;
  return user.canEdit;
};

export const addAccount = (newAccount: Omit<UserAccount, 'id'>): { success: boolean; message: string; account?: UserAccount } => {
  const accounts = getStoredAccounts();
  if (accounts.length >= MAX_ACCOUNTS) {
    return {
      success: false,
      message: `Batas kuota tercapai: Sistem dibatasi maksimal ${MAX_ACCOUNTS} akun petugas. Hapus atau nonaktifkan akun lama terlebih dahulu.`
    };
  }

  // Check username uniqueness
  if (accounts.some(a => a.username.toLowerCase() === newAccount.username.toLowerCase())) {
    return {
      success: false,
      message: `Username "${newAccount.username}" sudah digunakan oleh akun lain.`
    };
  }

  const id = `usr-${String(Date.now()).slice(-6)}`;
  const created: UserAccount = {
    ...newAccount,
    id,
  };

  const updated = [...accounts, created];
  saveAccounts(updated);

  return {
    success: true,
    message: `Akun ${created.name} (${created.role}) berhasil didaftarkan ke sistem (${updated.length}/${MAX_ACCOUNTS}).`,
    account: created,
  };
};

export const updateAccount = (id: string, updates: Partial<UserAccount>): { success: boolean; message: string } => {
  const accounts = getStoredAccounts();
  const index = accounts.findIndex(a => a.id === id);
  if (index === -1) {
    return { success: false, message: 'Akun tidak ditemukan' };
  }

  accounts[index] = { ...accounts[index], ...updates };
  saveAccounts(accounts);
  return { success: true, message: 'Perubahan akun berhasil disimpan' };
};

export const deleteAccount = (id: string): { success: boolean; message: string } => {
  const accounts = getStoredAccounts();
  if (accounts.length <= 1) {
    return { success: false, message: 'Minimal harus ada 1 akun pengelola di dalam sistem' };
  }

  const updated = accounts.filter(a => a.id !== id);
  saveAccounts(updated);

  if (getCurrentUserId() === id) {
    setCurrentUserId('guest');
  }

  return { success: true, message: `Akun berhasil dihapus. Tersisa ${updated.length}/${MAX_ACCOUNTS} akun.` };
};
