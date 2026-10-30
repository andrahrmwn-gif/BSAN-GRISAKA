import React, { useState, useEffect, useMemo } from 'react';
import { Student, ViolationRecord, ViewMode, SchoolProfile } from '../../types';
import { KELAS_LIST } from '../../data/schoolConfig';
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Award, 
  Clock, 
  Sparkles,
  ArrowUpRight,
  PlusCircle,
  FileText,
  Volume2,
  CloudSun,
  MapPin,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  Activity,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  Layers,
  Flame,
  AlertOctagon,
  Scale,
  Filter,
  ChevronDown,
  RotateCcw,
  Search,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
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
  // Filters: Jenjang (7, 8, 9, all) and Specific Class (7A - 9H, all)
  const [selectedJenjangFilter, setSelectedJenjangFilter] = useState<number | 'all'>('all');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState<string>('all');
  
  // Recharts visualization type: 'area' | 'bar' | 'line'
  const [chartVizType, setChartVizType] = useState<'area' | 'bar' | 'line'>('area');
  
  // Recharts timeframe: '30days' (default) | '7days' | 'monthly'
  const [trendTimeframe, setTrendTimeframe] = useState<'30days' | '7days' | 'monthly'>('30days');

  // Real-time large clock state for home executive dashboard KPI
  const [timeState, setTimeState] = useState({
    day: '',
    date: '',
    time: '',
    seconds: '',
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const day = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(now);
      const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
      const hoursMinutes = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(now);
      const seconds = String(now.getSeconds()).padStart(2, '0');

      setTimeState({
        day,
        date,
        time: hoursMinutes,
        seconds,
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize Jenjang & Class filters
  const handleSelectKelas = (kelas: string) => {
    setSelectedKelasFilter(kelas);
    if (kelas !== 'all') {
      const jenjang = parseInt(kelas.charAt(0), 10);
      if (!isNaN(jenjang)) {
        setSelectedJenjangFilter(jenjang);
      }
    }
  };

  const handleSelectJenjang = (jenjang: number | 'all') => {
    setSelectedJenjangFilter(jenjang);
    if (jenjang !== 'all' && selectedKelasFilter !== 'all') {
      const currentKelasJenjang = parseInt(selectedKelasFilter.charAt(0), 10);
      if (currentKelasJenjang !== jenjang) {
        setSelectedKelasFilter('all');
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedJenjangFilter('all');
    setSelectedKelasFilter('all');
  };

  // Filtered Students based on active filters
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchKelas = selectedKelasFilter === 'all' || s.kelas === selectedKelasFilter;
      const matchJenjang = selectedJenjangFilter === 'all' || s.jenjang === selectedJenjangFilter;
      return matchKelas && matchJenjang;
    });
  }, [students, selectedKelasFilter, selectedJenjangFilter]);

  // Filtered Violations based on active filters
  const filteredViolations = useMemo(() => {
    return violations.filter((v) => {
      const matchKelas = selectedKelasFilter === 'all' || v.kelas === selectedKelasFilter;
      let matchJenjang = true;
      if (selectedJenjangFilter !== 'all') {
        const std = students.find((s) => s.id === v.studentId);
        const j = std ? std.jenjang : (v.kelas ? parseInt(v.kelas.charAt(0), 10) : undefined);
        matchJenjang = j === selectedJenjangFilter;
      }
      return matchKelas && matchJenjang;
    });
  }, [violations, students, selectedKelasFilter, selectedJenjangFilter]);

  // Purely Disciplinary & Violation Metrics (NO ATTENDANCE METRICS)
  const totalStudents = filteredStudents.length || 1;

  // Compliance metrics (Students with 0 violations)
  const cleanStudents = filteredStudents.filter(
    (s) => s.totalPelanggaranRingan === 0 && s.totalPelanggaranSedang === 0 && s.totalPelanggaranBerat === 0
  );
  const complianceRate = ((cleanStudents.length / totalStudents) * 100).toFixed(1);
  const complianceRateNum = parseFloat(complianceRate);

  // Students requiring guidance / pembinaan (with at least 1 violation)
  const studentsInGuidance = filteredStudents.filter(
    (s) => s.totalPelanggaranRingan > 0 || s.totalPelanggaranSedang > 0 || s.totalPelanggaranBerat > 0
  );

  // Violations metrics
  const totalViolations = filteredViolations.length;
  const totalRingan = filteredViolations.filter((v) => v.tingkat === 'Ringan').length;
  const totalSedang = filteredViolations.filter((v) => v.tingkat === 'Sedang').length;
  const totalBerat = filteredViolations.filter((v) => v.tingkat === 'Berat').length;
  const selesaiCount = filteredViolations.filter((v) => v.statusSurat === 'Selesai').length;

  const resolutionRate = totalViolations > 0 
    ? ((selesaiCount / totalViolations) * 100).toFixed(1) 
    : '100.0';
  const resolutionRateNum = parseFloat(resolutionRate);

  // Multi-segment percentages for violations
  const ringanRate = totalViolations > 0 ? (totalRingan / totalViolations) * 100 : 0;
  const sedangRate = totalViolations > 0 ? (totalSedang / totalViolations) * 100 : 0;
  const beratRate = totalViolations > 0 ? (totalBerat / totalViolations) * 100 : 0;

  // Mini Donut geometry constants for KPI widgets
  const miniRadius = 22;
  const miniCircumference = 2 * Math.PI * miniRadius;

  // Class by class statistics (24 classes: 7A - 9H)
  const classStats = useMemo(() => {
    return KELAS_LIST.map((kls) => {
      const classStudents = students.filter((s) => s.kelas === kls);
      const classViolations = violations.filter((v) => v.kelas === kls);
      const ringanClass = classViolations.filter((v) => v.tingkat === 'Ringan').length;
      const sedangClass = classViolations.filter((v) => v.tingkat === 'Sedang').length;
      const beratClass = classViolations.filter((v) => v.tingkat === 'Berat').length;
      const cleanInClass = classStudents.filter(
        (s) => s.totalPelanggaranRingan === 0 && s.totalPelanggaranSedang === 0 && s.totalPelanggaranBerat === 0
      ).length;
      const jenjang = parseInt(kls.charAt(0), 10);
      const complianceRate = classStudents.length > 0 
        ? Math.round((cleanInClass / classStudents.length) * 100) 
        : 100;

      return {
        kelas: kls,
        jenjang,
        totalStudents: classStudents.length,
        cleanStudents: cleanInClass,
        complianceRate,
        violationsCount: classViolations.length,
        ringanClass,
        sedangClass,
        beratClass,
      };
    });
  }, [students, violations]);

  // Leaderboard: Top 5 classes with best discipline (Highest compliance rate & lowest violations)
  const leaderboardClasses = useMemo(() => {
    return [...classStats]
      .sort((a, b) => {
        if (b.complianceRate !== a.complianceRate) return b.complianceRate - a.complianceRate;
        return a.violationsCount - b.violationsCount;
      })
      .slice(0, 5);
  }, [classStats]);

  // Today Attendance Metrics for Executive Dashboard
  const todayAttendanceMetrics = useMemo(() => {
    const total = filteredStudents.length;
    const hadir = filteredStudents.filter(s => (s.statusKehadiran || 'Hadir') === 'Hadir').length;
    const sakit = filteredStudents.filter(s => s.statusKehadiran === 'Sakit').length;
    const izin = filteredStudents.filter(s => s.statusKehadiran === 'Izin').length;
    const alfa = filteredStudents.filter(s => s.statusKehadiran === 'Alfa').length;
    const percentHadir = total > 0 ? Math.round((hadir / total) * 100) : 100;

    return { total, hadir, sakit, izin, alfa, percentHadir };
  }, [filteredStudents]);

  // 30 Days Trend Aggregator for Student Violations (Recharts)
  // Strictly calculated day-by-day from actual filtered violations for the last 30 days
  const thirtyDaysTrendData = useMemo(() => {
    const list = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayLabel = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d);

      // Violations matching this specific date
      const dayViolations = filteredViolations.filter((v) => v.tanggal === dateStr);
      const Ringan = dayViolations.filter((v) => v.tingkat === 'Ringan').length;
      const Sedang = dayViolations.filter((v) => v.tingkat === 'Sedang').length;
      const Berat = dayViolations.filter((v) => v.tingkat === 'Berat').length;
      const Total = Ringan + Sedang + Berat;

      list.push({
        dateStr,
        label: dayLabel,
        name: dayLabel,
        Ringan,
        Sedang,
        Berat,
        Total,
      });
    }
    return list;
  }, [filteredViolations]);

  // 30-Day Summary Metrics
  const thirtyDaysStats = useMemo(() => {
    const total = thirtyDaysTrendData.reduce((acc, curr) => acc + curr.Total, 0);
    const totalRingan = thirtyDaysTrendData.reduce((acc, curr) => acc + curr.Ringan, 0);
    const totalSedang = thirtyDaysTrendData.reduce((acc, curr) => acc + curr.Sedang, 0);
    const totalBerat = thirtyDaysTrendData.reduce((acc, curr) => acc + curr.Berat, 0);
    const cleanDays = thirtyDaysTrendData.filter((d) => d.Total === 0).length;
    const dailyAvg = (total / 30).toFixed(1);
    
    // Find peak day
    let peakDay = { label: '-', count: 0 };
    thirtyDaysTrendData.forEach((d) => {
      if (d.Total > peakDay.count) {
        peakDay = { label: d.label, count: d.Total };
      }
    });

    return {
      total,
      totalRingan,
      totalSedang,
      totalBerat,
      cleanDays,
      dailyAvg,
      peakDay,
    };
  }, [thirtyDaysTrendData]);

  // Recharts Monthly Trends Aggregator (Academic Year Cycle: Jul - Jun)
  // Strictly calculated from actual filtered violations (100% clean when 0 violations)
  const monthlyTrendsData = useMemo(() => {
    const monthDefs = [
      { key: '07', label: 'Jul' },
      { key: '08', label: 'Agu' },
      { key: '09', label: 'Sep' },
      { key: '10', label: 'Okt' },
      { key: '11', label: 'Nov' },
      { key: '12', label: 'Des' },
      { key: '01', label: 'Jan' },
      { key: '02', label: 'Feb' },
      { key: '03', label: 'Mar' },
      { key: '04', label: 'Apr' },
      { key: '05', label: 'Mei' },
      { key: '06', label: 'Jun' },
    ];

    return monthDefs.map(({ key, label }) => {
      // Find actual records for this month
      const actualForMonth = filteredViolations.filter((v) => {
        if (!v.tanggal) return false;
        const m = v.tanggal.split('-')[1];
        return m === key;
      });

      const Ringan = actualForMonth.filter((v) => v.tingkat === 'Ringan').length;
      const Sedang = actualForMonth.filter((v) => v.tingkat === 'Sedang').length;
      const Berat = actualForMonth.filter((v) => v.tingkat === 'Berat').length;
      const Total = Ringan + Sedang + Berat;

      return {
        label,
        name: label,
        Ringan,
        Sedang,
        Berat,
        Total,
      };
    });
  }, [filteredViolations]);

  // Active chart data based on timeframe
  const activeChartData = useMemo(() => {
    if (trendTimeframe === '7days') {
      return thirtyDaysTrendData.slice(-7);
    }
    if (trendTimeframe === 'monthly') {
      return monthlyTrendsData;
    }
    return thirtyDaysTrendData;
  }, [trendTimeframe, thirtyDaysTrendData, monthlyTrendsData]);


  // Current scope title description
  const activeScopeLabel = useMemo(() => {
    if (selectedKelasFilter !== 'all') {
      return `Kelas ${selectedKelasFilter} (${filteredStudents.length} Siswa Terdaftar)`;
    }
    if (selectedJenjangFilter !== 'all') {
      return `Jenjang Kelas ${selectedJenjangFilter} (8 Rombel, ${filteredStudents.length} Siswa)`;
    }
    return `Seluruh Rombel (24 Kelas, 7A - 9H, ${filteredStudents.length} Siswa)`;
  }, [selectedKelasFilter, selectedJenjangFilter, filteredStudents.length]);

  return (
    <div className="space-y-6">
      {/* Running Announcement Text */}
      <div className="bg-[#0B231E] text-white px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-xs border border-[#163830] overflow-hidden">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#83C532] text-[#0B231E] font-bold text-[10px] tracking-wider uppercase shrink-0">
          <Volume2 className="w-3.5 h-3.5" />
          <span>Pengumuman</span>
        </div>
        <div className="text-xs text-slate-200 overflow-hidden text-ellipsis whitespace-nowrap">
          Portal Resmi BSAN (Budaya Sekolah Aman dan Nyaman) {schoolConfig.name || 'SMPN 1 Kandangan'}, Kecamatan Kandangan, Kabupaten Temanggung, Jawa Tengah. Bersama wujudkan iklim sekolah berkarakter dan berintegritas.
        </div>
      </div>

      {/* Hero Large Executive Time & School Identity KPI Card */}
      <div className="bg-gradient-to-r from-[#0B231E] via-[#0f342a] to-[#124235] text-white p-6 lg:p-8 rounded-3xl border border-[#1a4f40] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#83C532]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: School Identity */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-[#83C532]/25 text-[#83C532] font-bold">
                PORTAL EKSEKUTIF KONTROL KEDISIPLINAN
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300 font-medium">NPSN: {schoolConfig.npsn}</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
              {schoolConfig.name} ({schoolConfig.shortName})
            </h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              {schoolConfig.motto}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#83C532]" />
                <span>Kec. Kandangan, Kab. Temanggung, Jawa Tengah</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CloudSun className="w-4 h-4 text-[#83C532]" />
                <span>27°C Sejuk Berawan · Stasiun BMKG Temanggung</span>
              </div>
            </div>
          </div>

          {/* Right: Relatif Besar KPI Waktu (Executive Live Digital Clock) */}
          <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-5 lg:p-6 text-center lg:text-right shrink-0 flex flex-col justify-center min-w-[280px]">
            <div className="flex items-center justify-center lg:justify-end gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4 text-[#83C532]" />
              <span>{timeState.day || 'Hari Ini'}</span>
            </div>
            
            <div className="text-xs text-slate-300 font-medium mb-2">
              {timeState.date || 'Tanggal Pelaporan'}
            </div>

            {/* Giant Digital Clock */}
            <div className="flex items-baseline justify-center lg:justify-end gap-1">
              <span className="text-4xl lg:text-5xl font-black font-mono tracking-wider text-white">
                {timeState.time || '07:30'}
              </span>
              <span className="text-xl font-bold font-mono text-[#83C532]">
                :{timeState.seconds || '00'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-300 ml-1">
                WIB
              </span>
            </div>

            <div className="mt-2 text-[11px] text-emerald-400/90 font-medium flex items-center justify-center lg:justify-end gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#83C532] animate-pulse"></span>
              <span>Sistem Monitoring Pelanggaran Terpadu Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILTER TIAP KELAS & JENJANG (24 ROMBEL: 7A - 9H)                          */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left: Filter Title & Active Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B231E] text-[#83C532] flex items-center justify-center shadow-xs shrink-0">
              <Filter className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Filter Rombel & Jenjang:
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-200">
                  {activeScopeLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pilih rombel tertentu atau jenjang untuk menganalisis metrik kedisiplinan dan tren Recharts per kelas.
              </p>
            </div>
          </div>

          {/* Right: Quick Jenjang Buttons & Dropdown Kelas 7A - 9H */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Jenjang Chips */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => handleSelectJenjang('all')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  selectedJenjangFilter === 'all' && selectedKelasFilter === 'all'
                    ? 'bg-[#0B231E] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => handleSelectJenjang(7)}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  selectedJenjangFilter === 7 && selectedKelasFilter === 'all'
                    ? 'bg-[#0B231E] text-[#83C532] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kelas 7
              </button>
              <button
                onClick={() => handleSelectJenjang(8)}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  selectedJenjangFilter === 8 && selectedKelasFilter === 'all'
                    ? 'bg-[#0B231E] text-[#83C532] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kelas 8
              </button>
              <button
                onClick={() => handleSelectJenjang(9)}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  selectedJenjangFilter === 9 && selectedKelasFilter === 'all'
                    ? 'bg-[#0B231E] text-[#83C532] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kelas 9
              </button>
            </div>

            {/* Dropdown 24 Kelas: 7A - 9H */}
            <div className="relative">
              <select
                value={selectedKelasFilter}
                onChange={(e) => handleSelectKelas(e.target.value)}
                className="appearance-none bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl pl-3 pr-8 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B231E]"
              >
                <option value="all">-- Semua 24 Kelas (7A - 9H) --</option>
                <optgroup label="Jenjang Kelas 7 (7A - 7H)">
                  {KELAS_LIST.filter(k => k.startsWith('7')).map((k) => (
                    <option key={k} value={k}>
                      Kelas {k} ({students.filter(s => s.kelas === k).length} Siswa)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Jenjang Kelas 8 (8A - 8H)">
                  {KELAS_LIST.filter(k => k.startsWith('8')).map((k) => (
                    <option key={k} value={k}>
                      Kelas {k} ({students.filter(s => s.kelas === k).length} Siswa)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Jenjang Kelas 9 (9A - 9H)">
                  {KELAS_LIST.filter(k => k.startsWith('9')).map((k) => (
                    <option key={k} value={k}>
                      Kelas {k} ({students.filter(s => s.kelas === k).length} Siswa)
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Reset Filter Button if customized */}
            {(selectedKelasFilter !== 'all' || selectedJenjangFilter !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                title="Reset ke Seluruh Sekolah"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3 HIGH-IMPACT SOLID EXECUTIVE KPI WIDGETS WITH ENERGETIC SPIRITED COLORS  */}
      {/* (KEHADIRAN SISWA DIHAPUS DARI DASHBOARD SESUAI PERMINTAAN USER)            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* KPI WIDGET 1: INTEGRITAS SISWA (SOLID ENERGETIC ROYAL BLUE) */}
        <div className="bg-gradient-to-br from-[#1e3a8a] via-[#1d4ed8] to-[#0284c7] text-white p-5 lg:p-6 rounded-3xl border-2 border-sky-400/60 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-cyan-300 hover:shadow-2xl transition-all">
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#0f172a] bg-cyan-300 px-2.5 py-0.5 rounded-full font-black inline-block shadow-xs">
                  INTEGRITAS SISWA
                </span>
                <h3 className="text-sm font-extrabold text-white mt-1.5 tracking-tight">
                  Kepatuhan Bebas Kasus
                </h3>
              </div>

              {/* Dynamic Glowing Mini Donut */}
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 54 54">
                  <circle
                    cx="27"
                    cy="27"
                    r={miniRadius}
                    fill="transparent"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="5"
                  />
                  <circle
                    cx="27"
                    cy="27"
                    r={miniRadius}
                    fill="transparent"
                    stroke="#38BDF8"
                    strokeWidth="5"
                    strokeDasharray={`${(complianceRateNum / 100) * miniCircumference} ${miniCircumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-cyan-300" />
                </div>
              </div>
            </div>

            {/* Giant Metric Number */}
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl lg:text-4xl font-black font-mono tracking-tight text-white drop-shadow-xs">
                {complianceRate}%
              </span>
              <span className="text-xs font-mono font-bold text-cyan-100">
                ({cleanStudents.length} Disiplin Murni)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 space-y-1.5">
              <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden flex p-0.5 border border-white/20">
                <div
                  style={{ width: `${complianceRate}%` }}
                  className="bg-gradient-to-r from-cyan-400 to-sky-200 h-full rounded-full transition-all duration-500"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-cyan-100 font-mono font-semibold">
                <span>Total: {totalStudents} Siswa Terdaftar</span>
                <span className="text-cyan-200 font-black">
                  {studentsInGuidance.length} Siswa Dalam Pembinaan
                </span>
              </div>
            </div>
          </div>

          {/* Scope Footer */}
          <div className="mt-5 pt-3 border-t border-white/20 flex items-center justify-between text-[10px] text-cyan-100 font-medium relative z-10">
            <span>Cakupan: <strong>{selectedKelasFilter !== 'all' ? `Kelas ${selectedKelasFilter}` : (selectedJenjangFilter !== 'all' ? `Jenjang ${selectedJenjangFilter}` : '24 Rombel')}</strong></span>
            <span className="text-[#0B231E] font-black bg-[#83C532] px-2 py-0.5 rounded-md">BSAN Kandangan</span>
          </div>
        </div>

        {/* KPI WIDGET 2: DISTRIBUSI KASUS (SOLID ENERGETIC FLAME AMBER/ORANGE) */}
        <div className="bg-gradient-to-br from-[#9a3412] via-[#ea580c] to-[#e11d48] text-white p-5 lg:p-6 rounded-3xl border-2 border-amber-400/60 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-amber-300 hover:shadow-2xl transition-all">
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#451a03] bg-amber-300 px-2.5 py-0.5 rounded-full font-black inline-block shadow-xs">
                  DISTRIBUSI KASUS
                </span>
                <h3 className="text-sm font-extrabold text-white mt-1.5 tracking-tight">
                  Spektrum Pelanggaran
                </h3>
              </div>

              {/* Dynamic Glowing Mini Donut */}
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 54 54">
                  <circle
                    cx="27"
                    cy="27"
                    r={miniRadius}
                    fill="transparent"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="5"
                  />
                  {totalViolations > 0 ? (
                    <>
                      <circle
                        cx="27"
                        cy="27"
                        r={miniRadius}
                        fill="transparent"
                        stroke="#83C532"
                        strokeWidth="5"
                        strokeDasharray={`${(ringanRate / 100) * miniCircumference} ${miniCircumference}`}
                        strokeDashoffset="0"
                      />
                      <circle
                        cx="27"
                        cy="27"
                        r={miniRadius}
                        fill="transparent"
                        stroke="#FCD34D"
                        strokeWidth="5"
                        strokeDasharray={`${(sedangRate / 100) * miniCircumference} ${miniCircumference}`}
                        strokeDashoffset={`-${(ringanRate / 100) * miniCircumference}`}
                      />
                      <circle
                        cx="27"
                        cy="27"
                        r={miniRadius}
                        fill="transparent"
                        stroke="#FDA4AF"
                        strokeWidth="5"
                        strokeDasharray={`${(beratRate / 100) * miniCircumference} ${miniCircumference}`}
                        strokeDashoffset={`-${((ringanRate + sedangRate) / 100) * miniCircumference}`}
                      />
                    </>
                  ) : null}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-200" />
                </div>
              </div>
            </div>

            {/* Giant Metric Number */}
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl lg:text-4xl font-black font-mono tracking-tight text-white drop-shadow-xs">
                {totalViolations}
              </span>
              <span className="text-xs font-mono font-bold text-amber-100">
                Kasus Terdaftar
              </span>
            </div>

            {/* Multi-Segment Severity Progress Bar */}
            <div className="mt-3 space-y-1.5">
              <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden flex p-0.5 border border-white/20">
                {totalViolations > 0 ? (
                  <>
                    <div
                      style={{ width: `${ringanRate}%` }}
                      className="bg-[#83C532] h-full rounded-l-full transition-all duration-500"
                      title={`Ringan: ${totalRingan} Kasus`}
                    />
                    <div
                      style={{ width: `${sedangRate}%` }}
                      className="bg-amber-300 h-full transition-all duration-500"
                      title={`Sedang: ${totalSedang} Kasus`}
                    />
                    <div
                      style={{ width: `${beratRate}%` }}
                      className="bg-rose-400 h-full rounded-r-full transition-all duration-500"
                      title={`Berat: ${totalBerat} Kasus`}
                    />
                  </>
                ) : (
                  <div className="w-full bg-[#83C532] h-full rounded-full" />
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-amber-100 font-mono font-semibold">
                <span>R: {totalRingan} · S: {totalSedang}</span>
                <span className={`font-black ${totalBerat === 0 ? 'text-[#83C532]' : 'text-rose-200'}`}>
                  {totalBerat === 0 ? '✓ BEBAS KASUS BERAT' : `${totalBerat} KASUS BERAT`}
                </span>
              </div>
            </div>
          </div>

          {/* Severity Breakdown Footer */}
          <div className="mt-5 pt-3 border-t border-white/20 grid grid-cols-3 gap-1.5 text-center text-[10px] relative z-10">
            <div className="bg-black/25 border border-white/20 rounded-xl py-1 px-1">
              <span className="text-emerald-100 font-medium block">Ringan</span>
              <span className="font-black text-[#83C532] font-mono text-xs">{totalRingan}</span>
            </div>
            <div className="bg-black/25 border border-white/20 rounded-xl py-1 px-1">
              <span className="text-amber-100 font-medium block">Sedang</span>
              <span className="font-black text-amber-300 font-mono text-xs">{totalSedang}</span>
            </div>
            <div className="bg-black/25 border border-white/20 rounded-xl py-1 px-1">
              <span className="text-rose-100 font-medium block">Berat</span>
              <span className="font-black text-rose-300 font-mono text-xs">{totalBerat}</span>
            </div>
          </div>
        </div>

        {/* KPI WIDGET 3: TINDAK LANJUT & RESOLUSI (SOLID ENERGETIC ROYAL VIOLET) */}
        <div className="bg-gradient-to-br from-[#581c87] via-[#7c3aed] to-[#4338ca] text-white p-5 lg:p-6 rounded-3xl border-2 border-purple-400/60 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-fuchsia-300 hover:shadow-2xl transition-all">
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#3b0764] bg-fuchsia-300 px-2.5 py-0.5 rounded-full font-black inline-block shadow-xs">
                  TINDAK LANJUT
                </span>
                <h3 className="text-sm font-extrabold text-white mt-1.5 tracking-tight">
                  Efektivitas Resolusi Kasus
                </h3>
              </div>

              {/* Dynamic Glowing Mini Donut */}
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 54 54">
                  <circle
                    cx="27"
                    cy="27"
                    r={miniRadius}
                    fill="transparent"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="5"
                  />
                  <circle
                    cx="27"
                    cy="27"
                    r={miniRadius}
                    fill="transparent"
                    stroke="#E879F9"
                    strokeWidth="5"
                    strokeDasharray={`${(resolutionRateNum / 100) * miniCircumference} ${miniCircumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Award className="w-5 h-5 text-fuchsia-300" />
                </div>
              </div>
            </div>

            {/* Giant Metric Number */}
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl lg:text-4xl font-black font-mono tracking-tight text-white drop-shadow-xs">
                {resolutionRate}%
              </span>
              <span className="text-xs font-mono font-bold text-fuchsia-200">
                ({selesaiCount} Tuntas Selesai)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 space-y-1.5">
              <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden flex p-0.5 border border-white/20">
                <div
                  style={{ width: `${resolutionRate}%` }}
                  className="bg-gradient-to-r from-fuchsia-400 to-pink-300 h-full rounded-full transition-all duration-500"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-purple-100 font-mono font-semibold">
                <span>Kasus Berjalan: {totalViolations - selesaiCount}</span>
                <span className="text-fuchsia-300 font-black">
                  SOP BK & KESISWAAN
                </span>
              </div>
            </div>
          </div>

          {/* Action Status Footer */}
          <div className="mt-5 pt-3 border-t border-white/20 flex items-center justify-between text-[10px] text-purple-100 font-medium relative z-10">
            <span>Surat Tuntas: <strong className="font-mono text-white text-xs">{selesaiCount}</strong></span>
            <span className="text-[#0B231E] font-black bg-[#83C532] px-2 py-0.5 rounded-md">100% Edukatif</span>
          </div>
        </div>

      </div>

      {/* Quick Action Center */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#83C532]"></div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Aksi Cepat Manajemen BSAN:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenQuickViolation}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0B231E] hover:bg-[#143d34] text-white text-xs font-medium rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#83C532]" />
            <span>Catat Pelanggaran</span>
          </button>
          <button
            onClick={() => onNavigate('violations')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-medium rounded-xl border border-amber-200 transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
            <span>Buku Pelanggaran & Unduh</span>
          </button>
          <button
            onClick={() => onNavigate('tatatertib')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>Pusat Tata Tertib</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak Rekapitulasi</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RECHARTS DATA VISUALIZATION: TREN BULANAN PELANGGARAN SISWA                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Analytics Visualizer (2 Columns) with Recharts */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#0B231E]" />
                  <h3 className="font-bold text-slate-900 text-base">
                    {trendTimeframe === '30days' 
                      ? 'Tren Pelanggaran Siswa 30 Hari Terakhir'
                      : trendTimeframe === '7days'
                      ? 'Tren Pelanggaran Siswa 7 Hari Terakhir'
                      : 'Visualisasi Tren Bulanan Pelanggaran Siswa'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#83C532]/20 text-[#0B231E] font-bold text-[10px] uppercase font-mono">
                    Recharts
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {trendTimeframe === '30days'
                    ? 'Monitoring harian dinamika kedisiplinan 30 hari terakhir untuk tindakan preventif Tim Kesiswaan.'
                    : 'Pemantauan pola kedisiplinan berjangka waktu (Ringan, Sedang, Berat) untuk pimpinan sekolah.'}
                </p>
              </div>

              {/* Timeframe & Chart Visualization Switchers */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Timeframe Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setTrendTimeframe('30days')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      trendTimeframe === '30days'
                        ? 'bg-[#0B231E] text-[#83C532] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    30 Hari
                  </button>
                  <button
                    onClick={() => setTrendTimeframe('7days')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      trendTimeframe === '7days'
                        ? 'bg-[#0B231E] text-[#83C532] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    7 Hari
                  </button>
                  <button
                    onClick={() => setTrendTimeframe('monthly')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      trendTimeframe === 'monthly'
                        ? 'bg-[#0B231E] text-[#83C532] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Bulanan
                  </button>
                </div>

                {/* Chart Visualization Switcher: Area | Bar | Line */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setChartVizType('area')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      chartVizType === 'area'
                        ? 'bg-[#0B231E] text-[#83C532] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Diagram Area Volumetrik"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Area</span>
                  </button>
                  <button
                    onClick={() => setChartVizType('bar')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      chartVizType === 'bar'
                        ? 'bg-[#0B231E] text-[#83C532] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Diagram Batang Akumulasi"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Batang</span>
                  </button>
                  <button
                    onClick={() => setChartVizType('line')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      chartVizType === 'line'
                        ? 'bg-[#0B231E] text-[#83C532] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Grafik Garis Komparatif"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Garis</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 30-Day Specific Metrics Highlights */}
            {trendTimeframe === '30days' && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Kasus (30 Hari)</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-mono font-black text-slate-900">{thirtyDaysStats.total}</span>
                    <span className="text-[10px] text-slate-400">kasus</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Rata-rata Harian</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-mono font-black text-slate-900">{thirtyDaysStats.dailyAvg}</span>
                    <span className="text-[10px] text-slate-400">kasus/hari</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Hari Tertinggi</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-sm font-bold text-slate-800">{thirtyDaysStats.peakDay.label}</span>
                    <span className="text-[10px] font-mono text-slate-500">({thirtyDaysStats.peakDay.count} kasus)</span>
                  </div>
                </div>
                <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Hari Bebas Pelanggaran</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-mono font-black text-emerald-700">{thirtyDaysStats.cleanDays}</span>
                    <span className="text-[10px] text-emerald-600">/ 30 Hari</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recharts Container */}
            <div className="w-full h-72 sm:h-80 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                {chartVizType === 'area' ? (
                  <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRingan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="colorSedang" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="colorBerat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0B231E" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0B231E" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 10, fill: '#64748B' }} 
                      stroke="#CBD5E1" 
                      interval={trendTimeframe === '30days' ? 3 : 0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0B231E', 
                        borderColor: '#163830', 
                        borderRadius: '16px', 
                        color: '#fff',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)' 
                      }}
                      itemStyle={{ color: '#E2E8F0', fontSize: '11px', fontWeight: 'bold' }}
                      labelStyle={{ color: '#83C532', fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} 
                    />
                    <Area type="monotone" dataKey="Ringan" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRingan)" />
                    <Area type="monotone" dataKey="Sedang" stroke="#F59E0B" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSedang)" />
                    <Area type="monotone" dataKey="Berat" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBerat)" />
                  </AreaChart>
                ) : chartVizType === 'bar' ? (
                  <BarChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 10, fill: '#64748B' }} 
                      stroke="#CBD5E1" 
                      interval={trendTimeframe === '30days' ? 3 : 0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0B231E', 
                        borderColor: '#163830', 
                        borderRadius: '16px', 
                        color: '#fff',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)' 
                      }}
                      itemStyle={{ color: '#E2E8F0', fontSize: '11px', fontWeight: 'bold' }}
                      labelStyle={{ color: '#83C532', fontWeight: 'bold', fontSize: '12px' }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Bar dataKey="Ringan" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Sedang" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Berat" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 10, fill: '#64748B' }} 
                      stroke="#CBD5E1" 
                      interval={trendTimeframe === '30days' ? 3 : 0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0B231E', 
                        borderColor: '#163830', 
                        borderRadius: '16px', 
                        color: '#fff',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)' 
                      }}
                      itemStyle={{ color: '#E2E8F0', fontSize: '11px', fontWeight: 'bold' }}
                      labelStyle={{ color: '#83C532', fontWeight: 'bold', fontSize: '12px' }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Line type="monotone" dataKey="Ringan" stroke="#10B981" strokeWidth={3} dot={{ r: 3, fill: '#10B981' }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Sedang" stroke="#F59E0B" strokeWidth={3} dot={{ r: 3, fill: '#F59E0B' }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Berat" stroke="#EF4444" strokeWidth={3} dot={{ r: 3, fill: '#EF4444' }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Total" stroke="#0B231E" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Insights Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Ringan (Mapel/Piket)</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Sedang (Bimbingan Konseling)</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Berat (Kepala Sekolah)</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-600 font-mono">
              *Tersinkronisasi otomatis dengan Buku Pelanggaran & Database Siswa
            </span>
          </div>
        </div>

        {/* Informasi Presensi & Kehadiran Siswa 24 Rombel (1 Column) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Informasi Presensi Rombel</h3>
                  <p className="text-[11px] text-slate-500">Monitoring Kehadiran Siswa Hari Ini</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {todayAttendanceMetrics.percentHadir}% Hadir
              </span>
            </div>

            {/* Quick 4-Status Counter Grid */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800">Hadir (H)</span>
                <div className="text-xl font-black font-mono text-emerald-700 mt-0.5">
                  {todayAttendanceMetrics.hadir}
                </div>
                <span className="text-[10px] text-emerald-600">Siswa Masuk</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-amber-800">Sakit (S)</span>
                <div className="text-xl font-black font-mono text-amber-700 mt-0.5">
                  {todayAttendanceMetrics.sakit}
                </div>
                <span className="text-[10px] text-amber-600">Izin Sakit</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-blue-50/70 border border-blue-200">
                <span className="text-[10px] uppercase font-bold text-blue-800">Izin (I)</span>
                <div className="text-xl font-black font-mono text-blue-700 mt-0.5">
                  {todayAttendanceMetrics.izin}
                </div>
                <span className="text-[10px] text-blue-600">Izin Resmi</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-rose-50/70 border border-rose-200">
                <span className="text-[10px] uppercase font-bold text-rose-800">Alpa (A)</span>
                <div className="text-xl font-black font-mono text-rose-700 mt-0.5">
                  {todayAttendanceMetrics.alfa}
                </div>
                <span className="text-[10px] text-rose-600">Tanpa Ket.</span>
              </div>
            </div>

            {/* Jenjang 7, 8, 9 Summary Bars */}
            <div className="space-y-2 mt-4">
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Kehadiran Per-Jenjang (24 Rombel):
              </span>
              {[7, 8, 9].map((jenjang) => {
                const jStudents = students.filter(s => s.jenjang === jenjang);
                const jHadir = jStudents.filter(s => (s.statusKehadiran || 'Hadir') === 'Hadir').length;
                const jTotal = jStudents.length;
                const jPct = jTotal > 0 ? Math.round((jHadir / jTotal) * 100) : 100;

                return (
                  <div key={jenjang} className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-[#0B231E] text-white flex items-center justify-center font-bold text-[10px]">
                        {jenjang}
                      </span>
                      <span className="font-semibold text-slate-800">Kelas {jenjang} (8 Rombel)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${jPct}%` }}></div>
                      </div>
                      <span className="font-mono font-bold text-slate-900 text-[11px]">{jPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs text-[#0B231E] font-bold hover:text-emerald-800 inline-flex items-center gap-1.5 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-all w-full justify-center"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Buka Menu Presensi & Rekap 24 Rombel &rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DAFTAR SISWA DALAM PEMBINAAN KEDISIPLINAN & KONTROL SLIP PELANGGARAN        */}
      {/* (MENGGANTIKAN TABEL ABSENSI/KEHADIRAN LAMA DENGAN TABEL MURNI KEDISIPLINAN) */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              <h3 className="font-bold text-slate-900 text-base">
                Daftar Peserta Didik Dalam Pembinaan Kedisiplinan & Pelanggaran Aktif
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Klik nama siswa untuk membuka <strong>Slip Detail Catatan Pelanggaran Lengkap</strong> beserta opsi cetak dan unduh dokumen resmi (PDF, Word, Excel).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Dalam Pembinaan: {studentsInGuidance.length} Siswa
            </span>
          </div>
        </div>

        {studentsInGuidance.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <div className="font-bold text-sm text-slate-800">
              {selectedKelasFilter !== 'all' 
                ? `Kelas ${selectedKelasFilter} Bebas Pelanggaran!` 
                : 'Seluruh Siswa Tertib & Disiplin'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Nihil catatan pelanggaran aktif pada cakupan yang dipilih. Budaya aman dan nyaman terjaga dengan prima.
            </div>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Siswa & NISN</th>
                  <th className="py-3 px-3">Kelas</th>
                  <th className="py-3 px-3 text-center">Ringan</th>
                  <th className="py-3 px-3 text-center">Sedang</th>
                  <th className="py-3 px-3 text-center">Berat</th>
                  <th className="py-3 px-4">Orang Tua / Wali</th>
                  <th className="py-3 px-4 text-center">Aksi / Slip Siswa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentsInGuidance.map((student) => {
                  const hasBerat = student.totalPelanggaranBerat > 0;
                  const hasSedang = student.totalPelanggaranSedang > 0;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onSelectStudentProfile(student)}
                          className="font-bold text-slate-900 hover:text-emerald-800 text-left cursor-pointer group flex items-center gap-1.5"
                          title="Klik untuk membuka Slip Detail Siswa Lengkap"
                        >
                          <span className="group-hover:underline">{student.nama}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700" />
                        </button>
                        <div className="text-[10px] text-slate-500 font-mono">NISN: {student.nisn}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {student.kelas}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {student.totalPelanggaranRingan}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                          student.totalPelanggaranSedang > 0 ? 'bg-amber-100 text-amber-800' : 'text-slate-400 bg-slate-50'
                        }`}>
                          {student.totalPelanggaranSedang}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                          hasBerat ? 'bg-rose-100 text-rose-800 font-black' : 'text-slate-400 bg-slate-50'
                        }`}>
                          {student.totalPelanggaranBerat}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{student.namaOrtu}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{student.noWaOrtu}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onSelectStudentProfile(student)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B231E] hover:bg-[#143d34] text-white font-semibold text-xs shadow-xs transition-transform active:scale-95 cursor-pointer"
                          title="Buka Slip Catatan Pelanggaran Siswa & Unduh Dokumen"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#83C532]" />
                          <span>Buka Slip</span>
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
    </div>
  );
};
