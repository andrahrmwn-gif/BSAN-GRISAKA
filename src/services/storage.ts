import { Student, ViolationRecord, WhatsAppMessageLog, SchoolProfile } from '../types';
import { INITIAL_STUDENTS, INITIAL_VIOLATIONS, INITIAL_WA_LOGS } from '../data/initialStudents';
import { SCHOOL_CONFIG } from '../data/schoolConfig';

const STORAGE_KEYS = {
  STUDENTS: 'bsan_grisaka_students_v1',
  VIOLATIONS: 'bsan_grisaka_violations_v1',
  WA_LOGS: 'bsan_grisaka_wa_logs_v1',
  SCHOOL_CONFIG: 'bsan_grisaka_school_config_v1',
};

export const getStoredStudents = (): Student[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed reading students storage', err);
    return INITIAL_STUDENTS;
  }
};

export const saveStudents = (students: Student[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (err) {
    console.error('Failed saving students', err);
  }
};

export const getStoredViolations = (): ViolationRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VIOLATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify(INITIAL_VIOLATIONS));
      return INITIAL_VIOLATIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed reading violations storage', err);
    return INITIAL_VIOLATIONS;
  }
};

export const saveViolations = (violations: ViolationRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify(violations));
  } catch (err) {
    console.error('Failed saving violations', err);
  }
};

export const getStoredWaLogs = (): WhatsAppMessageLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WA_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.WA_LOGS, JSON.stringify(INITIAL_WA_LOGS));
      return INITIAL_WA_LOGS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed reading wa logs storage', err);
    return INITIAL_WA_LOGS;
  }
};

export const saveWaLogs = (logs: WhatsAppMessageLog[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.WA_LOGS, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed saving wa logs', err);
  }
};

export const getStoredSchoolConfig = (): SchoolProfile => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHOOL_CONFIG);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SCHOOL_CONFIG, JSON.stringify(SCHOOL_CONFIG));
      return SCHOOL_CONFIG;
    }
    const parsed = JSON.parse(raw);
    if (parsed.timKesiswaanName && parsed.timKesiswaanName.includes('Subagyo')) {
      parsed.timKesiswaanName = 'Tim Kesiswaan';
    }
    if (parsed.wakasekName && parsed.wakasekName.includes('Subagyo')) {
      parsed.wakasekName = 'Tim Kesiswaan';
    }
    return parsed;
  } catch (err) {
    console.error('Failed reading school config storage', err);
    return SCHOOL_CONFIG;
  }
};

export const saveSchoolConfig = (config: SchoolProfile): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SCHOOL_CONFIG, JSON.stringify(config));
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
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  localStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify(INITIAL_VIOLATIONS));
  localStorage.setItem(STORAGE_KEYS.WA_LOGS, JSON.stringify(INITIAL_WA_LOGS));
  localStorage.setItem(STORAGE_KEYS.SCHOOL_CONFIG, JSON.stringify(SCHOOL_CONFIG));
  return {
    students: INITIAL_STUDENTS,
    violations: INITIAL_VIOLATIONS,
    logs: INITIAL_WA_LOGS,
    config: SCHOOL_CONFIG,
  };
};
