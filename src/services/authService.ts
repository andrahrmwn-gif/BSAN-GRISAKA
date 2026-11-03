import { UserAccount, UserRole, OFFICIAL_JABATAN_LIST } from '../types/auth';
import { syncAccountToFirestore, deleteAccountFromFirestore, bulkSyncAccountsToFirestore } from './firebase';

const STORAGE_KEYS = {
  ACCOUNTS: 'bsan_grisaka_accounts_dapodik_v3',
  CURRENT_USER_ID: 'bsan_grisaka_current_user_dapodik_v3',
};

export const MAX_ACCOUNTS = 60;

/**
 * Official Staff Accounts taken directly from Lampiran SK Pembagian Tugas Guru DAPODIK SMPN 1 Kandangan
 */
export const DEFAULT_ACCOUNTS: UserAccount[] = [
  // 1. Kepala Sekolah
  {
    id: 'usr-001',
    name: 'Yuliana Dewi Marithawati, S.Pd., M.Pd.',
    username: 'yuliana.dewi',
    role: 'Kepala Sekolah',
    nip: '19680216 199802 2 001',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: true,
    canManageSettings: true,
    avatarColor: '#1E3A8A',
  },
  // 2. Endah Retno Pratiwi, S.Pd.
  {
    id: 'usr-002',
    name: 'Endah Retno Pratiwi, S.Pd.',
    username: 'endah.retno',
    role: 'Guru',
    nip: '19670202 200501 2 009',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#2563EB',
  },
  // 3. Binti Tsaniyah, S.Pd
  {
    id: 'usr-003',
    name: 'Binti Tsaniyah, S.Pd',
    username: 'binti.tsaniyah',
    role: 'Guru',
    nip: '19671009 199703 2 001',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#3B82F6',
  },
  // 4. Dra. Nanik Supriyani
  {
    id: 'usr-004',
    name: 'Dra. Nanik Supriyani',
    username: 'nanik.supriyani',
    role: 'Wakil Kepala Sekolah Bidang Akademik',
    nip: '19680104 199903 2 002',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: true,
    canManageSettings: true,
    avatarColor: '#059669',
  },
  // 5. Sri Rejeki, S.Pd.
  {
    id: 'usr-005',
    name: 'Sri Rejeki, S.Pd.',
    username: 'sri.rejeki',
    role: 'Guru',
    nip: '19710326 199802 2 004',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#0D9488',
  },
  // 6. Azis, S.Pd, M.Pd
  {
    id: 'usr-006',
    name: 'Azis, S.Pd, M.Pd',
    username: 'azis',
    role: 'Guru',
    nip: '-',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#0891B2',
  },
  // 7. David Ilmiyati Luthfiyah, S.Pd
  {
    id: 'usr-007',
    name: 'David Ilmiyati Luthfiyah, S.Pd',
    username: 'david.ilmiyati',
    role: 'Guru',
    nip: '19790310 200801 2 013',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#7C3AED',
  },
  // 8. Neng Suhetty, S.Pd
  {
    id: 'usr-008',
    name: 'Neng Suhetty, S.Pd',
    username: 'neng.suhetty',
    role: 'Guru',
    nip: '19720301 200501 2 006',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#9333EA',
  },
  // 9. Sri Aminah, S.Pd.
  {
    id: 'usr-009',
    name: 'Sri Aminah, S.Pd.',
    username: 'sri.aminah',
    role: 'Guru',
    nip: '19720428 200604 2 012',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#C026D3',
  },
  // 10. Amin Mariana Ria, S.Pd.
  {
    id: 'usr-010',
    name: 'Amin Mariana Ria, S.Pd.',
    username: 'amin.mariana',
    role: 'Guru',
    nip: '19770325 200801 2 012',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#DB2777',
  },
  // 11. Sudarmanto, S.Pd (Waka Non Akademik)
  {
    id: 'usr-011',
    name: 'Sudarmanto, S.Pd',
    username: 'sudarmanto',
    role: 'Wakil Kepala Sekolah Bidang Non Akademik',
    nip: '19790121 200801 1 006',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: true,
    canManageSettings: true,
    avatarColor: '#D97706',
  },
  // 12. Asep Satria Dwi Hanggara, M.Pd. (Waka Kesiswaan)
  {
    id: 'usr-012',
    name: 'Asep Satria Dwi Hanggara, M.Pd.',
    username: 'asep.satria',
    role: 'Wakil Kepala Sekolah Bidang Kesiswaan',
    nip: '19850903 201001 1 016',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: true,
    canManageSettings: true,
    avatarColor: '#EA580C',
  },
  // 13. Susanti, S.Pd.
  {
    id: 'usr-013',
    name: 'Susanti, S.Pd.',
    username: 'susanti',
    role: 'Guru',
    nip: '19771226 200801 2 012',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#4F46E5',
  },
  // 14. Joko Kuncoro, S.Pd
  {
    id: 'usr-014',
    name: 'Joko Kuncoro, S.Pd',
    username: 'joko.kuncoro',
    role: 'Guru',
    nip: '19821007 200801 1 007',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#2563EB',
  },
  // 15. Dyah Ayu Larasati, S.Pd.
  {
    id: 'usr-015',
    name: 'Dyah Ayu Larasati, S.Pd.',
    username: 'dyah.ayu',
    role: 'Guru',
    nip: '19870610 201001 2 021',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#059669',
  },
  // 16. Nur Khoiriyah, S.Ag
  {
    id: 'usr-016',
    name: 'Nur Khoiriyah, S.Ag',
    username: 'nur.khoiriyah',
    role: 'Guru',
    nip: '19710821 201406 2 001',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#0891B2',
  },
  // 17. Rahmawati, S.Pd.
  {
    id: 'usr-017',
    name: 'Rahmawati, S.Pd.',
    username: 'rahmawati',
    role: 'Guru',
    nip: '19810217 202121 2 002',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#7C3AED',
  },
  // 18. Ana Irfayanti, S.Sos.
  {
    id: 'usr-018',
    name: 'Ana Irfayanti, S.Sos.',
    username: 'ana.irfayanti',
    role: 'Guru',
    nip: '19750427 202221 2 005',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#DB2777',
  },
  // 19. Haryatun, M.Kom
  {
    id: 'usr-019',
    name: 'Haryatun, M.Kom',
    username: 'haryatun',
    role: 'Guru',
    nip: '19770412 202221 2 007',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#2563EB',
  },
  // 20. Sri Sudaryani, S.Pd
  {
    id: 'usr-020',
    name: 'Sri Sudaryani, S.Pd',
    username: 'sri.sudaryani',
    role: 'Guru',
    nip: '19781108 202221 2 009',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#059669',
  },
  // 21. Erna Suswanti, SE
  {
    id: 'usr-021',
    name: 'Erna Suswanti, SE',
    username: 'erna.suswanti',
    role: 'Guru',
    nip: '19800406 202221 2 004',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#D97706',
  },
  // 22. Eliza Ira, SE.
  {
    id: 'usr-022',
    name: 'Eliza Ira, SE.',
    username: 'eliza.ira',
    role: 'Guru',
    nip: '19800711 202221 2 011',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#4F46E5',
  },
  // 23. Panji Irawan, S.Pd
  {
    id: 'usr-023',
    name: 'Panji Irawan, S.Pd',
    username: 'panji.irawan',
    role: 'Guru',
    nip: '19911116 202221 1 004',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#0D9488',
  },
  // 24. Hanif Aditya S.D., S.Pd
  {
    id: 'usr-024',
    name: 'Hanif Aditya S.D., S.Pd',
    username: 'hanif.aditya',
    role: 'Guru',
    nip: '19920501 202221 1 013',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#7C3AED',
  },
  // 25. Andra Hermawan, S.Pd
  {
    id: 'usr-025',
    name: 'Andra Hermawan, S.Pd',
    username: 'andra.hermawan',
    role: 'Guru',
    nip: '19920513 202221 1 008',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#2563EB',
  },
  // 26. Dwi Kurniasari, S.Pd.
  {
    id: 'usr-026',
    name: 'Dwi Kurniasari, S.Pd.',
    username: 'dwi.kurniasari',
    role: 'Guru',
    nip: '19920915 202221 2 012',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#059669',
  },
  // 27. Aprilia Fitriyanti, S.Pd
  {
    id: 'usr-027',
    name: 'Aprilia Fitriyanti, S.Pd',
    username: 'aprilia.fitriyanti',
    role: 'Guru',
    nip: '19930403 202221 2 022',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#DB2777',
  },
  // 28. Sulasih, S.Pd
  {
    id: 'usr-028',
    name: 'Sulasih, S.Pd',
    username: 'sulasih',
    role: 'Guru',
    nip: '19690602 202321 2 004',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#9333EA',
  },
  // 29. Thorikul Khitobah, S.Pd
  {
    id: 'usr-029',
    name: 'Thorikul Khitobah, S.Pd',
    username: 'thorikul.khitobah',
    role: 'Guru',
    nip: '19781009 202321 2 003',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#0891B2',
  },
  // 30. Tri Kuatno, S.Pd
  {
    id: 'usr-030',
    name: 'Tri Kuatno, S.Pd',
    username: 'tri.kuatno',
    role: 'Guru',
    nip: '19800904 202321 1 004',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#D97706',
  },
  // 31. Faizah Nugrahati, S.Pd
  {
    id: 'usr-031',
    name: 'Faizah Nugrahati, S.Pd',
    username: 'faizah.nugrahati',
    role: 'Guru',
    nip: '19811208 202321 2 007',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#4F46E5',
  },
  // 32. Muhammad Khanifudin M, S.Pd.I
  {
    id: 'usr-032',
    name: 'Muhammad Khanifudin M, S.Pd.I',
    username: 'muhammad.khanifudin',
    role: 'Guru',
    nip: '1982011 202321 1 003',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#059669',
  },
  // 33. Khamim Syafrul H, S.Pd
  {
    id: 'usr-033',
    name: 'Khamim Syafrul H, S.Pd',
    username: 'khamim.syafrul',
    role: 'Guru',
    nip: '19821130 202321 1 002',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#7C3AED',
  },
  // 34. Singgih Wiyoko, S.Pd.
  {
    id: 'usr-034',
    name: 'Singgih Wiyoko, S.Pd.',
    username: 'singgih.wiyoko',
    role: 'Guru',
    nip: '19940426 202321 1 002',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#2563EB',
  },
  // 35. Melita Sitangga, S.Pd
  {
    id: 'usr-035',
    name: 'Melita Sitangga, S.Pd',
    username: 'melita.sitangga',
    role: 'Guru',
    nip: '19951206 202321 2 020',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#DB2777',
  },
  // 36. Reni Evianti, S.Pd
  {
    id: 'usr-036',
    name: 'Reni Evianti, S.Pd',
    username: 'reni.evianti',
    role: 'Guru',
    nip: '19970302 202521 2 032',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#0D9488',
  },
  // 37. Erli Kurniawan, S.Pd
  {
    id: 'usr-037',
    name: 'Erli Kurniawan, S.Pd',
    username: 'erli.kurniawan',
    role: 'Guru',
    nip: '19980712 202521 1 022',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#D97706',
  },
  // 38. Gita Dian Pratiwi, S.Pd
  {
    id: 'usr-038',
    name: 'Gita Dian Pratiwi, S.Pd',
    username: 'gita.dian',
    role: 'Guru',
    nip: '-',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#4F46E5',
  },
  // 39. Sausan Salsabila Hidayah, S.Pd
  {
    id: 'usr-039',
    name: 'Sausan Salsabila Hidayah, S.Pd',
    username: 'sausan.salsabila',
    role: 'Guru',
    nip: '-',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#7C3AED',
  },
  // 40. Reza Pangestu, S.Sn
  {
    id: 'usr-040',
    name: 'Reza Pangestu, S.Sn',
    username: 'reza.pangestu',
    role: 'Guru',
    nip: '-',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#0891B2',
  },
  // 41. Danang Setiadi, S.Pd
  {
    id: 'usr-041',
    name: 'Danang Setiadi, S.Pd',
    username: 'danang.setiadi',
    role: 'Guru',
    nip: '-',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#059669',
  },
  // 42. Endah Suryandari Martani, S.Pd., M.Pd.
  {
    id: 'usr-042',
    name: 'Endah Suryandari Martani, S.Pd., M.Pd.',
    username: 'endah.suryandari',
    role: 'Kepala Sekolah',
    nip: '19661209 198903 2 007',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: true,
    canManageSettings: true,
    avatarColor: '#1E3A8A',
  },
  // 43. Slamet Riyadi, S.AP (Koordinator Tata Usaha)
  {
    id: 'usr-043',
    name: 'Slamet Riyadi, S.AP',
    username: 'slamet.riyadi',
    role: 'Kepala/koordinator Tata Usaha',
    nip: '19830514 200801 1 005',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: true,
    canManageSettings: true,
    avatarColor: '#0F766E',
  },
  // 44. Siti Rohmah, A.Md
  {
    id: 'usr-044',
    name: 'Siti Rohmah, A.Md',
    username: 'siti.rohmah',
    role: 'Staff Tata Usaha',
    nip: '19860920 201001 2 018',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#6B7280',
  },
  // 45. Tri Wahyudi
  {
    id: 'usr-045',
    name: 'Tri Wahyudi',
    username: 'tri.wahyudi',
    role: 'Staff Tata Usaha',
    nip: '19900215 201402 1 003',
    pin: '1234',
    isActive: true,
    canEdit: true,
    canDelete: false,
    canManageSettings: false,
    avatarColor: '#4B5563',
  },
];

