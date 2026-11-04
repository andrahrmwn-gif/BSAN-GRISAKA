import React, { useState, useEffect, useMemo } from 'react';
import { 
  Student, 
  SchoolProfile, 
  AttendanceStatus, 
  AttendanceSheet, 
  AttendancePeriod, 
  AttendanceStudentEntry,
  AttendanceRecapRow 
} from '../../types';
import { KELAS_LIST } from '../../data/schoolConfig';
import { 
  getStoredAttendanceSheets, 
  saveSingleAttendanceSheet, 
  getAttendanceByClassAndDate,
  filterAttendanceSheets,
  calculateStudentRecap,
  resetAttendanceToClean,
  clearAllAttendanceSheets 
} from '../../services/attendanceStorage';
import { isGuestMode, getCurrentUser } from '../../services/authService';
import { logAudit } from '../../services/auditLogger';
import { exportAttendanceToWord, exportAttendanceToExcel, getPeriodLabel } from '../../utils/exportAttendance';
import { exportElementToPDF } from '../../utils/exportDocs';
import { sortByName, sortByClassAndName } from '../../utils/sortUtils';
import { 
  CalendarCheck, 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Save, 
  Search, 
  Users, 
  Calendar, 
  AlertCircle, 
  Lock, 
  Filter, 
  Award, 
  ChevronRight, 
  ChevronLeft,
  School, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  X,
  Trash2,
  AlertTriangle
} from 'lucide-react';


interface AttendanceManagerViewProps {
  students: Student[];
  schoolConfig: SchoolProfile;
  onUpdateStudentsAttendance?: (updatedStudents: Student[]) => void;
  onOpenAccountSwitchModal?: () => void;
}

