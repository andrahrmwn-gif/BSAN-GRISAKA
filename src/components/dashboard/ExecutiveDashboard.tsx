import React, { useState, useEffect, useMemo } from 'react';
import { Student, ViolationRecord, ViewMode, SchoolProfile, AttendanceStatus } from '../../types';
import { KELAS_LIST } from '../../data/schoolConfig';
import { sortByClassAndName } from '../../utils/sortUtils';
import { exportToCSV } from '../../utils/exportDocs';
import { getWhatsAppUrl, generateAttendanceMessage } from '../../utils/whatsapp';
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  GraduationCap, 
  Layers, 
  Calendar, 
  Clock, 
  CloudSun, 
  MapPin, 
  Megaphone, 
  ClipboardCheck, 
  ArrowUpRight, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  X, 
  ExternalLink, 
  FileText, 
  CalendarCheck,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Award,
  Plus,
  Trash2,
  Edit3,
  Volume2,
  Bell,
  Play
} from 'lucide-react';
import { getDateAttendanceSummary, getStoredAttendanceSheets } from '../../services/attendanceStorage';
import { 
  getStoredActivities, 
  addActivity, 
  updateActivity, 
  deleteActivity, 
  getActivityNotificationStatus, 
  SchoolActivity 
} from '../../services/announcementService';
import { playSchoolChimeSound } from '../../utils/soundNotification';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ExecutiveDashboardProps {
  students: Student[];
  violations: ViolationRecord[];
  schoolConfig: SchoolProfile;
  onNavigate: (view: ViewMode) => void;
  onOpenQuickViolation: () => void;
  onSelectStudentProfile: (student: Student) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  students,
  violations,
  schoolConfig,
  onNavigate,
  onOpenQuickViolation,
  onSelectStudentProfile,
}) => {
  // Historical / Anytime Attendance Date Selection State (Cek Setiap Saat)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Chart & List filter state
  const [chartPeriodFilter, setChartPeriodFilter] = useState<'harian' | 'bulanan'>('harian');
  const [chartMetricType, setChartMetricType] = useState<'jumlah' | 'persen'>('jumlah');
  const [absentStatusFilter, setAbsentStatusFilter] = useState<'all' | 'Sakit' | 'Izin' | 'Alfa'>('all');
  const [absentPeriodFilter, setAbsentPeriodFilter] = useState<'today' | 'month'>('today');

  // Interactive Student Modal State (triggered by KPI click or "Lihat Semua")
  const [selectedKpiStatus, setSelectedKpiStatus] = useState<AttendanceStatus | 'TidakHadir' | null>(null);
  const [statusSearchQuery, setStatusSearchQuery] = useState('');
  const [statusClassFilter, setStatusClassFilter] = useState<string>('all');

  // Real-time large clock state for home executive dashboard KPI matching Gambar 2
  const [timeState, setTimeState] = useState({
    day: '',
    date: '',
    time: '',
    seconds: '',
  });

  // School Activities / Announcements state & sound notifications (H-5 s/d Hari H)
  const [activities, setActivities] = useState<SchoolActivity[]>(() => getStoredActivities());
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<SchoolActivity | null>(null);
  const [activityForm, setActivityForm] = useState({
    title: '',
    date: todayStr,
    time: '07.00 WITA',
    location: 'SMPN 1 Kandangan',
    description: '',
  });
  const [isChimePlaying, setIsChimePlaying] = useState(false);

  // Play sound on mount if any activity is active (H-5 s/d Hari H) and listen to activity changes
  useEffect(() => {
    const refreshActivities = () => {
      const list = getStoredActivities();
      setActivities(list);
    };

    refreshActivities();
    window.addEventListener('bsan_activities_changed', refreshActivities);

    const list = getStoredActivities();
    const hasActiveEvent = list.some((a) => {
      const st = getActivityNotificationStatus(a);
      return st.shouldNotify;
    });

    if (hasActiveEvent) {
      const timer = setTimeout(() => {
        playSchoolChimeSound();
      }, 1500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('bsan_activities_changed', refreshActivities);
      };
    }

    return () => {
      window.removeEventListener('bsan_activities_changed', refreshActivities);
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const day = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(now);
      const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
      const hoursMinutes = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);

      setTimeState({
        day,
        date,
        time: hoursMinutes,
        seconds: String(now.getSeconds()).padStart(2, '0'),
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Formatted date string for selectedDate
  const selectedDateFormatted = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const isToday = selectedDate === todayStr;

  // Date Navigation Handlers (Prev Day, Next Day, Today, Yesterday)
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

  // Filtered Students & Unified Date-Driven Attendance Calculations
  const totalStudents = students.length;

  const dateAttendance = useMemo(() => {
    return getDateAttendanceSummary(selectedDate, students);
  }, [selectedDate, students]);

  const hadirCount = dateAttendance.hadirCount;
  const sakitCount = dateAttendance.sakitCount;
  const izinCount = dateAttendance.izinCount;
  const alfaCount = dateAttendance.alfaCount;
  const tidakHadirCount = dateAttendance.tidakHadirCount;

  const percentHadirNum = dateAttendance.percentHadir;
  const percentHadirStr = percentHadirNum.toFixed(2).replace('.', ',');

  const percentTidakHadirNum = totalStudents > 0 ? (tidakHadirCount / totalStudents) * 100 : 0;
  const percentTidakHadirStr = percentTidakHadirNum.toFixed(2).replace('.', ',');

  // Violations Metrics
  const totalRingan = useMemo(() => {
    return violations.filter((v) => v.tingkat === 'Ringan').length;
  }, [violations]);

  const totalSedang = useMemo(() => {
    return violations.filter((v) => v.tingkat === 'Sedang').length;
  }, [violations]);

  const totalBerat = useMemo(() => {
    return violations.filter((v) => v.tingkat === 'Berat').length;
  }, [violations]);

  // Absent students list for Middle Card 2 (Filtered for selectedDate)
  const absentStudentsList = useMemo(() => {
    let list = dateAttendance.studentRecords
      .filter((rec) => {
        if (rec.status === 'Hadir') return false;
        if (absentStatusFilter !== 'all' && rec.status !== absentStatusFilter) return false;
        return true;
      })
      .map((rec) => ({
        ...rec.student,
        statusKehadiran: rec.status,
        keteranganKehadiran: rec.keterangan,
      }));

    return sortByClassAndName(list);
  }, [dateAttendance, absentStatusFilter]);

  // Data for "Grafik Kehadiran Siswa Per Kelas" (24 Classes 7A - 9H) integrated with student counts
  const classAttendanceChartData = useMemo(() => {
    if (chartPeriodFilter === 'harian') {
      return dateAttendance.classData.map((c) => ({
        ...c,
        barHadir: chartMetricType === 'jumlah' ? c.hadir : c.hadirPct,
        barTidakHadir: chartMetricType === 'jumlah' ? c.tidakHadir : c.tidakHadirPct,
      }));
    }

    // Monthly aggregation across all attendance sheets of the selected month
    const allSheets = getStoredAttendanceSheets();
    const currentYearMonth = selectedDate.substring(0, 7);
    const monthSheets = allSheets.filter((s) => s.date.startsWith(currentYearMonth));

    return KELAS_LIST.map((cls) => {
      const clsSheets = monthSheets.filter((s) => s.kelas === cls);
      const classStudents = students.filter((s) => s.kelas === cls);
      const totalRombel = classStudents.length || 36;

      let hadir = 0;
      let sakit = 0;
      let izin = 0;
      let alfa = 0;
      const sheetCount = clsSheets.length;

      if (sheetCount > 0) {
        clsSheets.forEach((s) => {
          hadir += s.summary.hadir;
          sakit += s.summary.sakit;
          izin += s.summary.izin;
          alfa += s.summary.alfa;
        });

        const avgHadir = Math.round(hadir / sheetCount);
        const avgSakit = Math.round(sakit / sheetCount);
        const avgIzin = Math.round(izin / sheetCount);
        const avgAlfa = Math.round(alfa / sheetCount);
        const avgTidakHadir = avgSakit + avgIzin + avgAlfa;
        const total = totalRombel;
        const hadirPct = total > 0 ? Math.round((avgHadir / total) * 100) : 100;
        const tidakHadirPct = 100 - hadirPct;

        return {
          kelas: cls,
          total,
          hadir: avgHadir,
          tidakHadir: avgTidakHadir,
          sakit: avgSakit,
          izin: avgIzin,
          alfa: avgAlfa,
          hadirPct,
          tidakHadirPct,
          barHadir: chartMetricType === 'jumlah' ? avgHadir : hadirPct,
          barTidakHadir: chartMetricType === 'jumlah' ? avgTidakHadir : tidakHadirPct,
          Hadir: chartMetricType === 'jumlah' ? avgHadir : hadirPct,
          TidakHadir: chartMetricType === 'jumlah' ? avgTidakHadir : tidakHadirPct,
          hadirCount: avgHadir,
          tidakHadirCount: avgTidakHadir,
        };
      }

      // Fallback to day data if no monthly sheets exist yet
      const dayClass = dateAttendance.classData.find((c) => c.kelas === cls);
      const dHadir = dayClass?.hadir ?? totalRombel;
      const dTidakHadir = dayClass?.tidakHadir ?? 0;
      const dHadirPct = dayClass?.hadirPct ?? 100;
      const dTidakHadirPct = dayClass?.tidakHadirPct ?? 0;

      return {
        kelas: cls,
        total: totalRombel,
        hadir: dHadir,
        tidakHadir: dTidakHadir,
        sakit: dayClass?.sakit ?? 0,
        izin: dayClass?.izin ?? 0,
        alfa: dayClass?.alfa ?? 0,
        hadirPct: dHadirPct,
        tidakHadirPct: dTidakHadirPct,
        barHadir: chartMetricType === 'jumlah' ? dHadir : dHadirPct,
        barTidakHadir: chartMetricType === 'jumlah' ? dTidakHadir : dTidakHadirPct,
        Hadir: chartMetricType === 'jumlah' ? dHadir : dHadirPct,
        TidakHadir: chartMetricType === 'jumlah' ? dTidakHadir : dTidakHadirPct,
        hadirCount: dHadir,
        tidakHadirCount: dTidakHadir,
      };
    });
  }, [dateAttendance, chartPeriodFilter, chartMetricType, selectedDate, students]);

  // Donut chart data for Prosentasi Kehadiran for selectedDate
  const donutData = useMemo(() => {
    return [
      { name: 'Hadir', value: hadirCount, color: '#10B981' },
      { name: 'Tidak Hadir', value: tidakHadirCount, color: '#EF4444' },
    ];
  }, [hadirCount, tidakHadirCount]);

  // Filtered and sorted students for the clicked attendance KPI modal for selectedDate
  const selectedStatusStudents = useMemo(() => {
    if (!selectedKpiStatus) return [];

    let list = dateAttendance.studentRecords
      .filter((rec) => {
        if (selectedKpiStatus === 'TidakHadir') {
          return rec.status !== 'Hadir';
        }
        return rec.status === selectedKpiStatus;
      })
      .map((rec) => ({
        ...rec.student,
        statusKehadiran: rec.status,
        keteranganKehadiran: rec.keterangan,
      }));

    if (statusClassFilter !== 'all') {
      list = list.filter((s) => s.kelas === statusClassFilter);
    }

    if (statusSearchQuery.trim()) {
      const q = statusSearchQuery.toLowerCase().trim();
      list = list.filter((s) =>
        s.nama.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q) ||
        s.kelas.toLowerCase().includes(q) ||
        (s.alamat && s.alamat.toLowerCase().includes(q)) ||
        (s.keteranganKehadiran && s.keteranganKehadiran.toLowerCase().includes(q))
      );
    }

    return sortByClassAndName(list);
  }, [dateAttendance, selectedKpiStatus, statusClassFilter, statusSearchQuery]);

  // Export list of students to Excel
  const handleExportStatusListToExcel = () => {
    if (!selectedKpiStatus || selectedStatusStudents.length === 0) return;

    const exportData = selectedStatusStudents.map((s, idx) => ({
      No: idx + 1,
      NISN: s.nisn,
      'Nama Siswa': s.nama,
      Kelas: s.kelas,
      'L/P': s.gender,
      'Status Kehadiran': s.statusKehadiran || 'Hadir',
      Keterangan: s.keteranganKehadiran || '-',
      Alamat: s.alamat || '-',
      'Nama Orang Tua': s.namaOrtu || '-',
      'No WA Ortu': s.noWaOrtu || '-',
    }));

    const statusLabel = selectedKpiStatus === 'TidakHadir' ? 'Tidak_Hadir' : selectedKpiStatus;
    const filename = `Daftar_Siswa_${statusLabel}_${schoolConfig.shortName || 'GRISAKA'}_${selectedDate}`;
    exportToCSV(exportData, filename);
  };

  // Activity Management Handlers
  const handleOpenAddActivity = () => {
    setEditingActivity(null);
    setActivityForm({
      title: '',
      date: todayStr,
      time: '07.00 WITA',
      location: 'SMPN 1 Kandangan',
      description: '',
    });
    setIsActivityModalOpen(true);
  };

  const handleOpenEditActivity = (act: SchoolActivity) => {
    setEditingActivity(act);
    setActivityForm({
      title: act.title,
      date: act.startDate || act.date || todayStr,
      time: act.time || '',
      location: act.location || '',
      description: act.description || '',
    });
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityForm.title.trim() || !activityForm.date) return;

    if (editingActivity) {
      const updated = updateActivity(editingActivity.id, {
        title: activityForm.title.trim(),
        date: activityForm.date,
        time: activityForm.time.trim(),
        location: activityForm.location.trim(),
        description: activityForm.description.trim(),
      });
      setActivities(updated);
    } else {
      const updated = addActivity({
        title: activityForm.title.trim(),
        date: activityForm.date,
        time: activityForm.time.trim(),
        location: activityForm.location.trim(),
        description: activityForm.description.trim(),
      });
      setActivities(updated);
    }
    setIsActivityModalOpen(false);
  };

  const handleDeleteActivity = (id: string, title: string) => {
    if (window.confirm(`Yakin ingin menghapus agenda kegiatan "${title}"?`)) {
      const updated = deleteActivity(id);
      setActivities(updated);
    }
  };

  const handleTriggerChime = () => {
    setIsChimePlaying(true);
    playSchoolChimeSound();
    setTimeout(() => setIsChimePlaying(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* =========================================================================
          ROW 1: HERO EXECUTIVE BANNER (Matching Gambar 2 with Gambar 1 Tone)
      ========================================================================= */}
      <div className="bg-gradient-to-r from-[#172554] via-[#1E3A8A] to-[#2563EB] text-white rounded-3xl p-5 lg:p-7 shadow-lg border border-blue-900/40 relative overflow-hidden">
        {/* Subtle decorative glowing mesh in background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 left-1/3 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-center">
          {/* Left Block: Hari, Tanggal & Real-Time Digital Clock */}
          <div className="md:col-span-3 bg-black/25 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col justify-center">
            <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">
              Hari, Tanggal
            </span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {timeState.day || 'Selasa'}
            </div>
            <div className="text-xs text-blue-100 font-medium">
              {timeState.date || '20 Mei 2025'}
            </div>

            <div className="mt-3 pt-3 border-t border-white/15 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                {timeState.time || '10:24:36'}
              </span>
              <span className="text-xs font-bold text-blue-200">WIB</span>
            </div>
          </div>

          {/* Center Block: Large School Title & Slogan */}
          <div className="md:col-span-6 text-center space-y-2.5 px-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white uppercase drop-shadow-sm">
              {schoolConfig.name || 'SMPN 1 KANDANGAN'}
            </h1>

            <div className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs sm:text-sm font-black tracking-wider uppercase shadow-xs">
              BERAKHLAK MULIA, BERPRESTASI, BERBUDAYA
            </div>

            <div className="text-[11px] text-blue-200 flex items-center justify-center gap-1.5 pt-1">
              <MapPin className="w-3.5 h-3.5 text-blue-300" />
              <span>Kecamatan Kandangan, Kabupaten Temanggung, Jawa Tengah</span>
            </div>
          </div>

          {/* Right Block: Cuaca Saat Ini (Temanggung BMKG) */}
          <div className="md:col-span-3 bg-black/25 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">
                  Cuaca Saat Ini
                </div>
                <div className="text-xs font-medium text-white truncate max-w-[130px]">
                  Kandangan, Temanggung
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                <CloudSun className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">29°C</span>
              <span className="text-xs font-semibold text-blue-100">Cerah Berawan</span>
            </div>

            <div className="mt-2.5 pt-2 border-t border-white/10 grid grid-cols-3 text-center text-[10px] text-blue-200">
              <div>
                <span className="block text-white font-bold">72%</span>
                <span>Kelembapan</span>
              </div>
              <div>
                <span className="block text-white font-bold">12 km/j</span>
                <span>Angin</span>
              </div>
              <div>
                <span className="block text-white font-bold">0 mm</span>
                <span>Curah Hujan</span>
              </div>
            </div>

            <div className="text-[9px] text-right text-blue-300/80 mt-1">
              • Sumber: BMKG
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: TOP 5 KPI STATISTICAL METRIC CARDS (Exact Layout from Gambar 2)
      ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
        {/* KPI 1: Total Siswa */}
        <div 
          onClick={() => onNavigate('students')}
          className="bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] text-white p-4 sm:p-5 rounded-2xl border border-white/20 shadow-md shadow-blue-900/20 hover:scale-[1.02] transition-all cursor-pointer group flex items-center gap-3.5"
          title="Buka Database Siswa Terpusat"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shadow-inner shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-blue-100 uppercase tracking-wider block truncate">Total Siswa</span>
            <div className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {totalStudents}
            </div>
            <span className="text-[11px] font-bold text-blue-200 block truncate">Siswa Aktif</span>
          </div>
        </div>

        {/* KPI 2: Hadir Hari Ini */}
        <button
          type="button"
          onClick={() => {
            setSelectedKpiStatus('Hadir');
            setStatusClassFilter('all');
            setStatusSearchQuery('');
          }}
          className="bg-gradient-to-br from-[#065F46] via-[#059669] to-[#10B981] text-white p-4 sm:p-5 rounded-2xl border border-white/20 shadow-md shadow-emerald-900/20 hover:scale-[1.02] transition-all cursor-pointer group flex items-center gap-3.5 text-left active:scale-98"
          title="Klik untuk melihat daftar seluruh siswa yang Hadir hari ini"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shadow-inner shrink-0 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider block truncate">Hadir Hari Ini</span>
            <div className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {hadirCount}
            </div>
            <span className="text-[11px] font-black text-emerald-100 block truncate">
              {percentHadirStr}%
            </span>
          </div>
        </button>

        {/* KPI 3: Tidak Hadir */}
        <button
          type="button"
          onClick={() => {
            setSelectedKpiStatus('TidakHadir');
            setStatusClassFilter('all');
            setStatusSearchQuery('');
          }}
          className="bg-gradient-to-br from-[#9A3412] via-[#EA580C] to-[#F97316] text-white p-4 sm:p-5 rounded-2xl border border-white/20 shadow-md shadow-orange-900/20 hover:scale-[1.02] transition-all cursor-pointer group flex items-center gap-3.5 text-left active:scale-98"
          title="Klik untuk melihat daftar seluruh siswa yang Tidak Hadir (Sakit, Izin, Alpa)"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shadow-inner shrink-0 group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-orange-100 uppercase tracking-wider block truncate">Tidak Hadir</span>
            <div className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {tidakHadirCount}
            </div>
            <span className="text-[11px] font-black text-orange-100 block truncate">
              {percentTidakHadirStr}%
            </span>
          </div>
        </button>

        {/* KPI 4: Guru & Tendik */}
        <div 
          className="bg-gradient-to-br from-[#581C87] via-[#7E22CE] to-[#A855F7] text-white p-4 sm:p-5 rounded-2xl border border-white/20 shadow-md shadow-purple-900/20 hover:scale-[1.02] transition-all flex items-center gap-3.5"
          title="Total Guru dan Tenaga Kependidikan DAPODIK"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shadow-inner shrink-0">
            <GraduationCap className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-purple-100 uppercase tracking-wider block truncate">Guru & Tendik</span>
            <div className="text-2xl sm:text-3xl font-black text-white leading-tight">
              45
            </div>
            <span className="text-[11px] font-bold text-purple-200 block truncate">Petugas Resmi</span>
          </div>
        </div>

        {/* KPI 5: Kelas (24 Rombel) */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="bg-gradient-to-br from-[#0E7490] via-[#0891B2] to-[#06B6D4] text-white p-4 sm:p-5 rounded-2xl border border-white/20 shadow-md shadow-cyan-900/20 hover:scale-[1.02] transition-all cursor-pointer group flex items-center gap-3.5"
          title="24 Rombel (Kelas 7A - 9H)"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shadow-inner shrink-0 group-hover:scale-105 transition-transform">
            <Layers className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-cyan-100 uppercase tracking-wider block truncate">Kelas</span>
            <div className="text-2xl sm:text-3xl font-black text-white leading-tight">
              24
            </div>
            <span className="text-[11px] font-bold text-cyan-200 block truncate">7A - 9H</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2B: 2 DEDICATED QUICK-ACTION COMMAND CARDS (Distinct Wide Banner Model)
          Positioned below the 5 stats KPIs with custom shape and direct CTAs
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* ACTION CARD 1: Catat Pelanggaran Siswa */}
        <div 
          onClick={onOpenQuickViolation}
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#881337] via-[#9F1239] to-[#E11D48] text-white p-5 sm:p-6 border border-rose-400/40 shadow-lg shadow-rose-950/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[160px]"
        >
          {/* Subtle decorative background watermarks */}
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
          <div className="absolute bottom-0 right-10 w-24 h-24 bg-black/10 rounded-full blur-xl pointer-events-none"></div>

          <div>
            {/* Top Bar: Module Tag & Status Badge */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-rose-100 backdrop-blur-xs border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-300 animate-ping"></span>
                Modul Ketertiban & Poin Siswa
              </span>
              <span className="text-[11px] font-bold text-rose-200 hidden sm:inline-block">
                Ringan • Sedang • Berat
              </span>
            </div>

            {/* Main Content: Icon & Title */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-lg shadow-black/20 shrink-0 border border-white/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <ShieldAlert className="w-7 h-7 stroke-[2.3]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight flex items-center gap-2">
                  <span>Catat Pelanggaran Siswa</span>
                </h3>
                <p className="text-xs sm:text-sm text-rose-100/90 font-medium mt-1 leading-relaxed line-clamp-2">
                  Formulir input pelanggaran tata tertib, hitung poin sanksi otomatis, panggilan orang tua, serta cetak surat pernyataan.
                </p>
              </div>
            </div>
          </div>

          {/* Action CTA Button at Bottom */}
          <div className="mt-4 pt-3.5 border-t border-white/20 flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-200">
              Total {totalRingan + totalSedang + totalBerat} Kasus Aktif
            </span>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-rose-900 font-black text-xs shadow-md group-hover:bg-rose-50 transition-colors">
              <span>Buka Form Pelanggaran</span>
              <span className="text-sm font-bold group-hover:translate-x-1 transition-transform">➔</span>
            </div>
          </div>
        </div>

        {/* ACTION CARD 2: Catat Kehadiran Siswa */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4338CA] text-white p-5 sm:p-6 border border-indigo-400/40 shadow-lg shadow-indigo-950/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[160px]"
        >
          {/* Subtle decorative background watermarks */}
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
          <div className="absolute bottom-0 right-10 w-24 h-24 bg-black/10 rounded-full blur-xl pointer-events-none"></div>

          <div>
            {/* Top Bar: Module Tag & Status Badge */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-indigo-100 backdrop-blur-xs border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Presensi 24 Rombel (7A - 9H)
              </span>
              <span className="text-[11px] font-bold text-indigo-200 hidden sm:inline-block">
                Tandai Hadir Otomatis
              </span>
            </div>

            {/* Main Content: Icon & Title */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-lg shadow-black/20 shrink-0 border border-white/30 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <CalendarCheck className="w-7 h-7 stroke-[2.3]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight flex items-center gap-2">
                  <span>Catat Kehadiran Siswa</span>
                </h3>
                <p className="text-xs sm:text-sm text-indigo-100/90 font-medium mt-1 leading-relaxed line-clamp-2">
                  Input kehadiran harian kelas 7A - 9H, verifikasi izin & sakit, serta kirim laporan presensi otomatis via WhatsApp orang tua.
                </p>
              </div>
            </div>
          </div>

          {/* Action CTA Button at Bottom */}
          <div className="mt-4 pt-3.5 border-t border-white/20 flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-200">
              {percentHadirStr}% Kehadiran ({hadirCount} Hadir)
            </span>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-950 font-black text-xs shadow-md group-hover:bg-indigo-50 transition-colors">
              <span>Buka Presensi Rombel</span>
              <span className="text-sm font-bold group-hover:translate-x-1 transition-transform">➔</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2B: INFORMASI PRESENSI ROMBEL - 4 INTERACTIVE KPIS & HISTORICAL DATE CONTROLS
          (Cek Kehadiran Setiap Saat: Hari Ini, Kemarin, atau Tanggal Terdahulu)
      ========================================================================= */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#3B5BDB] text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                  Informasi Presensi Rombel
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-[#3B5BDB]">
                  24 Rombel
                </span>
                <span className="text-[11px] text-slate-400">·</span>
                <span className="text-xs font-semibold text-slate-700">
                  {selectedDateFormatted}
                </span>
                {isToday && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Hari Ini
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau kehadiran setiap saat & tanggal terdahulu · Klik salah satu dari 4 KPI di bawah untuk melihat daftar siswa
              </p>
            </div>
          </div>

          {/* Quick Date Navigator Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-all cursor-pointer active:scale-95"
                title="Hari Sebelumnya (H-1)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1 text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                title="Pilih tanggal presensi yang ingin dicek"
              />
              <button
                type="button"
                onClick={handleNextDay}
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-all cursor-pointer active:scale-95"
                title="Hari Berikutnya (H+1)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleGoToday}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isToday
                  ? 'bg-[#3B5BDB] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Hari Ini
            </button>

            <button
              type="button"
              onClick={handleGoYesterday}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              Kemarin
            </button>
          </div>
        </div>

        {/* 4 Attendance KPI Interactive Cards matching user request */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. KPI Hadir */}
          <button
            type="button"
            onClick={() => {
              setSelectedKpiStatus('Hadir');
              setStatusClassFilter('all');
              setStatusSearchQuery('');
            }}
            className="bg-emerald-50/70 hover:bg-emerald-100/90 border border-emerald-200/90 rounded-2xl p-4 text-left transition-all hover:shadow-md cursor-pointer group active:scale-98"
            title="Klik untuk melihat daftar anak yang Hadir pada tanggal ini"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                Hadir (H)
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-900 leading-tight">
              {hadirCount} <span className="text-xs font-medium text-emerald-700">Siswa</span>
            </div>
            <div className="mt-1 text-[11px] font-bold text-emerald-700 flex items-center justify-between">
              <span>{percentHadirStr}% Kehadiran</span>
              <span className="text-[10px] font-semibold underline group-hover:text-emerald-900">
                Lihat Data →
              </span>
            </div>
          </button>

          {/* 2. KPI Sakit */}
          <button
            type="button"
            onClick={() => {
              setSelectedKpiStatus('Sakit');
              setStatusClassFilter('all');
              setStatusSearchQuery('');
            }}
            className="bg-blue-50/70 hover:bg-blue-100/90 border border-blue-200/90 rounded-2xl p-4 text-left transition-all hover:shadow-md cursor-pointer group active:scale-98"
            title="Klik untuk melihat daftar anak yang Sakit pada tanggal ini"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                Sakit (S)
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-blue-900 leading-tight">
              {sakitCount} <span className="text-xs font-medium text-blue-700">Siswa</span>
            </div>
            <div className="mt-1 text-[11px] font-bold text-blue-700 flex items-center justify-between">
              <span>Surat / Keterangan</span>
              <span className="text-[10px] font-semibold underline group-hover:text-blue-900">
                Lihat Data →
              </span>
            </div>
          </button>

          {/* 3. KPI Izin */}
          <button
            type="button"
            onClick={() => {
              setSelectedKpiStatus('Izin');
              setStatusClassFilter('all');
              setStatusSearchQuery('');
            }}
            className="bg-amber-50/70 hover:bg-amber-100/90 border border-amber-200/90 rounded-2xl p-4 text-left transition-all hover:shadow-md cursor-pointer group active:scale-98"
            title="Klik untuk melihat daftar anak yang Izin pada tanggal ini"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                Izin (I)
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <ClipboardCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-900 leading-tight">
              {izinCount} <span className="text-xs font-medium text-amber-700">Siswa</span>
            </div>
            <div className="mt-1 text-[11px] font-bold text-amber-700 flex items-center justify-between">
              <span>Izin Resmi</span>
              <span className="text-[10px] font-semibold underline group-hover:text-amber-900">
                Lihat Data →
              </span>
            </div>
          </button>

          {/* 4. KPI Alpa */}
          <button
            type="button"
            onClick={() => {
              setSelectedKpiStatus('Alfa');
              setStatusClassFilter('all');
              setStatusSearchQuery('');
            }}
            className="bg-rose-50/70 hover:bg-rose-100/90 border border-rose-200/90 rounded-2xl p-4 text-left transition-all hover:shadow-md cursor-pointer group active:scale-98"
            title="Klik untuk melihat daftar anak yang Alpa pada tanggal ini"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wide">
                Alpa (A)
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-900 leading-tight">
              {alfaCount} <span className="text-xs font-medium text-rose-700">Siswa</span>
            </div>
            <div className="mt-1 text-[11px] font-bold text-rose-700 flex items-center justify-between">
              <span>Tanpa Keterangan</span>
              <span className="text-[10px] font-semibold underline group-hover:text-rose-900">
                Lihat Data →
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* =========================================================================
          ROW 3: MIDDLE GRID (3 Cards: Grafik Kelas, Siswa Tidak Hadir, Prosentasi)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1 (5 cols): Grafik Kehadiran Siswa Per Kelas (24 Rombel) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Grafik Kehadiran Siswa Per Kelas
                </h3>
                <p className="text-[11px] text-slate-500">
                  24 Rombel (7A - 9H) · {chartPeriodFilter === 'harian' ? selectedDateFormatted : 'Bulan Ini'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Mode Selector: Jumlah Siswa vs Persentase */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setChartMetricType('jumlah')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      chartMetricType === 'jumlah'
                        ? 'bg-white text-[#1E3A8A] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Tampilkan grafik dalam jumlah siswa (orang)"
                  >
                    Jumlah (Orang)
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetricType('persen')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      chartMetricType === 'persen'
                        ? 'bg-white text-[#1E3A8A] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Tampilkan grafik dalam persentase (%)"
                  >
                    Persentase (%)
                  </button>
                </div>

                <select
                  value={chartPeriodFilter}
                  onChange={(e) => setChartPeriodFilter(e.target.value as any)}
                  className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="harian">Hari ini</option>
                  <option value="bulanan">Bulan ini</option>
                </select>
              </div>
            </div>

            {/* Custom Legend & Info */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-600 mt-3 mb-2 px-1">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#10B981]"></span>
                  <span className="font-semibold text-slate-800">
                    {chartMetricType === 'jumlah' ? 'Masuk (Hadir)' : 'Hadir (%)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#EF4444]"></span>
                  <span className="font-semibold text-slate-800">
                    {chartMetricType === 'jumlah' ? 'Tidak Masuk' : 'Tidak Hadir (%)'}
                  </span>
                </div>
              </div>

              <span className="text-[11px] font-semibold text-slate-500">
                {chartMetricType === 'jumlah' 
                  ? 'Skala: Jumlah Siswa per Kelas' 
                  : 'Skala: 0% - 100%'}
              </span>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={classAttendanceChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="kelas" 
                    tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }} 
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis 
                    domain={chartMetricType === 'persen' ? [0, 100] : [0, 'dataMax + 4']} 
                    tick={{ fontSize: 10, fill: '#64748B' }} 
                    tickFormatter={(v) => chartMetricType === 'persen' ? `${v}%` : `${v}`}
                  />
                  <Tooltip 
                    formatter={(value: any, name: any, item: any) => {
                      const p = item.payload;
                      if (name === 'barHadir') {
                        return [`${p.hadir} Siswa (${p.hadirPct}%)`, 'Masuk (Hadir)'];
                      }
                      return [
                        `${p.tidakHadir} Siswa (${p.tidakHadirPct}%) [S: ${p.sakit}, I: ${p.izin}, A: ${p.alfa}]`,
                        'Tidak Masuk'
                      ];
                    }}
                    labelFormatter={(label) => {
                      const item = classAttendanceChartData.find(c => c.kelas === label);
                      return `Kelas ${label} (Total: ${item?.total || 36} Siswa)`;
                    }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="barHadir" name="barHadir" stackId="a" fill="#10B981" />
                  <Bar dataKey="barTidakHadir" name="barTidakHadir" stackId="a" fill="#EF4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Card 2 (4 cols): Daftar Siswa Tidak Hadir */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <h3 className="font-bold text-slate-900 text-sm truncate">
                Daftar Siswa Tidak Hadir
              </h3>

              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  value={absentStatusFilter}
                  onChange={(e) => setAbsentStatusFilter(e.target.value as any)}
                  className="text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Izin">Izin</option>
                  <option value="Alfa">Alpa</option>
                </select>

                <select
                  value={absentPeriodFilter}
                  onChange={(e) => setAbsentPeriodFilter(e.target.value as any)}
                  className="text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="today">Hari Ini</option>
                  <option value="month">Bulan Ini</option>
                </select>
              </div>
            </div>

            {/* Scrollable Mini Table */}
            <div className="mt-3 overflow-x-auto max-h-60 no-scrollbar">
              {absentStudentsList.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-800">100% Seluruh Siswa Hadir</p>
                  <p className="text-[11px] text-slate-500">Nihil siswa tidak hadir pada filter ini.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] text-slate-400 uppercase font-mono tracking-wider border-b border-slate-100">
                      <th className="py-1.5 px-2">Nama Siswa</th>
                      <th className="py-1.5 px-1.5 text-center">Kelas</th>
                      <th className="py-1.5 px-2">Status</th>
                      <th className="py-1.5 px-2">Alamat</th>
                      <th className="py-1.5 px-2">No. WA Ortu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {absentStudentsList.slice(0, 5).map((student) => {
                      const status = student.statusKehadiran || 'Alfa';
                      const waMsg = generateAttendanceMessage(student);
                      const waUrl = getWhatsAppUrl(student.noWaOrtu, waMsg);

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {student.nama.charAt(0)}
                              </div>
                              <span className="font-semibold text-slate-800 truncate max-w-[100px]" title={student.nama}>
                                {student.nama}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-1.5 text-center font-bold font-mono text-[11px] text-slate-700">
                            {student.kelas}
                          </td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              status === 'Sakit' ? 'bg-blue-100 text-blue-800' :
                              status === 'Izin' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {status === 'Alfa' ? 'Tidak Hadir' : status}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-[11px] text-slate-500 truncate max-w-[90px]" title={student.alamat}>
                            {student.alamat || 'Kandangan'}
                          </td>
                          <td className="py-2 px-2 font-mono text-[10px] text-slate-600">
                            {student.noWaOrtu && student.noWaOrtu !== '-' ? (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#3B5BDB] hover:underline flex items-center gap-0.5"
                                title="Kirim WA ke Orang Tua"
                              >
                                <span>{student.noWaOrtu}</span>
                              </a>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-right">
            <button
              onClick={() => {
                setSelectedKpiStatus('TidakHadir');
                setStatusClassFilter('all');
                setStatusSearchQuery('');
              }}
              className="text-xs font-bold text-[#3B5BDB] hover:text-[#2563EB] inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Lihat Semua</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3 (3 cols): Prosentasi Kehadiran */}
        <div className="lg:col-span-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Prosentasi Kehadiran
              </h3>
              <p className="text-[11px] text-slate-500">Persentase Hari Ini</p>
            </div>

            {/* Donut Chart with Center Percentage */}
            <div className="relative h-44 w-full flex items-center justify-center my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any, name: any) => [`${val} siswa`, name]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Absolute Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-900 leading-tight">
                  {percentHadirStr}%
                </span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Hadir
                </span>
              </div>
            </div>

            {/* Summary Metrics */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                  <span className="text-slate-600">Hadir</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {hadirCount} siswa ({percentHadirStr}%)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
                  <span className="text-slate-600">Tidak Hadir</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {tidakHadirCount} siswa ({percentTidakHadirStr}%)
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Total Siswa:</span>
            <span className="font-mono font-black text-slate-900">{totalStudents}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 4: BOTTOM GRID (3 Cards: Pelanggaran Siswa, Informasi, Rekomendasi)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1 (4 cols): Pelanggaran Siswa (Ringan, Sedang, Berat) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Pelanggaran Siswa
                </h3>
                <p className="text-[11px] text-slate-500">Klasifikasi Buku Kontrol & Sanksi</p>
              </div>
              <button
                onClick={() => onNavigate('violations')}
                className="text-[11px] font-bold text-[#3B5BDB] hover:underline"
              >
                Buku Catatan
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mt-4">
              {/* Ringan */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 text-center flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-800 uppercase block">Ringan</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto my-2">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black font-mono text-amber-900">
                    {totalRingan}
                  </div>
                  <span className="text-[10px] text-amber-700 font-medium">Kasus</span>
                </div>
                <button
                  onClick={() => onNavigate('violations')}
                  className="mt-3 text-[10px] font-bold text-amber-800 hover:underline block cursor-pointer"
                >
                  Lihat Detail
                </button>
              </div>

              {/* Sedang */}
              <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-3 text-center flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-orange-800 uppercase block">Sedang</span>
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mx-auto my-2">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black font-mono text-orange-900">
                    {totalSedang}
                  </div>
                  <span className="text-[10px] text-orange-700 font-medium">Kasus</span>
                </div>
                <button
                  onClick={() => onNavigate('violations')}
                  className="mt-3 text-[10px] font-bold text-orange-800 hover:underline block cursor-pointer"
                >
                  Lihat Detail
                </button>
              </div>

              {/* Berat */}
              <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3 text-center flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-rose-800 uppercase block">Berat</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto my-2">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black font-mono text-rose-900">
                    {totalBerat}
                  </div>
                  <span className="text-[10px] text-rose-700 font-medium">Kasus</span>
                </div>
                <button
                  onClick={() => onNavigate('violations')}
                  className="mt-3 text-[10px] font-bold text-rose-800 hover:underline block cursor-pointer"
                >
                  Lihat Detail
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Total Pelanggaran Aktif:</span>
            <span className="font-mono font-bold text-slate-900">
              {totalRingan + totalSedang + totalBerat} Kasus
            </span>
          </div>
        </div>

        {/* Card 2 (4 cols): Informasi & Pengumuman (Dynamic CRUD with H-5 to Hari H Sound Alerts) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1E3A8A] flex items-center justify-center font-bold">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    Informasi & Pengumuman
                  </h3>
                  <p className="text-[10px] text-slate-600 font-semibold">
                    Notifikasi aktif H-5 s/d Hari H
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* School Chime Button */}
                <button
                  type="button"
                  onClick={handleTriggerChime}
                  disabled={isChimePlaying}
                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-black transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Bunyikan nada bel sekolah"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>{isChimePlaying ? 'Bunyi...' : 'Bel'}</span>
                </button>

                {/* Tambah Kegiatan Button */}
                <button
                  type="button"
                  onClick={handleOpenAddActivity}
                  className="px-2.5 py-1 bg-[#1E3A8A] hover:bg-[#2563EB] text-white rounded-lg text-[10px] font-black transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                  title="Tambah agenda kegiatan sekolah baru"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>

            {/* List of Activities with Status Badges and Edit/Delete Controls */}
            <div className="mt-3.5 space-y-3 text-xs max-h-72 overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-700">Belum ada agenda kegiatan</p>
                  <button
                    type="button"
                    onClick={handleOpenAddActivity}
                    className="mt-2 text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    + Tambah Kegiatan Pertama
                  </button>
                </div>
              ) : (
                activities.map((act) => {
                  const status = getActivityNotificationStatus(act);

                  return (
                    <div 
                      key={act.id}
                      className={`p-2.5 rounded-xl border transition-all ${
                        status.isHariH
                          ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-200'
                          : status.isUpcomingAlert
                          ? 'bg-amber-50/80 border-amber-300'
                          : 'bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-slate-900 leading-tight">
                              {act.title}
                            </span>
                            {/* Alert Badge */}
                            <span 
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tight shrink-0 ${
                                status.isHariH
                                  ? 'bg-rose-600 text-white animate-pulse'
                                  : status.isUpcomingAlert
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-blue-100 text-[#1E3A8A]'
                              }`}
                            >
                              {status.badgeText}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-700 font-medium mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-800">{act.date}</span>
                            {act.time && <span>• {act.time}</span>}
                            {act.location && <span>• 📍 {act.location}</span>}
                          </div>

                          {act.description && (
                            <p className="text-[10px] text-slate-600 mt-0.5 line-clamp-2">
                              {act.description}
                            </p>
                          )}
                        </div>

                        {/* Edit and Delete Actions */}
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditActivity(act)}
                            className="p-1 hover:bg-white text-slate-500 hover:text-blue-700 rounded-md transition-colors cursor-pointer"
                            title="Edit Kegiatan"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(act.id, act.title)}
                            className="p-1 hover:bg-white text-slate-500 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                            title="Hapus Kegiatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3 text-[11px]">
            <span className="text-slate-600 font-semibold">
              Total {activities.length} Kegiatan Terjadwal
            </span>
            <button
              onClick={() => onNavigate('tatatertib')}
              className="font-bold text-[#1E3A8A] hover:text-[#2563EB] inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Tata Tertib & Sanksi</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3 (4 cols): Rekomendasi Hari Ini (Matching Gambar 2 Exact Copy) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Rekomendasi Hari Ini
              </h3>
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ClipboardCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3.5 space-y-2.5 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">Tingkatkan komunikasi dengan orang tua siswa yang sering tidak hadir.</span>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">Berikan perhatian khusus pada siswa dengan pelanggaran berulang.</span>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">Dorong guru untuk mengisi catatan harian secara rutin.</span>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">Adakan kegiatan positif untuk meningkatkan budaya disiplin.</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2 text-right">
            <button
              onClick={onOpenQuickViolation}
              className="text-xs font-bold text-[#3B5BDB] hover:text-[#2563EB] inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Catat Pelanggaran Cepat</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE MODAL: Detail Siswa per-KPI Kehadiran (Hadir / Sakit / Izin / Alpa / Tidak Hadir)
      ========================================================================= */}
      {selectedKpiStatus && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedKpiStatus(null);
          }}
        >
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className={`p-5 sm:p-6 text-white flex items-center justify-between gap-4 shrink-0 ${
              selectedKpiStatus === 'Hadir' ? 'bg-gradient-to-r from-emerald-700 to-emerald-900' :
              selectedKpiStatus === 'Sakit' ? 'bg-gradient-to-r from-blue-700 to-blue-900' :
              selectedKpiStatus === 'Izin' ? 'bg-gradient-to-r from-amber-600 to-amber-800' :
              selectedKpiStatus === 'Alfa' ? 'bg-gradient-to-r from-rose-700 to-rose-900' :
              'bg-gradient-to-r from-[#1E3A8A] to-[#3B5BDB]'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center font-black text-2xl border border-white/20 shadow-inner">
                  {selectedKpiStatus === 'Hadir' ? 'H' : selectedKpiStatus === 'Sakit' ? 'S' : selectedKpiStatus === 'Izin' ? 'I' : selectedKpiStatus === 'Alfa' ? 'A' : '!'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-white/20 font-bold">
                      INFORMASI KEHADIRAN SISWA
                    </span>
                    <span className="text-xs text-white/60">·</span>
                    <span className="text-xs text-white/90 font-medium">
                      {selectedDateFormatted}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                    {selectedKpiStatus === 'TidakHadir' 
                      ? 'Daftar Seluruh Siswa Tidak Hadir (Sakit, Izin, Alpa)' 
                      : selectedKpiStatus === 'Alfa' 
                      ? 'Daftar Siswa Alpa (Tanpa Keterangan)' 
                      : `Daftar Siswa ${selectedKpiStatus}`}
                  </h3>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedKpiStatus(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Status Tabs Inside Modal */}
            <div className="px-5 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedKpiStatus('TidakHadir')}
                className={`px-3 py-1.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  selectedKpiStatus === 'TidakHadir'
                    ? 'border-[#3B5BDB] text-[#3B5BDB] bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Tidak Hadir ({tidakHadirCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedKpiStatus('Hadir')}
                className={`px-3 py-1.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  selectedKpiStatus === 'Hadir'
                    ? 'border-emerald-600 text-emerald-700 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Hadir ({hadirCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedKpiStatus('Sakit')}
                className={`px-3 py-1.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  selectedKpiStatus === 'Sakit'
                    ? 'border-blue-600 text-blue-700 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Sakit ({sakitCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedKpiStatus('Izin')}
                className={`px-3 py-1.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  selectedKpiStatus === 'Izin'
                    ? 'border-amber-600 text-amber-700 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Izin ({izinCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedKpiStatus('Alfa')}
                className={`px-3 py-1.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  selectedKpiStatus === 'Alfa'
                    ? 'border-rose-600 text-rose-700 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Alpa ({alfaCount})
              </button>
            </div>

            {/* Toolbar: Filter Rombel, Pencarian, & Unduh */}
            <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* Class Selector Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600">Rombel:</span>
                  <select
                    value={statusClassFilter}
                    onChange={(e) => setStatusClassFilter(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="all">Semua Kelas (24 Rombel)</option>
                    {KELAS_LIST.map((cls) => (
                      <option key={cls} value={cls}>Kelas {cls}</option>
                    ))}
                  </select>
                </div>

                {/* Search input */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama siswa, NISN, atau alamat..."
                    value={statusSearchQuery}
                    onChange={(e) => setStatusSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3B5BDB] shadow-2xs"
                  />
                  {statusSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setStatusSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportStatusListToExcel}
                  disabled={selectedStatusStudents.length === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                  title="Unduh daftar ini ke format Excel / CSV (urut kelas 7A-9H & abjad A-Z)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Unduh Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedKpiStatus(null);
                    onNavigate('attendance');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#3B5BDB] hover:bg-[#2563EB] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                  title="Buka Menu Manajemen Presensi Lengkap"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Kelola Presensi</span>
                </button>
              </div>
            </div>

            {/* Content Table */}
            <div className="flex-1 overflow-auto p-4 sm:p-5">
              {selectedStatusStudents.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Tidak Ada Siswa Terdaftar</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    {statusSearchQuery || statusClassFilter !== 'all'
                      ? 'Tidak ditemukan siswa yang cocok dengan filter rombel atau kata kunci pencarian Anda.'
                      : 'Tidak ada siswa yang tercatat dalam status ini pada hari ini.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/90 text-slate-600 uppercase font-mono tracking-wider border-b border-slate-200 text-[10px]">
                        <th className="py-2.5 px-3 text-center w-12">No</th>
                        <th className="py-2.5 px-3">NISN</th>
                        <th className="py-2.5 px-4">Nama Siswa</th>
                        <th className="py-2.5 px-3 text-center">Kelas</th>
                        <th className="py-2.5 px-2 text-center">L/P</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-4">Alamat</th>
                        <th className="py-2.5 px-4">Kontak Orang Tua</th>
                        <th className="py-2.5 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedStatusStudents.map((student, idx) => {
                        const status = student.statusKehadiran || 'Hadir';
                        const waMsg = generateAttendanceMessage(student);
                        const waUrl = getWhatsAppUrl(student.noWaOrtu, waMsg);

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 text-center font-mono text-slate-500 font-semibold">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              {student.nisn}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-slate-900">
                              {student.nama}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-[#3B5BDB] text-white text-[11px]">
                                {student.kelas}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-600">
                              {student.gender}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  status === 'Hadir' ? 'bg-emerald-100 text-emerald-800' :
                                  status === 'Sakit' ? 'bg-blue-100 text-blue-800' :
                                  status === 'Izin' ? 'bg-amber-100 text-amber-800' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  {status === 'Alfa' ? 'Alpa' : status}
                                </span>
                                {student.keteranganKehadiran && (
                                  <span className="text-[11px] text-slate-600 italic">
                                    "{student.keteranganKehadiran}"
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">
                              {student.alamat || 'Kec. Kandangan, Temanggung'}
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <div className="font-medium text-slate-800">{student.namaOrtu || '-'}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">{student.noWaOrtu || '-'}</div>
                                </div>
                                {student.noWaOrtu && student.noWaOrtu !== '-' && (
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[10px] border border-emerald-200 transition-colors shrink-0"
                                    title="Kirim pesan WhatsApp ke Orang Tua"
                                  >
                                    <span>WA</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedKpiStatus(null);
                                  onSelectStudentProfile(student);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#3B5BDB] hover:bg-[#2563EB] text-white font-semibold text-[11px] transition-transform active:scale-95 cursor-pointer shadow-2xs"
                                title="Buka Slip Catatan Pelanggaran Siswa"
                              >
                                <FileText className="w-3 h-3 text-white" />
                                <span>Slip</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span className="font-medium">
                Total: <strong className="text-slate-800">{selectedStatusStudents.length}</strong> siswa ditampilkan (Urut Rombel 7A - 9H & Abjad Absen A - Z)
              </span>
              <button
                type="button"
                onClick={() => setSelectedKpiStatus(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Tambah & Edit Agenda Kegiatan / Pengumuman Sekolah
      ========================================================================= */}
      {isActivityModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setIsActivityModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#172554] via-[#1E3A8A] to-[#2563EB] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center font-bold">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    {editingActivity ? 'Ubah Agenda Kegiatan' : 'Tambah Agenda Kegiatan Baru'}
                  </h3>
                  <p className="text-[10px] text-blue-100">
                    Peringatan & suara bel aktif mulai H-5 s/d Hari H
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-blue-100 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveActivity} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nama / Judul Kegiatan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Upacara Hari Guru Nasional"
                  value={activityForm.title}
                  onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Tanggal Pelaksanaan *
                  </label>
                  <input
                    type="date"
                    required
                    value={activityForm.date}
                    onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none font-bold text-slate-900 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Waktu / Jam
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 07.00 WITA"
                    value={activityForm.time}
                    onChange={(e) => setActivityForm({ ...activityForm, time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Lokasi / Tempat Pelaksanaan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Lapangan Utama SMPN 1 Kandangan"
                  value={activityForm.location}
                  onChange={(e) => setActivityForm({ ...activityForm, location: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Keterangan Tambahan / Catatan
                </label>
                <textarea
                  rows={3}
                  placeholder="Catatan atribut seragam, pembina upacara, atau petunjuk teknis kegiatan..."
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] focus:outline-none font-medium text-slate-900 resize-none"
                />
              </div>

              {/* Information Alert Preview */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5">
                <Volume2 className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                <div className="text-[11px] text-blue-900">
                  <strong>Peringatan Suara Otomatis:</strong> Sistem akan menampilkan lencana khusus dan membunyikan bel sekolah mulai <strong>5 hari sebelum (H-5)</strong> sampai dengan <strong>Hari H</strong> pelaksanaan.
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E3A8A] hover:bg-[#2563EB] text-white rounded-xl font-black shadow-xs cursor-pointer transition-colors"
                >
                  {editingActivity ? 'Simpan Perubahan' : 'Tambahkan Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
