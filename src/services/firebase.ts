import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocFromServer,
  getDoc,
  getDocsFromServer,
  onSnapshot, 
  writeBatch,
  getDocs,
  runTransaction
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Student, ViolationRecord, WhatsAppMessageLog, SchoolProfile, AttendanceSheet, AttendanceStatus } from '../types';
import { SchoolActivity } from './announcementService';
import { UserAccount, AuditLogEntry } from '../types/auth';
import { sortByClassAndName } from '../utils/sortUtils';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId
const firestoreDbId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId || '(default)';
export const db = getFirestore(app, firestoreDbId);
export const auth = getAuth(app);

// Operation types enum for Firestore error handling conforming to SKILL.md
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function buildErrorInfo(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  return {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = buildErrorInfo(error, operationType, path);
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function logFirestoreListenerError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = buildErrorInfo(error, operationType, path);
  console.error('Firestore Listener Error: ', JSON.stringify(errInfo));
}

/**
 * Recursively remove `undefined` properties so Firestore SDK never rejects a write
 * with "Unsupported field value: undefined".
 */
export function sanitizeForFirestore<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof value === 'object' && !(value instanceof Date)) {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        clean[k] = sanitizeForFirestore(v);
      }
    }
    return clean as T;
  }
  return value;
}

// Validate Connection to Firestore on boot as required by SKILL.md
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline or connection pending. Local cache remains active.');
    }
  }
}

// Test connection on module load
testFirestoreConnection();

/* =========================================================================
   REAL-TIME SUBSCRIPTIONS (onSnapshot) ACROSS MULTI-ACCOUNT & CROSS-DEVICE
   ========================================================================= */

// Collection names matching firebase-blueprint.json
const COLLECTIONS = {
  STUDENTS: 'students',
  VIOLATIONS: 'violations',
  WA_LOGS: 'wa_logs',
  ATTENDANCE: 'attendance_sheets',
  SETTINGS: 'school_config',
  ACTIVITIES: 'activities',
  ACCOUNTS: 'accounts',
  AUDIT_LOGS: 'audit_logs',
};

export interface SystemMeta {
  studentsInitialized: boolean;
  isCleanReset: boolean;
  class7B7FSwapFixV1?: boolean;
  updatedAt: string;
}

/**
 * Read system initialization metadata directly from Firestore server
 * Prevents secondary devices from falsely re-seeding dummy INITIAL_STUDENTS
 */
export const getSystemMetaFromServer = async (): Promise<SystemMeta | null> => {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'system_meta');
  try {
    const snap = await getDocFromServer(docRef);
    return snap.exists() ? (snap.data() as SystemMeta) : null;
  } catch {
    try {
      const snap = await getDoc(docRef);
      return snap.exists() ? (snap.data() as SystemMeta) : null;
    } catch {
      return null;
    }
  }
};

export const setSystemMeta = async (meta: SystemMeta): Promise<void> => {
  const path = `${COLLECTIONS.SETTINGS}/system_meta`;
  try {
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'system_meta'), sanitizeForFirestore(meta), { merge: true });
  } catch (err) {
    logFirestoreListenerError(err, OperationType.WRITE, path);
  }
};

export const checkServerStudentsCount = async (): Promise<number | null> => {
  const colRef = collection(db, COLLECTIONS.STUDENTS);
  try {
    const snap = await getDocsFromServer(colRef);
    return snap.size;
  } catch {
    return null;
  }
};

/**
 * Subscribe to real-time student updates across all devices
 * Deterministically sorted by class (7A-9H) and name (A-Z).
 */
export const subscribeToStudents = (
  onUpdate: (students: Student[], meta: { fromCache: boolean; empty: boolean }) => void
) => {
  const colRef = collection(db, COLLECTIONS.STUDENTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Student[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Student);
      });
      const sorted = sortByClassAndName(list);
      onUpdate(sorted, {
        fromCache: snapshot.metadata.fromCache,
        empty: snapshot.empty,
      });
    },
    (err) => {
      logFirestoreListenerError(err, OperationType.GET, COLLECTIONS.STUDENTS);
    }
  );
};

/**
 * Subscribe to real-time violations updates across all devices
 */
