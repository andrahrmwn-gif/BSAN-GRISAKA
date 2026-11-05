import React, { useState, useMemo, useEffect } from 'react';
import { Student, ViolationRecord, SchoolProfile } from '../../types';
import { getWhatsAppUrl, generateAttendanceMessage } from '../../utils/whatsapp';
import { getStoredAttendanceSheets } from '../../services/attendanceStorage';
import { getRealtimeDateYMD } from '../../utils/dateUtils';
import { 
  X, 
  Printer, 
  MessageSquare, 
  ShieldAlert, 
  MapPin, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  User, 
  Layers,
  AlertOctagon,
  Info,
  FileDown,
  FileSpreadsheet,
  ExternalLink,
  Trash2,
  Calendar,
  Clock,
  Send,
  Filter
} from 'lucide-react';
import { 
  exportStudentSlipToWord, 
  exportStudentSlipToExcel, 
  exportStudentSlipToPDF 
} from '../../utils/exportDocs';

interface StudentSlipDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  violations: ViolationRecord[];
  schoolConfig: SchoolProfile;
  onOpenRecordViolation: (studentId: string) => void;
  onOpenSurat: (violation: ViolationRecord) => void;
  onDeleteViolation?: (violationId: string) => void;
}

export const StudentSlipDetailModal: React.FC<StudentSlipDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  violations,
  schoolConfig,
  onOpenRecordViolation,
  onOpenSurat,
  onDeleteViolation,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'document'>('timeline');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'pelanggaran' | 'ketidakhadiran'>('all');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const todayStr = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date());
    } catch {
      return new Date().toLocaleDateString('id-ID');
    }
  }, []);

  // Listen for real-time attendance saves or changes across tabs/windows
  const [attendanceRefreshKey, setAttendanceRefreshKey] = useState(0);
  useEffect(() => {
    const handleRefresh = () => setAttendanceRefreshKey((k) => k + 1);
    window.addEventListener('storage', handleRefresh);
    window.addEventListener('bsan_attendance_saved', handleRefresh);
    return () => {
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener('bsan_attendance_saved', handleRefresh);
    };
  }, []);

  // Filter student violations and sort newest first safely
  const studentViolations = useMemo(() => {
    if (!student) return [];
    return (violations || [])
      .filter((v) => 
        v && (
          v.studentId === student.id || 
          (v.studentName?.trim().toLowerCase() === student.nama?.trim().toLowerCase() && v.kelas === student.kelas) ||
          (student.nama && v.studentName?.trim().toLowerCase() === student.nama?.trim().toLowerCase())
        )
      )
      .sort((a, b) => {
        const dateA = a.tanggal ? new Date(a.tanggal).getTime() : 0;
        const dateB = b.tanggal ? new Date(b.tanggal).getTime() : 0;
        return dateB - dateA;
      });
  }, [violations, student]);

  // Dynamically calculate accurate violation counts from real-time studentViolations list
  const countRingan = useMemo(() => {
    const fromList = studentViolations.filter((v) => v.tingkat === 'Ringan').length;
    return Math.max(fromList, student?.totalPelanggaranRingan || 0);
  }, [studentViolations, student]);

  const countSedang = useMemo(() => {
    const fromList = studentViolations.filter((v) => v.tingkat === 'Sedang').length;
    return Math.max(fromList, student?.totalPelanggaranSedang || 0);
  }, [studentViolations, student]);

  const countBerat = useMemo(() => {
    const fromList = studentViolations.filter((v) => v.tingkat === 'Berat').length;
    return Math.max(fromList, student?.totalPelanggaranBerat || 0);
  }, [studentViolations, student]);

  // Extract all attendance absence records (Sakit, Izin, Alfa) for this student
  const studentAbsences = useMemo(() => {
    if (!student) return [];
    const sheets = getStoredAttendanceSheets();
    const list: Array<{
      id: string;
      date: string;
      time: string;
      status: 'Sakit' | 'Izin' | 'Alfa';
      kelas: string;
      keterangan: string;
      recordedBy: string;
    }> = [];

    const datesSeen = new Set<string>();

    sheets.forEach((sheet) => {
      if (!sheet || !Array.isArray(sheet.entries)) return;
      const entry = sheet.entries.find(
        (e) => e && (
          e.studentId === student.id || 
          (student.nisn && e.nisn === student.nisn) || 
          (e.nama && student.nama && e.nama.trim().toLowerCase() === student.nama.trim().toLowerCase())
        )
      );
      if (entry && entry.status) {
        if (entry.status !== 'Hadir') {
          let timeStr = '07:30';
          if (sheet.recordedAt) {
            const parts = sheet.recordedAt.split(' ');
            if (parts.length > 1) timeStr = parts[1];
          }
          list.push({
            id: `att-${sheet.id}-${student.id}`,
            date: sheet.date,
            time: timeStr.includes('WIB') ? timeStr : `${timeStr} WIB`,
            status: entry.status as 'Sakit' | 'Izin' | 'Alfa',
            kelas: sheet.kelas,
            keterangan: entry.keterangan || (entry.status === 'Alfa' ? 'Tanpa surat keterangan' : `Keterangan ${entry.status}`),
            recordedBy: sheet.recordedBy || 'Wali Kelas / Guru Piket',
          });
        }
        datesSeen.add(sheet.date);
      }
    });

    // Also check current student.statusKehadiran if not Hadir
    if (student.statusKehadiran && student.statusKehadiran !== 'Hadir') {
      const todayYMD = getRealtimeDateYMD();
      if (!datesSeen.has(todayYMD)) {
        list.push({
          id: `att-today-${student.id}`,
          date: todayYMD,
          time: '07:30 WIB',
          status: student.statusKehadiran as 'Sakit' | 'Izin' | 'Alfa',
          kelas: student.kelas,
          keterangan: student.keteranganKehadiran || (student.statusKehadiran === 'Alfa' ? 'Tanpa surat keterangan' : `Status ${student.statusKehadiran}`),
          recordedBy: 'Presensi Terkini',
        });
      }
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [student, attendanceRefreshKey]);

  // Real-time resolved attendance status for this student from attendance sheets + student record
  const currentAttendance = useMemo(() => {
    if (!student) return { status: 'Hadir', keterangan: 'Hadir Mengikuti KBM', dateLabel: 'Hari Ini' };
    const todayStr = getRealtimeDateYMD();
    const sheets = getStoredAttendanceSheets();

    // 1. Check if there is an entry in today's attendance sheet for this class
    const todaySheet = sheets.find((s) => s && s.kelas === student.kelas && s.date === todayStr);
    if (todaySheet && Array.isArray(todaySheet.entries)) {
      const entry = todaySheet.entries.find(
        (e) => e && (
          e.studentId === student.id || 
          (student.nisn && e.nisn === student.nisn) || 
          (e.nama && student.nama && e.nama.trim().toLowerCase() === student.nama.trim().toLowerCase())
        )
      );
      if (entry && entry.status) {
        return {
          status: entry.status,
          keterangan: entry.keterangan || (entry.status === 'Hadir' ? 'Hadir Mengikuti KBM' : `Keterangan ${entry.status}`),
          dateLabel: 'Hari Ini',
        };
      }
    }

    // 2. Check studentAbsences (all non-Hadir entries across recorded sheets)
    if (studentAbsences.length > 0) {
      const todayAbs = studentAbsences.find((a) => a.date === todayStr);
      if (todayAbs) {
        return {
          status: todayAbs.status,
          keterangan: todayAbs.keterangan,
          dateLabel: 'Hari Ini',
        };
      }
      const latestAbs = studentAbsences[0];
      const classSheets = sheets
        .filter((s) => s && s.kelas === student.kelas && Array.isArray(s.entries))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (classSheets.length > 0 && classSheets[0].date === latestAbs.date) {
        return {
          status: latestAbs.status,
          keterangan: `${latestAbs.keterangan} (${latestAbs.date})`,
          dateLabel: latestAbs.date === todayStr ? 'Hari Ini' : latestAbs.date,
        };
      }
    }

    // 3. Fallback to student.statusKehadiran if not Hadir
    if (student.statusKehadiran && student.statusKehadiran !== 'Hadir') {
      return {
        status: student.statusKehadiran,
        keterangan: student.keteranganKehadiran || `Status ${student.statusKehadiran}`,
        dateLabel: 'Hari Ini',
      };
    }

    return {
      status: 'Hadir',
      keterangan: student.keteranganKehadiran || 'Hadir Mengikuti KBM',
      dateLabel: 'Hari Ini',
    };
  }, [student, studentAbsences, attendanceRefreshKey]);

  // Combined Unified Timeline (Violations + Absences)
  const unifiedTimelineEvents = useMemo(() => {
    const events: Array<{
      id: string;
      type: 'pelanggaran' | 'ketidakhadiran';
      date: string;
      time: string;
      timestamp: number;
      title: string;
      category: 'Berat' | 'Sedang' | 'Ringan' | 'Alfa' | 'Sakit' | 'Izin';
      badgeLabel: string;
      badgeStyle: string;
      nodeColor: string;
      description: string;
      location: string;
      officer: string;
      notes?: string;
      tahapPembinaan?: string;
      violation?: ViolationRecord;
      absenceStatus?: 'Alfa' | 'Sakit' | 'Izin';
    }> = [];

    studentViolations.forEach((v) => {
      const isBerat = v.tingkat === 'Berat';
      const isSedang = v.tingkat === 'Sedang';
      events.push({
        id: `viol-${v.id}`,
        type: 'pelanggaran',
        date: v.tanggal,
        time: v.waktu ? `${v.waktu} WIB` : '07:30 WIB',
        timestamp: new Date(v.tanggal || '').getTime() || 0,
        title: `${v.kodePasal} - ${v.pasalTitle}`,
        category: v.tingkat as any,
        badgeLabel: `Pelanggaran ${v.tingkat}`,
        badgeStyle: isBerat
          ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
          : isSedang
          ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
          : 'bg-blue-100 text-blue-800 border-blue-200 font-semibold',
        nodeColor: isBerat
          ? 'border-rose-600 ring-rose-100'
          : isSedang
          ? 'border-amber-500 ring-amber-100'
          : 'border-blue-600 ring-blue-100',
        description: v.uraian,
        location: v.lokasi || 'Lingkungan Sekolah',
        officer: v.guruPencatat || 'Tim Kesiswaan',
        notes: v.catatanKhusus,
        tahapPembinaan: v.tahapPembinaan || 'Pembinaan Wali Kelas & BK',
        violation: v,
      });
    });

    studentAbsences.forEach((a) => {
      const isAlfa = a.status === 'Alfa';
      const isSakit = a.status === 'Sakit';
      events.push({
        id: a.id,
        type: 'ketidakhadiran',
        date: a.date,
        time: a.time,
        timestamp: new Date(a.date).getTime() || 0,
        title: `Ketidakhadiran: ${a.status.toUpperCase()}`,
        category: a.status,
        badgeLabel: `Presensi: ${a.status}`,
        badgeStyle: isAlfa
          ? 'bg-red-100 text-red-800 border-red-300 font-black'
          : isSakit
          ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
          : 'bg-sky-100 text-sky-800 border-sky-300 font-bold',
        nodeColor: isAlfa
          ? 'border-red-600 ring-red-100'
          : isSakit
          ? 'border-amber-500 ring-amber-100'
          : 'border-sky-500 ring-sky-100',
        description: `Siswa tercatat tidak hadir (${a.status}) pada presensi harian Kelas ${a.kelas}.${a.keterangan ? ` Keterangan: ${a.keterangan}` : ''}`,
        location: `Ruang Kelas ${a.kelas}`,
        officer: a.recordedBy,
        notes: a.keterangan,
        tahapPembinaan: a.status === 'Alfa' ? 'Konfirmasi Orang Tua / Surat Panggilan Wali Kelas' : 'Pencatatan Rekap Presensi Rombel',
        absenceStatus: a.status,
      });
    });

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }, [studentViolations, studentAbsences]);

  // Filtered timeline based on user choice
  const displayedTimelineEvents = useMemo(() => {
    if (timelineFilter === 'pelanggaran') {
      return unifiedTimelineEvents.filter((e) => e.type === 'pelanggaran');
    }
    if (timelineFilter === 'ketidakhadiran') {
      return unifiedTimelineEvents.filter((e) => e.type === 'ketidakhadiran');
    }
    return unifiedTimelineEvents;
  }, [unifiedTimelineEvents, timelineFilter]);

  if (!isOpen || !student) return null;

  const hasBerat = countBerat > 0;
  const hasSedang = countSedang > 0;
  const hasRingan = countRingan > 0;

  // Disciplinary status label purely based on Ringan, Sedang, Berat (No points)
  const getDisciplineStatus = () => {
    if (hasBerat) {
      return { 
        label: 'Peringatan Khusus / Sidang Kesiswaan (Tingkat Berat)', 
        subtext: 'Penanganan khusus Kepala Sekolah & pemanggilan orang tua',
        bg: 'bg-rose-50 text-rose-900 border-rose-300',
        badgeBg: 'bg-rose-600 text-white',
        icon: <AlertOctagon className="w-4 h-4 text-rose-600" />
      };
    }
    if (hasSedang) {
      return { 
        label: 'Perhatian Khusus / Konseling BK (Tingkat Sedang)', 
        subtext: 'Membutuhkan kontrak perilaku & bimbingan intensif',
        bg: 'bg-amber-50 text-amber-900 border-amber-300',
        badgeBg: 'bg-amber-600 text-white',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600" />
      };
    }
    if (hasRingan) {
      return { 
        label: 'Tingkat Pembinaan Ringan', 
        subtext: 'Dalam pendampingan wali kelas & guru piket',
        bg: 'bg-blue-50 text-blue-800 border-blue-200',
        badgeBg: 'bg-blue-600 text-white',
        icon: <Info className="w-4 h-4 text-blue-600" />
      };
    }
    return { 
      label: 'Sangat Disiplin (Nihil Catatan)', 
      subtext: 'Mempertahankan integritas dan kepatuhan standar BSAN',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badgeBg: 'bg-emerald-600 text-white',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />
    };
  };

  const discipline = getDisciplineStatus();

  const handlePrintSlip = () => {
    if (activeTab !== 'document') {
      setActiveTab('document');
      setTimeout(() => {
        window.print();
      }, 200);
    } else {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      const printArea = document.getElementById('student-slip-printable-area');
      const res = await exportStudentSlipToPDF(student, violations, schoolConfig, printArea);
      if (res?.blobUrl) {
        setPdfDownloadUrl(res.blobUrl);
      }
    } catch (err) {
      console.error('Error generating PDF slip', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadWord = () => {
    exportStudentSlipToWord(student, violations, schoolConfig);
  };

  const handleDownloadExcel = () => {
    exportStudentSlipToExcel(student, violations, schoolConfig);
  };

  const attendanceWa = generateAttendanceMessage(student);
  const attendanceWaUrl = getWhatsAppUrl(student.noWaOrtu, attendanceWa);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[94vh] flex flex-col">
        {/* Modal Top Header Bar */}
        <div className="no-print bg-gradient-to-r from-[#1E3A8A] via-[#3451B2] to-[#3B5BDB] px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center font-bold shadow-inner">
              <User className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">
                  Slip Kedisiplinan & Rapor Pelanggaran Siswa
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-white/20 text-white font-bold">
                  {student.kelas} · {student.nisn}
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Sistem Terpadu Budaya Sekolah Aman dan Nyaman {schoolConfig.shortName || 'GRISAKA'} (Kab. Temanggung)
              </p>
            </div>
          </div>

          {/* View Tab Switcher & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl text-xs">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'timeline'
                    ? 'bg-white text-[#3B5BDB] font-bold shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Linimasa</span>
              </button>

              <button
                onClick={() => setActiveTab('document')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'document'
                    ? 'bg-white text-[#3B5BDB] font-bold shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Lembar Rapor</span>
              </button>
            </div>

            {/* Multi-Format Direct Downloads: Word, PDF, Excel, Cetak */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
              title="Unduh langsung dokumen resmi dalam format PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'PDF...' : 'PDF'}</span>
            </button>

            <button
              onClick={handleDownloadWord}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
              title="Unduh Rapor Siswa dalam format Word (.doc) resmi dengan Kop Surat"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Word</span>
            </button>

            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
              title="Unduh Rekapitulasi Pelanggaran dalam format Excel (.csv)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            <button
              onClick={handlePrintSlip}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              title="Cetak langsung ke mesin printer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Automatic PDF Download Notification Banner */}
        {pdfDownloadUrl && (
          <div className="bg-[#1E3A8A] border-b border-blue-800 text-white px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-300 animate-ping"></span>
              <span className="font-semibold text-blue-100">
                File PDF resmi telah diproses dan diunduh secara otomatis.
              </span>
            </div>
            <a
              href={pdfDownloadUrl}
              download={`Rapor_Disiplin_${student.nama.replace(/\s+/g, '_')}_${student.kelas}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-[#3B5BDB] hover:bg-blue-50 font-bold rounded-lg transition-transform active:scale-95 text-[11px] shadow-xs"
            >
              <span>Buka / Unduh Ulang PDF</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Modal Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 bg-slate-50/60">
          {activeTab === 'timeline' && (
            /* TAB 1: INTERACTIVE DOSSIER & PELANGGARAN HISTORY TIMELINE */
            <div className="space-y-6">
              {/* Student Identity Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#3B5BDB] text-white flex items-center justify-center text-2xl font-black shadow-md shrink-0">
                    {student.nama.charAt(0)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        {student.nama}
                      </h2>
                      <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-[#3B5BDB] text-white">
                        Kelas {student.kelas}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                      <span>NISN: <strong className="font-mono text-slate-800">{student.nisn}</strong></span>
                      <span>·</span>
                      <span>Jenjang {student.jenjang} SMP</span>
                      <span>·</span>
                      <span>{student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-col sm:items-end gap-1.5 w-full md:w-auto">
                  <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border text-xs font-semibold ${discipline.bg}`}>
                    {discipline.icon}
                    <span>{discipline.label}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Status Presensi ({currentAttendance.dateLabel}):{' '}
                    <span className={`font-bold ${
                      currentAttendance.status === 'Hadir' 
                        ? 'text-emerald-700' 
                        : currentAttendance.status === 'Sakit'
                        ? 'text-amber-700'
                        : currentAttendance.status === 'Izin'
                        ? 'text-sky-700'
                        : 'text-red-700'
                    }`}>
                      {currentAttendance.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 KPI Metric Cards (Zero Points) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className={`p-4 rounded-2xl shadow-xs text-white transition-all ${
                  currentAttendance.status === 'Hadir'
                    ? 'bg-gradient-to-br from-emerald-700 to-teal-800'
                    : currentAttendance.status === 'Sakit'
                    ? 'bg-gradient-to-br from-amber-600 to-amber-700'
                    : currentAttendance.status === 'Izin'
                    ? 'bg-gradient-to-br from-sky-600 to-blue-700'
                    : 'bg-gradient-to-br from-red-600 to-rose-800'
                }`}>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-white/80">Presensi ({currentAttendance.dateLabel})</div>
                  <div className="text-2xl font-black font-mono mt-1">{currentAttendance.status}</div>
                  <div className="text-[11px] text-white/90 truncate mt-0.5" title={currentAttendance.keterangan}>
                    {currentAttendance.keterangan}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-700 to-cyan-800 text-white p-4 rounded-2xl shadow-xs">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200">Kasus Ringan</div>
                  <div className="text-2xl font-black font-mono mt-1">{countRingan}</div>
                  <div className="text-[11px] text-blue-100 mt-0.5">Teguran & Buku Piket</div>
                </div>

                <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-white p-4 rounded-2xl shadow-xs">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-200">Kasus Sedang</div>
                  <div className="text-2xl font-black font-mono mt-1">{countSedang}</div>
                  <div className="text-[11px] text-amber-100 mt-0.5">Konseling Guru BK</div>
                </div>

                <div className="bg-gradient-to-br from-rose-700 to-red-900 text-white p-4 rounded-2xl shadow-xs">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-rose-200">Kasus Berat</div>
                  <div className="text-2xl font-black font-mono mt-1">{countBerat}</div>
                  <div className="text-[11px] text-rose-100 mt-0.5">Kepala Sekolah & Tim Terpadu</div>
                </div>
              </div>

              {/* Personal Dossier & Parent Guardian Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3 text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Domisili & Kontak Siswa</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Alamat Rumah:</span>
                      <span className="font-semibold text-slate-900 leading-relaxed">{student.alamat}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Nomor Telepon / Seluler Siswa:</span>
                      <span className="font-mono text-slate-900 font-semibold">{student.noHpSiswa || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3 text-xs flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span>Data Orang Tua / Wali Murid</span>
                    </div>

                    <div className="space-y-2 mt-2">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Nama Orang Tua / Wali:</span>
                        <span className="font-bold text-slate-900 text-sm">{student.namaOrtu}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">Nomor WhatsApp Wali:</span>
                        <span className="font-mono font-bold text-slate-900">{student.noWaOrtu}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <a
                      href={attendanceWaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Hubungi Orang Tua via WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Multi-Format Export Quick Action Banner */}
              <div className="bg-gradient-to-r from-[#1E3A8A] via-[#3451B2] to-[#3B5BDB] p-5 rounded-3xl text-white shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border border-white/20">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-300 animate-pulse"></span>
                    <h4 className="font-bold text-sm tracking-tight text-white">
                      Unduh Berkas & Slip Kedisiplinan Siswa
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/20 text-white font-bold">
                      Format Resmi Temanggung
                    </span>
                  </div>
                  <p className="text-xs text-blue-100 leading-relaxed max-w-xl">
                    Dilengkapi Kop Surat resmi (Pemerintah Kab. Temanggung), data identitas, rekapitulasi status BSAN, tabel riwayat kasus, dan lembar pengesahan tanda tangan.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isExportingPdf}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                    title="Unduh Slip Lengkap dalam format PDF resmi"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{isExportingPdf ? 'Memproses PDF...' : 'Unduh PDF'}</span>
                  </button>

                  <button
                    onClick={handleDownloadWord}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                    title="Unduh Dokumen Word (.doc) lengkap dengan Kop Surat"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Unduh Word (.doc)</span>
                  </button>

                  <button
                    onClick={handleDownloadExcel}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                    title="Unduh Rekapitulasi Pelanggaran dalam format Excel (.csv)"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Unduh Excel (.csv)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('document')}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
                    title="Buka Pratinjau Lembar Rapor Resmi"
                  >
                    <Printer className="w-4 h-4 text-blue-200" />
                    <span>Lihat Lembar</span>
                  </button>
                </div>
              </div>

              {/* DEDICATED UNIFIED 'PELANGGARAN & KETIDAKHADIRAN' TIMELINE */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#3B5BDB]/10 text-[#3B5BDB] flex items-center justify-center font-bold">
                      <Layers className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        Linimasa Rekam Jejak Pelanggaran & Ketidakhadiran
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Kronologi peristiwa tata tertib (Ringan, Sedang, Berat) & kehadiran (Sakit, Izin, Alfa) peserta didik
                      </p>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto text-xs">
                    <button
                      type="button"
                      onClick={() => setTimelineFilter('all')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                        timelineFilter === 'all'
                          ? 'bg-[#3B5BDB] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua ({unifiedTimelineEvents.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimelineFilter('pelanggaran')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                        timelineFilter === 'pelanggaran'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      Pelanggaran ({studentViolations.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimelineFilter('ketidakhadiran')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                        timelineFilter === 'ketidakhadiran'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      Ketidakhadiran ({studentAbsences.length})
                    </button>
                  </div>
                </div>

                {displayedTimelineEvents.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div className="font-bold text-slate-800 text-sm">
                      Nihil Catatan Peristiwa
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Peserta didik ini memiliki rekam jejak perilaku disiplin yang prima serta kepatuhan penuh terhadap standar BSAN.
                    </p>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-200 ml-4 space-y-5 py-2">
                    {displayedTimelineEvents.map((evt) => {
                      const isViolation = evt.type === 'pelanggaran';
                      const v = evt.violation;

                      return (
                        <div key={evt.id} className="relative pl-6 group">
                          {/* Timeline node dot */}
                          <div
                            className={`absolute -left-[9px] top-2 w-4 h-4 rounded-full border-2 bg-white ring-4 ${evt.nodeColor}`}
                          />

                          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-2.5">
                            {/* Header event date & badge */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{evt.date}</span>
                                </span>
                                <span className="text-slate-400">·</span>
                                <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{evt.time}</span>
                                </span>
                                <span className="text-slate-400">·</span>
                                <span className="text-xs text-slate-600 italic">Lokasi: {evt.location}</span>
                              </div>

                              <span
                                className={`text-[10px] px-2.5 py-0.5 rounded-full border ${evt.badgeStyle}`}
                              >
                                {evt.badgeLabel}
                              </span>
                            </div>

                            {/* Title & Description */}
                            <div className="space-y-1">
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                {isViolation && v ? (
                                  <span className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-xs border border-emerald-200 font-bold">
                                    {v.kodePasal}
                                  </span>
                                ) : (
                                  <span className="font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-xs border border-amber-200 font-bold">
                                    ABSENSI
                                  </span>
                                )}
                                <span>{evt.title}</span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-200/70">
                                {evt.description}
                              </p>
                            </div>

                            {/* Notes if any */}
                            {evt.notes && (
                              <div className="text-[11px] text-amber-900 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 italic">
                                <strong>Catatan Khusus:</strong> {evt.notes}
                              </div>
                            )}

                            {/* Footer: Stage & Action buttons */}
                            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                              <div className="space-y-0.5">
                                <div className="text-[11px] text-slate-500">
                                  Tahap Pembinaan: <strong className="text-slate-900 font-bold">{evt.tahapPembinaan}</strong>
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Petugas Pencatat: {evt.officer}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {isViolation && v && onDeleteViolation && (
                                  confirmDeleteId === v.id ? (
                                    <div className="flex items-center gap-1.5 bg-rose-100 p-1 rounded-xl">
                                      <span className="text-[10px] text-rose-800 font-bold px-1">Yakin hapus?</span>
                                      <button
                                        onClick={() => {
                                          onDeleteViolation(v.id);
                                          setConfirmDeleteId(null);
                                        }}
                                        className="px-2 py-0.5 bg-rose-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                      >
                                        Ya
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                                      >
                                        Batal
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmDeleteId(v.id)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                                      title="Hapus Catatan Kasus Ini Secara Manual"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Hapus</span>
                                    </button>
                                  )
                                )}

                                {isViolation && v && (
                                  <button
                                    onClick={() => {
                                      onClose();
                                      onOpenSurat(v);
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#3B5BDB] hover:bg-[#2F4CB7] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-white" />
                                    <span>Buka Surat Resmi</span>
                                  </button>
                                )}

                                {!isViolation && student.noWaOrtu && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const text = generateAttendanceMessage(student);
                                      const url = getWhatsAppUrl(student.noWaOrtu, text);
                                      window.open(url, '_blank');
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                    title="Kirim konfirmasi ketidakhadiran ke WhatsApp Orang Tua"
                                  >
                                    <Send className="w-3.5 h-3.5 text-white" />
                                    <span>Kirim Notifikasi WA</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PRATINJAU LEMBAR RAPOR RESMI (PRINT-READY PREVIEW) - Always mounted in DOM for 100% identical PDF & Word export */}
          <div
            className={
              activeTab === 'document'
                ? 'flex flex-col items-center space-y-4'
                : 'fixed -left-[9999px] top-0 opacity-0 pointer-events-none w-[794px]'
            }
          >
            {/* Document View Top Action Bar */}
            <div className="no-print bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs max-w-[210mm] w-full flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800">
                      Pratinjau Lembar Rapor Resmi
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Sesuai standar cetak A4 Bimbingan Konseling & Kesiswaan SMPN 1 Kandangan
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isExportingPdf}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                    title="Unduh langsung lembar ini sebagai dokumen PDF"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isExportingPdf ? 'Memproses PDF...' : 'Unduh PDF'}</span>
                  </button>

                  <button
                    onClick={handleDownloadWord}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                    title="Unduh Lembar dalam format Word (.doc) lengkap dengan Kop Surat"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Unduh Word (.doc)</span>
                  </button>

                  <button
                    onClick={handleDownloadExcel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                    title="Unduh Rekapitulasi Data dalam format Excel (.csv)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Unduh Excel (.csv)</span>
                  </button>

                  <button
                    onClick={handlePrintSlip}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                    title="Cetak lembar langsung ke printer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Lembar</span>
                  </button>
                </div>
              </div>

              {/* Printable Paper Area (A4) */}
              <div id="student-slip-printable-area" className="print-area bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-10 lg:p-12 shadow-xl rounded-2xl border border-slate-300 font-serif leading-relaxed text-xs">
                {/* Official School Letterhead (Kop Surat) - PEMKAB TEMANGGUNG */}
                <div className="border-b-[3px] border-double border-black pb-4 mb-6 text-center flex items-center justify-between gap-4">
                  <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                    {schoolConfig.logoUrl ? (
                      <img
                        src={schoolConfig.logoUrl}
                        alt="Logo Sekolah"
                        className="max-h-16 max-w-16 object-contain"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full border-2 border-slate-900 flex flex-col items-center justify-center font-serif font-black text-slate-900 bg-slate-50 text-[10px] leading-tight">
                        <span className="font-sans font-extrabold text-[9px] text-[#1E3A8A]">KAB</span>
                        <span>TMG</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center font-serif">
                    <div className="text-xs uppercase tracking-wider font-bold text-black">PEMERINTAH KABUPATEN TEMANGGUNG</div>
                    <div className="text-xs uppercase tracking-wider font-bold text-black">DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA</div>
                    <div className="text-lg sm:text-xl font-black uppercase tracking-wide text-black mt-0.5">
                      {schoolConfig.name || 'SMP NEGERI 1 KANDANGAN'} ({schoolConfig.shortName || 'GRISAKA'})
                    </div>
                    <div className="text-[11px] text-black mt-0.5 font-sans">
                      NPSN: {schoolConfig.npsn || '20321456'} · Status Akreditasi: {schoolConfig.accreditation || 'A'}
                    </div>
                    <div className="text-[10.5px] text-black">
                      {schoolConfig.address || 'Jl. Raya Kandangan'}, {schoolConfig.city || 'Kabupaten Temanggung'} · Jawa Tengah {schoolConfig.postalCode || '56281'}
                    </div>
                    <div className="text-[9.5px] text-black font-sans">
                      Telp: {schoolConfig.phone || '-'} · Website: {schoolConfig.website || '-'} · Email: {schoolConfig.email || '-'}
                    </div>
                  </div>

                  <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full border-2 border-slate-900 flex flex-col items-center justify-center font-serif font-black text-slate-900 bg-slate-50 text-[9px] leading-tight text-center">
                      <span className="font-sans text-[8px] text-[#1E3A8A] font-bold">BSAN</span>
                      <span className="text-[10px]">GRISAKA</span>
                    </div>
                  </div>
                </div>

                {/* Report Document Title */}
                <div className="text-center mb-6">
                  <div className="text-base font-bold uppercase underline tracking-wide">
                    LEMBAR KONTROL & RAPOR KEDISIPLINAN SISWA (BSAN)
                  </div>
                  <div className="text-xs font-sans text-slate-600 mt-1">
                    Dokumen Resmi Bimbingan Konseling & Kesiswaan · Dicetak pada: {todayStr}
                  </div>
                </div>

                {/* Student Personal Dossier Table */}
                <div className="border border-black p-4 mb-6 font-sans text-xs bg-slate-50/50">
                  <div className="font-bold uppercase text-[11px] mb-2 border-b border-black pb-1">
                    I. IDENTITAS PESERTA DIDIK
                  </div>
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="w-44 py-1 font-semibold text-slate-600">Nama Lengkap Siswa</td>
                        <td className="w-4 py-1">:</td>
                        <td className="py-1 font-bold text-slate-900 text-sm">{student.nama}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold text-slate-600">Nomor Induk Siswa Nasional (NISN)</td>
                        <td className="py-1">:</td>
                        <td className="py-1 font-mono font-bold">{student.nisn}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold text-slate-600">Kelas / Jenjang Pendidikan</td>
                        <td className="py-1">:</td>
                        <td className="py-1">Kelas {student.kelas} / Jenjang {student.jenjang} SMP</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold text-slate-600">Jenis Kelamin</td>
                        <td className="py-1">:</td>
                        <td className="py-1">{student.gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold text-slate-600">Nama Orang Tua / Wali</td>
                        <td className="py-1">:</td>
                        <td className="py-1 font-bold">{student.namaOrtu}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold text-slate-600">No. WhatsApp Orang Tua / Wali</td>
                        <td className="py-1">:</td>
                        <td className="py-1 font-mono">{student.noWaOrtu}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold text-slate-600">Alamat Rumah Tinggal</td>
                        <td className="py-1">:</td>
                        <td className="py-1">{student.alamat}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Disciplinary Summary Ledger - ZERO POINTS */}
                <div className="border border-black mb-6 font-sans text-xs">
                  <div className="bg-slate-100 p-2 font-bold uppercase text-[11px] border-b border-black">
                    II. REKAPITULASI STATUS KEDISIPLINAN PESERTA DIDIK
                  </div>
                  <div className="grid grid-cols-4 text-center divide-x divide-black p-3">
                    <div>
                      <div className="text-[10px] text-slate-600 uppercase font-bold">Presensi Harian</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">{currentAttendance.status}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-600 uppercase font-bold">Pelanggaran Ringan</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">{countRingan} Kasus</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-600 uppercase font-bold">Pelanggaran Sedang</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">{countSedang} Kasus</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-600 uppercase font-bold">Pelanggaran Berat</div>
                      <div className={`text-base font-bold mt-0.5 ${hasBerat ? 'text-red-700' : 'text-slate-900'}`}>
                        {countBerat} Kasus
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Violations Ledger Table - ZERO POINTS */}
                <div className="font-sans mb-8">
                  <div className="font-bold text-xs uppercase mb-2">
                    III. DAFTAR RIWAYAT PELANGGARAN TATA TERTIB RESMI
                  </div>
                  <table className="w-full border-collapse border border-black text-[11px]">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black p-1.5 text-center w-8">No</th>
                        <th className="border border-black p-1.5 text-center w-28">Waktu & Tempat</th>
                        <th className="border border-black p-1.5 text-left">Pasal & Deskripsi Pelanggaran</th>
                        <th className="border border-black p-1.5 text-center w-20">Klasifikasi</th>
                        <th className="border border-black p-1.5 text-left w-48">Bentuk Pembinaan & SOP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentViolations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="border border-black p-4 text-center text-slate-500 italic">
                            Nihil catatan pelanggaran tata tertib. Siswa tercatat mematuhi norma BSAN dengan baik.
                          </td>
                        </tr>
                      ) : (
                        studentViolations.map((v, i) => (
                          <tr key={v.id}>
                            <td className="border border-black p-1.5 text-center font-mono">{i + 1}</td>
                            <td className="border border-black p-1.5 text-center">
                              <div>{v.tanggal}</div>
                              <div className="text-[10px] text-slate-600 font-mono">{v.waktu} WIB</div>
                              <div className="text-[10px] italic">{v.lokasi}</div>
                            </td>
                            <td className="border border-black p-1.5">
                              <strong>{v.kodePasal} - {v.pasalTitle}:</strong> {v.uraian}
                              {v.catatanKhusus && (
                                <div className="text-[10px] text-slate-600 italic mt-0.5">
                                  Catatan: {v.catatanKhusus}
                                </div>
                              )}
                            </td>
                            <td className="border border-black p-1.5 text-center font-semibold">{v.tingkat}</td>
                            <td className="border border-black p-1.5 text-[10px]">
                              <div className="font-semibold">{v.tahapPembinaan}</div>
                              <div className="text-slate-600">Oleh: {v.guruPencatat}</div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Formal Signatures Block */}
                <div className="font-sans text-xs pt-4 border-t border-black">
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    <div>
                      Mengetahui,<br />
                      <strong>Orang Tua / Wali</strong>
                      <div className="h-16"></div>
                      <div className="font-bold underline">( {student.namaOrtu} )</div>
                    </div>

                    <div>
                      Mengetahui,<br />
                      <strong>{schoolConfig.bkTitle || 'Guru BK / Konselor'}</strong>
                      <div className="h-16"></div>
                      <div className="font-bold underline">( {schoolConfig.bkName || 'Sri Wahyuni, S.Pd., M.Si.'} )</div>
                      <div className="text-[10px] text-slate-600 font-mono">NIP. {schoolConfig.bkNip || '19780824 200501 2 008'}</div>
                    </div>

                    <div>
                      Mengetahui,<br />
                      <strong>{schoolConfig.timKesiswaanTitle || 'Tim Kesiswaan'}</strong>
                      <div className="h-16"></div>
                      <div className="font-bold underline">( {schoolConfig.timKesiswaanName || schoolConfig.wakasekName || 'Drs. Subagyo, M.Pd.'} )</div>
                      <div className="text-[10px] text-slate-600 font-mono">NIP. {schoolConfig.timKesiswaanNip || schoolConfig.wakasekNip || '19700315 199601 1 002'}</div>
                    </div>

                    <div>
                      Kandangan, {todayStr}<br />
                      <strong>Kepala Sekolah</strong>
                      <div className="h-16"></div>
                      <div className="font-bold underline">
                        ( {schoolConfig.principalName || 'Yuliana Dewi Marithawati, S.Pd., M.Pd.'} )
                      </div>
                      <div className="text-[10px] text-slate-600 font-mono">
                        NIP. {schoolConfig.principalNip || '19740512 199802 2 003'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};
