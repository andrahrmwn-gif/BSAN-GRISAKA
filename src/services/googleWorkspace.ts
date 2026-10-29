import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Student, ViolationRecord, SchoolProfile } from '../types';

// Ensure Firebase is initialized once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Provider with Sheets & Drive Scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token cache (never stored in localStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface GoogleSyncStatus {
  isSignedIn: boolean;
  user: User | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastSyncedAt: string | null;
}

const STORAGE_KEY_SPREADSHEET_ID = 'bsan_gdrive_spreadsheet_id';
const STORAGE_KEY_LAST_SYNC = 'bsan_gdrive_last_synced_at';

export const getCurrentAppDomain = (): string => {
  try {
    return window.location.hostname;
  } catch {
    return 'localhost';
  }
};

export const getStoredSpreadsheetId = (): string | null => {
  return localStorage.getItem(STORAGE_KEY_SPREADSHEET_ID);
};

export const getStoredLastSync = (): string | null => {
  return localStorage.getItem(STORAGE_KEY_LAST_SYNC);
};

export const setManualAccessToken = (token: string): void => {
  cachedAccessToken = token.trim();
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      if (!cachedAccessToken && onAuthFailure) {
        onAuthFailure();
      }
    }
  });
};

export class GoogleAuthDomainError extends Error {
  isUnauthorizedDomain = true;
  domain: string;
  constructor(domain: string, originalMsg: string) {
    super(`Domain "${domain}" belum terdaftar di Firebase Authorized Domains. Gunakan opsi Token Direct atau tambahkan domain ke Firebase Console.`);
    this.name = 'GoogleAuthDomainError';
    this.domain = domain;
  }
}

