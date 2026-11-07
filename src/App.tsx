import React, { useState, useEffect } from 'react';
import { ViewMode, Student, ViolationRecord, WhatsAppMessageLog, SchoolProfile } from './types';
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
  syncStudentToFirestore,
  deleteStudentFromFirestore,
  syncViolationToFirestore,
  deleteViolationFromFirestore,
  syncWaLogToFirestore,
  deleteWaLogFromFirestore,
  syncSchoolConfigToFirestore,
  bulkImportStudentsToFirestore,
  bulkSyncAttendanceSheets,
  bulkSyncActivitiesToFirestore,
  bulkSyncAccountsToFirestore,
  clearAllFirestoreData,
} from './services/firebase';
import { INITIAL_STUDENTS } from './data/initialStudents';
import { generateCleanTodayAttendanceSheets } from './services/attendanceStorage';
import { getStoredActivities } from './services/announcementService';
import { getCurrentUser, isGuestMode, getStoredAccounts, DEFAULT_ACCOUNTS, setCurrentUserId } from './services/authService';
import { logAudit } from './services/auditLogger';
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
  const [violations, setViolations] = useState<ViolationRecord[]>(() => getStoredViolations());
  const [waLogs, setWaLogs] = useState<WhatsAppMessageLog[]>(() => getStoredWaLogs());
  const [schoolConfig, setSchoolConfig] = useState<SchoolProfile>(() => getStoredSchoolConfig());

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

  // Real-time synchronization across accounts & devices via Firestore onSnapshot
  useEffect(() => {
    let isInitialStudentSyncDone = false;

    const unsubStudents = subscribeToStudents((remoteStudents) => {
      if (remoteStudents.length > 0) {
        setStudents(remoteStudents);
        isInitialStudentSyncDone = true;
      } else if (!isInitialStudentSyncDone) {
        // First boot or empty Firestore: seed 864 students so they never disappear on iPad/mobile
        const local = getStoredStudents();
        const seedData = local && local.length > 0 ? local : INITIAL_STUDENTS;
        setStudents(seedData);
        bulkImportStudentsToFirestore(seedData).catch(console.error);
        isInitialStudentSyncDone = true;
      } else {
        setStudents([]);
      }
    });

    const unsubViolations = subscribeToViolations((remoteViolations) => {
      setViolations(remoteViolations);
    });

    const unsubWaLogs = subscribeToWaLogs((remoteLogs) => {
      setWaLogs(remoteLogs);
    });

    const unsubConfig = subscribeToSchoolConfig((remoteConfig) => {
      setSchoolConfig((prev) => ({ ...prev, ...remoteConfig }));
    });

    const unsubAttendance = subscribeToAttendanceSheets((remoteSheets) => {
      if (remoteSheets.length > 0) {
        try {
          localStorage.setItem('bsan_grisaka_attendance_sheets_v1', JSON.stringify(remoteSheets));
        } catch {}
      } else {
        // Attendance empty in cloud: seed clean today sheets
        const clean = generateCleanTodayAttendanceSheets();
        if (clean.length > 0) {
          try {
            localStorage.setItem('bsan_grisaka_attendance_sheets_v1', JSON.stringify(clean));
          } catch {}
          bulkSyncAttendanceSheets(clean).catch(console.error);
        }
      }
    });

    const unsubActivities = subscribeToActivities((remoteActivities) => {
      try {
        localStorage.setItem('bsan_grisaka_announcements_v1', JSON.stringify(remoteActivities || []));
        localStorage.setItem('bsan_grisaka_announcements_initialized_v2', 'true');
        window.dispatchEvent(new CustomEvent('bsan_activities_changed', { detail: remoteActivities || [] }));
      } catch {}
    });

    const unsubAccounts = subscribeToAccounts((remoteAccounts) => {
      if (remoteAccounts && remoteAccounts.length > 0) {
        try {
          localStorage.setItem('bsan_grisaka_accounts_dapodik_v3', JSON.stringify(remoteAccounts));
          window.dispatchEvent(new CustomEvent('bsan_accounts_changed', { detail: remoteAccounts }));
        } catch {}
      }
    });

    return () => {
      unsubStudents();
      unsubViolations();
      unsubWaLogs();
      unsubConfig();
      unsubAttendance();
      unsubActivities();
      unsubAccounts();
    };
  }, []);

  // Real-time synchronization of student violation counts from actual violations ledger
  useEffect(() => {
    if (!violations || violations.length === 0) return;
    setStudents((prev) => {
      let changed = false;
      const updated = prev.map((s) => {
        const studentV = violations.filter(
          (v) =>
            v &&
            (v.studentId === s.id ||
              (v.studentName?.trim().toLowerCase() === s.nama?.trim().toLowerCase() && v.kelas === s.kelas) ||
              (s.nama && v.studentName?.trim().toLowerCase() === s.nama?.trim().toLowerCase()))
        );
        const rCount = studentV.filter((v) => v.tingkat === 'Ringan').length;
        const sCount = studentV.filter((v) => v.tingkat === 'Sedang').length;
        const bCount = studentV.filter((v) => v.tingkat === 'Berat').length;

        if (
          s.totalPelanggaranRingan !== rCount ||
          s.totalPelanggaranSedang !== sCount ||
          s.totalPelanggaranBerat !== bCount
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
  }, [violations]);

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

    setStudents((prev) => [newStudent, ...prev]);
    // Real-time sync to Firestore across all accounts and devices
    syncStudentToFirestore(newStudent).catch(console.error);

    logAudit({
      actionType: 'CREATE',
      module: 'Siswa',
      description: `Menambahkan siswa baru: ${newStudent.nama} (Kelas ${newStudent.kelas}, NISN: ${newStudent.nisn})`,
      status: 'SUCCESS',
    });
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    if (isGuestMode()) {
      alert('Akses Ditolak: Anda sedang dalam Mode Tamu (Guest - View Only). Hanya 55 akun petugas resmi yang berhak mengedit biodata siswa.');
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
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
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
      alert('Akses Ditolak: Anda sedang dalam Mode Tamu (Guest - View Only). Hanya akun petugas resmi yang berhak menghapus data.');
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

  const handleBulkImportStudents = (newStudents: Student[]) => {
    if (isGuestMode()) {
      alert('Akses Ditolak: Anda sedang dalam Mode Tamu. Hanya akun petugas resmi yang berhak mengimpor data siswa.');
      logAudit({
        actionType: 'BLOCKED',
        module: 'Siswa',
        description: 'Percobaan impor massal data siswa ditolak karena dalam Mode Tamu',
        status: 'BLOCKED',
      });
      setIsAccountSwitchOpen(true);
      return;
    }

    setStudents((prev) => [...newStudents, ...prev]);
    // Real-time bulk sync to Firestore
    bulkImportStudentsToFirestore(newStudents).catch(console.error);

    logAudit({
      actionType: 'CREATE',
      module: 'Siswa',
      description: `Impor massal data siswa berhasil: ${newStudents.length} siswa baru ditambahkan`,
      status: 'SUCCESS',
    });
  };

  // Handlers for violations
  const handleSaveViolation = (newViolation: ViolationRecord) => {
    if (isGuestMode()) {
      alert('Akses Ditolak: Mode Tamu hanya berhak membaca data. Silakan login dengan akun petugas resmi untuk mencatat pelanggaran.');
      logAudit({
        actionType: 'BLOCKED',
        module: 'Pelanggaran',
        description: `Percobaan pencatatan pelanggaran (${newViolation.studentName}) ditolak karena dalam Mode Tamu`,
        status: 'BLOCKED',
      });
      setIsAccountSwitchOpen(true);
      return;
    }

    const nextViolations = [newViolation, ...violations];
    setViolations(nextViolations);
    saveViolations(nextViolations);
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
      syncStudentToFirestore(studentObj).catch(console.error);
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

    const nextViolations = violations.filter((v) => v.id !== violationId);
    setViolations(nextViolations);
    saveViolations(nextViolations);
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
      syncStudentToFirestore(studentObj).catch(console.error);
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

  // Clear all violations manually
  const handleClearAllViolations = () => {
    if (isGuestMode()) {
      setResetErrorToast('Akses Ditolak: Anda sedang dalam Mode Tamu. Hanya akun petugas resmi yang berwenang mengosongkan data.');
      setTimeout(() => setResetErrorToast(null), 5000);
      setIsAccountSwitchOpen(true);
      return;
    }

    setViolations([]);
    violations.forEach((v) => deleteViolationFromFirestore(v.id).catch(console.error));

    const cleanedStudents = students.map((s) => ({
      ...s,
      totalPelanggaranRingan: 0,
      totalPelanggaranSedang: 0,
      totalPelanggaranBerat: 0,
      totalPoinPelanggaran: 0,
    }));
    setStudents(cleanedStudents);
    bulkImportStudentsToFirestore(cleanedStudents).catch(console.error);

    logAudit({
      actionType: 'DELETE',
      module: 'Pelanggaran',
      description: 'Mengosongkan seluruh buku catatan pelanggaran secara manual.',
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

  // Trigger Reset Data with In-App Confirmation Modal (no window.confirm / alert)
  const handleTriggerResetData = () => {
    if (isGuestMode()) {
      setResetErrorToast('Akses Ditolak: Anda saat ini berada dalam Mode Tamu (Guest - View Only). Silakan login ke salah satu dari 55 akun petugas resmi untuk mereset database.');
      setTimeout(() => setResetErrorToast(null), 6000);
      setIsAccountSwitchOpen(true);
      return;
    }
    setIsResetConfirmModalOpen(true);
  };

  // Perform full database reset
  const handleConfirmResetData = async () => {
    try {
      const reset = resetToDefaultData();
      localStorage.removeItem('bsan_grisaka_attendance_sheets_v1');
      
      setStudents(reset.students);
      setViolations(reset.violations);
      setWaLogs(reset.logs);
      setSchoolConfig(reset.config);

      // Wipe Firestore so all other devices and accounts are updated cleanly in real time
      await clearAllFirestoreData();

      logAudit({
        actionType: 'RESET',
        module: 'Sistem',
        description: 'Mereset database & data contoh: Seluruh data contoh siswa, presensi, pelanggaran, dan riwayat dibersihkan total secara tuntas (0 siswa, 0 kasus, presensi bersih).',
        status: 'SUCCESS',
      });

      setIsResetConfirmModalOpen(false);
      setResetSuccessToast('Data contoh berhasil dibersihkan total! Presensi kini bersih tanpa nama siswa, dan seluruh perangkat telah tersinkronisasi realtime.');
      setTimeout(() => setResetSuccessToast(null), 5000);
    } catch (err) {
      console.error('Reset error:', err);
      setResetErrorToast('Terjadi kesalahan saat mereset database.');
      setTimeout(() => setResetErrorToast(null), 5000);
    }
  };

  // Guard: In guest mode, force view to stay on dashboard (Requirement 3)
  useEffect(() => {
    if (isGuestMode() && currentView !== 'dashboard') {
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
          setCurrentView('dashboard');
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

      {/* Sidebar Navigation (with Mobile Drawer support & Royal Blue Theme) */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => {
          if (isGuestMode() && view !== 'dashboard') {
            setResetErrorToast('Akses Dibatasi: Mode Tamu hanya berhak melihat Dashboard.');
            setTimeout(() => setResetErrorToast(null), 4000);
            return;
          }
          setCurrentView(view);
          setIsMobileSidebarOpen(false);
        }}
        activeViolationsCount={violations.filter((v) => v.statusSurat !== 'Selesai').length}
        pendingWaCount={students.filter((s) => s.statusKehadiran !== 'Hadir').length}
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
          onNavigate={(view) => {
            if (isGuestMode() && view !== 'dashboard') return;
            setCurrentView(view);
          }}
        />

        {/* Viewport Content with clean mobile padding & responsive spacing */}
        <main className="flex-1 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6">
          {currentView === 'dashboard' && (
            <ExecutiveDashboard
              students={students}
              violations={violations}
              schoolConfig={schoolConfig}
              onNavigate={(view) => setCurrentView(view)}
              onOpenQuickViolation={() => handleTriggerQuickViolation()}
              onSelectStudentProfile={(student) => {
                setDetailedSlipStudent(student);
              }}
            />
          )}

          {currentView === 'students' && (
            <StudentCentralHub
              students={students}
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
              students={students}
              schoolConfig={schoolConfig}
              onUpdateStudentsAttendance={(updated) => {
                setStudents(updated);
                saveStudents(updated);
                bulkImportStudentsToFirestore(updated).catch(console.error);
                if (detailedSlipStudent) {
                  const refreshed = updated.find((s) => s.id === detailedSlipStudent.id);
                  if (refreshed) setDetailedSlipStudent(refreshed);
                }
              }}
              onOpenAccountSwitchModal={() => setIsAccountSwitchOpen(true)}
            />
          )}

          {currentView === 'violations' && (
            <ViolationsManager
              violations={violations}
              students={students}
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
              students={students}
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
              students={students}
              violations={violations}
              schoolConfig={schoolConfig}
            />
          )}

          {currentView === 'settings' && (
            <SchoolSettingsView
              schoolConfig={schoolConfig}
              students={students}
              violations={violations}
              onUpdateSchoolConfig={handleUpdateSchoolConfig}
              onResetData={handleTriggerResetData}
              onUserUpdated={(updatedUser) => setCurrentUser(updatedUser)}
              onPullDataFromSheets={(newStudents, newViolations, partialConfig) => {
                if (isGuestMode()) {
                  setResetErrorToast('Akses Ditolak: Mode Tamu tidak berhak memuat atau menimpa data.');
                  setTimeout(() => setResetErrorToast(null), 5000);
                  return;
                }
                if (newStudents && newStudents.length > 0) setStudents(newStudents);
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
            <span>·</span>
            <button
              onClick={handleTriggerResetData}
              className="text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
              title="Kembalikan data contoh awal ke kondisi clean dan bersih"
            >
              <RotateCcw className="w-3 h-3 text-rose-500" />
              <span>Reset Data</span>
            </button>
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
        students={students}
        preselectedStudentId={preselectedStudentId}
        onSaveViolation={handleSaveViolation}
        onOpenSurat={(v) => handleOpenSuratModal(v)}
        onOpenWa={(s, v) => setCurrentView('whatsapp')}
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
        student={students.find((s) => s.id === detailedSlipStudent?.id) || detailedSlipStudent}
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