export const getStoredAccounts = (): UserAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (!raw) {
      saveAccounts(DEFAULT_ACCOUNTS);
      return DEFAULT_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveAccounts(DEFAULT_ACCOUNTS);
      return DEFAULT_ACCOUNTS;
    }
    return parsed;
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
      message: `Batas kuota tercapai: Sistem dibatasi maksimal ${MAX_ACCOUNTS} akun petugas.`
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
  syncAccountToFirestore(created).catch(console.error);

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

  const updatedAcc = { ...accounts[index], ...updates };
  accounts[index] = updatedAcc;
  saveAccounts(accounts);
  syncAccountToFirestore(updatedAcc).catch(console.error);
  return { success: true, message: 'Perubahan akun berhasil disimpan' };
};

export const deleteAccount = (id: string): { success: boolean; message: string } => {
  const accounts = getStoredAccounts();
  if (accounts.length <= 1) {
    return { success: false, message: 'Minimal harus ada 1 akun pengelola di dalam sistem' };
  }

  const updated = accounts.filter(a => a.id !== id);
  saveAccounts(updated);
  deleteAccountFromFirestore(id).catch(console.error);

  if (getCurrentUserId() === id) {
    setCurrentUserId('guest');
  }

  return { success: true, message: `Akun berhasil dihapus. Tersisa ${updated.length}/${MAX_ACCOUNTS} akun.` };
};
