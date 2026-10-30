import { AttendanceSheet, AttendanceStatus, Student, AttendanceRecapRow, AttendancePeriod } from '../types';
import { KELAS_LIST } from '../data/schoolConfig';
import { INITIAL_STUDENTS } from '../data/initialStudents';

const STORAGE_KEYS = {
  ATTENDANCE: 'bsan_grisaka_attendance_sheets_v1',
};

// Seed sample attendance sheets for recent school days
// Generate clean today attendance sheets for all 24 classes (100% Hadir, 0 Sakit, 0 Izin, 0 Alfa)
// Generate clean today attendance sheets based on actual students in database
export const generateCleanTodayAttendanceSheets = (currentStudents?: Student[]): AttendanceSheet[] => {
  const sheets: AttendanceSheet[] = [];
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Use passed students or fallback to stored students
  let studentPool = currentStudents;
  if (!studentPool) {
    try {
      const raw = localStorage.getItem('bsan_grisaka_students_v1');
      if (raw) {
        studentPool = JSON.parse(raw);
      }
    } catch {
      studentPool = [];
    }
  }

  if (!studentPool || studentPool.length === 0) {
    return [];
  }

  KELAS_LIST.forEach((kelasName) => {
    const classStudents = (studentPool || []).filter((s) => s.kelas === kelasName);
    if (classStudents.length === 0) return;

    const entries = classStudents.map((std) => ({
      studentId: std.id,
      nisn: std.nisn,
      nama: std.nama,
      gender: std.gender,
      status: 'Hadir' as AttendanceStatus,
      keterangan: undefined,
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
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (raw === null) {
      const clean = generateCleanTodayAttendanceSheets();
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(clean));
      return clean;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch (err) {
    console.error('Failed reading attendance storage', err);
    return [];
  }
};

export const clearAllAttendanceSheets = (): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
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
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(sheets));
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

  saveAttendanceSheets(updated);
  return updated;
};

export const getAttendanceByClassAndDate = (kelas: string, date: string): AttendanceSheet | null => {
  const sheets = getStoredAttendanceSheets();
  return sheets.find(s => s.kelas === kelas && s.date === date) || null;
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
  const dateObj = new Date(targetDate);
  const targetYear = dateObj.getFullYear();
  const targetMonth = dateObj.getMonth(); // 0-11

  return sheets.filter((sheet) => {
    // Class filter
    if (kelas !== 'all' && sheet.kelas !== kelas) return false;

    const sheetDate = new Date(sheet.date);
    const sheetYear = sheetDate.getFullYear();
    const sheetMonth = sheetDate.getMonth();

    if (period === 'harian') {
      return sheet.date === targetDate;
    }

    if (period === 'mingguan') {
      // 7 days window ending at targetDate or starting around Monday of the target week
      const diffTime = Math.abs(dateObj.getTime() - sheetDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && sheetDate <= dateObj;
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
      // School year: July to June of next year, or calendar year
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
  const relevantStudents = kelasFilter === 'all' 
    ? students 
    : students.filter(s => s.kelas === kelasFilter);

  return relevantStudents.map((std) => {
    let totalHadir = 0;
    let totalSakit = 0;
    let totalIzin = 0;
    let totalAlfa = 0;
    let lastNote: string | undefined = undefined;

    filteredSheets.forEach((sheet) => {
      const entry = sheet.entries.find(e => e.studentId === std.id || e.nisn === std.nisn);
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
