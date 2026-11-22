import { AttendanceSheet, AttendanceStatus, Student, AttendanceRecapRow, AttendancePeriod } from '../types';
import { KELAS_LIST } from '../data/schoolConfig';
import { sortByClassAndName } from '../utils/sortUtils';
import { syncAttendanceSheetToFirestore, bulkSyncAttendanceSheets } from './firebase';
import { getRealtimeDateYMD } from '../utils/dateUtils';
import { secureStorage } from './secureStorage';
import { getStoredStudents } from './storage';

const STORAGE_KEYS = {
  ATTENDANCE: 'bsan_grisaka_attendance_sheets_v1',
};

// Generate clean today attendance sheets based on actual students in database
export const generateCleanTodayAttendanceSheets = (currentStudents?: Student[]): AttendanceSheet[] => {
  const sheets: AttendanceSheet[] = [];
  const todayStr = getRealtimeDateYMD();

  const studentPool = currentStudents && currentStudents.length > 0 ? currentStudents : getStoredStudents();
  if (!studentPool || studentPool.length === 0) {
    return [];
  }

  KELAS_LIST.forEach((kelasName) => {
    const classStudents = sortByClassAndName(studentPool.filter((s) => s.kelas === kelasName));
    if (classStudents.length === 0) return;

    const entries = classStudents.map((std) => ({
      studentId: std.id,
      nisn: std.nisn,
      nama: std.nama,
      gender: std.gender,
      status: 'Hadir' as AttendanceStatus,
      keterangan: '',
    }));

    const total = entries.length;

    sheets.push({
      id: `att-${todayStr}-${kelasName}`,
      date: todayStr,
      kelas: kelasName,
      recordedBy: 'Wali Kelas ' + kelasName,
      recordedByNip: '-',
      recordedAt: `${todayStr} 07:00 WIB`,
      entries,
      summary: {
        total,
        hadir: total,
        sakit: 0,
        izin: 0,
        alfa: 0,
        persentaseHadir: 100,
      },
    });
  });

  return sheets;
};

export const getStoredAttendanceSheets = (): AttendanceSheet[] => {
  try {
    const data = secureStorage.getItem<AttendanceSheet[]>(STORAGE_KEYS.ATTENDANCE, []);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Failed reading attendance storage', err);
    return [];
  }
};

export const saveAttendanceSheetsLocalOnly = (sheets: AttendanceSheet[]): void => {
  try {
    secureStorage.setItem(STORAGE_KEYS.ATTENDANCE, sheets);
  } catch (err) {
    console.error('Failed saving attendance sheets locally', err);
  }
};

const emitLocalAttendanceChanged = (sheets: AttendanceSheet[]) => {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('bsan_attendance_sheets_synced', { detail: sheets }));
    } catch {}
  }
};

export const clearAllAttendanceSheets = (): void => {
  try {
    secureStorage.setItem(STORAGE_KEYS.ATTENDANCE, []);
    emitLocalAttendanceChanged([]);
  } catch (err) {
    console.error('Failed clearing attendance sheets', err);
  }
};

export const resetAttendanceToClean = (currentStudents?: Student[]): AttendanceSheet[] => {
  const clean = generateCleanTodayAttendanceSheets(currentStudents);
  saveAttendanceSheets(clean);
  return clean;
};

export const saveAttendanceSheets = (sheets: AttendanceSheet[]): void => {
  try {
    secureStorage.setItem(STORAGE_KEYS.ATTENDANCE, sheets);
    emitLocalAttendanceChanged(sheets);
    bulkSyncAttendanceSheets(sheets).catch(console.error);
  } catch (err) {
    console.error('Failed saving attendance sheets', err);
  }
};

export const saveSingleAttendanceSheet = (sheet: AttendanceSheet): AttendanceSheet[] => {
  const existing = getStoredAttendanceSheets();
  const index = existing.findIndex(s => s.id === sheet.id || (s.date === sheet.date && s.kelas === sheet.kelas));
  
  let updated: AttendanceSheet[];
  if (index >= 0) {
    existing[index] = sheet;
    updated = [...existing];
  } else {
    updated = [sheet, ...existing];
  }

  try {
    secureStorage.setItem(STORAGE_KEYS.ATTENDANCE, updated);
    emitLocalAttendanceChanged(updated);
    syncAttendanceSheetToFirestore(sheet).catch(console.error);
  } catch (err) {
    console.error('Failed saving attendance sheet', err);
  }
  return updated;
};

