import { AuditLogEntry, AuditActionType, AuditModule } from '../types/auth';
import { getCurrentUser, isGuestMode } from './authService';
import { exportToCSV } from '../utils/exportDocs';

const STORAGE_KEY = 'bsan_grisaka_audit_logs_v1';
const MAX_LOGS = 300;

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-001',
    timestamp: '28 Okt 2026, 07:15:20 WIB',
    isoTimestamp: '2026-10-28T07:15:20.000Z',
    userId: 'usr-001',
    userName: 'Yuliana Dewi Marithawati, S.Pd., M.Pd.',
    userRole: 'Kepala Sekolah',
    actionType: 'LOGIN',
    module: 'Autentikasi',
    description: 'Login sesi pimpinan sekolah ke Portal BSAN',
    status: 'SUCCESS',
  },
  {
    id: 'log-002',
    timestamp: '28 Okt 2026, 07:22:45 WIB',
    isoTimestamp: '2026-10-28T07:22:45.000Z',
    userId: 'usr-003',
    userName: 'Sri Wahyuni, S.Pd., M.Si.',
    userRole: 'Guru BK',
    actionType: 'LOGIN',
    module: 'Autentikasi',
    description: 'Login sesi Petugas Bimbingan Konseling',
    status: 'SUCCESS',
  },
  {
    id: 'log-003',
    timestamp: '28 Okt 2026, 07:30:10 WIB',
    isoTimestamp: '2026-10-28T07:30:10.000Z',
    userId: 'usr-009',
    userName: 'Siti Aminah, S.Pd.',
    userRole: 'Guru Piket',
    actionType: 'CREATE',
    module: 'Pelanggaran',
    description: 'Pencatatan pelanggaran Ringan: Atribut seragam tidak lengkap (Kelas 7A)',
    details: 'Pasal 1 Ayat 1 · Pembinaan lisan di pos piket',
    status: 'SUCCESS',
  },
  {
    id: 'log-004',
    timestamp: '28 Okt 2026, 07:45:00 WIB',
    isoTimestamp: '2026-10-28T07:45:00.000Z',
    userId: 'usr-002',
    userName: 'Andi Prasetyo, S.Pd.',
    userRole: 'Wakasek Kesiswaan',
    actionType: 'UPDATE',
    module: 'Pelanggaran',
    description: 'Verifikasi & peningkatan status surat SP-1 menjadi Diterbitkan',
    details: 'Dokumen administrasi siap cetak & dikirim ke wali murid',
    status: 'SUCCESS',
  },
  {
    id: 'log-005',
    timestamp: '28 Okt 2026, 08:00:12 WIB',
    isoTimestamp: '2026-10-28T08:00:12.000Z',
    userId: 'usr-018',
    userName: 'Kurniawan Dwi, A.Md.',
    userRole: 'Tata Usaha (Admin)',
    actionType: 'SYNC',
    module: 'Pengaturan',
    description: 'Sinkronisasi data ke Google Sheets & Google Drive Database',
    status: 'SUCCESS',
  },
];

export const getAuditLogs = (): AuditLogEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_AUDIT_LOGS;
  } catch (err) {
    console.error('Failed reading audit logs', err);
    return INITIAL_AUDIT_LOGS;
  }
};

export const saveAuditLogs = (logs: AuditLogEntry[]): void => {
  try {
    // Keep max logs to prevent quota overflow
    const trimmed = logs.slice(0, MAX_LOGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed saving audit logs', err);
  }
};

export const logAudit = (params: {
  actionType: AuditActionType;
  module: AuditModule;
  description: string;
  details?: string;
  status?: 'SUCCESS' | 'BLOCKED';
  forcedUser?: { id: string; name: string; role: string };
}): AuditLogEntry => {
  const currentLogs = getAuditLogs();
  const user = params.forcedUser || getCurrentUser();
  const isGuest = !params.forcedUser && isGuestMode();

  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(now);
  const timeStr = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now);

  const newEntry: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: `${dateStr}, ${timeStr} WIB`,
    isoTimestamp: now.toISOString(),
    userId: isGuest ? 'guest' : (user ? user.id : 'system'),
    userName: isGuest ? 'Mode Tamu (Guest)' : (user ? user.name : 'Sistem Otomatis'),
    userRole: isGuest ? 'Tamu (Hanya Lihat)' : (user ? user.role : 'System Worker'),
    actionType: params.actionType,
    module: params.module,
    description: params.description,
    details: params.details,
    status: params.status || 'SUCCESS',
  };

  const updated = [newEntry, ...currentLogs];
  saveAuditLogs(updated);

  return newEntry;
};

export const clearAuditLogs = (): void => {
  const resetLogs: AuditLogEntry[] = [
    {
      id: `log-${Date.now()}`,
      timestamp: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date()) + ' WIB',
      isoTimestamp: new Date().toISOString(),
      userId: getCurrentUser()?.id || 'admin',
      userName: getCurrentUser()?.name || 'Administrator',
      userRole: getCurrentUser()?.role || 'Admin',
      actionType: 'DELETE',
      module: 'Sistem',
      description: 'Pembersihan riwayat audit log sistem oleh Administrator',
      status: 'SUCCESS',
    }
  ];
  saveAuditLogs(resetLogs);
};

export const exportAuditLogsToExcel = (logs: AuditLogEntry[]): void => {
  const exportData = logs.map((log, idx) => ({
    No: idx + 1,
    Waktu_Aktivitas: log.timestamp,
    Akun_Petugas: log.userName,
    Peran: log.userRole,
    ID_Akun: log.userId,
    Jenis_Aksi: log.actionType,
    Modul: log.module,
    Deskripsi: log.description,
    Rincian: log.details || '-',
    Status: log.status,
  }));

  const filename = `Audit_Log_Keamanan_BSAN_${new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date()).replace(/\//g, '-')}`;
  exportToCSV(exportData, filename);
};