export const googleSignIn = async (): Promise<{ user: User | null; accessToken: string } | null> => {
  // If user already set a manual token
  if (cachedAccessToken) {
    return { user: auth.currentUser, accessToken: cachedAccessToken };
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal memperoleh access token dari Google Provider.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const errorStr = String(error?.code || error?.message || '');
    if (errorStr.includes('auth/unauthorized-domain')) {
      const currentDomain = getCurrentAppDomain();
      console.warn(`[GoogleWorkspace] Domain ${currentDomain} is unauthorized in Firebase Auth.`);
      throw new GoogleAuthDomainError(currentDomain, error?.message || '');
    }
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  try {
    await signOut(auth);
  } catch {}
  cachedAccessToken = null;
};

const SPREADSHEET_TITLE = 'BSAN_Database_SMPN1_Kandangan';

/**
 * Find existing spreadsheet in user's Google Drive or create a new one
 */
export const findOrCreateDatabaseSpreadsheet = async (token: string): Promise<{ id: string; url: string }> => {
  const savedId = getStoredSpreadsheetId();
  if (savedId) {
    try {
      const checkRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${savedId}?fields=spreadsheetId,spreadsheetUrl`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (checkRes.ok) {
        const data = await checkRes.json();
        return { id: data.spreadsheetId, url: data.spreadsheetUrl };
      }
    } catch {
      // fallback to searching or creating
    }
  }

  // Search Drive for file with title
  const query = encodeURIComponent(`name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const file = searchData.files[0];
      localStorage.setItem(STORAGE_KEY_SPREADSHEET_ID, file.id);
      return { id: file.id, url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit` };
    }
  }

  // Create new Spreadsheet with 3 sheets
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: SPREADSHEET_TITLE
      },
      sheets: [
        { properties: { title: 'Data_Siswa' } },
        { properties: { title: 'Buku_Pelanggaran' } },
        { properties: { title: 'Profil_Sekolah' } }
      ]
    })
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Gagal membuat Google Spreadsheet baru: ${errText}`);
  }

  const createdData = await createRes.json();
  const newId = createdData.spreadsheetId;
  const newUrl = createdData.spreadsheetUrl;
  localStorage.setItem(STORAGE_KEY_SPREADSHEET_ID, newId);
  return { id: newId, url: newUrl };
};

/**
 * Push local application data (students, violations, schoolConfig) to Google Sheets
 */
export const syncDataToGoogleSheets = async (
  token: string,
  students: Student[],
  violations: ViolationRecord[],
  schoolConfig: SchoolProfile
): Promise<{ id: string; url: string; syncedAt: string }> => {
  const { id: spreadsheetId, url: spreadsheetUrl } = await findOrCreateDatabaseSpreadsheet(token);

  // 1. Prepare Data_Siswa sheet data
  const studentHeaders = [
    'ID Siswa', 'NISN', 'Nama Siswa', 'Kelas', 'Jenjang', 'Gender',
    'No HP Siswa', 'Nama Orang Tua/Wali', 'No WhatsApp Ortu', 'Alamat Lengkap',
    'Status Kehadiran', 'Pelanggaran Ringan', 'Pelanggaran Sedang', 'Pelanggaran Berat'
  ];
  const studentRows = students.map((s) => [
    s.id,
    s.nisn,
    s.nama,
    s.kelas,
    s.jenjang,
    s.gender,
    s.noHpSiswa,
    s.namaOrtu,
    s.noWaOrtu,
    s.alamat,
    s.statusKehadiran,
    s.totalPelanggaranRingan,
    s.totalPelanggaranSedang,
    s.totalPelanggaranBerat
  ]);

  // 2. Prepare Buku_Pelanggaran sheet data
  const violationHeaders = [
    'ID Pelanggaran', 'Tanggal', 'Waktu', 'Nama Siswa', 'Kelas',
    'Kode Kasus', 'Pasal Tata Tertib', 'Uraian Pelanggaran', 'Tingkat',
    'Tahap Pembinaan', 'Guru Pencatat', 'Status Surat', 'Catatan Khusus', 'No WA Ortu'
  ];
  const violationRows = violations.map((v) => [
    v.id,
    v.tanggal,
    v.waktu,
    v.studentName,
    v.kelas,
    v.kodePasal,
    v.pasalTitle,
    v.uraian,
    v.tingkat,
    v.tahapPembinaan,
    v.guruPencatat,
    v.statusSurat,
    v.catatanKhusus || '-',
    v.noWaOrtu
  ]);

  // 3. Prepare Profil_Sekolah sheet data
  const profileRows = [
    ['Parameter Profil', 'Nilai Konfigurasi'],
    ['Nama Sekolah', schoolConfig.name],
    ['Singkatan', schoolConfig.shortName],
    ['NPSN', schoolConfig.npsn],
    ['Akreditasi', schoolConfig.accreditation],
    ['Kepala Sekolah', schoolConfig.principalName],
    ['NIP Kepala Sekolah', schoolConfig.principalNip],
    ['Nama Tim Kesiswaan / Wakasek', schoolConfig.timKesiswaanName || schoolConfig.wakasekName || '-'],
    ['Jabatan Kesiswaan', schoolConfig.timKesiswaanTitle || '-'],
    ['NIP Tim Kesiswaan', schoolConfig.timKesiswaanNip || schoolConfig.wakasekNip || '-'],
    ['Koordinator Guru BK', schoolConfig.bkName || '-'],
    ['Motto BSAN', schoolConfig.motto],
    ['Alamat Lengkap', schoolConfig.address],
    ['Kota / Kabupaten', schoolConfig.city],
    ['Telepon', schoolConfig.phone],
    ['Email', schoolConfig.email],
    ['Website', schoolConfig.website],
    ['Terakhir Diperbarui', new Date().toLocaleString('id-ID')]
  ];

  // Batch update all 3 sheets
  const updateDataPayload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: 'Data_Siswa!A1:N' + (studentRows.length + 1),
        values: [studentHeaders, ...studentRows]
      },
      {
        range: 'Buku_Pelanggaran!A1:N' + (violationRows.length + 1),
        values: [violationHeaders, ...violationRows]
      },
      {
        range: 'Profil_Sekolah!A1:B' + profileRows.length,
        values: profileRows
      }
    ]
  };

  const syncRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateDataPayload)
    }
  );

  if (!syncRes.ok) {
    const errorDetails = await syncRes.text();
    throw new Error(`Gagal menyinkronkan data ke Google Sheets: ${errorDetails}`);
  }

  const nowIso = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY_LAST_SYNC, nowIso);

  return {
    id: spreadsheetId,
    url: spreadsheetUrl,
    syncedAt: nowIso
  };
};

