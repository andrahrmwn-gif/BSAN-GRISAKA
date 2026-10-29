import { AttendanceSheet, AttendanceStatus, Student, AttendanceRecapRow, AttendancePeriod } from '../types';
import { KELAS_LIST } from '../data/schoolConfig';
import { INITIAL_STUDENTS } from '../data/initialStudents';

const STORAGE_KEYS = {
  ATTENDANCE: 'bsan_grisaka_attendance_sheets_v1',
};

// Seed sample attendance sheets for recent school days
const generateSeedAttendanceSheets = (): AttendanceSheet[] => {
  const sheets: AttendanceSheet[] = [];
  const today = new Date();
  
  // Generate for past 14 days (excluding Sundays)
  for (let offset = 0; offset < 14; offset++) {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    
    // Skip Sunday (0)
    if (d.getDay() === 0) continue;
    
    const dateStr = d.toISOString().split('T')[0];

    // Create sheets for classes
    KELAS_LIST.forEach((kelasName, idx) => {
      // Pick students in this class
      const classStudents = INITIAL_STUDENTS.filter((s) => s.kelas === kelasName);
      if (classStudents.length === 0) return;

      let hadir = 0;
      let sakit = 0;
      let izin = 0;
      let alfa = 0;

      const entries = classStudents.map((std, sIdx) => {
        let status: AttendanceStatus = 'Hadir';
        let keterangan: string | undefined = undefined;

        // Occasional illness or leave for realistic simulation
        if ((offset + idx + sIdx) % 19 === 0) {
          status = 'Sakit';
          keterangan = 'Demam / flu';
          sakit++;
        } else if ((offset * 3 + idx + sIdx) % 29 === 0) {
          status = 'Izin';
          keterangan = 'Acara keluarga';
          izin++;
        } else if ((offset * 5 + idx + sIdx) % 37 === 0) {
          status = 'Alfa';
          keterangan = 'Tanpa keterangan';
          alfa++;
        } else {
          hadir++;
        }

        return {
          studentId: std.id,
          nisn: std.nisn,
          nama: std.nama,
          gender: std.gender,
          status,
          keterangan,
        };
      });

      const total = entries.length;
      const persentaseHadir = total > 0 ? Math.round((hadir / total) * 100) : 100;

      sheets.push({
        id: `att-${dateStr}-${kelasName}`,
        date: dateStr,
        kelas: kelasName,
        recordedBy: 'Wali Kelas ' + kelasName,
        recordedByNip: '-',
        recordedAt: `${dateStr} 07:15 WIB`,
        entries,
        summary: {
          total,
          hadir,
          sakit,
          izin,
          alfa,
          persentaseHadir,
        },
      });
    });
  }

  return sheets;
};

export const getStoredAttendanceSheets = (): AttendanceSheet[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!raw) {
      const seeded = generateSeedAttendanceSheets();
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seeded = generateSeedAttendanceSheets();
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(seeded));
      return seeded;
    }
    return parsed;
  } catch (err) {
    console.error('Failed reading attendance storage', err);
    return generateSeedAttendanceSheets();
  }
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