export const AttendanceManagerView: React.FC<AttendanceManagerViewProps> = ({
  students,
  schoolConfig,
  onUpdateStudentsAttendance,
  onOpenAccountSwitchModal,
}) => {
  const [activeTab, setActiveTab] = useState<'input' | 'recap'>('input');
  
  // Input View State
  const [selectedKelas, setSelectedKelas] = useState<string>('7A');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const handlePrevDay = () => {
    const parts = selectedDate.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const parts = selectedDate.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleGoToday = () => {
    setSelectedDate(todayStr);
  };

  const handleGoYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };
  
  const [entries, setEntries] = useState<AttendanceStudentEntry[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTrigger, setSaveTrigger] = useState(0);

  // Status map of all 24 classes for selectedDate (whether attendance has been recorded)
  const classStatusMap = useMemo(() => {
    const map: Record<string, { isDone: boolean; sheet?: AttendanceSheet; hadirPct?: number }> = {};
    KELAS_LIST.forEach((k) => {
      const sheet = getAttendanceByClassAndDate(k, selectedDate);
      if (sheet && sheet.entries && sheet.entries.length > 0) {
        map[k] = {
          isDone: true,
          sheet,
          hadirPct: sheet.summary?.persentaseHadir ?? 100,
        };
      } else {
        map[k] = {
          isDone: false,
        };
      }
    });
    return map;
  }, [selectedDate, saveTrigger]);

  const currentClassStatus = classStatusMap[selectedKelas] || { isDone: false };

  const completedClassesCount = useMemo(() => {
    return Object.values(classStatusMap).filter((item) => item.isDone).length;
  }, [classStatusMap]);

  // Recap View State
  const [recapPeriod, setRecapPeriod] = useState<AttendancePeriod>('harian');
  const [recapKelas, setRecapKelas] = useState<string>('all');
  const [recapDate, setRecapDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter students belonging to the currently selected class, sorted alphabetically (urut absen A-Z)
  const classStudents = useMemo(() => {
    const filtered = students.filter((s) => s.kelas === selectedKelas);
    return sortByName(filtered);
  }, [students, selectedKelas]);

  // Load or initialize attendance entries when selectedKelas or selectedDate changes
  useEffect(() => {
    const existingSheet = getAttendanceByClassAndDate(selectedKelas, selectedDate);
    
    if (existingSheet && existingSheet.entries.length > 0) {
      // Ensure loaded entries are sorted alphabetically by student name (urut absen A-Z)
      const sortedEntries = sortByName(existingSheet.entries);
      setEntries(sortedEntries);
    } else {
      // Initialize from current students database (already sorted by name)
      const newEntries: AttendanceStudentEntry[] = classStudents.map((std) => ({
        studentId: std.id,
        nisn: std.nisn,
        nama: std.nama,
        gender: std.gender,
        status: std.statusKehadiran || 'Hadir',
        keterangan: std.keteranganKehadiran || '',
      }));
      setEntries(newEntries);
    }
  }, [selectedKelas, selectedDate, classStudents]);

  // Handle single student attendance status change
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setEntries((prev) =>
      prev.map((e) => (e.studentId === studentId ? { ...e, status } : e))
    );
  };

  // Handle single student note change
  const handleNoteChange = (studentId: string, note: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.studentId === studentId ? { ...e, keterangan: note } : e))
    );
  };

  // Quick Action: Mark all present
  const handleMarkAllHadir = () => {
    setEntries((prev) =>
      prev.map((e) => ({
        ...e,
        status: 'Hadir',
        keterangan: '',
      }))
    );
  };

  // Quick Action: Reset to initial
  const handleResetEntries = () => {
    const fresh: AttendanceStudentEntry[] = classStudents.map((std) => ({
      studentId: std.id,
      nisn: std.nisn,
      nama: std.nama,
      gender: std.gender,
      status: 'Hadir',
      keterangan: '',
    }));
    setEntries(fresh);
  };

  // Reset all attendance sheets cleanly
  const handleResetAllAttendance = () => {
    if (isGuestMode()) {
      setActionFeedback({
        type: 'error',
        message: 'Akses Ditolak: Anda saat ini dalam Mode Tamu. Hanya akun petugas resmi yang berwenang mereset rekap presensi.',
      });
      setTimeout(() => setActionFeedback(null), 5000);
      if (onOpenAccountSwitchModal) onOpenAccountSwitchModal();
      return;
    }

    clearAllAttendanceSheets();

    // Reset student presence status in state
    const cleanStudents = students.map((s) => ({
      ...s,
      statusKehadiran: 'Hadir' as AttendanceStatus,
      keteranganKehadiran: undefined,
    }));
    if (onUpdateStudentsAttendance) {
      onUpdateStudentsAttendance(cleanStudents);
    }

    // Refresh current entries from actual students (will be empty if 0 students)
    const freshEntries: AttendanceStudentEntry[] = classStudents.map((std) => ({
      studentId: std.id,
      nisn: std.nisn,
      nama: std.nama,
      gender: std.gender,
      status: 'Hadir',
      keterangan: '',
    }));
    setEntries(freshEntries);

    logAudit({
      actionType: 'RESET',
      module: 'Presensi',
      description: 'Mereset & membersihkan seluruh lembar presensi kelas secara total.',
      status: 'SUCCESS',
    });

    setIsResetModalOpen(false);
    setActionFeedback({
      type: 'success',
      message: 'Seluruh rekap dan lembar presensi berhasil dibersihkan total!',
    });
    setTimeout(() => setActionFeedback(null), 5000);
  };

  // Save current attendance sheet
  const handleSaveAttendance = () => {
    if (isGuestMode()) {
      setActionFeedback({
        type: 'error',
        message: 'Akses Ditolak: Anda saat ini berada dalam Mode Tamu (Guest - View Only). Hanya 55 akun petugas resmi yang berhak menginput dan menyimpan presensi. Silakan beralih akun petugas.',
      });
      setTimeout(() => setActionFeedback(null), 6000);
      logAudit({
        actionType: 'BLOCKED',
        module: 'Presensi',
        description: `Percobaan simpan presensi Kelas ${selectedKelas} (${selectedDate}) ditolak karena dalam Mode Tamu`,
        status: 'BLOCKED',
      });
      if (onOpenAccountSwitchModal) onOpenAccountSwitchModal();
      return;
    }


    setIsSaving(true);

    const currentUser = getCurrentUser();
    const total = entries.length;
    const hadir = entries.filter((e) => e.status === 'Hadir').length;
    const sakit = entries.filter((e) => e.status === 'Sakit').length;
    const izin = entries.filter((e) => e.status === 'Izin').length;
    const alfa = entries.filter((e) => e.status === 'Alfa').length;
    const persentaseHadir = total > 0 ? Math.round((hadir / total) * 100) : 100;

    const sheetId = `att-${selectedDate}-${selectedKelas}`;
    const newSheet: AttendanceSheet = {
      id: sheetId,
      date: selectedDate,
      kelas: selectedKelas,
      recordedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : `Wali Kelas ${selectedKelas}`,
      recordedByNip: currentUser?.nip || '-',
      recordedAt: `${selectedDate} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
      entries,
      summary: {
        total,
        hadir,
        sakit,
        izin,
        alfa,
        persentaseHadir,
      },
    };

    saveSingleAttendanceSheet(newSheet);
    setSaveTrigger((c) => c + 1);

    // If the saved date is today, synchronize the Student database
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDate === todayStr && onUpdateStudentsAttendance) {
      const updatedStudents = students.map((std) => {
        if (std.kelas === selectedKelas) {
          const matchedEntry = entries.find((e) => e.studentId === std.id);
          if (matchedEntry) {
            return {
              ...std,
              statusKehadiran: matchedEntry.status,
              keteranganKehadiran: matchedEntry.keterangan || undefined,
            };
          }
        }
        return std;
      });
      onUpdateStudentsAttendance(updatedStudents);
    }

    logAudit({
      actionType: 'CREATE',
      module: 'Presensi',
      description: `Menyimpan presensi Kelas ${selectedKelas} tanggal ${selectedDate}: Hadir=${hadir}, Sakit=${sakit}, Izin=${izin}, Alpa=${alfa} (${persentaseHadir}%)`,
      status: 'SUCCESS',
    });

    setIsSaving(false);
    setSaveSuccessMsg(`✓ KETERANGAN RESMI: Presensi Kelas ${selectedKelas} Tanggal ${selectedDate} SUDAH DILAKUKAN & TERCATAT RESMI!`);
    setTimeout(() => setSaveSuccessMsg(null), 5000);
  };

  // Real-time metrics for current input class
  const currentMetrics = useMemo(() => {
    const total = entries.length;
    const hadir = entries.filter((e) => e.status === 'Hadir').length;
    const sakit = entries.filter((e) => e.status === 'Sakit').length;
    const izin = entries.filter((e) => e.status === 'Izin').length;
    const alfa = entries.filter((e) => e.status === 'Alfa').length;
    const persentaseHadir = total > 0 ? Math.round((hadir / total) * 100) : 100;

    return { total, hadir, sakit, izin, alfa, persentaseHadir };
  }, [entries]);

  // Aggregate Recap Data based on recap filters
  const { filteredSheets, recapRows, recapSummary } = useMemo(() => {
    const allSheets = getStoredAttendanceSheets();
    const filtered = filterAttendanceSheets(allSheets, recapPeriod, recapKelas, recapDate);
    const rows = calculateStudentRecap(students, filtered, recapKelas);

    const totalSiswa = rows.length;
    const totalHadir = rows.reduce((acc, r) => acc + r.totalHadir, 0);
    const totalSakit = rows.reduce((acc, r) => acc + r.totalSakit, 0);
    const totalIzin = rows.reduce((acc, r) => acc + r.totalIzin, 0);
    const totalAlfa = rows.reduce((acc, r) => acc + r.totalAlfa, 0);
    const totalPertemuan = totalHadir + totalSakit + totalIzin + totalAlfa;
    const avgPersen = totalPertemuan > 0 
      ? Math.round((totalHadir / totalPertemuan) * 100)
      : 100;

    return {
      filteredSheets: filtered,
      recapRows: rows,
      recapSummary: {
        totalSiswa,
        totalHadir,
        totalSakit,
        totalIzin,
        totalAlfa,
        avgPersen,
        totalPertemuan,
      },
    };
  }, [students, recapPeriod, recapKelas, recapDate]);

  // Handle Export Word
  const handleExportWord = () => {
    exportAttendanceToWord(recapRows, recapPeriod, recapKelas, recapDate, schoolConfig);
    logAudit({
      actionType: 'EXPORT',
      module: 'Presensi',
      description: `Mengunduh Rekap Presensi (${recapPeriod}) format Word (.doc)`,
      status: 'SUCCESS',
    });
  };

  // Handle Export Excel
  const handleExportExcel = () => {
    exportAttendanceToExcel(recapRows, recapPeriod, recapKelas, recapDate, schoolConfig);
    logAudit({
      actionType: 'EXPORT',
      module: 'Presensi',
      description: `Mengunduh Rekap Presensi (${recapPeriod}) format Excel (.csv)`,
      status: 'SUCCESS',
    });
  };

  // Handle Direct PDF Export
  const handleExportPDF = async () => {
    const el = document.getElementById('attendance-printable-doc');
    if (el) {
      setIsPdfExporting(true);
      const filename = `Rekap_Presensi_${recapKelas === 'all' ? 'Semua_Kelas' : recapKelas}_${recapPeriod}_${recapDate}`;
      const res = await exportElementToPDF(el, filename);
      setIsPdfExporting(false);
      if (res.blobUrl) {
        setPdfDownloadUrl(res.blobUrl);
      }
      logAudit({
        actionType: 'EXPORT',
        module: 'Presensi',
        description: `Mengunduh Rekap Presensi (${recapPeriod}) format PDF resmi`,
        status: 'SUCCESS',
      });
    } else {
      setIsPrintModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Navigation */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-base font-bold text-slate-900">
              Presensi Siswa & Rekapitulasi Kehadiran 24 Rombel
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengisian absensi per-kelas (7A - 9H), sinkronisasi otomatis database murid, serta rekap harian, mingguan, bulanan, semester, dan tahunan.
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('input')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'input'
                ? 'bg-[#3B5BDB] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Input Presensi Per-Kelas</span>
          </button>

          <button
            onClick={() => setActiveTab('recap')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'recap'
                ? 'bg-[#3B5BDB] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Rekap & Unduh Laporan</span>
          </button>
        </div>
      </div>

      {/* Guest Mode Warning Banner */}
      {isGuestMode() && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Mode Tamu Aktif (Read-Only):</strong> Anda dapat melihat data presensi dan rekapitulasi, tetapi tidak dapat menyimpan atau merubah absensi. Silakan masuk ke salah satu dari 55 akun petugas resmi.
            </span>
          </div>
          {onOpenAccountSwitchModal && (
            <button
              onClick={onOpenAccountSwitchModal}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
            >
              Login 55 Akun
            </button>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 1: INPUT PRESENSI PER-KELAS                                */}
      {/* ============================================================== */}
      {activeTab === 'input' && (
        <div className="space-y-6">
          {/* Class & Date Selector Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#3B5BDB] text-white flex items-center justify-center font-bold shadow-xs">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      PILIH KELAS / ROMBEL (24 KELAS)
                    </span>
                    <select
                      value={selectedKelas}
                      onChange={(e) => setSelectedKelas(e.target.value)}
                      className="mt-0.5 text-sm font-black text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      {KELAS_LIST.map((k) => (
                        <option key={k} value={k}>
                          Kelas {k} ({students.filter((s) => s.kelas === k).length} Siswa)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      TANGGAL PRESENSI (CEK SETIAP SAAT)
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl p-0.5">
                        <button
                          type="button"
                          onClick={handlePrevDay}
                          className="p-1 hover:bg-slate-200 rounded-lg text-slate-700 transition-all cursor-pointer"
                          title="Hari Sebelumnya (H-1)"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="px-2 py-1 text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={handleNextDay}
                          className="p-1 hover:bg-slate-200 rounded-lg text-slate-700 transition-all cursor-pointer"
                          title="Hari Berikutnya (H+1)"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleGoToday}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          selectedDate === todayStr
                            ? 'bg-[#3B5BDB] text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        Hari Ini
                      </button>

                      <button
                        type="button"
                        onClick={handleGoYesterday}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                      >
                        Kemarin
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Save Button */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllHadir}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Tandai seluruh siswa di kelas ini berstatus Hadir"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Semua Hadir</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetEntries}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-all cursor-pointer"
                  title="Kembalikan status awal"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${
                    currentClassStatus.isDone
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[#3B5BDB] hover:bg-[#2563EB] text-white'
                  }`}
                  title={currentClassStatus.isDone ? 'Presensi sudah dilakukan. Klik untuk memperbarui' : 'Simpan presensi kelas'}
                >
                  {currentClassStatus.isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <Save className="w-4 h-4 text-white" />
                  )}
                  <span>
                    {isSaving
                      ? 'Menyimpan...'
                      : currentClassStatus.isDone
                      ? '✓ Presensi Sudah Dilakukan'
                      : 'Simpan Presensi Kelas'}
                  </span>
                </button>
              </div>
            </div>

            {/* Quick 24-Class Chips Picker with Real-time Completion Badges */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                <span className="font-bold text-slate-600 uppercase tracking-wide">
                  PILIH ROMBEL KELAS 7, 8, DAN 9 ({selectedDate}):
                </span>
                <span className="font-semibold text-slate-700">
                  <strong className="text-emerald-700 font-bold">{completedClassesCount} dari 24 Rombel</strong> Selesai Presensi ({Math.round((completedClassesCount / 24) * 100)}%)
                </span>
              </div>

              {/* Progress bar of recorded classes for selectedDate */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(completedClassesCount / 24) * 100}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {KELAS_LIST.map((k) => {
                  const status = classStatusMap[k];
                  const isSelected = selectedKelas === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSelectedKelas(k)}
                      className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? status?.isDone
                            ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300 scale-105'
                            : 'bg-[#3B5BDB] text-white shadow-md ring-2 ring-blue-300 scale-105'
                          : status?.isDone
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      {status?.isDone && (
                        <span className={`text-[11px] ${isSelected ? 'text-white' : 'text-emerald-600'}`}>✓</span>
                      )}
                      <span>{k}</span>
                      {status?.isDone ? (
                        <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                          isSelected ? 'bg-white/25 text-white' : 'bg-emerald-200/80 text-emerald-900'
                        }`}>
                          {status.hadirPct}%
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-normal">
                          Belum
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Permanent Keterangan Status Presensi Card for Selected Class */}
            {currentClassStatus.isDone ? (
              <div className="p-4 bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl text-xs text-emerald-950 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-emerald-900 uppercase">
                        KETERANGAN: PRESENSI KELAS {selectedKelas} SUDAH DILAKUKAN
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900 border border-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        <span>Tersimpan & Terverifikasi</span>
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 mt-1">
                      Presensi tanggal <strong>{selectedDate}</strong> telah berhasil dicatat pada <strong>{currentClassStatus.sheet?.recordedAt || `${selectedDate} WIB`}</strong> oleh <strong>{currentClassStatus.sheet?.recordedBy || 'Petugas Resmi'}</strong>.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-[11px] font-bold text-emerald-900">
                      <span className="bg-white/80 px-2 py-0.5 rounded border border-emerald-200">
                        Hadir: {currentClassStatus.sheet?.summary.hadir} siswa
                      </span>
                      <span className="bg-white/80 px-2 py-0.5 rounded border border-emerald-200">
                        Sakit: {currentClassStatus.sheet?.summary.sakit} siswa
                      </span>
                      <span className="bg-white/80 px-2 py-0.5 rounded border border-emerald-200">
                        Izin: {currentClassStatus.sheet?.summary.izin} siswa
                      </span>
                      <span className="bg-white/80 px-2 py-0.5 rounded border border-emerald-200">
                        Alpa: {currentClassStatus.sheet?.summary.alfa} siswa
                      </span>
                      <span className="bg-emerald-700 text-white px-2.5 py-0.5 rounded-md font-extrabold">
                        Kehadiran: {currentClassStatus.sheet?.summary.persentaseHadir}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-semibold uppercase block">Kondisi Tampilan</span>
                  <span className="text-xs font-bold text-emerald-900">✓ Sudah Dilakukan</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Keterangan: Presensi <strong>Kelas {selectedKelas}</strong> tanggal <strong>{selectedDate}</strong> <em>belum disimpan</em>. Silakan periksa daftar kehadiran di bawah lalu klik tombol di bagian paling bawah untuk menyimpan.
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-200 text-amber-900 whitespace-nowrap">
                  Belum Dilakukan
                </span>
              </div>
            )}
          </div>

          {/* Success Banner */}
          {saveSuccessMsg && (
            <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 animate-fade-in shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Real-time Attendance Metrics for Selected Class */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Siswa</span>
              <div className="text-xl font-black text-slate-900 mt-1">{currentMetrics.total}</div>
              <span className="text-[10px] text-slate-400">Kelas {selectedKelas}</span>
            </div>

            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">Hadir (H)</span>
              <div className="text-xl font-black text-emerald-700 mt-1">{currentMetrics.hadir}</div>
              <span className="text-[10px] text-emerald-600 font-medium">Siswa Masuk</span>
            </div>

            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-[11px] font-bold text-amber-800 uppercase">Sakit (S)</span>
              <div className="text-xl font-black text-amber-700 mt-1">{currentMetrics.sakit}</div>
              <span className="text-[10px] text-amber-600 font-medium">Dengan Keterangan</span>
            </div>

            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 shadow-xs">
              <span className="text-[11px] font-bold text-blue-800 uppercase">Izin (I)</span>
              <div className="text-xl font-black text-blue-700 mt-1">{currentMetrics.izin}</div>
              <span className="text-[10px] text-blue-600 font-medium">Izin Resmi</span>
            </div>

            <div className="bg-red-50/60 p-4 rounded-2xl border border-red-200 shadow-xs">
              <span className="text-[11px] font-bold text-red-800 uppercase">Alpa (A)</span>
              <div className="text-xl font-black text-red-700 mt-1">{currentMetrics.alfa}</div>
              <span className="text-[10px] text-red-600 font-medium">Tanpa Keterangan</span>
            </div>

            <div className="bg-gradient-to-r from-[#1E3A8A] to-[#3B5BDB] p-4 rounded-2xl text-white shadow-xs">
              <span className="text-[11px] font-bold text-blue-200 uppercase">% Kehadiran</span>
              <div className="text-xl font-black text-white mt-1">{currentMetrics.persentaseHadir}%</div>
              <span className="text-[10px] text-slate-200">Tingkat Disiplin</span>
            </div>
          </div>

          {/* Student Roster Attendance Input Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Murid Kelas {selectedKelas} — {selectedDate}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan opsi kehadiran per siswa: Hadir, Sakit, Izin, atau Alpa beserta catatan bila diperlukan.
                </p>
              </div>
              <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-700">
                {entries.length} Murid Terdaftar
              </span>
            </div>

            {entries.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold">Belum ada murid di Kelas {selectedKelas}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Tambahkan murid baru pada menu Data Siswa terlebih dahulu.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4 w-28">NISN</th>
                      <th className="py-3 px-4">Nama Lengkap Murid</th>
                      <th className="py-3 px-4 w-12 text-center">L/P</th>
                      <th className="py-3 px-4 w-72 text-center">Status Kehadiran</th>
                      <th className="py-3 px-4">Keterangan Tambahan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entries.map((entry, idx) => (
                      <tr 
                        key={entry.studentId}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          entry.status === 'Alfa' ? 'bg-red-50/30' : entry.status === 'Sakit' ? 'bg-amber-50/20' : entry.status === 'Izin' ? 'bg-blue-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {entry.nisn}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{entry.nama}</span>
                          <span className="text-[10px] text-slate-400">Kelas {selectedKelas}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            entry.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                          }`}>
                            {entry.gender}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1 bg-slate-100 p-1 rounded-xl">
                            {/* Hadir Button */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(entry.studentId, 'Hadir')}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                entry.status === 'Hadir'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              Hadir
                            </button>

                            {/* Sakit Button */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(entry.studentId, 'Sakit')}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                entry.status === 'Sakit'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                              }`}
                            >
                              Sakit
                            </button>

                            {/* Izin Button */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(entry.studentId, 'Izin')}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                entry.status === 'Izin'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                              }`}
                            >
                              Izin
                            </button>

                            {/* Alfa Button */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(entry.studentId, 'Alfa')}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                entry.status === 'Alfa'
                                  ? 'bg-red-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-red-700 hover:bg-red-50'
                              }`}
                            >
                              Alpa
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Catatan / surat izin dokter (opsional)"
                            value={entry.keterangan || ''}
                            onChange={(e) => handleNoteChange(entry.studentId, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Save Bar with Dynamic Keterangan & State Change */}
            <div className={`p-4 sm:p-5 border-t transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
              currentClassStatus.isDone
                ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950'
                : 'bg-slate-50 border-slate-100 text-slate-700'
            }`}>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  {currentClassStatus.isDone ? (
                    <span className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs sm:text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Keterangan: Presensi Kelas {selectedKelas} SUDAH DILAKUKAN</span>
                    </span>
                  ) : (
                    <span className="font-semibold text-slate-700">
                      Status: Belum disimpan untuk Kelas {selectedKelas}
                    </span>
                  )}
                  {currentClassStatus.isDone && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900 border border-emerald-400">
                      Tersimpan Resmi
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-[11px]">
                  Pencatat: <strong>{getCurrentUser()?.name || 'Mode Tamu / Petugas'}</strong> · Tanggal Presensi: <strong>{selectedDate}</strong>
                  {currentClassStatus.isDone && (
                    <span> · Terakhir disimpan: <strong>{currentClassStatus.sheet?.recordedAt}</strong></span>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={isSaving}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${
                  currentClassStatus.isDone
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300'
                    : 'bg-[#3B5BDB] hover:bg-[#2563EB] text-white'
                }`}
              >
                {currentClassStatus.isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : (
                  <Save className="w-4 h-4 text-white" />
                )}
                <span>
                  {isSaving
                    ? 'Menyimpan...'
                    : currentClassStatus.isDone
                    ? '✓ Presensi Sudah Dilakukan (Klik untuk Perbarui Data)'
                    : 'Simpan Presensi Kelas Sekarang'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: REKAPITULASI KEHADIRAN & UNDUH LAPORAN                  */}
      {/* ============================================================== */}
      {activeTab === 'recap' && (
        <div className="space-y-6">
          {/* Filter Toolbar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Period Tabs: Harian, Mingguan, Bulanan, Semester, Tahunan */}
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  PILIH PERIODE REKAPITULASI
                </span>
                <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-2xl">
                  {(['harian', 'mingguan', 'bulanan', 'semester', 'tahunan'] as AttendancePeriod[]).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setRecapPeriod(period)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                        recapPeriod === period
                          ? 'bg-[#3B5BDB] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scope & Date Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    LINGKUP KELAS
                  </span>
                  <select
                    value={recapKelas}
                    onChange={(e) => setRecapKelas(e.target.value)}
                    className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="all">Seluruh Kelas (24 Rombel)</option>
                    {KELAS_LIST.map((k) => (
                      <option key={k} value={k}>Kelas {k}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    TANGGAL / ACUAN
                  </span>
                  <input
                    type="date"
                    value={recapDate}
                    onChange={(e) => setRecapDate(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Export Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                Menampilkan rekapitulasi: <strong>{getPeriodLabel(recapPeriod, recapDate)}</strong> · Rombel: <strong>{recapKelas === 'all' ? '24 Kelas' : `Kelas ${recapKelas}`}</strong>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportWord}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="Unduh format Microsoft Word (.doc) lengkap dengan KOP Surat"
                >
                  <FileText className="w-4 h-4 text-blue-200" />
                  <span>Unduh Word</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="Unduh format spreadsheet Excel (.csv)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>Unduh Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={isPdfExporting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#3B5BDB] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="Unduh PDF Resmi dengan KOP Surat"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>{isPdfExporting ? 'Memproses PDF...' : 'Unduh PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                  title="Bersihkan seluruh data rekap presensi dan reset ke Hadir 100%"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Reset / Bersihkan Rekap</span>
                </button>
              </div>
            </div>


            {/* Direct Fallback PDF Download link if available */}
            {pdfDownloadUrl && (
              <div className="bg-gradient-to-r from-[#1E3A8A] to-[#3B5BDB] text-white p-3 rounded-xl flex items-center justify-between text-xs animate-fade-in">
                <span className="text-blue-100">File PDF rekap presensi berhasil dibuat!</span>
                <a
                  href={pdfDownloadUrl}
                  download={`Rekap_Presensi_${recapKelas}_${recapPeriod}.pdf`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-white text-[#3B5BDB] font-bold rounded-lg text-[11px]"
                >
                  <span>Buka / Unduh Ulang PDF</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Siswa</span>
              <div className="text-xl font-black text-slate-900 mt-1">{recapSummary.totalSiswa}</div>
              <span className="text-[10px] text-slate-400">Dalam Filter</span>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">Total Hadir</span>
              <div className="text-xl font-black text-emerald-700 mt-1">{recapSummary.totalHadir}</div>
              <span className="text-[10px] text-emerald-600">Presensi Masuk</span>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-[11px] font-bold text-amber-800 uppercase">Total Sakit</span>
              <div className="text-xl font-black text-amber-700 mt-1">{recapSummary.totalSakit}</div>
              <span className="text-[10px] text-amber-600">Sakit</span>
            </div>

            <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-xs">
              <span className="text-[11px] font-bold text-blue-800 uppercase">Total Izin</span>
              <div className="text-xl font-black text-blue-700 mt-1">{recapSummary.totalIzin}</div>
              <span className="text-[10px] text-blue-600">Izin</span>
            </div>

            <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200 shadow-xs">
              <span className="text-[11px] font-bold text-red-800 uppercase">Total Alpa</span>
              <div className="text-xl font-black text-red-700 mt-1">{recapSummary.totalAlfa}</div>
              <span className="text-[10px] text-red-600">Tanpa Keterangan</span>
            </div>

            <div className="bg-gradient-to-r from-[#1E3A8A] to-[#3B5BDB] p-4 rounded-2xl text-white shadow-xs">
              <span className="text-[11px] font-bold text-blue-200 uppercase">Rata-Rata Kehadiran</span>
              <div className="text-xl font-black text-white mt-1">{recapSummary.avgPersen}%</div>
              <span className="text-[10px] text-slate-200">Tingkat Absensi</span>
            </div>
          </div>

          {/* Printable Document Area with Official KOP Surat */}
          <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div id="attendance-printable-doc" className="print-area bg-white p-6 max-w-5xl mx-auto font-serif text-slate-900">
              {/* KOP SURAT RESMI */}
              <div className="text-center pb-3 border-b-4 border-double border-black mb-6">
                <div className="text-xs font-bold uppercase tracking-wider">
                  PEMERINTAH KABUPATEN TEMANGGUNG
                </div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA
                </div>
                <div className="text-lg font-black tracking-tight uppercase text-black mt-0.5">
                  {schoolConfig.name || 'SMP NEGERI 1 KANDANGAN'}
                </div>
                <div className="text-[10px] font-sans text-slate-600 mt-0.5 italic">
                  {schoolConfig.address || 'Jl. Raya Kandangan - Temanggung'}, {schoolConfig.city || 'Kabupaten Temanggung'} {schoolConfig.postalCode || '56281'} · Telp: {schoolConfig.phone || '(0293) 490123'} · Email: {schoolConfig.email || 'smpn1kandangan@temanggungkab.go.id'}
                </div>
              </div>

              {/* Title Header */}
              <div className="text-center mb-6">
                <h3 className="text-sm font-black uppercase underline tracking-wide">
                  REKAPITULASI PRESENSI KEHADIRAN SISWA
                </h3>
                <p className="text-xs font-sans text-slate-600 font-bold mt-1">
                  PERIODE: {getPeriodLabel(recapPeriod, recapDate).toUpperCase()}
                </p>
                <p className="text-[11px] font-sans text-slate-500">
                  Rombel: {recapKelas === 'all' ? 'Seluruh Kelas (24 Rombel)' : `Kelas ${recapKelas}`}
                </p>
              </div>

              {/* Recap Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-black">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-center border-b border-black">
                      <th className="py-2 px-2 border border-black w-10">No</th>
                      <th className="py-2 px-3 border border-black w-24">NISN</th>
                      <th className="py-2 px-3 border border-black text-left">Nama Lengkap Siswa</th>
                      <th className="py-2 px-2 border border-black w-12">Kelas</th>
                      <th className="py-2 px-2 border border-black w-10">L/P</th>
                      <th className="py-2 px-2 border border-black w-12 text-emerald-800">H</th>
                      <th className="py-2 px-2 border border-black w-12 text-amber-800">S</th>
                      <th className="py-2 px-2 border border-black w-12 text-blue-800">I</th>
                      <th className="py-2 px-2 border border-black w-12 text-red-800">A</th>
                      <th className="py-2 px-2 border border-black w-16">% Hadir</th>
                      <th className="py-2 px-3 border border-black text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recapRows.map((row, idx) => (
                      <tr key={row.studentId} className="border-b border-black/50">
                        <td className="py-1.5 px-2 text-center border border-black">{idx + 1}</td>
                        <td className="py-1.5 px-3 text-center font-mono border border-black">{row.nisn}</td>
                        <td className="py-1.5 px-3 font-bold border border-black">{row.nama}</td>
                        <td className="py-1.5 px-2 text-center border border-black">{row.kelas}</td>
                        <td className="py-1.5 px-2 text-center border border-black">{row.gender}</td>
                        <td className="py-1.5 px-2 text-center font-bold text-emerald-800 border border-black">{row.totalHadir}</td>
                        <td className="py-1.5 px-2 text-center text-amber-800 border border-black">{row.totalSakit}</td>
                        <td className="py-1.5 px-2 text-center text-blue-800 border border-black">{row.totalIzin}</td>
                        <td className="py-1.5 px-2 text-center font-bold text-red-800 border border-black">{row.totalAlfa}</td>
                        <td className="py-1.5 px-2 text-center font-bold border border-black">{row.persentaseHadir}%</td>
                        <td className="py-1.5 px-3 border border-black font-sans text-[11px] text-slate-600">
                          {row.keteranganTerakhir || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tanda Tangan Tiga Kolom Resmi */}
              <div className="mt-10 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  Mengetahui,<br />
                  <strong>{recapKelas !== 'all' ? `Wali Kelas ${recapKelas}` : 'Koordinator Guru Piket'}</strong>
                  <div className="h-16"></div>
                  <div className="font-bold underline">
                    {recapKelas !== 'all' ? `Wali Kelas ${recapKelas}` : 'Siti Aminah, S.Pd.'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-600 mt-0.5">
                    NIP. {recapKelas !== 'all' ? '-' : '19840311 200902 2 006'}
                  </div>
                </div>

                <div>
                  Mengetahui,<br />
                  <strong>Wakasek Urusan Kesiswaan</strong>
                  <div className="h-16"></div>
                  <div className="font-bold underline">
                    {schoolConfig.wakasekName || schoolConfig.timKesiswaanName || 'Andi Prasetyo, S.Pd.'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-600 mt-0.5">
                    NIP. {schoolConfig.wakasekNip || '19800315 200604 1 007'}
                  </div>
                </div>

                <div>
                  Kandangan, {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}<br />
                  <strong>Kepala SMPN 1 Kandangan</strong>
                  <div className="h-16"></div>
                  <div className="font-bold underline">
                    {schoolConfig.principalName || 'Yuliana Dewi Marithawati, S.Pd., M.Pd.'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-600 mt-0.5">
                    NIP. {schoolConfig.principalNip || '19740512 199802 2 003'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Feedback Toast */}
      {actionFeedback && (
        <div className={`fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-xl flex items-center gap-3 border animate-in fade-in slide-in-from-bottom-4 ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-800 text-white border-emerald-600'
            : 'bg-rose-800 text-white border-rose-600'
        }`}>
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
          )}
          <span className="text-xs font-semibold flex-1 leading-relaxed">
            {actionFeedback.message}
          </span>
          <button
            onClick={() => setActionFeedback(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* In-App Confirmation Modal: Reset Rekap Presensi */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Reset Semua Rekap Presensi?
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Tindakan ini akan membersihkan catatan sakit, izin, dan alpa pada lembar presensi seluruh 24 rombel dan mengembalikan status kehadiran seluruh siswa ke <strong>Hadir (100%)</strong>.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetAllAttendance}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Ya, Bersihkan & Reset Rekap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

