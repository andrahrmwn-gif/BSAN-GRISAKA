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
import { getCurrentUser, isGuestMode } from './services/authService';
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
import { RotateCcw, AlertTriangle, CheckCircle2, X, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [students, setStudents] = useState<Student[]>(() => getStoredStudents());
  const [violations, setViolations] = useState<ViolationRecord[]>(() => getStoredViolations());
  const [waLogs, setWaLogs] = useState<WhatsAppMessageLog[]>(() => getStoredWaLogs());
  const [schoolConfig, setSchoolConfig] = useState<SchoolProfile>(() => getStoredSchoolConfig());

  // User Authentication & Guest Mode state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());
  const [isAccountSwitchOpen, setIsAccountSwitchOpen] = useState(false);

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

    setViolations((prev) => [newViolation, ...prev]);

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === newViolation.studentId) {
          const isRingan = newViolation.tingkat === 'Ringan' ? 1 : 0;
          const isSedang = newViolation.tingkat === 'Sedang' ? 1 : 0;
          const isBerat = newViolation.tingkat === 'Berat' ? 1 : 0;

          return {
            ...s,
            totalPoinPelanggaran: (s.totalPoinPelanggaran || 0) + (newViolation.poin || 0),
            totalPelanggaranRingan: (s.totalPelanggaranRingan || 0) + isRingan,
            totalPelanggaranSedang: (s.totalPelanggaranSedang || 0) + isSedang,
            totalPelanggaranBerat: (s.totalPelanggaranBerat || 0) + isBerat,
          };
        }
        return s;
      })
    );

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

    setViolations((prev) =>
      prev.map((v) => (v.id === violationId ? { ...v, statusSurat: newStatus } : v))
    );

    const targetV = violations.find((v) => v.id === violationId);
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

  // Add WhatsApp Log
  const handleAddWaLog = (newLog: WhatsAppMessageLog) => {
    if (isGuestMode()) {
      alert('Akses Ditolak: Mode Tamu tidak berhak mencatat riwayat WhatsApp.');
      return;
    }

    setWaLogs((prev) => [newLog, ...prev]);

    logAudit({
      actionType: 'CREATE',
      module: 'WhatsApp',
      description: `Pengiriman pesan WhatsApp (${newLog.category}) ke ${newLog.recipientName} (${newLog.recipientPhone})`,
      status: 'SUCCESS',
    });
  };

  // Quick Violation modal trigger
  const handleTriggerQuickViolation = (studentId?: string) => {
    if (isGuestMode()) {
      alert('Akses Ditolak: Anda saat ini berada dalam Mode Tamu (Guest - View Only). Mode Tamu hanya berhak membuka dan melihat menu. Silakan login ke salah satu dari 55 akun petugas untuk mencatat pelanggaran.');
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
  const handleConfirmResetData = () => {
    try {
      const reset = resetToDefaultData();
      localStorage.removeItem('bsan_grisaka_attendance_sheets_v1');
      
      setStudents(reset.students);
      setViolations(reset.violations);
      setWaLogs(reset.logs);
      setSchoolConfig(reset.config);

      logAudit({
        actionType: 'RESET',
        module: 'Sistem',
        description: 'Mereset database: Seluruh 24 rombel dibersihkan secara tuntas (0 kasus pelanggaran, status Hadir) dan riwayat pelanggaran dikosongkan.',
        status: 'SUCCESS',
      });

      setIsResetConfirmModalOpen(false);
      setResetSuccessToast('Database berhasil dibersihkan & di-reset! Seluruh 24 rombel kini berada dalam kondisi bersih (0 kasus pelanggaran, status Hadir).');
      setTimeout(() => setResetSuccessToast(null), 5000);
    } catch (err) {
      console.error('Reset error:', err);
      setResetErrorToast('Terjadi kesalahan saat mereset database.');
      setTimeout(() => setResetErrorToast(null), 5000);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F4F6F8] text-slate-800 relative">
      {/* Toast Notifications */}
      {resetSuccessToast && (
        <div className="fixed top-5 right-5 z-[999] max-w-md bg-emerald-600 text-white px-5 py-4 rounded-xl shadow-2xl flex items-start gap-3 border border-emerald-400/30 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-100" />
          <div className="flex-1 text-sm font-medium leading-relaxed">
            {resetSuccessToast}
          </div>
          <button 
            onClick={() => setResetSuccessToast(null)} 
            className="text-emerald-200 hover:text-white p-1 rounded transition-colors"
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

      {/* Sidebar Navigation (with Mobile Drawer support) */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => {
          setCurrentView(view);
          setIsMobileSidebarOpen(false);
        }}
        activeViolationsCount={violations.filter((v) => v.statusSurat !== 'Selesai').length}
        pendingWaCount={students.filter((s) => s.statusKehadiran !== 'Hadir').length}
        schoolConfig={schoolConfig}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
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
        />

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
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
              onUpdateStudentsAttendance={(updated) => setStudents(updated)}
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

        {/* Bottom Quiet Footer */}
        <footer className="no-print mt-auto py-4 px-6 lg:px-8 border-t border-slate-200/80 bg-white text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="font-semibold text-slate-800">{schoolConfig.name} ({schoolConfig.shortName})</span>
            <span>·</span>
            <span>Budaya Sekolah Aman dan Nyaman (BSAN)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] flex-wrap justify-center">
            <span>Kepala Sekolah: <strong>{schoolConfig.principalName}</strong></span>
            <span>·</span>
            <button
              onClick={handleTriggerResetData}
              className="text-slate-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
              title="Kembalikan data contoh awal ke kondisi clean dan bersih"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span>Reset Data Contoh (Clean & Bersih)</span>
            </button>
          </div>
        </footer>
      </div>

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
        student={detailedSlipStudent}
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
      />

      {/* Account Switch & 55 Accounts Login Modal */}
      <AccountSwitchModal
        isOpen={isAccountSwitchOpen}
        onClose={() => setIsAccountSwitchOpen(false)}
        onAccountChanged={(user) => {
          setCurrentUser(user);
        }}
      />

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
