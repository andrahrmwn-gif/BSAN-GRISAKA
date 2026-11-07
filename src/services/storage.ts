import { Student, ViolationRecord, WhatsAppMessageLog, SchoolProfile } from '../types';
import { INITIAL_STUDENTS, INITIAL_VIOLATIONS, INITIAL_WA_LOGS } from '../data/initialStudents';
import { SCHOOL_CONFIG } from '../data/schoolConfig';
import { clearAllAttendanceSheets } from './attendanceStorage';
import { secureStorage } from './secureStorage';

const STORAGE_KEYS = {
  STUDENTS: 'bsan_grisaka_students_v1',
  VIOLATIONS: 'bsan_grisaka_violations_v1',
  WA_LOGS: 'bsan_grisaka_wa_logs_v1',
  SCHOOL_CONFIG: 'bsan_grisaka_school_config_v1',
};

export const getStoredStudents = (): Student[] => {
  try {
    const data = secureStorage.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    if (!Array.isArray(data) || data.length === 0) {
      return INITIAL_STUDENTS;
    }
    return data;
  } catch (err) {
    console.error('Failed reading students storage', err);
    return INITIAL_STUDENTS;
  }
};

export const saveStudents = (students: Student[]): void => {
  try {
    secureStorage.setItem(STORAGE_KEYS.STUDENTS, students);
  } catch (err) {
    console.error('Failed saving students', err);
  }
};

export const getStoredViolations = (): ViolationRecord[] => {
  try {
    const data = secureStorage.getItem<ViolationRecord[]>(STORAGE_KEYS.VIOLATIONS, INITIAL_VIOLATIONS);
    return Array.isArray(data) ? data : INITIAL_VIOLATIONS;
  } catch (err) {
    console.error('Failed reading violations storage', err);
    return INITIAL_VIOLATIONS;
  }
};

export const saveViolations = (violations: ViolationRecord[]): void => {
  try {
    secureStorage.setItem(STORAGE_KEYS.VIOLATIONS, violations);
  } catch (err) {
    console.error('Failed saving violations', err);
  }
};

export const getStoredWaLogs = (): WhatsAppMessageLog[] => {
  try {
    const data = secureStorage.getItem<WhatsAppMessageLog[]>(STORAGE_KEYS.WA_LOGS, INITIAL_WA_LOGS);
    return Array.isArray(data) ? data : INITIAL_WA_LOGS;
  } catch (err) {
    console.error('Failed reading wa logs storage', err);
    return INITIAL_WA_LOGS;
  }
};

export const saveWaLogs = (logs: WhatsAppMessageLog[]): void => {
  try {
    secureStorage.setItem(STORAGE_KEYS.WA_LOGS, logs);
  } catch (err) {
    console.error('Failed saving wa logs', err);
  }
};

export const getStoredSchoolConfig = (): SchoolProfile => {
  try {
    const parsed = secureStorage.getItem<SchoolProfile>(STORAGE_KEYS.SCHOOL_CONFIG, SCHOOL_CONFIG);
    if (parsed.timKesiswaanName && parsed.timKesiswaanName.includes('Subagyo')) {
      parsed.timKesiswaanName = 'Tim Kesiswaan';
    }
    if (parsed.wakasekName && parsed.wakasekName.includes('Subagyo')) {
      parsed.wakasekName = 'Tim Kesiswaan';
    }
    if (!parsed.footerYear || parsed.footerYear.includes('2025')) {
      parsed.footerYear = '2026';
    }
    return parsed;
  } catch (err) {
    console.error('Failed reading school config storage', err);
    return SCHOOL_CONFIG;
  }
};

export const saveSchoolConfig = (config: SchoolProfile): void => {
  try {
    secureStorage.setItem(STORAGE_KEYS.SCHOOL_CONFIG, config);
  } catch (err) {
    console.error('Failed saving school config', err);
  }
};

export const resetToDefaultData = (): { 
  students: Student[]; 
  violations: ViolationRecord[]; 
  logs: WhatsAppMessageLog[];
  config: SchoolProfile;
} => {
  // Completely pristine reset: 0 students, 0 violations, 0 logs, 0 attendance sheets
  const cleanStudents: Student[] = [];
  const cleanViolations: ViolationRecord[] = [];
  const cleanLogs: WhatsAppMessageLog[] = [];

  secureStorage.setItem(STORAGE_KEYS.STUDENTS, cleanStudents);
  secureStorage.setItem(STORAGE_KEYS.VIOLATIONS, cleanViolations);
  secureStorage.setItem(STORAGE_KEYS.WA_LOGS, cleanLogs);
  secureStorage.setItem(STORAGE_KEYS.SCHOOL_CONFIG, SCHOOL_CONFIG);

  // Clear all attendance sheets so attendance menu has no dummy student names
  clearAllAttendanceSheets();

  return {
    students: cleanStudents,
    violations: cleanViolations,
    logs: cleanLogs,
    config: SCHOOL_CONFIG,
  };
};

export const loadDemoData = (): {
  students: Student[];
  violations: ViolationRecord[];
  logs: WhatsAppMessageLog[];
  config: SchoolProfile;
} => {
  secureStorage.setItem(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  secureStorage.setItem(STORAGE_KEYS.VIOLATIONS, INITIAL_VIOLATIONS);
  secureStorage.setItem(STORAGE_KEYS.WA_LOGS, INITIAL_WA_LOGS);
  secureStorage.setItem(STORAGE_KEYS.SCHOOL_CONFIG, SCHOOL_CONFIG);

  return {
    students: INITIAL_STUDENTS,
    violations: INITIAL_VIOLATIONS,
    logs: INITIAL_WA_LOGS,
    config: SCHOOL_CONFIG,
  };
};