/**
 * Fetch and import latest data from Google Sheets into the application
 */
export const pullDataFromGoogleSheets = async (
  token: string,
  spreadsheetId: string
): Promise<{
  students: Student[];
  violations: ViolationRecord[];
  partialConfig: Partial<SchoolProfile>;
}> => {
  const fetchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=Data_Siswa!A2:N&ranges=Buku_Pelanggaran!A2:N&ranges=Profil_Sekolah!A2:B20`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!fetchRes.ok) {
    const errorDetails = await fetchRes.text();
    throw new Error(`Gagal membaca data dari Google Sheets: ${errorDetails}`);
  }

  const result = await fetchRes.json();
  const valueRanges = result.valueRanges || [];

  const rawStudents = valueRanges[0]?.values || [];
  const rawViolations = valueRanges[1]?.values || [];
  const rawProfile = valueRanges[2]?.values || [];

  // Parse Students
  const parsedStudents: Student[] = rawStudents.map((row: any[], idx: number) => ({
    id: row[0] || `std-${Date.now()}-${idx}`,
    nisn: row[1] || '',
    nama: row[2] || '',
    kelas: row[3] || '7A',
    jenjang: Number(row[4]) || 7,
    gender: (row[5] === 'P' ? 'P' : 'L') as any,
    noHpSiswa: row[6] || '',
    namaOrtu: row[7] || '',
    noWaOrtu: row[8] || '',
    alamat: row[9] || '',
    statusKehadiran: (row[10] || 'Hadir') as any,
    totalPelanggaranRingan: Number(row[11]) || 0,
    totalPelanggaranSedang: Number(row[12]) || 0,
    totalPelanggaranBerat: Number(row[13]) || 0
  }));

  // Parse Violations
  const parsedViolations: ViolationRecord[] = rawViolations.map((row: any[], idx: number) => ({
    id: row[0] || `viol-${Date.now()}-${idx}`,
    tanggal: row[1] || new Date().toISOString().slice(0, 10),
    waktu: row[2] || '07:30',
    studentId: '',
    studentName: row[3] || '',
    kelas: row[4] || '7A',
    kodePasal: row[5] || 'Pasal 1',
    pasalNumber: 1,
    pasalTitle: row[6] || 'Tata Tertib',
    uraian: row[7] || '',
    tingkat: (row[8] || 'Ringan') as any,
    tahapPembinaan: (row[9] || 'Guru Mapel / Piket (Teguran Lisan & Buku Kontrol)') as any,
    guruPencatat: row[10] || 'Guru Piket',
    statusSurat: (row[11] || 'Selesai') as any,
    catatanKhusus: row[12] || '',
    noWaOrtu: row[13] || '',
    namaOrtu: ''
  }));

  // Parse Profile
  const partialConfig: Partial<SchoolProfile> = {};
  rawProfile.forEach(([param, value]: [string, string]) => {
    if (!param || !value) return;
    if (param === 'Nama Sekolah') partialConfig.name = value;
    if (param === 'Singkatan') partialConfig.shortName = value;
    if (param === 'NPSN') partialConfig.npsn = value;
    if (param === 'Kepala Sekolah') partialConfig.principalName = value;
    if (param === 'NIP Kepala Sekolah') partialConfig.principalNip = value;
    if (param === 'Nama Tim Kesiswaan / Wakasek') {
      partialConfig.wakasekName = value;
      partialConfig.timKesiswaanName = value;
    }
    if (param === 'Jabatan Kesiswaan') partialConfig.timKesiswaanTitle = value;
    if (param === 'NIP Tim Kesiswaan') {
      partialConfig.wakasekNip = value;
      partialConfig.timKesiswaanNip = value;
    }
    if (param === 'Motto BSAN') partialConfig.motto = value;
  });

  return {
    students: parsedStudents,
    violations: parsedViolations,
    partialConfig
  };
};

/**
 * Direct Google Sheets formatted CSV export bridge that teachers can upload or open directly
 * in Google Sheets (Buka di Google Spreadsheet) without any authentication domain issues!
 */
export const exportDirectSheetsFile = (
  students: Student[],
  violations: ViolationRecord[],
  schoolConfig: SchoolProfile
): void => {
  const lines: string[] = [];

  // Sheet 1: Data Siswa
  lines.push('### SHEET: DATA SISWA ###');
  lines.push(['ID Siswa', 'NISN', 'Nama Siswa', 'Kelas', 'Jenjang', 'Gender', 'No HP Siswa', 'Nama Orang Tua/Wali', 'No WhatsApp Ortu', 'Alamat', 'Status Kehadiran', 'Pelanggaran Ringan', 'Pelanggaran Sedang', 'Pelanggaran Berat'].map(v => `"${v}"`).join(','));
  students.forEach((s) => {
    lines.push([
      `"${s.id}"`,
      `="${s.nisn}"`,
      `"${s.nama.replace(/"/g, '""')}"`,
      `"${s.kelas}"`,
      s.jenjang,
      `"${s.gender}"`,
      `="${s.noHpSiswa}"`,
      `"${s.namaOrtu.replace(/"/g, '""')}"`,
      `="${s.noWaOrtu}"`,
      `"${s.alamat.replace(/"/g, '""')}"`,
      `"${s.statusKehadiran}"`,
      s.totalPelanggaranRingan,
      s.totalPelanggaranSedang,
      s.totalPelanggaranBerat
    ].join(','));
  });

  lines.push('');
  lines.push('### SHEET: BUKU PELANGGARAN ###');
  lines.push(['ID Pelanggaran', 'Tanggal', 'Waktu', 'Nama Siswa', 'Kelas', 'Kode Kasus', 'Pasal Tata Tertib', 'Uraian Pelanggaran', 'Tingkat', 'Tahap Pembinaan', 'Guru Pencatat', 'Status Surat', 'No WA Ortu'].map(v => `"${v}"`).join(','));
  violations.forEach((v) => {
    lines.push([
      `"${v.id}"`,
      `"${v.tanggal}"`,
      `"${v.waktu}"`,
      `"${v.studentName.replace(/"/g, '""')}"`,
      `"${v.kelas}"`,
      `"${v.kodePasal}"`,
      `"${v.pasalTitle.replace(/"/g, '""')}"`,
      `"${v.uraian.replace(/"/g, '""')}"`,
      `"${v.tingkat}"`,
      `"${v.tahapPembinaan.replace(/"/g, '""')}"`,
      `"${v.guruPencatat.replace(/"/g, '""')}"`,
      `"${v.statusSurat}"`,
      `="${v.noWaOrtu}"`
    ].join(','));
  });

  lines.push('');
  lines.push('### SHEET: PROFIL SEKOLAH ###');
  lines.push(['Parameter', 'Nilai'].map(v => `"${v}"`).join(','));
  lines.push(`"Nama Sekolah","${schoolConfig.name}"`);
  lines.push(`"NPSN","${schoolConfig.npsn}"`);
  lines.push(`"Kepala Sekolah","${schoolConfig.principalName}"`);
  lines.push(`"NIP Kepala Sekolah","${schoolConfig.principalNip}"`);
  lines.push(`"Tim Kesiswaan","${schoolConfig.timKesiswaanName || '-'}"`);
  lines.push(`"Motto","${schoolConfig.motto}"`);

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BSAN_GoogleSheets_Sync_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
