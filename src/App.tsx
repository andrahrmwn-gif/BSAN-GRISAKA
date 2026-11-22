import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ViewMode, Student, ViolationRecord, WhatsAppMessageLog, SchoolProfile, AttendanceSheet } from './types';
import { UserAccount } from './types/auth';
import { 
  getStoredStudents, 
  saveStudents, 
  getStoredViolations, 
  saveViolations, 
  getStoredWaLogs, 
  saveWaLogs,
  getStoredSchoolConfig,
  saveSchoolConfig,
  resetToDefaultData 
} from './services/storage';
import { 
  subscribeToStudents,
  subscribeToViolations,
  subscribeToWaLogs,
  subscribeToSchoolConfig,
  subscribeToAttendanceSheets,
  subscribeToActivities,
  subscribeToAccounts,
  subscribeToAuditLogs,
  syncStudentToFirestore,
  updateStudentFieldsInFirestore,
  batchUpdateStudentsAttendanceInFirestore,
  batchResetStudentViolationCountersInFirestore,
  deleteStudentFromFirestore,
  syncViolationToFirestore,
  deleteViolationFromFirestore,
  syncWaLogToFirestore,
  deleteWaLogFromFirestore,
  syncSchoolConfigToFirestore,
  syncAccountToFirestore,
  bulkImportStudentsToFirestore,
  replaceAllStudentsInFirestore,
  bulkSyncAccountsToFirestore,
  clearCollectionFromFirestore,
  clearAllFirestoreData,
  getSystemMetaFromServer,
  setSystemMeta,
  checkServerStudentsCount,
  getAccountDirectlyFromFirestore,
  swapClass7BAnd7FInFirestoreOnce,
} from './services/firebase';
import { INITIAL_STUDENTS } from './data/initialStudents';
import { 
  saveAttendanceSheetsLocalOnly, 
  getStoredAttendanceSheets, 
  getEffectiveStudentAttendanceForDate 
} from './services/attendanceStorage';
import { useRealtimeDateTracker } from './utils/dateUtils';
import { saveActivities } from './services/announcementService';
import { sortByClassAndName } from './utils/sortUtils';
import { 
  getCurrentUser, 
  isGuestMode, 
  isAdminUser,
  ensureAdminAccount,
  saveAccountsLocalOnly,
  ADMIN_ACCOUNT,
  DEFAULT_ACCOUNTS, 
  setCurrentUserId 
} from './services/authService';
import { logAudit, saveAuditLogsLocalOnly } from './services/auditLogger';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { StudentCentralHub } from './components/students/StudentCentralHub';
import { AttendanceManagerView } from './components/attendance/AttendanceManagerView';
import { ViolationsManager } from './components/violations/ViolationsManager';
import { TataTertibDocView } from './components/violations/TataTertibDocView';
import { WhatsAppGateway } from './components/whatsapp/WhatsAppGateway';
import { ComprehensiveReports } from './components/reports/ComprehensiveReports';
import { SchoolSettingsView } from './components/settings/SchoolSettingsView';
import { RecordViolationModal } from './components/modals/RecordViolationModal';
import { SuratPernyataanModal } from './components/modals/SuratPernyataanModal';
import { StudentSlipDetailModal } from './components/modals/StudentSlipDetailModal';
import { AccountSwitchModal } from './components/modals/AccountSwitchModal';
import { LogoutConfirmModal } from './components/modals/LogoutConfirmModal';
import { SessionTimeoutModal } from './components/modals/SessionTimeoutModal';
import { LoginPage } from './components/auth/LoginPage';
import { generateViolationMessage } from './utils/whatsapp';
import { RotateCcw, AlertTriangle, CheckCircle2, X, ShieldAlert, Menu } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [students, setStudents] = useState<Student[]>(() => getStoredStudents());
  const [attendanceSheets, setAttendanceSheets] = useState<AttendanceSheet[]>(() => getStoredAttendanceSheets());
  const [violations, setViolations] = useState<ViolationRecord[]>(() => getStoredViolations());
  const [waLogs, setWaLogs] = useState<WhatsAppMessageLog[]>(() => getStoredWaLogs());
  const [schoolConfig, setSchoolConfig] = useState<SchoolProfile>(() => getStoredSchoolConfig());
  const { todayStr } = useRealtimeDateTracker();
  const hasChecked7B7FSwapRef = useRef(false);

  // User Authentication & Session Unlocked state (Requirement 6: Login page first)
  const [isSessionUnlocked, setIsSessionUnlocked] = useState<boolean>(() => {
    try {
      return Boolean(sessionStorage.getItem('bsan_active_session_unlocked'));
    } catch {
      return false;
    }
  });

  // User Authentication & Guest Mode state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());
  const [isAccountSwitchOpen, setIsAccountSwitchOpen] = useState(false);

  // Security: Logout Confirmation & Session Inactivity Timeout states
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSessionTimeoutWarning, setShowSessionTimeoutWarning] = useState(false);
  const [sessionWarningSeconds, setSessionWarningSeconds] = useState(60);

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Reset database modal & toast state
  const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = useState(false);
  const [resetSuccessToast, setResetSuccessToast] = useState<string | null>(null);
  const [resetErrorToast, setResetErrorToast] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [preselectedStudentId, setPreselectedStudentId] = useState<string>('');
  
  const [activeSuratViolation, setActiveSuratViolation] = useState<ViolationRecord | null>(null);
  const [activeSuratStudent, setActiveSuratStudent] = useState<Student | null>(null);

  // Sharpened Individual Student Slip Detail Modal
  const [detailedSlipStudent, setDetailedSlipStudent] = useState<Student | null>(null);

  // Mobile Hardware Back Button Navigation Stack & Info Toast
  const viewHistoryRef = useRef<ViewMode[]>(['dashboard']);
  const [navInfoToast, setNavInfoToast] = useState<string | null>(null);
  const navToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNavToast = useCallback((msg: string) => {
    setNavInfoToast(msg);
    if (navToastTimerRef.current) clearTimeout(navToastTimerRef.current);
    navToastTimerRef.current = setTimeout(() => {
      setNavInfoToast(null);
    }, 2500);
  }, []);

  const navigateToView = useCallback((view: ViewMode) => {
    if (isGuestMode() && view !== 'dashboard') {
      setResetErrorToast('Akses Dibatasi: Mode Tamu hanya berhak melihat Dashboard.');
      setTimeout(() => setResetErrorToast(null), 4000);
      return;
    }
    setCurrentView((prev) => {
      if (prev !== view) {
        const nextHistory = [...viewHistoryRef.current, view];
        if (nextHistory.length > 30) {
          nextHistory.shift();
        }
        viewHistoryRef.current = nextHistory;
      }
      return view;
    });
    if (typeof window !== 'undefined') {
      if (!window.history.state || !window.history.state.bsanGuard) {
        window.history.pushState({ bsanGuard: true }, '', window.location.href);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Real-time synchronization across accounts & devices via Firestore onSnapshot
  useEffect(() => {
    let isInitialStudentSyncDone = false;
    let isInitialAccountSeedChecked = false;
    let isCancelled = false;

    const unsubStudents = subscribeToStudents((remoteStudents, meta) => {
      if (isCancelled) return;
      // Skip initial empty cache-only snapshot while waiting for real server response
      if (meta.fromCache && meta.empty) {
        return;
      }

      if (remoteStudents.length > 0) {
        isInitialStudentSyncDone = true;
        setStudents(remoteStudents);
        if (!meta.fromCache && !hasChecked7B7FSwapRef.current) {
          hasChecked7B7FSwapRef.current = true;
          swapClass7BAnd7FInFirestoreOnce()
            .then((res) => {
              if (!isCancelled && res.swappedStudents > 0) {
                setResetSuccessToast(`Database siswa kelas 7B dan 7F (${res.swappedStudents} data siswa) berhasil diperbaiki & disinkronkan.`);
                setTimeout(() => setResetSuccessToast(null), 6000);
                logAudit({
                  actionType: 'UPDATE',
                  module: 'Siswa',
                  description: `Perbaikan otomatis pertukaran kelas 7B ↔ 7F berhasil diterapkan pada ${res.swappedStudents} data siswa di cloud.`,
                  status: 'SUCCESS',
                });
              }
            })
            .catch(console.error);
        }
      } else if (!isInitialStudentSyncDone) {
        isInitialStudentSyncDone = true;
        // Verify directly on Firestore server whether DB was never initialized vs intentionally reset/empty
        Promise.all([getSystemMetaFromServer(), checkServerStudentsCount()])
          .then(([sysMeta, serverCount]) => {
            if (isCancelled) return;
            // Only seed INITIAL_STUDENTS if server is genuinely brand-new (no system_meta AND 0 server docs)
            if (sysMeta === null && serverCount === 0) {
              setStudents(sortByClassAndName(INITIAL_STUDENTS));
              bulkImportStudentsToFirestore(INITIAL_STUDENTS).catch(console.error);
              setSystemMeta({
                studentsInitialized: true,
                isCleanReset: false,
                class7B7FSwapFixV1: true,
                updatedAt: new Date().toISOString(),
              }).catch(console.error);
            } else if (serverCount === 0) {
              setStudents([]);
            }
          })
          .catch(console.error);
      } else {
        setStudents([]);
      }
    });

    const unsubViolations = subscribeToViolations((remoteViolations) => {
      if (!isCancelled) {
        setViolations(remoteViolations);
      }
    });

    const unsubWaLogs = subscribeToWaLogs((remoteLogs) => {
      if (!isCancelled) {
        setWaLogs(remoteLogs);
      }
    });

    const unsubConfig = subscribeToSchoolConfig((remoteConfig) => {
      if (!isCancelled) {
        setSchoolConfig((prev) => ({ ...prev, ...remoteConfig }));
      }
    });

    const handleLocalAttendanceSync = (e: Event) => {
      if (isCancelled) return;
      const customEvt = e as CustomEvent<AttendanceSheet[]>;
      if (Array.isArray(customEvt.detail)) {
        setAttendanceSheets(customEvt.detail);
      } else {
        setAttendanceSheets(getStoredAttendanceSheets());
      }
    };
    window.addEventListener('bsan_attendance_sheets_synced', handleLocalAttendanceSync);

    const unsubAttendance = subscribeToAttendanceSheets((remoteSheets) => {
      if (isCancelled) return;
      const sheets = remoteSheets || [];
      saveAttendanceSheetsLocalOnly(sheets);
      setAttendanceSheets(sheets);
      try {
        window.dispatchEvent(new CustomEvent('bsan_attendance_sheets_synced', { detail: sheets }));
      } catch {}
    });

    const unsubActivities = subscribeToActivities((remoteActivities) => {
      if (isCancelled) return;
      saveActivities(remoteActivities || []);
    });

    const unsubAccounts = subscribeToAccounts((remoteAccounts) => {
      if (isCancelled) return;
      if (remoteAccounts && remoteAccounts.length > 0) {
        const { accounts: merged, addedAdmin } = ensureAdminAccount(remoteAccounts);
        saveAccountsLocalOnly(merged);
        if (addedAdmin) {
          syncAccountToFirestore(ADMIN_ACCOUNT).catch(console.error);
        }
        try {
          window.dispatchEvent(new CustomEvent('bsan_accounts_changed', { detail: merged }));
        } catch {}
        setCurrentUser((prevUser) => {
          if (!prevUser) return prevUser;
          const refreshed = merged.find((a) => a.id === prevUser.id);
          return refreshed || prevUser;
        });
      } else if (!isInitialAccountSeedChecked) {
        isInitialAccountSeedChecked = true;
        getAccountDirectlyFromFirestore('usr-admin')
          .then((existingAdmin) => {
            if (isCancelled) return;
            if (!existingAdmin) {
              saveAccountsLocalOnly(DEFAULT_ACCOUNTS);
              bulkSyncAccountsToFirestore(DEFAULT_ACCOUNTS).catch(console.error);
            }
          })
          .catch(console.error);
      }
    });

    const unsubAuditLogs = subscribeToAuditLogs((remoteLogs, meta) => {
      if (isCancelled) return;
      if (meta.fromCache && meta.empty) return;
      saveAuditLogsLocalOnly(remoteLogs || []);
    });

    return () => {
      isCancelled = true;
      window.removeEventListener('bsan_attendance_sheets_synced', handleLocalAttendanceSync);
      unsubStudents();
      unsubViolations();
      unsubWaLogs();
      unsubConfig();
      unsubAttendance();
      unsubActivities();
      unsubAccounts();
      unsubAuditLogs();
    };
  }, []);

  // Derive date-aware today attendance for every student cleanly:
  // If no sheet exists for todayStr (e.g., midnight rollover to a new day), status returns to 'Hadir' automatically
  // while preserving all past days' attendance sheets intact in Firestore & recap.
  const effectiveStudents = useMemo(() => {
    return students.map((std) => {
      const eff = getEffectiveStudentAttendanceForDate(std, todayStr, attendanceSheets);
      return {
        ...std,
        statusKehadiran: eff.status,
        keteranganKehadiran: eff.keterangan,
        statusKehadiranDate: eff.isRecorded ? todayStr : undefined,
      };
    });
  }, [students, attendanceSheets, todayStr]);

  // Real-time synchronization of student violation counts from actual violations ledger
  useEffect(() => {
    setStudents((prev) => {
      if (!prev || prev.length === 0) return prev;
      let changed = false;
      const updated = prev.map((s) => {
        const studentV = (violations || []).filter(
          (v) =>
            v &&
            (v.studentId === s.id ||
              (s.nama &&
                s.kelas &&
                v.studentName?.trim().toLowerCase() === s.nama.trim().toLowerCase() &&
                v.kelas === s.kelas))
        );
        const rCount = studentV.filter((v) => v.tingkat === 'Ringan').length;
        const sCount = studentV.filter((v) => v.tingkat === 'Sedang').length;
        const bCount = studentV.filter((v) => v.tingkat === 'Berat').length;

        if (
          (s.totalPelanggaranRingan || 0) !== rCount ||
          (s.totalPelanggaranSedang || 0) !== sCount ||
          (s.totalPelanggaranBerat || 0) !== bCount
        ) {
          changed = true;
          return {
            ...s,
            totalPelanggaranRingan: rCount,
            totalPelanggaranSedang: sCount,
            totalPelanggaranBerat: bCount,
          };
        }
        return s;
      });

      if (changed) {
        saveStudents(updated);
        return updated;
      }
      return prev;
    });
  }, [violations, students.length]);

  // Security Auto-Lock / Session Inactivity Timeout (14 min active + 60s countdown warning)
  useEffect(() => {
    if (!currentUser || !isSessionUnlocked) return;

    let warnTimeoutId: any;
    let countdownIntervalId: any;
    const INACTIVITY_WARN_MS = 14 * 60 * 1000; // 14 minutes

    const startCountdown = () => {
      setShowSessionTimeoutWarning(true);
      setSessionWarningSeconds(60);

      countdownIntervalId = setInterval(() => {
        setSessionWarningSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalId);
            executeLogout('Sesi diakhiri otomatis karena tidak ada aktivitas selama 15 menit (Auto-Timeout Keamanan)');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const resetInactivityTimer = () => {
      if (showSessionTimeoutWarning) return;
      if (warnTimeoutId) clearTimeout(warnTimeoutId);
      if (countdownIntervalId) clearInterval(countdownIntervalId);
      warnTimeoutId = setTimeout(startCountdown, INACTIVITY_WARN_MS);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((ev) => window.addEventListener(ev, resetInactivityTimer, { passive: true }));
    warnTimeoutId = setTimeout(startCountdown, INACTIVITY_WARN_MS);

    return () => {
      if (warnTimeoutId) clearTimeout(warnTimeoutId);
      if (countdownIntervalId) clearInterval(countdownIntervalId);
      events.forEach((ev) => window.removeEventListener(ev, resetInactivityTimer));
    };
  }, [currentUser, isSessionUnlocked, showSessionTimeoutWarning]);

  // Sync to local storage
  useEffect(() => {
    saveStudents(students);
  }, [students]);

  useEffect(() => {
    saveViolations(violations);
  }, [violations]);

  useEffect(() => {
    saveWaLogs(waLogs);
  }, [waLogs]);

  useEffect(() => {
    saveSchoolConfig(schoolConfig);
  }, [schoolConfig]);

  // Handlers for students
  const handleAddStudent = (newStudent: Student) => {
    if (isGuestMode()) {
      alert('Akses Ditolak: Anda sedang dalam Mode Tamu (Guest - View Only). Hanya 55 akun petugas resmi yang berhak menambah siswa.');
      logAudit({
        actionType: 'BLOCKED',
        module: 'Siswa',
        description: `Percobaan tambah siswa (${newStudent.nama}) ditolak karena dalam Mode Tamu`,
        status: 'BLOCKED',
      });
      setIsAccountSwitchOpen(true);
      return;
    }

    setStudents((prev) => sortByClassAndName([newStudent, ...prev]));
    // Real-time sync to Firestore across all accounts and devices
    syncStudentToFirestore(newStudent).catch(console.error);
    setSystemMeta({
      studentsInitialized: true,
      isCleanReset: false,
      updatedAt: new Date().toISOString(),
    }).catch(console.error);

    logAudit({
      actionType: 'CREATE',
      module: 'Siswa',
      description: `Menambahkan siswa baru: ${newStudent.nama} (Kelas ${newStudent.kelas}, NISN: ${newStudent.nisn})`,
      status: 'SUCCESS',
    });
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    if (isGuestMode()) {
      setResetErrorToast('Akses Ditolak: Anda sedang dalam Mode Tamu (Guest - View Only). Hanya akun petugas resmi yang berhak mengedit biodata siswa.');
      setTimeout(() => setResetErrorToast(null), 5000);
      logAudit({
        actionType: 'BLOCKED',
        module: 'Siswa',
        description: `Percobaan edit biodata siswa (${updatedStudent.nama}) ditolak karena dalam Mode Tamu`,
        status: 'BLOCKED',
      });
      setIsAccountSwitchOpen(true);
      return;
    }

    setStudents((prev) =>
      sortByClassAndName(prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)))
    );
    // Real-time sync to Firestore
    syncStudentToFirestore(updatedStudent).catch(console.error);

    logAudit({
      actionType: 'UPDATE',
      module: 'Siswa',
      description: `Memperbarui biodata siswa: ${updatedStudent.nama} (Kelas ${updatedStudent.kelas})`,
      status: 'SUCCESS',
    });
  };

  const handleDeleteStudent = (studentId: string) => {
    if (isGuestMode()) {
      setResetErrorToast('Akses Ditolak: Anda sedang dalam Mode Tamu (Guest - View Only). Hanya akun petugas resmi yang berhak menghapus data.');
      setTimeout(() => setResetErrorToast(null), 5000);
      logAudit({
        actionType: 'BLOCKED',
        module: 'Siswa',
        description: `Percobaan hapus siswa ID #${studentId} ditolak karena dalam Mode Tamu`,
        status: 'BLOCKED',
      });
      setIsAccountSwitchOpen(true);
      return;
    }

    const target = students.find((s) => s.id === studentId);
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    // Real-time delete from Firestore
    deleteStudentFromFirestore(studentId).catch(console.error);

    logAudit({
      actionType: 'DELETE',
      module: 'Siswa',
      description: `Menghapus data siswa: ${target?.nama || studentId} (Kelas ${target?.kelas || '-'})`,
      status: 'SUCCESS',
    });
  };

  const handleBulkImportStudents = async (newStudents: Student[], mode: 'merge' | 'replace' = 'merge') => {
    if (isGuestMode()) {
      setResetErrorToast('Akses Ditolak: Anda sedang dalam Mode Tamu. Hanya akun petugas resmi yang berhak mengupload database murid.');
      setTimeout(() => setResetErrorToast(null), 5000);
      logAudit({
        actionType: 'BLOCKED',
        module: 'Siswa',
        description: 'Percobaan upload database murid ditolak karena dalam Mode Tamu',
        status: 'BLOCKED',
      });
      setIsAccountSwitchOpen(true);
      return;
    }

    if (!isAdminUser(currentUser)) {
      setResetErrorToast('Akses Ditolak: Fitur Upload Database Murid hanya tersedia untuk akun Administrator (admin).');
      setTimeout(() => setResetErrorToast(null), 5000);
      logAudit({
        actionType: 'BLOCKED',
        module: 'Siswa',
        description: 'Percobaan upload database murid ditolak karena bukan akun admin',
        status: 'BLOCKED',
      });
      return;
    }

    try {
      if (mode === 'replace') {
        const sorted = sortByClassAndName(newStudents);
        setStudents(sorted);
        saveStudents(sorted);
        await replaceAllStudentsInFirestore(sorted);
        await setSystemMeta({
          studentsInitialized: true,
          isCleanReset: false,
          class7B7FSwapFixV1: true,
          updatedAt: new Date().toISOString(),
        });

        logAudit({
          actionType: 'UPDATE',
          module: 'Siswa',
          description: `Upload Database Murid (Sesuai Persis Isi File): ${sorted.length} murid berhasil disimpan`,
          status: 'SUCCESS',
        });

        setResetSuccessToast(`Database murid berhasil diperbarui sesuai isi file (${sorted.length} murid).`);
        setTimeout(() => setResetSuccessToast(null), 5000);
      } else {
        setStudents((prev) => {
          const existingMap = new Map<string, Student>();
          prev.forEach((s) => existingMap.set(s.id, s));
          newStudents.forEach((ns) => {
            existingMap.set(ns.id, ns);
          });
          const mergedSorted = sortByClassAndName(Array.from(existingMap.values()));
          saveStudents(mergedSorted);
          return mergedSorted;
        });
        await bulkImportStudentsToFirestore(newStudents);
        await setSystemMeta({
          studentsInitialized: true,
          isCleanReset: false,
          class7B7FSwapFixV1: true,
          updatedAt: new Date().toISOString(),
        });

        logAudit({
          actionType: 'CREATE',
          module: 'Siswa',
          description: `Upload Database Murid (Tambah & Perbarui): ${newStudents.length} murid berhasil diproses`,
          status: 'SUCCESS',
        });

        setResetSuccessToast(`${newStudents.length} data murid berhasil ditambahkan/diperbarui ke database.`);
        setTimeout(() => setResetSuccessToast(null), 5000);
      }
    } catch (err) {
      console.error('Upload database murid error:', err);
      setResetErrorToast('Gagal menyimpan database murid ke server. Silakan periksa koneksi dan coba lagi.');
      setTimeout(() => setResetErrorToast(null), 5000);
      throw err;
    }
  };

  // Handlers for violations
  const handleSaveViolation = (newViolation: ViolationRecord) => {
    if (isGuestMode()) {
      setResetErrorToast('Akses Ditolak: Mode Tamu hanya berhak membaca data. Silakan login dengan akun petugas resmi untuk mencatat pelanggaran.');
      setTimeout(() => setResetErrorToast(null), 5000);
      logAudit({
        actionType: 'BLOCKED',
        module: 'Pelanggaran',
        description: `Percobaan pencatatan pelanggaran (${newViolation.studentName}) ditolak karena dalam Mode Tamu`,
        status: 'BLOCKED',
      });
      setIsAccountSwitchOpen(true);
      return;
    }

    setViolations((prev) => {
      const next = [newViolation, ...prev.filter((v) => v.id !== newViolation.id)];
      saveViolations(next);
      return next;
    });
    // Real-time sync violation to Firestore
    syncViolationToFirestore(newViolation).catch(console.error);

    const target = students.find(
      (s) =>
        s.id === newViolation.studentId ||
        (s.nama?.trim().toLowerCase() === newViolation.studentName?.trim().toLowerCase() && s.kelas === newViolation.kelas)
    );

    let updatedTargetStudent: Student | null = null;
    if (target) {
      const isRingan = newViolation.tingkat === 'Ringan' ? 1 : 0;
      const isSedang = newViolation.tingkat === 'Sedang' ? 1 : 0;
      const isBerat = newViolation.tingkat === 'Berat' ? 1 : 0;

      updatedTargetStudent = {
        ...target,
        totalPoinPelanggaran: (target.totalPoinPelanggaran || 0) + (newViolation.poin || 0),
        totalPelanggaranRingan: (target.totalPelanggaranRingan || 0) + isRingan,
        totalPelanggaranSedang: (target.totalPelanggaranSedang || 0) + isSedang,
        totalPelanggaranBerat: (target.totalPelanggaranBerat || 0) + isBerat,
      };
    }

    setStudents((prev) => {
      const updated = prev.map((s) => {
        if (
          s.id === newViolation.studentId ||
          (s.nama?.trim().toLowerCase() === newViolation.studentName?.trim().toLowerCase() && s.kelas === newViolation.kelas)
        ) {
          return updatedTargetStudent || s;
        }
        return s;
      });
      saveStudents(updated);
      return updated;
    });

    if (updatedTargetStudent) {
      const studentObj: Student = updatedTargetStudent;
      // Update ONLY violation counters on Firestore so concurrent name/attendance edits are never overwritten
      updateStudentFieldsInFirestore(studentObj.id, {
        totalPoinPelanggaran: studentObj.totalPoinPelanggaran,
        totalPelanggaranRingan: studentObj.totalPelanggaranRingan,
        totalPelanggaranSedang: studentObj.totalPelanggaranSedang,
        totalPelanggaranBerat: studentObj.totalPelanggaranBerat,
      }).catch(console.error);
      if (detailedSlipStudent && (detailedSlipStudent.id === studentObj.id || detailedSlipStudent.nama?.trim().toLowerCase() === studentObj.nama?.trim().toLowerCase())) {
        setDetailedSlipStudent(studentObj);
      }
    }

    logAudit({
      actionType: 'CREATE',
      module: 'Pelanggaran',
      description: `Pencatatan pelanggaran ${newViolation.tingkat}: ${newViolation.studentName} (Kelas ${newViolation.kelas}) - ${newViolation.kodePasal} ${newViolation.pasalTitle}`,
      details: `Uraian: ${newViolation.uraian} · Pencatat: ${newViolation.guruPencatat} · Tahap: ${newViolation.tahapPembinaan}`,
      status: 'SUCCESS',
    });

    const targetStudent = students.find((s) => s.id === newViolation.studentId);
    if (targetStudent) {
      setActiveSuratViolation(newViolation);
      setActiveSuratStudent(targetStudent);
    }

    // Requirement 5: Automatically generate WhatsApp Gateway log with customized message by level & type
    const resolvedStudent: Student = targetStudent || {
      id: newViolation.studentId,
      nama: newViolation.studentName,
      kelas: newViolation.kelas,
      nisn: '-',
      jenjang: 7,
      gender: 'L',
      noHpSiswa: '-',
      namaOrtu: newViolation.namaOrtu || 'Orang Tua / Wali',
      noWaOrtu: newViolation.noWaOrtu || '-',
      alamat: '-',
      statusKehadiran: 'Hadir',
      totalPelanggaranRingan: 0,
      totalPelanggaranSedang: 0,
      totalPelanggaranBerat: 0,
    };

    const waText = generateViolationMessage(resolvedStudent, newViolation);
    const nowStr = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date()) + ' WIB';

    const autoWaLog: WhatsAppMessageLog = {
      id: `walog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentId: newViolation.studentId,
      studentName: newViolation.studentName,
      kelas: newViolation.kelas,
      recipientName: resolvedStudent.namaOrtu || newViolation.namaOrtu || 'Orang Tua / Wali',
      recipientPhone: resolvedStudent.noWaOrtu || newViolation.noWaOrtu || '',
      category: newViolation.tingkat === 'Berat' ? 'Panggilan Ortu' : 'Pelanggaran',
      message: waText,
      timestamp: nowStr,
      status: 'Antrian',
      triggerType: 'Otomatis',
    };

    setWaLogs((prev) => [autoWaLog, ...prev]);
    syncWaLogToFirestore(autoWaLog).catch(console.error);
  };

  const handleUpdateViolationStatus = (
    violationId: string,
    newStatus: 'Draft' | 'Diterbitkan' | 'Selesai'
  ) => {
    if (isGuestMode()) {
      alert('Akses Ditolak: Mode Tamu tidak berhak mengubah status pelanggaran.');
      logAudit({
        actionType: 'BLOCKED',
        module: 'Pelanggaran',
        description: `Percobaan ubah status pelanggaran #${violationId} ditolak (Mode Tamu)`,
        status: 'BLOCKED',
      });
      setIsAccountSwitchOpen(true);
      return;
    }

    const targetV = violations.find((v) => v.id === violationId);
    if (targetV) {
      const updated = { ...targetV, statusSurat: newStatus };
      syncViolationToFirestore(updated).catch(console.error);
    }

    setViolations((prev) =>
      prev.map((v) => (v.id === violationId ? { ...v, statusSurat: newStatus } : v))
    );

    logAudit({
      actionType: 'UPDATE',
      module: 'Pelanggaran',
      description: `Pembaruan status dokumen pelanggaran ${targetV?.studentName || violationId}: status diubah menjadi "${newStatus}"`,
      status: 'SUCCESS',
    });
  };

  // Open Surat Modal
  const handleOpenSuratModal = (violation: ViolationRecord) => {
    const student = students.find((s) => s.id === violation.studentId);
    if (student) {
      setActiveSuratViolation(violation);
      setActiveSuratStudent(student);
    }
  };

  // Delete individual violation manually
  const handleDeleteViolation = (violationId: string) => {
    if (isGuestMode()) {
      setResetErrorToast('Akses Ditolak: Anda sedang dalam Mode Tamu. Hanya akun petugas resmi yang berwenang menghapus catatan pelanggaran.');
      setTimeout(() => setResetErrorToast(null), 5000);
      setIsAccountSwitchOpen(true);
      return;
    }

    const targetV = violations.find((v) => v.id === violationId);
    if (!targetV) return;

    setViolations((prev) => {
      const next = prev.filter((v) => v.id !== violationId);
      saveViolations(next);
      return next;
    });
    // Real-time delete violation from Firestore
    deleteViolationFromFirestore(violationId).catch(console.error);

    const target = students.find(
      (s) =>
        s.id === targetV.studentId || 
        (s.nama?.trim().toLowerCase() === targetV.studentName?.trim().toLowerCase() && s.kelas === targetV.kelas)
    );

    let updatedTargetStudent: Student | null = null;
    if (target) {
      const isRingan = targetV.tingkat === 'Ringan' ? 1 : 0;
      const isSedang = targetV.tingkat === 'Sedang' ? 1 : 0;
      const isBerat = targetV.tingkat === 'Berat' ? 1 : 0;

      updatedTargetStudent = {
        ...target,
        totalPoinPelanggaran: Math.max(0, (target.totalPoinPelanggaran || 0) - (targetV.poin || 0)),
        totalPelanggaranRingan: Math.max(0, (target.totalPelanggaranRingan || 0) - isRingan),
        totalPelanggaranSedang: Math.max(0, (target.totalPelanggaranSedang || 0) - isSedang),
        totalPelanggaranBerat: Math.max(0, (target.totalPelanggaranBerat || 0) - isBerat),
      };
    }

    setStudents((prev) => {
      const updated = prev.map((s) => {
        if (
          s.id === targetV.studentId || 
          (s.nama?.trim().toLowerCase() === targetV.studentName?.trim().toLowerCase() && s.kelas === targetV.kelas)
        ) {
          return updatedTargetStudent || s;
        }
        return s;
      });
      saveStudents(updated);
      return updated;
    });

    if (updatedTargetStudent) {
      const studentObj: Student = updatedTargetStudent;
      updateStudentFieldsInFirestore(studentObj.id, {
        totalPoinPelanggaran: studentObj.totalPoinPelanggaran,
        totalPelanggaranRingan: studentObj.totalPelanggaranRingan,
        totalPelanggaranSedang: studentObj.totalPelanggaranSedang,
        totalPelanggaranBerat: studentObj.totalPelanggaranBerat,
      }).catch(console.error);
      if (detailedSlipStudent && (detailedSlipStudent.id === studentObj.id || detailedSlipStudent.nama?.trim().toLowerCase() === studentObj.nama?.trim().toLowerCase())) {
        setDetailedSlipStudent(studentObj);
      }
    }

    logAudit({
      actionType: 'DELETE',
      module: 'Pelanggaran',
      description: `Menghapus pelanggaran ${targetV.tingkat}: ${targetV.studentName} (Kelas ${targetV.kelas}) - ${targetV.kodePasal}`,
      status: 'SUCCESS',
    });

    setResetSuccessToast(`Catatan pelanggaran ${targetV.studentName} berhasil dihapus.`);
    setTimeout(() => setResetSuccessToast(null), 4000);
  };

  // Clear all violations manually (Admin only)
  const handleClearAllViolations = () => {
    if (!isAdminUser(currentUser)) {
      setResetErrorToast('Akses Ditolak: Hanya akun Administrator (admin) yang berhak mengosongkan seluruh catatan pelanggaran.');
      setTimeout(() => setResetErrorToast(null), 5000);
      logAudit({
        actionType: 'BLOCKED',
        module: 'Pelanggaran',
        description: 'Percobaan mengosongkan seluruh buku pelanggaran ditolak karena bukan akun admin.',
        status: 'BLOCKED',
      });
      return;
    }

    setViolations([]);
    saveViolations([]);
    clearCollectionFromFirestore('violations').catch(console.error);

    const cleanedStudents = students.map((s) => ({
      ...s,
      totalPelanggaranRingan: 0,
      totalPelanggaranSedang: 0,
      totalPelanggaranBerat: 0,
      totalPoinPelanggaran: 0,
    }));
    setStudents(cleanedStudents);
    saveStudents(cleanedStudents);
    batchResetStudentViolationCountersInFirestore(students.map((s) => s.id)).catch(console.error);

    logAudit({
      actionType: 'DELETE',
      module: 'Pelanggaran',
      description: 'Mengosongkan seluruh buku catatan pelanggaran secara manual oleh Administrator.',
      status: 'SUCCESS',
    });

    setResetSuccessToast('Seluruh buku catatan pelanggaran berhasil dikosongkan!');
    setTimeout(() => setResetSuccessToast(null), 4000);
  };

  // Add WhatsApp Log
  const handleAddWaLog = (newLog: WhatsAppMessageLog) => {
    if (isGuestMode()) {
      setResetErrorToast('Akses Ditolak: Mode Tamu tidak berhak mencatat riwayat WhatsApp.');
      setTimeout(() => setResetErrorToast(null), 4000);
      return;
    }

    setWaLogs((prev) => [newLog, ...prev]);
    // Real-time sync to Firestore
    syncWaLogToFirestore(newLog).catch(console.error);

    logAudit({
      actionType: 'CREATE',
      module: 'WhatsApp',
      description: `Pengiriman pesan WhatsApp (${newLog.category}) ke ${newLog.recipientName} (${newLog.recipientPhone})`,
      status: 'SUCCESS',
    });
  };

  // Delete individual WhatsApp Log
  const handleDeleteWaLog = (logId: string) => {
    if (isGuestMode()) {
      setResetErrorToast('Akses Ditolak: Mode Tamu tidak berhak menghapus riwayat pesan.');
      setTimeout(() => setResetErrorToast(null), 4000);
      return;
    }
    setWaLogs((prev) => prev.filter((l) => l.id !== logId));
    deleteWaLogFromFirestore(logId).catch(console.error);
    setResetSuccessToast('Riwayat pesan WhatsApp berhasil dihapus.');
    setTimeout(() => setResetSuccessToast(null), 3000);
  };

  // Update existing WhatsApp Log (Edit / Status change to Terkirim)
  const handleUpdateWaLog = (updatedLog: WhatsAppMessageLog) => {
    if (isGuestMode()) {
      setResetErrorToast('Akses Ditolak: Mode Tamu tidak berhak mengubah riwayat pesan.');
      setTimeout(() => setResetErrorToast(null), 4000);
      return;
    }
    setWaLogs((prev) => prev.map((l) => (l.id === updatedLog.id ? updatedLog : l)));
    syncWaLogToFirestore(updatedLog).catch(console.error);
    setResetSuccessToast('Riwayat pesan WhatsApp berhasil diperbarui.');
    setTimeout(() => setResetSuccessToast(null), 3000);
  };

  // Clear all WhatsApp Logs
  const handleClearAllWaLogs = () => {
    if (isGuestMode()) {
      setResetErrorToast('Akses Ditolak: Mode Tamu tidak berhak mengosongkan riwayat pesan.');
      setTimeout(() => setResetErrorToast(null), 4000);
      return;
    }
    waLogs.forEach((l) => deleteWaLogFromFirestore(l.id).catch(console.error));
    setWaLogs([]);
    setResetSuccessToast('Seluruh riwayat pesan WhatsApp berhasil dibersihkan.');
    setTimeout(() => setResetSuccessToast(null), 3000);
  };

  // Quick Violation modal trigger
  const handleTriggerQuickViolation = (studentId?: string) => {
    if (isGuestMode()) {
      setResetErrorToast('Akses Ditolak: Anda saat ini berada dalam Mode Tamu (Guest - View Only). Mode Tamu hanya berhak membuka dan melihat menu. Silakan login ke salah satu dari 55 akun petugas untuk mencatat pelanggaran.');
      setTimeout(() => setResetErrorToast(null), 6000);
      logAudit({
        actionType: 'BLOCKED',
        module: 'Pelanggaran',
        description: 'Mencoba membuka form catat pelanggaran ditolak karena pengguna berada dalam Mode Tamu',
        status: 'BLOCKED',
      });
      setIsAccountSwitchOpen(true);
      return;
    }
    setPreselectedStudentId(studentId || '');
    setIsRecordModalOpen(true);
  };

  // Settings update
  const handleUpdateSchoolConfig = (newConfig: SchoolProfile) => {
    setSchoolConfig(newConfig);
    syncSchoolConfigToFirestore(newConfig).catch(console.error);
  };

  // Trigger Reset Data with In-App Confirmation Modal (STRICTLY ADMIN ONLY)
  const handleTriggerResetData = () => {
    if (!isAdminUser(currentUser)) {
      setResetErrorToast('Akses Ditolak: Fitur Reset Data hanya tersedia khusus untuk akun Administrator (admin) demi keamanan database.');
      setTimeout(() => setResetErrorToast(null), 6000);
      logAudit({
        actionType: 'BLOCKED',
        module: 'Sistem',
        description: `Percobaan membuka menu Reset Data ditolak untuk akun ${currentUser?.name || 'Tamu'}`,
        status: 'BLOCKED',
      });
      return;
    }
    setIsResetConfirmModalOpen(true);
  };

  // Perform full database reset (STRICTLY ADMIN ONLY)
  const handleConfirmResetData = async () => {
    if (!isAdminUser(currentUser)) {
      setIsResetConfirmModalOpen(false);
      setResetErrorToast('Akses Ditolak: Hanya akun Administrator (admin) yang berwenang melakukan reset database.');
      setTimeout(() => setResetErrorToast(null), 5000);
      return;
    }
    try {
      const reset = resetToDefaultData();
      saveAttendanceSheetsLocalOnly([]);
      
      setStudents(reset.students);
      setViolations(reset.violations);
      setWaLogs(reset.logs);
      setSchoolConfig(reset.config);

      try {
        window.dispatchEvent(new CustomEvent('bsan_attendance_sheets_synced', { detail: [] }));
      } catch {}

      // Wipe Firestore cleanly with chunked batches and mark system_meta.isCleanReset = true
      await clearAllFirestoreData();

      logAudit({
        actionType: 'RESET',
        module: 'Sistem',
        description: 'Administrator mereset database & data contoh: Seluruh data siswa, presensi, pelanggaran, dan riwayat dibersihkan total (0 siswa, 0 kasus, presensi bersih).',
        status: 'SUCCESS',
      });

      setIsResetConfirmModalOpen(false);
      setResetSuccessToast('Database berhasil direset total oleh Admin! Seluruh perangkat telah tersinkronisasi bersih.');
      setTimeout(() => setResetSuccessToast(null), 5000);
    } catch (err) {
      console.error('Reset error:', err);
      setResetErrorToast('Terjadi kesalahan saat mereset database.');
      setTimeout(() => setResetErrorToast(null), 5000);
    }
  };

  // Keep latest state ref for hardware Back button handler (popstate)
  const latestNavStateRef = useRef({
    isSessionUnlocked,
    currentView,
    isMobileSidebarOpen,
    isAccountSwitchOpen,
    isRecordModalOpen,
    activeSuratViolation,
    detailedSlipStudent,
    isResetConfirmModalOpen,
    showLogoutConfirm,
    showSessionTimeoutWarning,
  });

  useEffect(() => {
    latestNavStateRef.current = {
      isSessionUnlocked,
      currentView,
      isMobileSidebarOpen,
      isAccountSwitchOpen,
      isRecordModalOpen,
      activeSuratViolation,
      detailedSlipStudent,
      isResetConfirmModalOpen,
      showLogoutConfirm,
      showSessionTimeoutWarning,
    };
  }, [
    isSessionUnlocked,
    currentView,
    isMobileSidebarOpen,
    isAccountSwitchOpen,
    isRecordModalOpen,
    activeSuratViolation,
    detailedSlipStudent,
    isResetConfirmModalOpen,
    showLogoutConfirm,
    showSessionTimeoutWarning,
  ]);

  // Mobile / Browser Hardware Back Button Handler (prevents exiting app; closes modals or goes to previous page)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ensureHistoryGuard = () => {
      try {
        if (!window.history.state || !window.history.state.bsanGuard) {
          window.history.replaceState({ bsanRoot: true }, '', window.location.href);
          window.history.pushState({ bsanGuard: true }, '', window.location.href);
        }
      } catch {
        // Ignore SecurityError in restricted environments
      }
    };

    ensureHistoryGuard();

    const handlePopState = () => {
      // Immediately re-arm history guard so pressing Back never exits the application
      try {
        window.history.pushState({ bsanGuard: true }, '', window.location.href);
      } catch {
        // Ignore
      }

      const s = latestNavStateRef.current;

      // On LoginPage: allow any child dialog to close, otherwise remain on LoginPage
      if (!s.isSessionUnlocked) {
        window.dispatchEvent(new CustomEvent('bsan_hardware_back', { cancelable: true }));
        return;
      }

      // Do not dismiss security timeout countdown via back button
      if (s.showSessionTimeoutWarning) {
        return;
      }

      // Priority 1: Close topmost open App-level modal or mobile drawer
      if (s.showLogoutConfirm) {
        setShowLogoutConfirm(false);
        return;
      }
      if (s.isResetConfirmModalOpen) {
        setIsResetConfirmModalOpen(false);
        return;
      }
      if (s.activeSuratViolation) {
        setActiveSuratViolation(null);
        setActiveSuratStudent(null);
        return;
      }
      if (s.isRecordModalOpen) {
        setIsRecordModalOpen(false);
        setPreselectedStudentId('');
        return;
      }
      if (s.detailedSlipStudent) {
        setDetailedSlipStudent(null);
        return;
      }
      if (s.isAccountSwitchOpen) {
        setIsAccountSwitchOpen(false);
        return;
      }
      if (s.isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
        return;
      }

      // Priority 2: Allow active child view modals/panels to intercept Back press first
      const backEvent = new CustomEvent('bsan_hardware_back', { cancelable: true });
      window.dispatchEvent(backEvent);
      if (backEvent.defaultPrevented) {
        return;
      }

      // Priority 3: Navigate back to previous page in view history stack
      if (viewHistoryRef.current.length > 1) {
        viewHistoryRef.current.pop();
        const prevView = viewHistoryRef.current[viewHistoryRef.current.length - 1];
        setCurrentView(prevView);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Priority 4: Fallback to Dashboard if not already there
      if (s.currentView !== 'dashboard') {
        viewHistoryRef.current = ['dashboard'];
        setCurrentView('dashboard');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Priority 5: Already at home (Dashboard) — prevent exit & inform user
      showNavToast('Anda berada di halaman utama (Dashboard).');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showNavToast]);

  // Guard: In guest mode, force view to stay on dashboard (Requirement 3)
  useEffect(() => {
    if (isGuestMode() && currentView !== 'dashboard') {
      viewHistoryRef.current = ['dashboard'];
      setCurrentView('dashboard');
    }
  }, [currentUser, currentView]);

  const requestLogout = () => {
    setShowLogoutConfirm(true);
  };

  const executeLogout = (reason: string = 'Pengguna melakukan logout') => {
    setShowLogoutConfirm(false);
    setShowSessionTimeoutWarning(false);
    sessionStorage.removeItem('bsan_active_session_unlocked');
    setCurrentUserId('guest');
    setCurrentUser(null);
    setIsSessionUnlocked(false);
    viewHistoryRef.current = ['dashboard'];
    setCurrentView('dashboard');
    logAudit({
      actionType: 'LOGOUT',
      module: 'Autentikasi',
      description: reason,
      status: 'SUCCESS',
    });
  };

  const handleLogout = () => {
    requestLogout();
  };

  // Requirement 6: First view when opening the link/url is the dedicated Login Page
  if (!isSessionUnlocked) {
    return (
      <LoginPage
        schoolConfig={schoolConfig}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsSessionUnlocked(true);
          viewHistoryRef.current = ['dashboard'];
          setCurrentView('dashboard');
          try {
            if (!window.history.state || !window.history.state.bsanGuard) {
              window.history.pushState({ bsanGuard: true }, '', window.location.href);
            }
          } catch {}
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-[#EEF2F8] text-slate-800 relative">
      {/* Toast Notifications */}
      {resetSuccessToast && (
        <div className="fixed top-5 right-5 z-[999] max-w-md bg-[#3B5BDB] text-white px-5 py-4 rounded-xl shadow-2xl flex items-start gap-3 border border-blue-400/30 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-100" />
          <div className="flex-1 text-sm font-medium leading-relaxed">
            {resetSuccessToast}
          </div>
          <button 
            onClick={() => setResetSuccessToast(null)} 
            className="text-blue-200 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {resetErrorToast && (
        <div className="fixed top-5 right-5 z-[999] max-w-md bg-rose-600 text-white px-5 py-4 rounded-xl shadow-2xl flex items-start gap-3 border border-rose-400/30 animate-in fade-in slide-in-from-top-4">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-rose-100" />
          <div className="flex-1 text-sm font-medium leading-relaxed">
            {resetErrorToast}
          </div>
          <button 
            onClick={() => setResetErrorToast(null)} 
            className="text-rose-200 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {navInfoToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[999] bg-slate-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-full shadow-xl text-xs font-semibold border border-white/15 animate-in fade-in slide-in-from-bottom-3 whitespace-nowrap">
          {navInfoToast}
        </div>
      )}

      {/* Sidebar Navigation (with Mobile Drawer support & Royal Blue Theme) */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => {
          navigateToView(view);
          setIsMobileSidebarOpen(false);
        }}
        activeViolationsCount={violations.filter((v) => v.tanggal === todayStr && v.statusSurat !== 'Selesai').length}
        pendingWaCount={effectiveStudents.filter((s) => s.statusKehadiran !== 'Hadir').length}
        schoolConfig={schoolConfig}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenAccountSwitch={handleLogout}
        isGuest={isGuestMode()}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full min-h-screen relative">
        {/* Top Header with Mobile Hamburger, Account Switcher & Mode Tamu Indicator */}
        <Header
          currentView={currentView}
          currentUser={currentUser}
          onOpenQuickViolation={() => handleTriggerQuickViolation()}
          onOpenAccountSwitch={() => setIsAccountSwitchOpen(true)}
          onSearchGlobal={(q) => setSearchQuery(q)}
          searchQuery={searchQuery}
          schoolConfig={schoolConfig}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          onNavigate={(view) => navigateToView(view)}
        />

        {/* Viewport Content with clean mobile padding & responsive spacing */}
        <main className="flex-1 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6">
          {currentView === 'dashboard' && (
            <ExecutiveDashboard
              students={effectiveStudents}
              violations={violations}
              schoolConfig={schoolConfig}
              onNavigate={(view) => navigateToView(view)}
              onOpenQuickViolation={() => handleTriggerQuickViolation()}
              onSelectStudentProfile={(student) => {
                setDetailedSlipStudent(student);
              }}
            />
          )}

          {currentView === 'students' && (
            <StudentCentralHub
              students={effectiveStudents}
              currentUser={currentUser}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onBulkImport={handleBulkImportStudents}
              onOpenRecordViolation={(studentId) => handleTriggerQuickViolation(studentId)}
              onSelectStudentProfile={(student) => setDetailedSlipStudent(student)}
            />
          )}

          {currentView === 'attendance' && (
            <AttendanceManagerView
              students={effectiveStudents}
              schoolConfig={schoolConfig}
              onUpdateStudentsAttendance={(updated, changedOnly) => {
                // Only update attendance fields for the affected students so concurrent edits
                // to student names, imports, or violation counters in other classes are NEVER overwritten
                const affectedList = changedOnly && changedOnly.length > 0 ? changedOnly : updated;
                const affectedMap = new Map(affectedList.map((s) => [s.id, s]));

                setStudents((prev) => {
                  const next = prev.map((std) => {
                    const match = affectedMap.get(std.id);
                    if (!match) return std;
                    return {
                      ...std,
                      statusKehadiran: match.statusKehadiran,
                      statusKehadiranDate: match.statusKehadiranDate || todayStr,
                      keteranganKehadiran: match.keteranganKehadiran || '',
                    };
                  });
                  saveStudents(next);
                  return next;
                });

                batchUpdateStudentsAttendanceInFirestore(
                  affectedList.map((s) => ({
                    id: s.id,
                    statusKehadiran: s.statusKehadiran,
                    statusKehadiranDate: s.statusKehadiranDate || todayStr,
                    keteranganKehadiran: s.keteranganKehadiran || '',
                  }))
                ).catch(console.error);

                if (detailedSlipStudent) {
                  const refreshed = affectedMap.get(detailedSlipStudent.id);
                  if (refreshed) {
                    setDetailedSlipStudent((prev) =>
                      prev
                        ? {
                            ...prev,
                            statusKehadiran: refreshed.statusKehadiran,
                            statusKehadiranDate: refreshed.statusKehadiranDate || todayStr,
                            keteranganKehadiran: refreshed.keteranganKehadiran || '',
                          }
                        : null
                    );
                  }
                }
              }}
              onOpenAccountSwitchModal={() => setIsAccountSwitchOpen(true)}
            />
          )}

          {currentView === 'violations' && (
            <ViolationsManager
              violations={violations}
              students={effectiveStudents}
              schoolConfig={schoolConfig}
              onOpenRecordModal={() => handleTriggerQuickViolation()}
              onOpenSuratModal={handleOpenSuratModal}
              onUpdateViolationStatus={handleUpdateViolationStatus}
              onDeleteViolation={handleDeleteViolation}
              onClearAllViolations={handleClearAllViolations}
            />
          )}

          {currentView === 'tatatertib' && (
            <TataTertibDocView
              schoolConfig={schoolConfig}
              onSelectRuleForStudent={(ruleId) => handleTriggerQuickViolation()}
            />
          )}

          {currentView === 'whatsapp' && (
            <WhatsAppGateway
              students={effectiveStudents}
              violations={violations}
              waLogs={waLogs}
              schoolConfig={schoolConfig}
              onAddLog={handleAddWaLog}
              onUpdateLog={handleUpdateWaLog}
              onDeleteLog={handleDeleteWaLog}
              onClearAllLogs={handleClearAllWaLogs}
            />
          )}


          {currentView === 'reports' && (
            <ComprehensiveReports
              students={effectiveStudents}
              violations={violations}
              schoolConfig={schoolConfig}
            />
          )}

          {currentView === 'settings' && (
            <SchoolSettingsView
              schoolConfig={schoolConfig}
              students={effectiveStudents}
              violations={violations}
              currentUser={currentUser}
              onUpdateSchoolConfig={handleUpdateSchoolConfig}
              onResetData={isAdminUser(currentUser) ? handleTriggerResetData : undefined}
              onUserUpdated={(updatedUser) => setCurrentUser(updatedUser)}
              onPullDataFromSheets={(newStudents, newViolations, partialConfig) => {
                if (isGuestMode()) {
                  setResetErrorToast('Akses Ditolak: Mode Tamu tidak berhak memuat atau menimpa data.');
                  setTimeout(() => setResetErrorToast(null), 5000);
                  return;
                }
                if (newStudents && newStudents.length > 0) setStudents(sortByClassAndName(newStudents));
                if (newViolations && newViolations.length > 0) setViolations(newViolations);
                if (partialConfig) setSchoolConfig((prev) => ({ ...prev, ...partialConfig }));
                logAudit({
                  actionType: 'SYNC',
                  module: 'Pengaturan',
                  description: `Memuat & menimpa data dari Google Sheets (${newStudents?.length || 0} siswa)`,
                  status: 'SUCCESS',
                });
              }}
            />
          )}
        </main>

        {/* Footer Matching Professional Standards */}
        <footer className="no-print mt-auto py-3.5 px-6 lg:px-8 border-t border-slate-200/90 bg-white text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-center sm:text-left flex-wrap">
            <span className="font-semibold text-slate-700">BSAN Enterprise Edition</span>
            <span>·</span>
            <span>© {schoolConfig.footerYear || '2026'} {schoolConfig.name || 'SMPN 1 Kandangan'}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Penyimpanan Terproteksi & Terenkripsi
            </span>
            {isAdminUser(currentUser) && (
              <>
                <span>·</span>
                <button
                  onClick={handleTriggerResetData}
                  className="text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
                  title="Kembalikan data contoh awal ke kondisi clean dan bersih (Khusus Admin)"
                >
                  <RotateCcw className="w-3 h-3 text-rose-500" />
                  <span>Reset Data</span>
                </button>
              </>
            )}
          </div>

          <div className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            v2.5.0 Enterprise
          </div>
        </footer>
      </div>

      {/* Floating Strip 3 Navigation Button - Mengikuti Arah Scroll (Akses Cepat & Efektif) */}
      <button
        type="button"
        onClick={() => setIsMobileSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 left-5 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#3B5BDB] hover:from-[#2F4CB7] hover:to-[#1E3A8A] text-white shadow-2xl shadow-blue-950/40 border border-white/30 active:scale-95 transition-all cursor-pointer backdrop-blur-md group animate-fade-in"
        title="Buka Menu Utama Navigasi (Garis 3)"
        aria-label="Buka Menu Utama Navigasi"
      >
        <Menu className="w-5 h-5 text-white stroke-[2.5]" />
        <span className="text-xs font-bold tracking-wide">Menu Utama</span>
      </button>

      {/* Record Violation Modal */}
      <RecordViolationModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setPreselectedStudentId('');
        }}
        students={effectiveStudents}
        preselectedStudentId={preselectedStudentId}
        onSaveViolation={handleSaveViolation}
        onOpenSurat={(v) => handleOpenSuratModal(v)}
        onOpenWa={(s, v) => navigateToView('whatsapp')}
      />

      {/* Surat Pernyataan & Slip Modal */}
      <SuratPernyataanModal
        isOpen={!!activeSuratViolation}
        onClose={() => {
          setActiveSuratViolation(null);
          setActiveSuratStudent(null);
        }}
        violation={activeSuratViolation}
        student={activeSuratStudent}
        schoolConfig={schoolConfig}
      />

      {/* Sharpened Student Detailed Slip & Record Modal */}
      <StudentSlipDetailModal
        isOpen={!!detailedSlipStudent}
        onClose={() => setDetailedSlipStudent(null)}
        student={effectiveStudents.find((s) => s.id === detailedSlipStudent?.id) || detailedSlipStudent}
        violations={violations}
        schoolConfig={schoolConfig}
        onOpenRecordViolation={(studentId) => {
          setDetailedSlipStudent(null);
          handleTriggerQuickViolation(studentId);
        }}
        onOpenSurat={(v) => {
          setDetailedSlipStudent(null);
          handleOpenSuratModal(v);
        }}
        onDeleteViolation={handleDeleteViolation}
      />

      {/* Profile & Logout Modal */}
      <AccountSwitchModal
        isOpen={isAccountSwitchOpen}
        onClose={() => setIsAccountSwitchOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onAccountChanged={(user) => {
          setCurrentUser(user);
        }}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <LogoutConfirmModal
          user={currentUser}
          onConfirm={() => executeLogout('Petugas mengonfirmasi logout dari sistem')}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}

      {/* Session Inactivity Timeout Modal */}
      {showSessionTimeoutWarning && (
        <SessionTimeoutModal
          remainingSeconds={sessionWarningSeconds}
          onStayLoggedIn={() => {
            setShowSessionTimeoutWarning(false);
            setSessionWarningSeconds(60);
          }}
          onLogoutNow={() => executeLogout('Petugas memilih logout dari modal peringatan sesi')}
        />
      )}

      {/* In-App Confirmation Modal for Clean & Reset Database */}
      {isResetConfirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Konfirmasi Reset Database & Clean Data
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Tindakan ini akan membersihkan data contoh dan mengembalikan sistem ke kondisi awal yang bersih (<span className="font-semibold text-slate-800">Clean Database</span>):
              </p>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs text-slate-700 mb-5">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  <span>Presensi seluruh siswa di <strong>24 Rombel</strong> (Kelas 7A–9H) diset kembali ke <strong>Hadir (100%)</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  <span>Poin pelanggaran seluruh siswa direset kembali ke <strong>0 poin</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  <span>Buku riwayat pelanggaran dan arsip log WhatsApp dikosongkan.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  <span>Arsip rekap presensi harian di-refresh ke kondisi bersih.</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Pastikan Anda telah mengunduh rekap jika ada arsip lama yang masih diperlukan.
                </span>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsResetConfirmModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetData}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ya, Bersihkan & Reset Database</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