export const subscribeToViolations = (onUpdate: (violations: ViolationRecord[]) => void) => {
  const colRef = collection(db, COLLECTIONS.VIOLATIONS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      // Ignore empty initial cache-only snapshots to avoid wiping cached UI before server arrives
      if (snapshot.metadata.fromCache && snapshot.empty) {
        return;
      }
      const list: ViolationRecord[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as ViolationRecord);
      });
      // Sort newest first by tanggal and waktu/id
      list.sort((a, b) => {
        const da = `${a.tanggal || ''} ${a.waktu || ''}`;
        const dbDate = `${b.tanggal || ''} ${b.waktu || ''}`;
        const cmp = dbDate.localeCompare(da);
        return cmp !== 0 ? cmp : (b.id || '').localeCompare(a.id || '');
      });
      onUpdate(list);
    },
    (err) => {
      logFirestoreListenerError(err, OperationType.GET, COLLECTIONS.VIOLATIONS);
    }
  );
};

/**
 * Subscribe to real-time WhatsApp dispatch logs
 */
export const subscribeToWaLogs = (onUpdate: (logs: WhatsAppMessageLog[]) => void) => {
  const colRef = collection(db, COLLECTIONS.WA_LOGS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.metadata.fromCache && snapshot.empty) {
        return;
      }
      const list: WhatsAppMessageLog[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as WhatsAppMessageLog);
      });
      // Sort newest first
      list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      onUpdate(list);
    },
    (err) => {
      logFirestoreListenerError(err, OperationType.GET, COLLECTIONS.WA_LOGS);
    }
  );
};

/**
 * Subscribe to real-time School Config / Profile updates
 */
export const subscribeToSchoolConfig = (onUpdate: (config: SchoolProfile) => void) => {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'profile');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as SchoolProfile);
      }
    },
    (err) => {
      logFirestoreListenerError(err, OperationType.GET, `${COLLECTIONS.SETTINGS}/profile`);
    }
  );
};

/**
 * Subscribe to real-time Attendance Sheets
 */
export const subscribeToAttendanceSheets = (onUpdate: (sheets: AttendanceSheet[]) => void) => {
  const colRef = collection(db, COLLECTIONS.ATTENDANCE);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.metadata.fromCache && snapshot.empty) {
        return;
      }
      const list: AttendanceSheet[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as AttendanceSheet);
      });
      onUpdate(list);
    },
    (err) => {
      logFirestoreListenerError(err, OperationType.GET, COLLECTIONS.ATTENDANCE);
    }
  );
};

/**
 * Subscribe to real-time School Activities & Announcements
 */
export const subscribeToActivities = (onUpdate: (activities: SchoolActivity[]) => void) => {
  const colRef = collection(db, COLLECTIONS.ACTIVITIES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.metadata.fromCache && snapshot.empty) {
        return;
      }
      const list: SchoolActivity[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as SchoolActivity);
      });
      // Sort by startDate
      list.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
      onUpdate(list);
    },
    (err) => {
      logFirestoreListenerError(err, OperationType.GET, COLLECTIONS.ACTIVITIES);
    }
  );
};

/**
 * Subscribe to real-time Staff Accounts
 */
export const subscribeToAccounts = (onUpdate: (accounts: UserAccount[]) => void) => {
  const colRef = collection(db, COLLECTIONS.ACCOUNTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.metadata.fromCache && snapshot.empty) {
        return;
      }
      const list: UserAccount[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as UserAccount);
      });
      // Sort so usr-admin comes first, then by ID
      list.sort((a, b) => {
        if (a.id === 'usr-admin') return -1;
        if (b.id === 'usr-admin') return 1;
        return a.id.localeCompare(b.id);
      });
      onUpdate(list);
    },
    (err) => {
      logFirestoreListenerError(err, OperationType.GET, COLLECTIONS.ACCOUNTS);
    }
  );
};

/**
 * Subscribe to real-time System Audit Logs across all devices & accounts
 */
export const subscribeToAuditLogs = (
  onUpdate: (logs: AuditLogEntry[], meta: { fromCache: boolean; empty: boolean }) => void
) => {
  const colRef = collection(db, COLLECTIONS.AUDIT_LOGS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.metadata.fromCache && snapshot.empty) {
        return;
      }
      const list: AuditLogEntry[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as AuditLogEntry);
      });
      list.sort((a, b) => {
        const cmp = (b.isoTimestamp || '').localeCompare(a.isoTimestamp || '');
        return cmp !== 0 ? cmp : (b.id || '').localeCompare(a.id || '');
      });
      onUpdate(list, {
        fromCache: snapshot.metadata.fromCache,
        empty: snapshot.empty,
      });
    },
    (err) => {
      logFirestoreListenerError(err, OperationType.GET, COLLECTIONS.AUDIT_LOGS);
    }
  );
};

