import { AuditLogEntry, AuditActionType, AuditModule } from '../types/auth';
import { getCurrentUser, isGuestMode, isAdminUser } from './authService';
import { exportToCSV } from '../utils/exportDocs';
import {
  syncAuditLogToFirestore,
  clearAuditLogsFromFirestore,
  fetchAuditLogsFromServer,
} from './firebase';

const STORAGE_KEY = 'bsan_grisaka_audit_logs_v1';
const MAX_LOGS = 300;

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

const emitAuditLogsChanged = (logs: AuditLogEntry[]): void => {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('bsan_audit_logs_changed', { detail: logs }));
    } catch {
      // Ignore event dispatch error
    }
  }
};

export const getAuditLogs = (): AuditLogEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed reading audit logs', err);
    return [];
  }
};

export const saveAuditLogsLocalOnly = (logs: AuditLogEntry[]): void => {
  try {
    const trimmed = logs.slice(0, MAX_LOGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    emitAuditLogsChanged(trimmed);
  } catch (err) {
    console.error('Failed saving audit logs', err);
  }
};

export const saveAuditLogs = saveAuditLogsLocalOnly;

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
    ...(params.details ? { details: params.details } : {}),
    status: params.status || 'SUCCESS',
  };

  const updated = [newEntry, ...currentLogs];
  saveAuditLogsLocalOnly(updated);
  syncAuditLogToFirestore(newEntry).catch(console.error);

  return newEntry;
};

export const clearAuditLogsAsync = async (): Promise<{ success: boolean; message: string }> => {
  if (!isAdminUser(getCurrentUser())) {
    return {
      success: false,
      message: 'Akses Ditolak: Hanya akun Administrator (admin) yang berhak membersihkan audit log sistem.',
    };
  }

  saveAuditLogsLocalOnly([]);
  try {
    await clearAuditLogsFromFirestore();
    return {
      success: true,
      message: 'Seluruh riwayat audit log berhasil dibersihkan secara real-time di semua akun dan perangkat.',
    };
  } catch (err) {
    console.error('Failed clearing audit logs in Firestore', err);
    return {
      success: false,
      message: 'Gagal membersihkan riwayat audit log di server cloud. Silakan coba lagi.',
    };
  }
};

export const clearAuditLogs = (): void => {
  if (!isAdminUser(getCurrentUser())) {
    return;
  }
  clearAuditLogsAsync().catch(console.error);
};

export const refreshAuditLogsFromCloud = async (): Promise<AuditLogEntry[]> => {
  try {
    const serverLogs = await fetchAuditLogsFromServer();
    saveAuditLogsLocalOnly(serverLogs);
    return serverLogs;
  } catch (err) {
    console.warn('Failed refreshing audit logs from server, using local cache', err);
    return getAuditLogs();
  }
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
