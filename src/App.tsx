import React, { useState, useEffect } from 'react';
import { ViewMode, Student, ViolationRecord, WhatsAppMessageLog, SchoolProfile } from './types';
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
import { RotateCcw } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [students, setStudents] = useState<Student[]>(() => getStoredStudents());
  const [violations, setViolations] = useState<ViolationRecord[]>(() => getStoredViolations());
  const [waLogs, setWaLogs] = useState<WhatsAppMessageLog[]>(() => getStoredWaLogs());
  const [schoolConfig, setSchoolConfig] = useState<SchoolProfile>(() => getStoredSchoolConfig());

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
    setStudents((prev) => [newStudent, ...prev]);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const handleBulkImportStudents = (newStudents: Student[]) => {
    setStudents((prev) => [...newStudents, ...prev]);
  };

  // Handlers for violations
  const handleSaveViolation = (newViolation: ViolationRecord) => {
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
    setViolations((prev) =>
      prev.map((v) => (v.id === violationId ? { ...v, statusSurat: newStatus } : v))
    );
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
    setWaLogs((prev) => [newLog, ...prev]);
  };

  // Quick Violation modal trigger
  const handleTriggerQuickViolation = (studentId?: string) => {
    setPreselectedStudentId(studentId || '');
    setIsRecordModalOpen(true);
  };

  // Settings update
  const handleUpdateSchoolConfig = (newConfig: SchoolProfile) => {
    setSchoolConfig(newConfig);
  };

  // Reset to default data
  const handleResetData = () => {
    if (window.confirm('Kembalikan seluruh data dan pengaturan ke sampel resmi SMPN 1 Kandangan?')) {
      const reset = resetToDefaultData();
      setStudents(reset.students);
      setViolations(reset.violations);
      setWaLogs(reset.logs);
      setSchoolConfig(reset.config);
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
        {/* Top Header (Time removed as requested) */}
        <Header
          currentView={currentView}
          onOpenQuickViolation={() => handleTriggerQuickViolation()}
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
                if (newStudents && newStudents.length > 0) setStudents(newStudents);
                if (newViolations && newViolations.length > 0) setViolations(newViolations);
                if (partialConfig) setSchoolConfig(prev => ({ ...prev, ...partialConfig }));
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
              className="text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
              title="Kembalikan data contoh awal"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Data Contoh</span>
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
    </div>
  );
}
