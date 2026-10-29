import { UserAccount, UserRole } from '../types/auth';

const STORAGE_KEYS = {
  ACCOUNTS: 'bsan_grisaka_accounts_v2', // Updated to v2 for 55 accounts
  CURRENT_USER_ID: 'bsan_grisaka_current_user_v2',
};

export const MAX_ACCOUNTS = 55;

export const DEFAULT_ACCOUNTS: UserAccount[] = [
  // 1-4: Pimpinan Sekolah & Wakasek
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
    name: 'Drs. H. Mulyono, M.Pd.',
    username: 'wakasek.kurikulum',
    role: 'Wakasek Kesiswaan',
    nip: '19710815 199702 1 003',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: true,
    canManageSettings: true,
    avatarColor: '#1E40AF',
  },
  {
    id: 'usr-004',
    name: 'Dra. Siti Masitoh, M.Pd.',
    username: 'wakasek.sarpras',
    role: 'Wakasek Kesiswaan',
    nip: '19730419 199803 2 005',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: true,
    canManageSettings: true,
    avatarColor: '#1D4ED8',
  },

  // 5-8: Guru BK (Bimbingan Konseling)
  {
    id: 'usr-005',
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
    id: 'usr-006',
    name: 'Drs. Subagyo, M.Pd.',
    username: 'bk.subagyo',
    role: 'Guru BK',
    nip: '19720410 199703 1 004',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#5B21B6',
  },
  {
    id: 'usr-007',
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
    id: 'usr-008',
    name: 'Fajar Setiawan, S.Pd.',
    username: 'bk.fajar',
    role: 'Guru BK',
    nip: '19880120 201402 1 006',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#4C1D95',
  },

  // 9-12: Tim Kesiswaan & Ketertiban
  {
    id: 'usr-009',
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
    id: 'usr-010',
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
    id: 'usr-011',
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
    id: 'usr-012',
    name: 'Drs. Hendro Wibowo',
    username: 'tim.ketertiban4',
    role: 'Tim Kesiswaan & Ketertiban',
    nip: '19760812 200212 1 002',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#B45309',
  },

  // 13-36: 24 Wali Kelas (7A-7H, 8A-8H, 9A-9H)
  { id: 'usr-013', name: 'Nurul Hidayati, S.Pd.', username: 'wali.7a', role: 'Wali Kelas', nip: '19910118 201903 2 018', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#0369A1' },
  { id: 'usr-014', name: 'Ahmad Fauzi, S.Pd.', username: 'wali.7b', role: 'Wali Kelas', nip: '19870412 201101 1 008', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#0284C7' },
  { id: 'usr-015', name: 'Ratih Kumalasari, S.Pd.', username: 'wali.7c', role: 'Wali Kelas', nip: '19900822 201503 2 006', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#0EA5E9' },
  { id: 'usr-016', name: 'Wahyu Nugroho, S.Pd.', username: 'wali.7d', role: 'Wali Kelas', nip: '19830514 200902 1 004', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#0891B2' },
  { id: 'usr-017', name: 'Tri Hastuti, S.Pd.', username: 'wali.7e', role: 'Wali Kelas', nip: '19861109 201001 2 011', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#06B6D4' },
  { id: 'usr-018', name: 'Dedi Kurniawan, S.Pd.', username: 'wali.7f', role: 'Wali Kelas', nip: '19920315 202012 1 005', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#0D9488' },
  { id: 'usr-019', name: 'Maya Anggraini, S.Pd.', username: 'wali.7g', role: 'Wali Kelas', nip: '19890730 201402 2 007', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#14B8A6' },
  { id: 'usr-020', name: 'Rizky Pratama, S.Pd.', username: 'wali.7h', role: 'Wali Kelas', nip: '19940521 202203 1 003', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#059669' },
  { id: 'usr-021', name: 'Agus Santoso, S.Pd.', username: 'wali.8a', role: 'Wali Kelas', nip: '19880212 201201 1 005', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#10B981' },
  { id: 'usr-022', name: 'Sri Rejeki, S.Pd.', username: 'wali.8b', role: 'Wali Kelas', nip: '19820914 200801 2 009', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#047857' },
  { id: 'usr-023', name: 'Danang Triyadi, S.Pd.', username: 'wali.8c', role: 'Wali Kelas', nip: '19850619 201101 1 006', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#15803D' },
  { id: 'usr-024', name: 'Indah Permatasari, S.Pd.', username: 'wali.8d', role: 'Wali Kelas', nip: '19930410 201903 2 014', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#16A34A' },
  { id: 'usr-025', name: 'Joko Purnomo, S.Pd.', username: 'wali.8e', role: 'Wali Kelas', nip: '19800728 200604 1 008', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#4D7C0F' },
  { id: 'usr-026', name: 'Yuni Astuti, S.Pd.', username: 'wali.8f', role: 'Wali Kelas', nip: '19871203 201001 2 013', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#65A30D' },
  { id: 'usr-027', name: 'Bayu Sasongko, S.Pd.', username: 'wali.8g', role: 'Wali Kelas', nip: '19911015 201503 1 004', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#84CC16' },
  { id: 'usr-028', name: 'Fitri Nur Aini, S.Pd.', username: 'wali.8h', role: 'Wali Kelas', nip: '19950325 202203 2 008', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#A16207' },
  { id: 'usr-029', name: 'Endang Purwanti, S.Pd.', username: 'wali.9a', role: 'Wali Kelas', nip: '19790903 200604 2 011', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#CA8A04' },
  { id: 'usr-030', name: 'Toto Hariyanto, S.Pd.', username: 'wali.9b', role: 'Wali Kelas', nip: '19810416 200801 1 007', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#D97706' },
  { id: 'usr-031', name: 'Dyah Ayu Pitaloka, S.Pd.', username: 'wali.9c', role: 'Wali Kelas', nip: '19880812 201402 2 005', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#B45309' },
  { id: 'usr-032', name: 'Heri Siswanto, S.Pd.', username: 'wali.9d', role: 'Wali Kelas', nip: '19830220 200902 1 003', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#92400E' },
  { id: 'usr-033', name: 'Anita Kusuma, S.Pd.', username: 'wali.9e', role: 'Wali Kelas', nip: '19860517 201101 2 010', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#78350F' },
  { id: 'usr-034', name: 'Gunawan Wibisono, S.Pd.', username: 'wali.9f', role: 'Wali Kelas', nip: '19841124 200902 1 006', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#431407' },
  { id: 'usr-035', name: 'Retno Wulandari, S.Pd.', username: 'wali.9g', role: 'Wali Kelas', nip: '19900218 201503 2 007', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#831843' },
  { id: 'usr-036', name: 'Arif Budiman, S.Pd.', username: 'wali.9h', role: 'Wali Kelas', nip: '19870911 201201 1 008', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#9D174D' },

  // 37-48: 12 Guru Piket (Senin - Sabtu Shift 1 & 2)
  { id: 'usr-037', name: 'Siti Aminah, S.Pd.', username: 'piket.senin1', role: 'Guru Piket', nip: '19840311 200902 2 006', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#047857' },
  { id: 'usr-038', name: 'Budi Hartono, S.Pd.', username: 'piket.senin2', role: 'Guru Piket', nip: '19860115 201001 1 008', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#059669' },
  { id: 'usr-039', name: 'Hadi Sucipto, S.Pd.', username: 'piket.selasa1', role: 'Guru Piket', nip: '19871109 201001 1 011', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#10B981' },
  { id: 'usr-040', name: 'Dewi Sartika, S.Pd.', username: 'piket.selasa2', role: 'Guru Piket', nip: '19910419 201602 2 007', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#0D9488' },
  { id: 'usr-041', name: 'Dewi Lestari, S.Pd.', username: 'piket.rabu1', role: 'Guru Piket', nip: '19900814 201503 2 004', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#0284C7' },
  { id: 'usr-042', name: 'Agung Wicaksono, S.Pd.', username: 'piket.rabu2', role: 'Guru Piket', nip: '19880721 201201 1 009', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#0369A1' },
  { id: 'usr-043', name: 'Joko Susilo, S.Pd.', username: 'piket.kamis1', role: 'Guru Piket', nip: '19820516 200801 1 014', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#2563EB' },
  { id: 'usr-044', name: 'Anisa Rahma, S.Pd.', username: 'piket.kamis2', role: 'Guru Piket', nip: '19930811 201903 2 012', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#1D4ED8' },
  { id: 'usr-045', name: 'Tri Haryanti, S.Pd.', username: 'piket.jumat1', role: 'Guru Piket', nip: '19890422 201402 2 008', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#4F46E5' },
  { id: 'usr-046', name: 'Sugeng Riyadi, S.Pd.', username: 'piket.jumat2', role: 'Guru Piket', nip: '19851214 201101 1 005', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#4338CA' },
  { id: 'usr-047', name: 'Supriyanto, S.Pd.', username: 'piket.sabtu1', role: 'Guru Piket', nip: '19850730 201101 1 007', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#7C3AED' },
  { id: 'usr-048', name: 'Lilis Suryani, S.Pd.', username: 'piket.sabtu2', role: 'Guru Piket', nip: '19920625 201602 2 009', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#6D28D9' },

  // 49-52: 4 Staf Tata Usaha / Admin
  { id: 'usr-049', name: 'Kurniawan Dwi, A.Md.', username: 'tu.admin1', role: 'Tata Usaha (Admin)', nip: '19930615 202012 1 004', pin: '1234', isActive: true, canEdit: true, canDelete: true, canManageSettings: true, avatarColor: '#374151' },
  { id: 'usr-050', name: 'Maya Indriani, S.Kom.', username: 'tu.admin2', role: 'Tata Usaha (Admin)', nip: '19951025 202203 2 009', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: true, avatarColor: '#4B5563' },
  { id: 'usr-051', name: 'Slamet Riyadi, S.AP.', username: 'tu.kepegawaian', role: 'Tata Usaha (Admin)', nip: '19880312 201402 1 004', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: true, avatarColor: '#1F2937' },
  { id: 'usr-052', name: 'Intan Pratiwi, A.Md.', username: 'tu.presensi', role: 'Tata Usaha (Admin)', nip: '19960718 202103 2 005', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: true, avatarColor: '#111827' },

  // 53-55: 3 Pembina & Pendukung Khusus
  { id: 'usr-053', name: 'Haryo Seno, S.Pd.', username: 'pembina.osis', role: 'Tim Kesiswaan & Ketertiban', nip: '19890514 201402 1 007', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#BE185D' },
  { id: 'usr-054', name: 'Dra. Hj. Rumini', username: 'pembina.karakter', role: 'Tim Kesiswaan & Ketertiban', nip: '19700318 199503 2 003', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#9D174D' },
  { id: 'usr-055', name: 'Sutrisno', username: 'satpam.sekolah', role: 'Tim Kesiswaan & Ketertiban', nip: '19781105 200801 1 003', pin: '1234', isActive: true, canEdit: true, canDelete: false, canManageSettings: false, avatarColor: '#0F172A' },
];

export const getStoredAccounts = (): UserAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 25) {
      // Migrate to 55 accounts if older small set found
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    return parsed.slice(0, MAX_ACCOUNTS);
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

/**
 * Requirement: "Setiap orang baru yang membuka web otomatis dalam mode tamu."
 * Default is strictly 'guest' if not set or first visit in this browser session.
 */
export const getCurrentUserId = (): string => {
  try {
    const sessionActive = sessionStorage.getItem('bsan_active_session_unlocked');
    if (!sessionActive) {
      return 'guest';
    }
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return stored || 'guest';
  } catch {
    return 'guest';
  }
};

export const setCurrentUserId = (userId: string): void => {
  try {
    if (userId === 'guest') {
      sessionStorage.removeItem('bsan_active_session_unlocked');
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'guest');
    } else {
      sessionStorage.setItem('bsan_active_session_unlocked', 'true');
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
    }
  } catch (err) {
    console.error('Failed setting current user id', err);
  }
};

export const getCurrentUser = (): UserAccount | null => {
  const currentId = getCurrentUserId();
  if (currentId === 'guest') {
    return null; // Mode Tamu
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
  return { success: true, message: 'Perubahan akun (Nama, NIP, Password) berhasil disimpan' };
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
