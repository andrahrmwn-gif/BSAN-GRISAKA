import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocFromServer,
  onSnapshot, 
  writeBatch,
  getDocs
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Student, ViolationRecord, WhatsAppMessageLog, SchoolProfile, AttendanceSheet } from '../types';

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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
};

/**
 * Subscribe to real-time student updates across all devices
 */
export const subscribeToStudents = (onUpdate: (students: Student[]) => void) => {
  const colRef = collection(db, COLLECTIONS.STUDENTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Student[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Student);
      });
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, COLLECTIONS.STUDENTS);
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
      const list: ViolationRecord[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as ViolationRecord);
      });
      // Sort newest first by tanggal and createdAt/waktu
      list.sort((a, b) => {
        const da = a.tanggal || '';
        const db = b.tanggal || '';
        return db.localeCompare(da);
      });
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, COLLECTIONS.VIOLATIONS);
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
      const list: WhatsAppMessageLog[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as WhatsAppMessageLog);
      });
      // Sort newest first
      list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, COLLECTIONS.WA_LOGS);
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
      handleFirestoreError(err, OperationType.GET, `${COLLECTIONS.SETTINGS}/profile`);
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
      const list: AttendanceSheet[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as AttendanceSheet);
      });
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, COLLECTIONS.ATTENDANCE);
    }
  );
};

/* =========================================================================
   FIRESTORE REAL-TIME MUTATION APIS
   ========================================================================= */

/**
 * Save or update a single student in Firestore
 */
export const syncStudentToFirestore = async (student: Student): Promise<void> => {
  const path = `${COLLECTIONS.STUDENTS}/${student.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.STUDENTS, student.id), student);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
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
    await setDoc(doc(db, COLLECTIONS.VIOLATIONS, violation.id), violation);
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
    await setDoc(doc(db, COLLECTIONS.WA_LOGS, log.id), log);
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
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'profile'), config);
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
    await setDoc(doc(db, COLLECTIONS.ATTENDANCE, sheet.id), sheet);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

/**
 * Bulk import students to Firestore
 */
export const bulkImportStudentsToFirestore = async (students: Student[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    students.forEach((student) => {
      const ref = doc(db, COLLECTIONS.STUDENTS, student.id);
      batch.set(ref, student);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.STUDENTS);
  }
};

/**
 * COMPLETELY CLEAN & RESET FIRESTORE
 * Deletes all documents in students, violations, wa_logs, attendance_sheets.
 * Ensures the database is 100% clean across all devices.
 */
export const clearAllFirestoreData = async (): Promise<void> => {
  try {
    const collectionsToClear = [
      COLLECTIONS.STUDENTS,
      COLLECTIONS.VIOLATIONS,
      COLLECTIONS.WA_LOGS,
      COLLECTIONS.ATTENDANCE,
    ];

    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.forEach((d) => {
          batch.delete(d.ref);
        });
        await batch.commit();
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'all_collections');
  }
};
