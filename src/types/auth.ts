export type UserRole = 
  | 'Kepala Sekolah'
  | 'Wakasek Kesiswaan'
  | 'Guru BK'
  | 'Tim Kesiswaan & Ketertiban'
  | 'Guru Piket'
  | 'Wali Kelas'
  | 'Tata Usaha (Admin)';

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  nip: string;
  pin: string;
  isActive: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageSettings: boolean;
  avatarColor?: string;
}

export type AuditActionType = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'RESET' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'EXPORT' 
  | 'SYNC'
  | 'BLOCKED';

export type AuditModule = 
  | 'Pelanggaran' 
  | 'Siswa' 
  | 'Pengaturan' 
  | 'Tata Tertib' 
  | 'WhatsApp' 
  | 'Autentikasi' 
  | 'Sistem';

export interface AuditLogEntry {
  id: string;
  timestamp: string;      // Formatted date string, e.g. "28 Okt 2026, 08:30:15 WIB"
  isoTimestamp: string;   // ISO format for sorting/filtering
  userId: string;
  userName: string;
  userRole: string;
  actionType: AuditActionType;
  module: AuditModule;
  description: string;
  details?: string;
  status: 'SUCCESS' | 'BLOCKED';
}
