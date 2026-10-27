import React, { useState, useEffect } from 'react';
import { Student, ViolationRecord, ViewMode, SchoolProfile } from '../../types';
import { KELAS_LIST } from '../../data/schoolConfig';
import { getWhatsAppUrl, generateAttendanceMessage } from '../../utils/whatsapp';
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  MessageSquare, 
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
  Activity,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  Gauge,
  Layers,
  Flame,
  AlertOctagon,
  Scale
} from 'lucide-react';

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
  const [selectedJenjangFilter, setSelectedJenjangFilter] = useState<number | 'all'>('all');
  const [chartType, setChartType] = useState<'bar' | 'donut'>('bar');
  const [chartMetricMode, setChartMetricMode] = useState<'attendance' | 'violations'>('attendance');

  // Real-time large clock state for home dashboard KPI
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

  // Key metrics
  const totalStudents = students.length || 1;
  const hadirStudents = students.filter((s) => s.statusKehadiran === 'Hadir');
  const sakitStudents = students.filter((s) => s.statusKehadiran === 'Sakit');
  const izinStudents = students.filter((s) => s.statusKehadiran === 'Izin');
  const alfaStudents = students.filter((s) => s.statusKehadiran === 'Alfa');
  const absentStudents = students.filter((s) => s.statusKehadiran !== 'Hadir');

  const attendanceRate = ((hadirStudents.length / totalStudents) * 100).toFixed(1);
  const attendanceRateNum = parseFloat(attendanceRate);

  // Compliance metrics (Students with 0 violations)
  const cleanStudents = students.filter(
    (s) => s.totalPelanggaranRingan === 0 && s.totalPelanggaranSedang === 0 && s.totalPelanggaranBerat === 0
  );
  const complianceRate = ((cleanStudents.length / totalStudents) * 100).toFixed(1);
  const complianceRateNum = parseFloat(complianceRate);

  // Violations metrics
  const totalViolations = violations.length;
  const totalRingan = violations.filter((v) => v.tingkat === 'Ringan').length;
  const totalSedang = violations.filter((v) => v.tingkat === 'Sedang').length;
  const totalBerat = violations.filter((v) => v.tingkat === 'Berat').length;
  const selesaiCount = violations.filter((v) => v.statusSurat === 'Selesai').length;

  const resolutionRate = totalViolations > 0 
    ? ((selesaiCount / totalViolations) * 100).toFixed(1) 
    : '100.0';
  const resolutionRateNum = parseFloat(resolutionRate);

  // Multi-segment percentages for attendance
  const hadirRate = ((hadirStudents.length / totalStudents) * 100);
  const sakitRate = ((sakitStudents.length / totalStudents) * 100);
  const izinRate = ((izinStudents.length / totalStudents) * 100);
  const alfaRate = ((alfaStudents.length / totalStudents) * 100);

  // Multi-segment percentages for violations
  const ringanRate = totalViolations > 0 ? (totalRingan / totalViolations) * 100 : 0;
  const sedangRate = totalViolations > 0 ? (totalSedang / totalViolations) * 100 : 0;
  const beratRate = totalViolations > 0 ? (totalBerat / totalViolations) * 100 : 0;

  // Class by class statistics
  const classStats = KELAS_LIST.map((kls) => {
    const classStudents = students.filter((s) => s.kelas === kls);
    const hadir = classStudents.filter((s) => s.statusKehadiran === 'Hadir').length;
    const count = classStudents.length || 1;
    const rate = Math.round((hadir / count) * 100);
    const classViolations = violations.filter((v) => v.kelas === kls);
    const ringanClass = classViolations.filter((v) => v.tingkat === 'Ringan').length;
    const sedangClass = classViolations.filter((v) => v.tingkat === 'Sedang').length;
    const beratClass = classViolations.filter((v) => v.tingkat === 'Berat').length;
    const jenjang = parseInt(kls.charAt(0));

    return {
      kelas: kls,
      jenjang,
      total: classStudents.length,
      hadir,
      absen: classStudents.length - hadir,
      rate,
      violationsCount: classViolations.length,
      ringanClass,
      sedangClass,
      beratClass,
    };
  });

  const filteredClassStats = selectedJenjangFilter === 'all'
    ? classStats
    : classStats.filter((c) => c.jenjang === selectedJenjangFilter);

  // Filtered students for attendance donut chart
  const currentStudentsScope = selectedJenjangFilter === 'all'
    ? students
    : students.filter((s) => s.jenjang === selectedJenjangFilter);

  const scopeTotal = currentStudentsScope.length || 1;
  const scopeHadir = currentStudentsScope.filter((s) => s.statusKehadiran === 'Hadir').length;
  const scopeSakit = currentStudentsScope.filter((s) => s.statusKehadiran === 'Sakit').length;
  const scopeIzin = currentStudentsScope.filter((s) => s.statusKehadiran === 'Izin').length;
  const scopeAlfa = currentStudentsScope.filter((s) => s.statusKehadiran === 'Alfa').length;

  const hadirPct = Math.round((scopeHadir / scopeTotal) * 100);
  const sakitPct = Math.round((scopeSakit / scopeTotal) * 100);
  const izinPct = Math.round((scopeIzin / scopeTotal) * 100);
  const alfaPct = Math.round((scopeAlfa / scopeTotal) * 100);

  // Filtered violations for violation donut chart
  const currentViolationsScope = selectedJenjangFilter === 'all'
    ? violations
    : violations.filter((v) => {
        const std = students.find((s) => s.id === v.studentId);
        return std ? std.jenjang === selectedJenjangFilter : true;
      });
  const scopeViolationsTotal = currentViolationsScope.length || 1;
  const scopeRingan = currentViolationsScope.filter((v) => v.tingkat === 'Ringan').length;
  const scopeSedang = currentViolationsScope.filter((v) => v.tingkat === 'Sedang').length;
  const scopeBerat = currentViolationsScope.filter((v) => v.tingkat === 'Berat').length;

  const scopeRinganPct = currentViolationsScope.length > 0 ? Math.round((scopeRingan / scopeViolationsTotal) * 100) : 0;
  const scopeSedangPct = currentViolationsScope.length > 0 ? Math.round((scopeSedang / scopeViolationsTotal) * 100) : 0;
  const scopeBeratPct = currentViolationsScope.length > 0 ? Math.round((scopeBerat / scopeViolationsTotal) * 100) : 0;

  // Donut geometry constants
  const mainRadius = 54;
  const mainCircumference = 2 * Math.PI * mainRadius; // ~339.29
  const strokeHadir = (scopeHadir / scopeTotal) * mainCircumference;
  const strokeSakit = (scopeSakit / scopeTotal) * mainCircumference;
  const strokeIzin = (scopeIzin / scopeTotal) * mainCircumference;
  const strokeAlfa = (scopeAlfa / scopeTotal) * mainCircumference;

  const strokeRingan = (scopeRingan / scopeViolationsTotal) * mainCircumference;
  const strokeSedang = (scopeSedang / scopeViolationsTotal) * mainCircumference;
  const strokeBerat = (scopeBerat / scopeViolationsTotal) * mainCircumference;

  // Mini Donut helper for KPI widgets (radius = 22, circumference = ~138.23)
  const miniRadius = 22;
  const miniCircumference = 2 * Math.PI * miniRadius;

  // Leaderboard: Top 4 classes with best discipline
  const leaderboardClasses = [...classStats]
    .sort((a, b) => {
      if (b.rate !== a.rate) return b.rate - a.rate;
      return a.violationsCount - b.violationsCount;
    })
    .slice(0, 4);

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
                PORTAL EKSEKUTIF REAL-TIME
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
              <span>Sinkronisasi Presensi Temanggung Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HIGH-IMPACT PROFESSIONAL KPI WIDGETS WITH COLOR-CODED PROGRESS & MINI-DONUT */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* HIGH-IMPACT SOLID EXECUTIVE KPI WIDGETS WITH ENERGETIC SPIRITED COLORS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI WIDGET 1: KEHADIRAN SISWA REAL-TIME (SOLID ENERGETIC EMERALD) */}
        <div className="bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#059669] text-white p-5 rounded-3xl border-2 border-emerald-400/60 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#83C532] hover:shadow-2xl transition-all">
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#0B231E] bg-[#83C532] px-2.5 py-0.5 rounded-full font-black inline-block shadow-xs">
                  KEHADIRAN SISWA
                </span>
                <h3 className="text-sm font-extrabold text-white mt-1.5 tracking-tight">
                  Tingkat Presensi Real-Time
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
                    stroke="#83C532"
                    strokeWidth="5"
                    strokeDasharray={`${(attendanceRateNum / 100) * miniCircumference} ${miniCircumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-[#83C532]" />
                </div>
              </div>
            </div>

            {/* Giant Metric Number */}
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl lg:text-4xl font-black font-mono tracking-tight text-white drop-shadow-xs">
                {attendanceRate}%
              </span>
              <span className="text-xs font-mono font-bold text-emerald-100">
                ({hadirStudents.length}/{totalStudents} Siswa)
              </span>
            </div>

            {/* Multi-Segment Color-Coded Progress Bar */}
            <div className="mt-3 space-y-1.5">
              <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden flex p-0.5 border border-white/20">
                <div
                  style={{ width: `${hadirRate}%` }}
                  className="bg-[#83C532] h-full rounded-l-full transition-all duration-500"
                  title={`Hadir: ${hadirRate.toFixed(1)}%`}
                />
                <div
                  style={{ width: `${sakitRate}%` }}
                  className="bg-amber-300 h-full transition-all duration-500"
                  title={`Sakit: ${sakitRate.toFixed(1)}%`}
                />
                <div
                  style={{ width: `${izinRate}%` }}
                  className="bg-sky-300 h-full transition-all duration-500"
                  title={`Izin: ${izinRate.toFixed(1)}%`}
                />
                <div
                  style={{ width: `${alfaRate}%` }}
                  className="bg-rose-400 h-full rounded-r-full transition-all duration-500"
                  title={`Alfa: ${alfaRate.toFixed(1)}%`}
                />
              </div>

              {/* Progress Labels */}
              <div className="flex items-center justify-between text-[10px] text-emerald-100 font-mono font-semibold">
                <span>Standar Target: &gt;95%</span>
                <span className="text-[#83C532] font-black">
                  {attendanceRateNum >= 95 ? '✓ TARGET TERCAPAI' : 'PERLU PENINGKATAN'}
                </span>
              </div>
            </div>
          </div>

          {/* Micro-Badges Breakdown Footer */}
          <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-3 gap-1.5 text-center text-[10px] relative z-10">
            <div className="bg-black/25 border border-white/20 rounded-xl py-1 px-1">
              <span className="text-emerald-100 font-medium block">Sakit</span>
              <span className="font-black text-amber-300 font-mono text-xs">{sakitStudents.length}</span>
            </div>
            <div className="bg-black/25 border border-white/20 rounded-xl py-1 px-1">
              <span className="text-emerald-100 font-medium block">Izin</span>
              <span className="font-black text-sky-200 font-mono text-xs">{izinStudents.length}</span>
            </div>
            <div className="bg-black/25 border border-white/20 rounded-xl py-1 px-1">
              <span className="text-emerald-100 font-medium block">Alfa</span>
              <span className="font-black text-rose-300 font-mono text-xs">{alfaStudents.length}</span>
            </div>
          </div>
        </div>

        {/* KPI WIDGET 2: INTEGRITAS SISWA (SOLID ENERGETIC ROYAL BLUE) */}
        <div className="bg-gradient-to-br from-[#1e3a8a] via-[#1d4ed8] to-[#0284c7] text-white p-5 rounded-3xl border-2 border-sky-400/60 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-cyan-300 hover:shadow-2xl transition-all">
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
            <div className="mt-3 flex items-baseline gap-2">
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
                <span>Total Siswa: {totalStudents}</span>
                <span className="text-cyan-200 font-black">
                  {totalStudents - cleanStudents.length} Siswa Dalam Pembinaan
                </span>
              </div>
            </div>
          </div>

          {/* Scope Footer */}
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[10px] text-cyan-100 font-medium relative z-10">
            <span>Cakupan: <strong>24 Rombel (7A - 9H)</strong></span>
            <span className="text-[#0B231E] font-black bg-[#83C532] px-2 py-0.5 rounded-md">BSAN Kandangan</span>
          </div>
        </div>

        {/* KPI WIDGET 3: DISTRIBUSI KASUS (SOLID ENERGETIC FLAME AMBER/ORANGE) */}
        <div className="bg-gradient-to-br from-[#9a3412] via-[#ea580c] to-[#e11d48] text-white p-5 rounded-3xl border-2 border-amber-400/60 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-amber-300 hover:shadow-2xl transition-all">
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
            <div className="mt-3 flex items-baseline gap-2">
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
          <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-3 gap-1.5 text-center text-[10px] relative z-10">
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

        {/* KPI WIDGET 4: TINDAK LANJUT & RESOLUSI (SOLID ENERGETIC ROYAL VIOLET) */}
        <div className="bg-gradient-to-br from-[#581c87] via-[#7c3aed] to-[#4338ca] text-white p-5 rounded-3xl border-2 border-purple-400/60 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-fuchsia-300 hover:shadow-2xl transition-all">
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
            <div className="mt-3 flex items-baseline gap-2">
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
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[10px] text-purple-100 font-medium relative z-10">
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B231E] hover:bg-[#143d34] text-white text-xs font-medium rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#83C532]" />
            <span>Catat Pelanggaran</span>
          </button>
          <button
            onClick={() => onNavigate('violations')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-medium rounded-xl border border-amber-200 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
            <span>Buku Pelanggaran & Unduh</span>
          </button>
          <button
            onClick={() => onNavigate('whatsapp')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-medium rounded-xl border border-emerald-200 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
            <span>Kirim WhatsApp Presensi</span>
          </button>
          <button
            onClick={() => onNavigate('tatatertib')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-xl transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>Pusat Tata Tertib</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-xl transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak Rekapitulasi</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REAL-TIME CLASS ATTENDANCE & VIOLATION TRENDS SECTION (CHARTS & DONUTS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Analytics Visualizer (2 Columns) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#0B231E]" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    {chartMetricMode === 'attendance'
                      ? 'Analitik Presensi Real-Time per Rombel (7A - 9D)'
                      : 'Tren & Kepadatan Pelanggaran per Rombel (7A - 9D)'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualisasi grafik batang dan diagram donat interaktif berbasis data langsung
                </p>
              </div>

              {/* Controls: Metric Mode Toggle, Chart Type Toggle, and Grade Filter */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Metric Selector (Attendance vs Violations) */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setChartMetricMode('attendance')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      chartMetricMode === 'attendance'
                        ? 'bg-[#0B231E] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Presensi
                  </button>
                  <button
                    onClick={() => setChartMetricMode('violations')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      chartMetricMode === 'violations'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pelanggaran
                  </button>
                </div>

                {/* Chart Mode Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setChartType('bar')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      chartType === 'bar'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Tampilkan Diagram Batang"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Batang</span>
                  </button>
                  <button
                    onClick={() => setChartType('donut')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      chartType === 'donut'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Tampilkan Diagram Lingkaran"
                  >
                    <PieChartIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Donat</span>
                  </button>
                </div>

                {/* Grade Filter */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setSelectedJenjangFilter('all')}
                    className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                      selectedJenjangFilter === 'all'
                        ? 'bg-[#0B231E] text-white font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setSelectedJenjangFilter(7)}
                    className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                      selectedJenjangFilter === 7
                        ? 'bg-[#0B231E] text-white font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    7
                  </button>
                  <button
                    onClick={() => setSelectedJenjangFilter(8)}
                    className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                      selectedJenjangFilter === 8
                        ? 'bg-[#0B231E] text-white font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    8
                  </button>
                  <button
                    onClick={() => setSelectedJenjangFilter(9)}
                    className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                      selectedJenjangFilter === 9
                        ? 'bg-[#0B231E] text-white font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    9
                  </button>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* VIEW 1: DIAGRAM BATANG PER KELAS DENGAN COLOR-CODED PROGRESS */}
            {/* ========================================================= */}
            {chartType === 'bar' && chartMetricMode === 'attendance' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-5">
                {filteredClassStats.map((item) => {
                  const isPrima = item.rate >= 95;
                  const isBaik = item.rate >= 90;

                  return (
                    <div
                      key={item.kelas}
                      className="bg-slate-50/90 hover:bg-slate-100/90 transition-all p-3 rounded-2xl border border-slate-200/70 flex flex-col justify-between group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-[#0B231E]">
                          {item.kelas}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isPrima
                              ? 'bg-emerald-100 text-emerald-800'
                              : isBaik
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.rate}%
                        </span>
                      </div>

                      {/* Visual Color-Coded Progress Bar */}
                      <div className="mt-3">
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-300 ${
                              isPrima
                                ? 'bg-gradient-to-r from-emerald-600 to-[#83C532]'
                                : isBaik
                                ? 'bg-gradient-to-r from-blue-600 to-sky-400'
                                : 'bg-gradient-to-r from-amber-600 to-amber-400'
                            }`}
                            style={{ width: `${item.rate}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>Hadir: {item.hadir}</span>
                        {item.absen > 0 ? (
                          <span className="text-red-700 font-bold font-mono">Abs: {item.absen}</span>
                        ) : (
                          <span className="text-emerald-700 font-bold">100%</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW 1B: DIAGRAM BATANG TREN PELANGGARAN PER ROMBEL */}
            {chartType === 'bar' && chartMetricMode === 'violations' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-5">
                {filteredClassStats.map((item) => {
                  const hasCases = item.violationsCount > 0;
                  const hasBerat = item.beratClass > 0;
                  const hasSedang = item.sedangClass > 0;

                  return (
                    <div
                      key={item.kelas}
                      className="bg-slate-50/90 hover:bg-slate-100/90 transition-all p-3 rounded-2xl border border-slate-200/70 flex flex-col justify-between group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-[#0B231E]">
                          {item.kelas}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            hasBerat
                              ? 'bg-rose-100 text-rose-800'
                              : hasSedang
                              ? 'bg-amber-100 text-amber-800'
                              : hasCases
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.violationsCount} Kasus
                        </span>
                      </div>

                      {/* Color-Coded Multi-Segment Bar */}
                      <div className="mt-3">
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
                          {hasCases ? (
                            <>
                              <div
                                style={{ width: `${(item.ringanClass / item.violationsCount) * 100}%` }}
                                className="bg-emerald-500 h-full"
                                title={`Ringan: ${item.ringanClass}`}
                              />
                              <div
                                style={{ width: `${(item.sedangClass / item.violationsCount) * 100}%` }}
                                className="bg-amber-500 h-full"
                                title={`Sedang: ${item.sedangClass}`}
                              />
                              <div
                                style={{ width: `${(item.beratClass / item.violationsCount) * 100}%` }}
                                className="bg-rose-600 h-full"
                                title={`Berat: ${item.beratClass}`}
                              />
                            </>
                          ) : (
                            <div className="w-full bg-emerald-400/40 h-full rounded-full" />
                          )}
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        {hasCases ? (
                          <span className="font-mono text-slate-700">R:{item.ringanClass} S:{item.sedangClass} B:{item.beratClass}</span>
                        ) : (
                          <span className="text-emerald-700 font-bold">Nihil Kasus</span>
                        )}
                        <span className="text-slate-400">{item.total} Siswa</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW 2: DIAGRAM DONAT INTERAKTIF DENGAN STATISTIK DINAMIS */}
            {/* ========================================================= */}
            {chartType === 'donut' && chartMetricMode === 'attendance' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mt-5 p-5 bg-slate-50 rounded-2xl border border-slate-200/70">
                {/* Dynamic SVG Donut */}
                <div className="relative flex items-center justify-center">
                  <svg className="w-52 h-52 transform -rotate-90" viewBox="0 0 140 140">
                    <circle
                      cx="70"
                      cy="70"
                      r={mainRadius}
                      fill="transparent"
                      stroke="#E2E8F0"
                      strokeWidth="16"
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r={mainRadius}
                      fill="transparent"
                      stroke="#0B231E"
                      strokeWidth="16"
                      strokeDasharray={`${strokeHadir} ${mainCircumference}`}
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r={mainRadius}
                      fill="transparent"
                      stroke="#D97706"
                      strokeWidth="16"
                      strokeDasharray={`${strokeSakit} ${mainCircumference}`}
                      strokeDashoffset={`-${strokeHadir}`}
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r={mainRadius}
                      fill="transparent"
                      stroke="#2563EB"
                      strokeWidth="16"
                      strokeDasharray={`${strokeIzin} ${mainCircumference}`}
                      strokeDashoffset={`-${strokeHadir + strokeSakit}`}
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r={mainRadius}
                      fill="transparent"
                      stroke="#DC2626"
                      strokeWidth="16"
                      strokeDasharray={`${strokeAlfa} ${mainCircumference}`}
                      strokeDashoffset={`-${strokeHadir + strokeSakit + strokeIzin}`}
                    />
                  </svg>

                  {/* Centered KPI inside Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-black font-mono text-slate-900 leading-none">
                      {hadirPct}%
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 mt-1">
                      Tingkat Hadir
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                      {scopeHadir}/{scopeTotal}
                    </span>
                  </div>
                </div>

                {/* Donut Legend & Proportional Stats */}
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                    Distribusi Presensi ({selectedJenjangFilter === 'all' ? 'Seluruh Kelas' : `Jenjang ${selectedJenjangFilter}`}):
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#0B231E]"></span>
                        <span className="font-semibold text-slate-800">Hadir di Kelas</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">{scopeHadir} Siswa ({hadirPct}%)</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#D97706]"></span>
                        <span className="font-semibold text-slate-800">Sakit (Izin Medis)</span>
                      </div>
                      <span className="font-mono font-bold text-amber-700">{scopeSakit} Siswa ({sakitPct}%)</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#2563EB]"></span>
                        <span className="font-semibold text-slate-800">Izin Keperluan Keluarga</span>
                      </div>
                      <span className="font-mono font-bold text-blue-700">{scopeIzin} Siswa ({izinPct}%)</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#DC2626]"></span>
                        <span className="font-semibold text-slate-800">Tanpa Keterangan (Alfa)</span>
                      </div>
                      <span className="font-mono font-bold text-red-700">{scopeAlfa} Siswa ({alfaPct}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2B: DIAGRAM DONAT TREN & SPEKTRUM PELANGGARAN */}
            {chartType === 'donut' && chartMetricMode === 'violations' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mt-5 p-5 bg-slate-50 rounded-2xl border border-slate-200/70">
                {/* Dynamic SVG Donut */}
                <div className="relative flex items-center justify-center">
                  <svg className="w-52 h-52 transform -rotate-90" viewBox="0 0 140 140">
                    <circle
                      cx="70"
                      cy="70"
                      r={mainRadius}
                      fill="transparent"
                      stroke="#E2E8F0"
                      strokeWidth="16"
                    />
                    {currentViolationsScope.length > 0 ? (
                      <>
                        <circle
                          cx="70"
                          cy="70"
                          r={mainRadius}
                          fill="transparent"
                          stroke="#10B981"
                          strokeWidth="16"
                          strokeDasharray={`${strokeRingan} ${mainCircumference}`}
                          strokeDashoffset="0"
                        />
                        <circle
                          cx="70"
                          cy="70"
                          r={mainRadius}
                          fill="transparent"
                          stroke="#F59E0B"
                          strokeWidth="16"
                          strokeDasharray={`${strokeSedang} ${mainCircumference}`}
                          strokeDashoffset={`-${strokeRingan}`}
                        />
                        <circle
                          cx="70"
                          cy="70"
                          r={mainRadius}
                          fill="transparent"
                          stroke="#EF4444"
                          strokeWidth="16"
                          strokeDasharray={`${strokeBerat} ${mainCircumference}`}
                          strokeDashoffset={`-${strokeRingan + strokeSedang}`}
                        />
                      </>
                    ) : (
                      <circle
                        cx="70"
                        cy="70"
                        r={mainRadius}
                        fill="transparent"
                        stroke="#10B981"
                        strokeWidth="16"
                        strokeDasharray={`${mainCircumference} ${mainCircumference}`}
                      />
                    )}
                  </svg>

                  {/* Centered KPI */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-black font-mono text-slate-900 leading-none">
                      {currentViolationsScope.length}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 mt-1">
                      Total Kasus
                    </span>
                    <span className="text-[10px] font-mono text-purple-700 font-semibold">
                      {selectedJenjangFilter === 'all' ? 'Seluruh Rombel' : `Jenjang ${selectedJenjangFilter}`}
                    </span>
                  </div>
                </div>

                {/* Legend & Breakdown */}
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                    Klasifikasi Kasus Tata Tertib:
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                        <span className="font-semibold text-slate-800">Tingkat Ringan</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-800">{scopeRingan} Kasus ({scopeRinganPct}%)</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                        <span className="font-semibold text-slate-800">Tingkat Sedang</span>
                      </div>
                      <span className="font-mono font-bold text-amber-700">{scopeSedang} Kasus ({scopeSedangPct}%)</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                        <span className="font-semibold text-slate-800">Tingkat Berat</span>
                      </div>
                      <span className={`font-mono font-bold ${scopeBerat === 0 ? 'text-slate-500' : 'text-rose-700'}`}>
                        {scopeBerat} Kasus ({scopeBeratPct}%)
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-[11px] text-purple-900 flex items-center justify-between">
                      <span>Kasus Selesai Tuntas:</span>
                      <strong className="font-mono">{selesaiCount} Kasus</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom legend */}
          <div className="mt-6 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            {chartMetricMode === 'attendance' ? (
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0B231E]"></span>
                  <span>Hadir</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Sakit</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>Izin</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span>Alfa</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Ringan (Mapel/Piket)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Sedang (BK)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                  <span>Berat (Kepala Sekolah)</span>
                </span>
              </div>
            )}
            <span className="text-[11px] text-slate-600">
              *Diperbarui real-time per sesi piket {schoolConfig.shortName || 'SMPN 1 Kandangan'}
            </span>
          </div>
        </div>

        {/* Leaderboard Kedisiplinan Kelas */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Leaderboard Kedisiplinan</h3>
                  <p className="text-[11px] text-slate-500">Peringkat Kepatuhan BSAN Terbaik</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {leaderboardClasses.map((item, index) => (
                <div
                  key={item.kelas}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    index === 0
                      ? 'bg-amber-50/60 border-amber-200'
                      : index === 1
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        index === 0
                          ? 'bg-amber-500 text-white'
                          : index === 1
                          ? 'bg-slate-400 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">
                        Kelas {item.kelas}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Kehadiran {item.rate}% · {item.violationsCount === 0 ? 'Nihil Pelanggaran' : `${item.violationsCount} Kasus`}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Bintang Disiplin
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs text-[#0B231E] font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Lihat Detail Evaluasi Bulanan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Contact Information Panel (Klik Nama Siswa -> Buka Slip Detail Tajam & Lengkap) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <h3 className="font-bold text-slate-900 text-base">
                Panel Informasi Kontak Darurat & Buku Slip Siswa Berhalangan
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Klik pada nama siswa untuk membuka <strong>Slip Catatan & Profil Lengkap</strong> beserta linimasa riwayat kedisiplinan dan cetak dokumen.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
              Total Berhalangan: {absentStudents.length} Siswa
            </span>
          </div>
        </div>

        {absentStudents.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <div className="font-semibold text-sm">Semua Siswa Tercatat Hadir</div>
            <div className="text-xs">Tingkat kehadiran 100% sempurna hari ini.</div>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Siswa & NISN</th>
                  <th className="py-3 px-3">Kelas</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4">Keterangan / Alasan</th>
                  <th className="py-3 px-4">Alamat Domisili</th>
                  <th className="py-3 px-4">Nama Orang Tua / Wali</th>
                  <th className="py-3 px-4 text-center">Tindakan Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {absentStudents.map((student) => {
                  const message = generateAttendanceMessage(student);
                  const waUrl = getWhatsAppUrl(student.noWaOrtu, message);

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
                        <div className="text-[10px] text-slate-600 font-mono">NISN: {student.nisn}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {student.kelas}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`font-semibold px-2.5 py-0.5 rounded-full text-[11px] ${
                            student.statusKehadiran === 'Alfa'
                              ? 'bg-red-100 text-red-800 font-bold'
                              : student.statusKehadiran === 'Sakit'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {student.statusKehadiran}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                        {student.keteranganKehadiran || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {student.alamat}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{student.namaOrtu}</div>
                        <div className="text-[10px] text-slate-600 font-mono">{student.noWaOrtu}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectStudentProfile(student)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
                            title="Buka Slip Catatan Lengkap"
                          >
                            Buka Slip
                          </button>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-transform active:scale-95"
                            title="Hubungi Orang Tua lewat WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-white" />
                            <span>WA Ortu</span>
                          </a>
                        </div>
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