/**
 * Fetch latest System Audit Logs directly from Firestore server
 */
export const fetchAuditLogsFromServer = async (): Promise<AuditLogEntry[]> => {
  const colRef = collection(db, COLLECTIONS.AUDIT_LOGS);
  const snap = await getDocsFromServer(colRef).catch(() => getDocs(colRef));
  const list: AuditLogEntry[] = [];
  snap.forEach((d) => {
    list.push(d.data() as AuditLogEntry);
  });
  list.sort((a, b) => {
    const cmp = (b.isoTimestamp || '').localeCompare(a.isoTimestamp || '');
    return cmp !== 0 ? cmp : (b.id || '').localeCompare(a.id || '');
  });
  return list;
};

/**
 * Save a single System Audit Log entry to Firestore
 */
export const syncAuditLogToFirestore = async (entry: AuditLogEntry): Promise<void> => {
  const path = `${COLLECTIONS.AUDIT_LOGS}/${entry.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.AUDIT_LOGS, entry.id), sanitizeForFirestore(entry), { merge: true });
  } catch (err) {
    logFirestoreListenerError(err, OperationType.WRITE, path);
  }
};

/* =========================================================================
   FIRESTORE REAL-TIME MUTATION APIS
   ========================================================================= */

/**
 * Save or update a single student in Firestore (merge: true preserves concurrent fields)
 */
export const syncStudentToFirestore = async (student: Student): Promise<void> => {
  const path = `${COLLECTIONS.STUDENTS}/${student.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.STUDENTS, student.id), sanitizeForFirestore(student), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

/**
 * Update specific fields on a single student document without overwriting unrelated properties
 */
export const updateStudentFieldsInFirestore = async (
  studentId: string,
  fields: Partial<Student>
): Promise<void> => {
  const path = `${COLLECTIONS.STUDENTS}/${studentId}`;
  try {
    await setDoc(doc(db, COLLECTIONS.STUDENTS, studentId), sanitizeForFirestore(fields), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
};

/**
 * Batch-update ONLY attendance fields for specific students (e.g., 1 class)
 * NEVER touches nama, nisn, kelas, or violation counters of any student!
 */
export const batchUpdateStudentsAttendanceInFirestore = async (
  updates: Array<{ id: string; statusKehadiran: AttendanceStatus; statusKehadiranDate?: string; keteranganKehadiran?: string }>
): Promise<void> => {
  if (!updates || updates.length === 0) return;
  const CHUNK_SIZE = 350;
  try {
    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
      const chunk = updates.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((u) => {
        const ref = doc(db, COLLECTIONS.STUDENTS, u.id);
        const payload: Record<string, unknown> = {
          statusKehadiran: u.statusKehadiran,
          keteranganKehadiran: u.keteranganKehadiran || '',
        };
        if (u.statusKehadiranDate) {
          payload.statusKehadiranDate = u.statusKehadiranDate;
        }
        batch.set(ref, payload, { merge: true });
      });
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, COLLECTIONS.STUDENTS);
  }
};

/**
 * Batch-reset ONLY violation counters on specified students
 */
export const batchResetStudentViolationCountersInFirestore = async (
  studentIds: string[]
): Promise<void> => {
  if (!studentIds || studentIds.length === 0) return;
  const CHUNK_SIZE = 350;
  try {
    for (let i = 0; i < studentIds.length; i += CHUNK_SIZE) {
      const chunk = studentIds.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        const ref = doc(db, COLLECTIONS.STUDENTS, id);
        batch.set(
          ref,
          {
            totalPelanggaranRingan: 0,
            totalPelanggaranSedang: 0,
            totalPelanggaranBerat: 0,
            totalPoinPelanggaran: 0,
          },
          { merge: true }
        );
      });
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, COLLECTIONS.STUDENTS);
  }
};

/**
 * Delete a student from Firestore
 */