export const getAttendanceByClassAndDate = (kelas: string, date: string): AttendanceSheet | null => {
  const sheets = getStoredAttendanceSheets();
  return sheets.find(s => s.kelas === kelas && s.date === date) || null;
};

/**
 * Parse YYYY-MM-DD safely in local timezone (avoids UTC midnight off-by-one-day bugs)
 */
const parseLocalYMD = (dateStr: string): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

/**
 * Match a student against an attendance sheet entry safely (avoiding false empty-NISN matches)
 */
const matchStudentEntry = (
  entry: { studentId?: string; nisn?: string; nama?: string },
  student: Student,
  sheetKelas?: string
): boolean => {
  if (!entry) return false;
  if (entry.studentId && student.id && entry.studentId === student.id) return true;
  const stdNisn = (student.nisn || '').trim();
  const entNisn = (entry.nisn || '').trim();
  if (stdNisn && entNisn && stdNisn === entNisn) return true;
  const stdNama = (student.nama || '').trim().toLowerCase();
  const entNama = (entry.nama || '').trim().toLowerCase();
  if (stdNama && entNama && stdNama === entNama && (!sheetKelas || sheetKelas === student.kelas)) {
    return true;
  }
  return false;
};

/**
 * Resolve a student's effective attendance for a specific date (defaulting cleanly to 'Hadir' on a new day
 * when no sheet has been recorded yet so yesterday's Sakit/Izin/Alfa never leaks into today).
 */
export const getEffectiveStudentAttendanceForDate = (
  student: Student,
  targetDate: string,
  sheets?: AttendanceSheet[]
): { status: AttendanceStatus; keterangan: string; isRecorded: boolean } => {
  const pool = sheets ?? getStoredAttendanceSheets();
  const classSheet = pool.find((s) => s && s.date === targetDate && s.kelas === student.kelas);
  if (classSheet && Array.isArray(classSheet.entries)) {
    const entry = classSheet.entries.find((e) => matchStudentEntry(e, student, classSheet.kelas));
    if (entry && entry.status) {
      return {
        status: entry.status,
        keterangan: entry.keterangan || '',
        isRecorded: true,
      };
    }
  }

  // Only honour student.statusKehadiran when it explicitly belongs to targetDate
  if (student.statusKehadiranDate && student.statusKehadiranDate === targetDate) {
    return {
      status: (student.statusKehadiran || 'Hadir') as AttendanceStatus,
      keterangan: student.keteranganKehadiran || '',
      isRecorded: true,
    };
  }

  return {
    status: 'Hadir',
    keterangan: '',
    isRecorded: false,
  };
};

/**
 * Filter attendance sheets based on period and class
 */
export const filterAttendanceSheets = (
  sheets: AttendanceSheet[],
  period: AttendancePeriod,
  kelas: string, // 'all' or specific class e.g. '7A'
  targetDate: string // YYYY-MM-DD
): AttendanceSheet[] => {
  const dateObj = parseLocalYMD(targetDate);
  if (!dateObj) return [];
  const targetYear = dateObj.getFullYear();
  const targetMonth = dateObj.getMonth(); // 0-11

  return sheets.filter((sheet) => {
    if (!sheet || !sheet.date) return false;
    // Class filter
    if (kelas !== 'all' && sheet.kelas !== kelas) return false;

    if (period === 'harian') {
      return sheet.date === targetDate;
    }

    const sheetDate = parseLocalYMD(sheet.date);
    if (!sheetDate) return false;
    const sheetYear = sheetDate.getFullYear();
    const sheetMonth = sheetDate.getMonth();

    if (period === 'mingguan') {
      // Exact 7-day local calendar window ending on targetDate (inclusive)
      const diffMs = dateObj.getTime() - sheetDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays < 7;
    }

    if (period === 'bulanan') {
      return sheetYear === targetYear && sheetMonth === targetMonth;
    }

    if (period === 'semester') {
      // Semester 1: July (6) to Dec (11)
      // Semester 2: Jan (0) to June (5)
      const isSemester1 = targetMonth >= 6;
      const sheetIsSemester1 = sheetMonth >= 6;
      return sheetYear === targetYear && isSemester1 === sheetIsSemester1;
    }

    if (period === 'tahunan') {
      return sheetYear === targetYear;
    }

    return true;
  });
};

/**
 * Calculate aggregated recap per student across filtered attendance sheets
 */
