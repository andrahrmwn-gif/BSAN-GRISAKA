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
import { ViolationsManager } from './components/violations/ViolationsManager';
import { TataTertibDocView } from './components/violations/TataTertibDocView';
import { WhatsAppGateway } from './components/whatsapp/WhatsAppGateway';
import { ComprehensiveReports } from './components/reports/ComprehensiveReports';
import { SchoolSettingsView } from './components/settings/SchoolSettingsView';
import { RecordViolationModal } from './components/modals/RecordViolationModal';
import { SuratPernyataanModal } from './components/modals/SuratPernyataanModal';
import { StudentSlipDetailModal } from './components/modals/StudentSlipDetailModal';
import { AccountSwitchModal } from './components/modals/AccountSwitchModal';
import { RotateCcw } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [students, setStudents] = useState<Student[]>(() => getStoredStudents());
  const [violations, setViolations] = useState<ViolationRecord[]>(() => getStoredViolations());
  const [waLogs, setWaLogs] = useState<WhatsAppMessageLog[]>(() => getStoredWaLogs());
  const [schoolConfig, setSchoolConfig] = useState<SchoolProfile>(() => getStoredSchoolConfig());

  // User Authentication & Guest Mode state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());
  const [isAccountSwitchOpen, setIsAccountSwitchOpen] = useState(false);

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
      alert('Akses Ditolak: Anda sedang dalam Mode Tamu (Guest - View Only). Hanya 20 akun petugas resmi yang berhak menambah siswa.');
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
      alert('Akses Ditolak: Anda sedang dalam Mode Tamu (Guest - View Only). Hanya 20 akun petugas resmi yang berhak mengedit biodata siswa.');
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
      alert('Akses Ditolak: Anda saat ini berada dalam Mode Tamu (Guest - View Only). Mode Tamu hanya berhak membuka dan melihat menu. Silakan login ke salah satu dari 20 akun petugas untuk mencatat pelanggaran.');
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

  // Reset to default data - CLEAN & BERSIH
  const handleResetData = () => {
    if (isGuestMode()) {
      alert('Akses Ditolak: Anda sedang dalam Mode Tamu. Hanya akun petugas resmi yang berwenang mereset database.');
      logAudit({
        actionType: 'BLOCKED',
        module: 'Sistem',
        description: 'Percobaan reset data contoh ditolak karena pengguna berada dalam Mode Tamu',
        status: 'BLOCKED',
      });
      setIsAccountSwitchOpen(true);
      return;
    }

    if (window.confirm('Reset data contoh sekarang? Seluruh data anak akan dibersihkan secara tuntas (0 pelanggaran, status Hadir) dan buku pelanggaran dikosongkan.')) {
      const reset = resetToDefaultData();
      setStudents(reset.students);
      setViolations(reset.violations);
      setWaLogs(reset.logs);
      setSchoolConfig(reset.config);

      logAudit({
        actionType: 'RESET',
        module: 'Sistem',
        description: 'Mereset data contoh: Seluruh data anak dibersihkan secara tuntas (0 kasus pelanggaran, status Hadir) dan riwayat pelanggaran dikosongkan.',
        status: 'SUCCESS',
      });

      alert('Berhasil! Seluruh data anak telah clean dan bersih (0 kasus pelanggaran, status Hadir).');
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F4F6F8] text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => setCurrentView(view)}
        activeViolationsCount={violations.filter((v) => v.statusSurat !== 'Selesai').length}
        pendingWaCount={students.filter((s) => s.statusKehadiran !== 'Hadir').length}
        schoolConfig={schoolConfig}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header with Account Switcher & Mode Tamu Indicator */}
        <Header
          currentView={currentView}
          currentUser={currentUser}
          onOpenQuickViolation={() => handleTriggerQuickViolation()}
          onOpenAccountSwitch={() => setIsAccountSwitchOpen(true)}
          onSearchGlobal={(q) => setSearchQuery(q)}
          searchQuery={searchQuery}
          schoolConfig={schoolConfig}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
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
              onPullDataFromSheets={(newStudents, newViolations, partialConfig) => {
                if (isGuestMode()) {
                  alert('Akses Ditolak: Mode Tamu tidak berhak memuat atau menimpa data.');
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
        <footer className="no-print mt-auto py-4 px-8 border-t border-slate-200/80 bg-white text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{schoolConfig.name} ({schoolConfig.shortName})</span>
            <span>·</span>
            <span>Budaya Sekolah Aman dan Nyaman (BSAN)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Kepala Sekolah: <strong>{schoolConfig.principalName}</strong></span>
            <span>·</span>
            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              title="Kembalikan data contoh awal ke kondisi clean dan bersih"
            >
              <RotateCcw className="w-3 h-3" />
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

      {/* Account Switch & 20 Accounts Login Modal */}
      <AccountSwitchModal
        isOpen={isAccountSwitchOpen}
        onClose={() => setIsAccountSwitchOpen(false)}
        onAccountChanged={(user) => {
          setCurrentUser(user);
        }}
      />
    </div>
  );
}
