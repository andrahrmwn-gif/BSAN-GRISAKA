export type Gender = 'L' | 'P';
export type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';
export type ViolationSeverity = 'Ringan' | 'Sedang' | 'Berat';

export type DisciplinaryStage = 
  | 'Guru Mapel / Piket (Teguran Lisan & Buku Kontrol)'
  | 'Wali Kelas (Pembinaan Personal & Surat Pernyataan)'
  | 'Guru BK (Konseling Individu & Kontrak Perilaku)'
  | 'Wakasek Kesiswaan (Pemanggilan Ortu & SP)'
  | 'Kepala Sekolah & Tim Penanganan (Pemeriksaan Khusus)';

export interface Student {
  id: string;
  nisn: string;
  nama: string;
  kelas: string; // e.g. '7A', '7B', ..., '9H'
  jenjang: number; // 7, 8, 9
  gender: Gender;
  noHpSiswa: string;
  namaOrtu: string;
  noWaOrtu: string;
  alamat: string;
  statusKehadiran: AttendanceStatus;
  keteranganKehadiran?: string;
  totalPelanggaranRingan: number;
  totalPelanggaranSedang: number;
  totalPelanggaranBerat: number;
  totalPoinPelanggaran?: number; // legacy optional
}

export interface TataTertibItem {
  id: string;
  pasal: number;
  pasalTitle: string;
  kategori: 'Seragam' | 'Rambut' | 'Kehadiran' | 'Ibadah & Akademik' | 'Pelanggaran Berat' | 'Lingkungan & Fasilitas';
  kode: string;
  uraian: string;
  tingkat: ViolationSeverity;
  sanksiDefault: string;
  poin?: number;
}

export interface ViolationRecord {
  id: string;
  studentId: string;
  studentName: string;
  kelas: string;
  pasalId: string;
  pasalNumber: number;
  pasalTitle: string;
  kodePasal: string;
  uraian: string;
  tingkat: ViolationSeverity;
  tanggal: string; // YYYY-MM-DD
  waktu: string;   // HH:mm
  lokasi: string;
  guruPencatat: string;
  tahapPembinaan: DisciplinaryStage;
  statusSurat: 'Draft' | 'Diterbitkan' | 'Selesai';
  catatanKhusus?: string;
  noWaOrtu: string;
  namaOrtu: string;
  poin?: number;
}

export interface WhatsAppMessageLog {
  id: string;
  studentId: string;
  studentName: string;
  kelas: string;
  recipientName: string;
  recipientPhone: string;
  category: 'Absensi' | 'Pelanggaran' | 'Panggilan Ortu';
  message: string;
  timestamp: string;
  status: 'Terkirim' | 'Antrian';
  triggerType: 'Manual' | 'Otomatis';
}

export interface SchoolProfile {
  name: string;
  shortName: string;
  motto: string;
  accreditation: string;
  npsn: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  principalName: string;
  principalNip: string;
  wakasekName?: string;
  wakasekNip?: string;
  timKesiswaanName?: string;
  timKesiswaanTitle?: string;
  timKesiswaanNip?: string;
  bkName?: string;
  bkTitle?: string;
  bkNip?: string;
  logoUrl?: string;
}

export type ViewMode = 
  | 'dashboard'
  | 'students'
  | 'violations'
  | 'whatsapp'
  | 'reports'
  | 'tatatertib'
  | 'settings';