export const calculateStudentRecap = (
  students: Student[],
  filteredSheets: AttendanceSheet[],
  kelasFilter: string
): AttendanceRecapRow[] => {
  const rawStudents = kelasFilter === 'all' 
    ? students 
    : students.filter(s => s.kelas === kelasFilter);

  const relevantStudents = sortByClassAndName(rawStudents);

  return relevantStudents.map((std) => {
    let totalHadir = 0;
    let totalSakit = 0;
    let totalIzin = 0;
    let totalAlfa = 0;
    let lastNote: string | undefined = undefined;

    filteredSheets.forEach((sheet) => {
      if (!sheet || !Array.isArray(sheet.entries)) return;
      const entry = sheet.entries.find((e) => matchStudentEntry(e, std, sheet.kelas));
      if (entry) {
        if (entry.status === 'Hadir') totalHadir++;
        else if (entry.status === 'Sakit') {
          totalSakit++;
          if (entry.keterangan) lastNote = entry.keterangan;
        } else if (entry.status === 'Izin') {
          totalIzin++;
          if (entry.keterangan) lastNote = entry.keterangan;
        } else if (entry.status === 'Alfa') {
          totalAlfa++;
          if (entry.keterangan) lastNote = entry.keterangan;
        }
      }
    });

    const totalHari = totalHadir + totalSakit + totalIzin + totalAlfa;
    const persentaseHadir = totalHari > 0 ? Math.round((totalHadir / totalHari) * 100) : 100;

    return {
      studentId: std.id,
      nisn: std.nisn,
      nama: std.nama,
      kelas: std.kelas,
      gender: std.gender,
      totalHadir,
      totalSakit,
      totalIzin,
      totalAlfa,
      totalHari,
      persentaseHadir,
      keteranganTerakhir: lastNote,
    };
  });
};

export interface DateAttendanceSummary {
  date: string;
  totalStudents: number;
  hadirCount: number;
  sakitCount: number;
  izinCount: number;
  alfaCount: number;
  tidakHadirCount: number;
  percentHadir: number;
  classData: Array<{
    kelas: string;
    total: number;
    hadir: number;
    tidakHadir: number;
    sakit: number;
    izin: number;
    alfa: number;
    hadirPct: number;
    tidakHadirPct: number;
  }>;
  studentRecords: Array<{
    student: Student;
    status: AttendanceStatus;
    keterangan?: string;
  }>;
}

/**
 * Get unified attendance statistics, class breakdown, and individual records for ANY date
 * (today or any historical past date).
 */
export const getDateAttendanceSummary = (
  targetDate: string,
  students: Student[],
  overrideSheets?: AttendanceSheet[]
): DateAttendanceSummary => {
  const allSheets = overrideSheets ?? getStoredAttendanceSheets();
  const dateSheets = allSheets.filter((s) => s && s.date === targetDate);

  const studentRecords = students.map((student) => {
    const resolved = getEffectiveStudentAttendanceForDate(student, targetDate, dateSheets);
    return {
      student,
      status: resolved.status,
      keterangan: resolved.keterangan || undefined,
    };
  });

  const totalStudents = studentRecords.length;
  const hadirCount = studentRecords.filter(r => r.status === 'Hadir').length;
  const sakitCount = studentRecords.filter(r => r.status === 'Sakit').length;
  const izinCount = studentRecords.filter(r => r.status === 'Izin').length;
  const alfaCount = studentRecords.filter(r => r.status === 'Alfa').length;
  const tidakHadirCount = sakitCount + izinCount + alfaCount;
  const percentHadir = totalStudents > 0 ? (hadirCount / totalStudents) * 100 : 100;

  const classData = KELAS_LIST.map(cls => {
    const classRecords = studentRecords.filter(r => r.student.kelas === cls);
    const total = classRecords.length || 1;
    const hadir = classRecords.filter(r => r.status === 'Hadir').length;
    const sakit = classRecords.filter(r => r.status === 'Sakit').length;
    const izin = classRecords.filter(r => r.status === 'Izin').length;
    const alfa = classRecords.filter(r => r.status === 'Alfa').length;
    const tidakHadir = sakit + izin + alfa;
    const hadirPct = Math.round((hadir / total) * 100);
    const tidakHadirPct = 100 - hadirPct;

    return {
      kelas: cls,
      total,
      hadir,
      tidakHadir,
      sakit,
      izin,
      alfa,
      hadirPct,
      tidakHadirPct,
      Hadir: hadir,
      TidakHadir: tidakHadir,
      hadirCount: hadir,
      tidakHadirCount: tidakHadir,
    };
  });

  return {
    date: targetDate,
    totalStudents,
    hadirCount,
    sakitCount,
    izinCount,
    alfaCount,
    tidakHadirCount,
    percentHadir,
    classData,
    studentRecords
  };
};

