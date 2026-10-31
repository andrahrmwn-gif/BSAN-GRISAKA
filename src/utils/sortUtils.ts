import { KELAS_LIST } from '../data/schoolConfig';

/**
 * Compare two class names (e.g. '7A' vs '8B' vs '9H')
 * Orders from smallest class to largest class using KELAS_LIST hierarchy.
 */
export const compareKelas = (a: string = '', b: string = ''): number => {
  const cleanA = a.trim();
  const cleanB = b.trim();
  const idxA = KELAS_LIST.indexOf(cleanA);
  const idxB = KELAS_LIST.indexOf(cleanB);
  if (idxA !== -1 && idxB !== -1) {
    return idxA - idxB;
  }
  if (idxA !== -1) return -1;
  if (idxB !== -1) return 1;
  return cleanA.localeCompare(cleanB, 'id-ID', { numeric: true, sensitivity: 'base' });
};

/**
 * Compare two student names alphabetically (A-Z, urut absen)
 */
export const compareStudentName = (a: string = '', b: string = ''): number => {
  return a.trim().localeCompare(b.trim(), 'id-ID', { sensitivity: 'base' });
};

/**
 * Sort any student or attendance recap list by:
 * 1. Class from smallest to largest (7A -> 9H)
 * 2. Student name alphabetically (A -> Z, nomor absen urut)
 */
export const sortByClassAndName = <T extends { kelas?: string; nama?: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const classDiff = compareKelas(a.kelas || '', b.kelas || '');
    if (classDiff !== 0) return classDiff;
    return compareStudentName(a.nama || '', b.nama || '');
  });
};

/**
 * Sort students within a single class alphabetically by name (urut absen A-Z)
 */
export const sortByName = <T extends { nama?: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => compareStudentName(a.nama || '', b.nama || ''));
};