export const deleteStudentFromFirestore = async (studentId: string): Promise<void> => {
  const path = `${COLLECTIONS.STUDENTS}/${studentId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.STUDENTS, studentId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

/**
 * Save or update a violation in Firestore
 */
export const syncViolationToFirestore = async (violation: ViolationRecord): Promise<void> => {
  const path = `${COLLECTIONS.VIOLATIONS}/${violation.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.VIOLATIONS, violation.id), sanitizeForFirestore(violation), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

/**
 * Delete a single violation from Firestore
 */
export const deleteViolationFromFirestore = async (violationId: string): Promise<void> => {
  const path = `${COLLECTIONS.VIOLATIONS}/${violationId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.VIOLATIONS, violationId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

/**
 * Save WhatsApp log to Firestore
 */
export const syncWaLogToFirestore = async (log: WhatsAppMessageLog): Promise<void> => {
  const path = `${COLLECTIONS.WA_LOGS}/${log.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.WA_LOGS, log.id), sanitizeForFirestore(log), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

/**
 * Delete a single WhatsApp log from Firestore
 */
export const deleteWaLogFromFirestore = async (logId: string): Promise<void> => {
  const path = `${COLLECTIONS.WA_LOGS}/${logId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.WA_LOGS, logId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

/**
 * Save or update School Config to Firestore
 */
export const syncSchoolConfigToFirestore = async (config: SchoolProfile): Promise<void> => {
  const path = `${COLLECTIONS.SETTINGS}/profile`;
  try {
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'profile'), sanitizeForFirestore(config), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

/**
 * Save or update Attendance Sheet to Firestore
 */
export const syncAttendanceSheetToFirestore = async (sheet: AttendanceSheet): Promise<void> => {
  const path = `${COLLECTIONS.ATTENDANCE}/${sheet.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.ATTENDANCE, sheet.id), sanitizeForFirestore(sheet));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

/**
 * Delete Attendance Sheet from Firestore
 */
export const deleteAttendanceSheetFromFirestore = async (sheetId: string): Promise<void> => {
  const path = `${COLLECTIONS.ATTENDANCE}/${sheetId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.ATTENDANCE, sheetId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

/**
 * Bulk sync attendance sheets to Firestore with chunking
 */
export const bulkSyncAttendanceSheets = async (sheets: AttendanceSheet[]): Promise<void> => {
  const CHUNK_SIZE = 350;
  try {
    for (let i = 0; i < sheets.length; i += CHUNK_SIZE) {
      const chunk = sheets.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((sheet) => {
        const ref = doc(db, COLLECTIONS.ATTENDANCE, sheet.id);
        batch.set(ref, sanitizeForFirestore(sheet));
      });
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.ATTENDANCE);
  }
};

/**
 * Save or update School Activity / Announcement to Firestore
 */
export const syncActivityToFirestore = async (activity: SchoolActivity): Promise<void> => {
  const path = `${COLLECTIONS.ACTIVITIES}/${activity.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.ACTIVITIES, activity.id), sanitizeForFirestore(activity));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

/**
 * Delete School Activity / Announcement from Firestore
 */
export const deleteActivityFromFirestore = async (activityId: string): Promise<void> => {
  const path = `${COLLECTIONS.ACTIVITIES}/${activityId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.ACTIVITIES, activityId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

/**
 * Bulk sync School Activities to Firestore
 */
export const bulkSyncActivitiesToFirestore = async (activities: SchoolActivity[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    activities.forEach((act) => {
      const ref = doc(db, COLLECTIONS.ACTIVITIES, act.id);
      batch.set(ref, sanitizeForFirestore(act));
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.ACTIVITIES);
  }
};

/**
 * Save or update Staff Account to Firestore
 */
export const syncAccountToFirestore = async (account: UserAccount): Promise<void> => {
  const path = `${COLLECTIONS.ACCOUNTS}/${account.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.ACCOUNTS, account.id), sanitizeForFirestore(account), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

/**
 * Delete Staff Account from Firestore
 */
export const deleteAccountFromFirestore = async (accountId: string): Promise<void> => {
  const path = `${COLLECTIONS.ACCOUNTS}/${accountId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.ACCOUNTS, accountId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

/**
 * Bulk sync Staff Accounts to Firestore
 */
export const bulkSyncAccountsToFirestore = async (accounts: UserAccount[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    accounts.forEach((acc) => {
      const ref = doc(db, COLLECTIONS.ACCOUNTS, acc.id);
      batch.set(ref, sanitizeForFirestore(acc), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.ACCOUNTS);
  }
};

/**
 * Direct fetch of a single user account from Firestore
 * Guarantees cross-device password verification succeeds even before real-time sync completes
 */
export const getAccountDirectlyFromFirestore = async (accountId: string): Promise<UserAccount | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.ACCOUNTS, accountId);
    const snap = await getDocFromServer(docRef);
    if (snap.exists()) {
      return snap.data() as UserAccount;
    }
    return null;
  } catch (err) {
    console.warn('Direct fetch from server failed, falling back to cache or null', err);
    try {
      const docRef = doc(db, COLLECTIONS.ACCOUNTS, accountId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as UserAccount;
      }
      return null;
    } catch {
      return null;
    }
  }
};

/**
 * Bulk import students to Firestore safely chunked by 350 to prevent 500 limit exception
 */
export const bulkImportStudentsToFirestore = async (students: Student[]): Promise<void> => {
  if (!students || students.length === 0) return;
  const CHUNK_SIZE = 350;
  try {
    for (let i = 0; i < students.length; i += CHUNK_SIZE) {
      const chunk = students.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((student) => {
        const ref = doc(db, COLLECTIONS.STUDENTS, student.id);
        batch.set(ref, sanitizeForFirestore(student), { merge: true });
      });
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.STUDENTS);
  }
};

/**
 * Replace the entire Firestore students collection so it matches the uploaded database 1:1
 */
export const replaceAllStudentsInFirestore = async (students: Student[]): Promise<void> => {
  const CHUNK_SIZE = 350;
  try {
    const colRef = collection(db, COLLECTIONS.STUDENTS);
    const snap = await getDocsFromServer(colRef).catch(() => getDocs(colRef));
    const keepIds = new Set(students.map((s) => s.id));
    const docsToDelete = snap.docs.filter((d) => !keepIds.has(d.id));

    // Write uploaded students first so the collection never becomes transiently empty
    for (let i = 0; i < students.length; i += CHUNK_SIZE) {
      const chunk = students.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((student) => {
        const ref = doc(db, COLLECTIONS.STUDENTS, student.id);
        batch.set(ref, sanitizeForFirestore(student));
      });
      await batch.commit();
    }

    // Delete any stale student documents not present in the uploaded file
    for (let i = 0; i < docsToDelete.length; i += CHUNK_SIZE) {
      const chunk = docsToDelete.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.STUDENTS);
  }
};

/**
 * Safely delete all documents in a single Firestore collection using chunked batches (<500 limit)
 */
export const clearCollectionFromFirestore = async (
  colName: 'students' | 'violations' | 'wa_logs' | 'attendance_sheets' | 'activities' | 'audit_logs'
): Promise<void> => {
  const CHUNK_SIZE = 350;
  try {
    const colRef = collection(db, colName);
    const snap = await getDocsFromServer(colRef).catch(() => getDocs(colRef));
    if (snap.empty) return;
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
      const chunk = docs.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, colName);
  }
};

/**
 * Clear all audit logs from Firestore so every device & account receives empty state in real time
 */
export const clearAuditLogsFromFirestore = async (): Promise<void> => {
  await clearCollectionFromFirestore('audit_logs');
};

/**
 * COMPLETELY CLEAN & RESET FIRESTORE
 * Deletes all documents in students, violations, wa_logs, attendance_sheets, activities, audit_logs
 * using chunked batches, and records `isCleanReset: true` so other devices NEVER re-seed dummy data.
 */
export const clearAllFirestoreData = async (): Promise<void> => {
  try {
    const collectionsToClear: Array<'students' | 'violations' | 'wa_logs' | 'attendance_sheets' | 'activities' | 'audit_logs'> = [
      'students',
      'violations',
      'wa_logs',
      'attendance_sheets',
      'activities',
      'audit_logs',
    ];

    for (const colName of collectionsToClear) {
      await clearCollectionFromFirestore(colName);
    }

    await setSystemMeta({
      studentsInitialized: true,
      isCleanReset: true,
      class7B7FSwapFixV1: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'all_collections');
  }
};

/**
 * Atomically repairs swapped 7B <-> 7F classes in existing Firestore database exactly once
 * using a transaction lock on school_config/system_meta.
 */
export const swapClass7BAnd7FInFirestoreOnce = async (): Promise<{ swappedStudents: number }> => {
  const metaRef = doc(db, COLLECTIONS.SETTINGS, 'system_meta');
  const shouldRun = await runTransaction(db, async (tx) => {
    const snap = await tx.get(metaRef);
    const data = snap.exists() ? (snap.data() as SystemMeta) : null;
    if (data?.class7B7FSwapFixV1 || data?.isCleanReset) {
      return false;
    }
    tx.set(
      metaRef,
      {
        studentsInitialized: true,
        isCleanReset: false,
        class7B7FSwapFixV1: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  });

  if (!shouldRun) {
    return { swappedStudents: 0 };
  }

  const swapKelasLabel = (k?: string): string | undefined => {
    if (!k) return k;
    const norm = k.trim().toUpperCase();
    if (norm === '7B') return '7F';
    if (norm === '7F') return '7B';
    return k;
  };

  let swappedStudents = 0;
  const CHUNK_SIZE = 350;

  // 1. Swap 7B <-> 7F on students collection
  const stdSnap = await getDocsFromServer(collection(db, COLLECTIONS.STUDENTS)).catch(() =>
    getDocs(collection(db, COLLECTIONS.STUDENTS))
  );
  const stdToUpdate: Array<{ id: string; nextKelas: string }> = [];
  stdSnap.forEach((d) => {
    const data = d.data() as Student;
    const swapped = swapKelasLabel(data.kelas);
    if (swapped && swapped !== data.kelas) {
      stdToUpdate.push({ id: d.id, nextKelas: swapped });
    }
  });
  for (let i = 0; i < stdToUpdate.length; i += CHUNK_SIZE) {
    const chunk = stdToUpdate.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((item) => {
      batch.set(doc(db, COLLECTIONS.STUDENTS, item.id), { kelas: item.nextKelas }, { merge: true });
    });
    await batch.commit();
  }
  swappedStudents = stdToUpdate.length;

  // 2. Swap 7B <-> 7F on violations collection
  const violSnap = await getDocsFromServer(collection(db, COLLECTIONS.VIOLATIONS)).catch(() =>
    getDocs(collection(db, COLLECTIONS.VIOLATIONS))
  );
  const violToUpdate: Array<{ id: string; nextKelas: string }> = [];
  violSnap.forEach((d) => {
    const data = d.data() as ViolationRecord;
    const swapped = swapKelasLabel(data.kelas);
    if (swapped && swapped !== data.kelas) {
      violToUpdate.push({ id: d.id, nextKelas: swapped });
    }
  });
  for (let i = 0; i < violToUpdate.length; i += CHUNK_SIZE) {
    const chunk = violToUpdate.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((item) => {
      batch.set(doc(db, COLLECTIONS.VIOLATIONS, item.id), { kelas: item.nextKelas }, { merge: true });
    });
    await batch.commit();
  }

  // 3. Swap 7B <-> 7F on attendance_sheets collection
  const attSnap = await getDocsFromServer(collection(db, COLLECTIONS.ATTENDANCE)).catch(() =>
    getDocs(collection(db, COLLECTIONS.ATTENDANCE))
  );
  const attSwappedDocs: Array<{ oldId: string; newSheet: AttendanceSheet }> = [];
  attSnap.forEach((d) => {
    const data = d.data() as AttendanceSheet;
    const swappedKelas = swapKelasLabel(data.kelas);
    if (swappedKelas && swappedKelas !== data.kelas) {
      const nextId = `att-${data.date}-${swappedKelas}`;
      attSwappedDocs.push({
        oldId: d.id,
        newSheet: {
          ...data,
          id: nextId,
          kelas: swappedKelas,
        },
      });
    }
  });
  if (attSwappedDocs.length > 0) {
    const oldIds = new Set(attSwappedDocs.map((a) => a.oldId));
    const newIds = new Set(attSwappedDocs.map((a) => a.newSheet.id));
    for (let i = 0; i < attSwappedDocs.length; i += CHUNK_SIZE) {
      const chunk = attSwappedDocs.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.ATTENDANCE, item.newSheet.id), sanitizeForFirestore(item.newSheet));
      });
      await batch.commit();
    }
    // Delete any orphaned old sheet IDs that aren't overwritten by the swapped counterpart
    const toDeleteOldIds = Array.from(oldIds).filter((id) => !newIds.has(id));
    for (let i = 0; i < toDeleteOldIds.length; i += CHUNK_SIZE) {
      const chunk = toDeleteOldIds.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((id) => batch.delete(doc(db, COLLECTIONS.ATTENDANCE, id)));
      await batch.commit();
    }
  }

  return { swappedStudents };
};
