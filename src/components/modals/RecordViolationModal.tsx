import React, { useState, useEffect, useRef } from 'react';
import { Student, TataTertibItem, ViolationRecord, DisciplinaryStage, ViolationSeverity } from '../../types';
import { TATA_TERTIB_ITEMS, determineDisciplinaryStage } from '../../data/rulesData';
import { 
  X, 
  ShieldAlert, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  Calendar,
  Clock,
  User,
  MapPin,
  UserCheck,
  FileText,
  Check,
  ChevronDown,
  RefreshCw,
  Phone,
  GraduationCap,
  Scale
} from 'lucide-react';
import { getCurrentUser } from '../../services/authService';
import { getRealtimeDateYMD, getRealtimeTimeHM, addDaysToDateStr } from '../../utils/dateUtils';

interface RecordViolationModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  preselectedStudentId?: string;
  onSaveViolation: (violation: ViolationRecord) => void;
  onOpenSurat: (violation: ViolationRecord) => void;
  onOpenWa: (student: Student, violation: ViolationRecord) => void;
}

const PASAL_LIST = [
  { num: 1, label: 'Pasal 1: Seragam' },
  { num: 2, label: 'Pasal 2: Rambut & Hiasan' },
  { num: 3, label: 'Pasal 3: Kehadiran' },
  { num: 4, label: 'Pasal 4: Ibadah & Belajar' },
  { num: 5, label: 'Pasal 5: Pelanggaran Berat' },
  { num: 6, label: 'Pasal 6: Lingkungan & Fasilitas' },
];

const LOKASI_PRESETS = [
  'Halaman Upacara / Lapangan',
  'Gerbang Utama Sekolah',
  'Ruang Kelas',
  'Kantin Sekolah',
  'Toilet / Area Belakang',
  'Laboratorium / Perpustakaan'
];

export const RecordViolationModal: React.FC<RecordViolationModalProps> = ({
  isOpen,
  onClose,
  students,
  preselectedStudentId,
  onSaveViolation,
  onOpenSurat,
  onOpenWa,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(preselectedStudentId || '');
  const [selectedRuleId, setSelectedRuleId] = useState<string>('p1-1');
  const [activePasalTab, setActivePasalTab] = useState<number>(1);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [searchRule, setSearchRule] = useState<string>('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState<boolean>(false);
  const [lokasi, setLokasi] = useState<string>('Halaman Upacara / Piket');
  const [guruPencatat, setGuruPencatat] = useState<string>(() => {
    return getCurrentUser()?.name || 'Petugas Piket / Kesiswaan';
  });
  const [catatanKhusus, setCatatanKhusus] = useState<string>('');
  const [customWaktu, setCustomWaktu] = useState<string>(() => getRealtimeTimeHM());
  const [customTanggal, setCustomTanggal] = useState<string>(() => getRealtimeDateYMD());
  
  // UX State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successSaved, setSuccessSaved] = useState<boolean>(false);

  const studentSearchRef = useRef<HTMLDivElement>(null);

  // Close student dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (studentSearchRef.current && !studentSearchRef.current.contains(event.target as Node)) {
        setIsStudentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Realtime update whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setCustomTanggal(getRealtimeDateYMD());
      setCustomWaktu(getRealtimeTimeHM());
      setIsSubmitting(false);
      setErrorMessage(null);
      setSuccessSaved(false);
      setIsStudentDropdownOpen(false);
      if (preselectedStudentId) {
        setSelectedStudentId(preselectedStudentId);
      }
      const currentUser = getCurrentUser();
      if (currentUser?.name) {
        setGuruPencatat(currentUser.name);
      }
    }
  }, [isOpen, preselectedStudentId]);

  if (!isOpen) return null;

  const currentStudent = students.find((s) => s.id === (selectedStudentId || preselectedStudentId));
  const currentRule = TATA_TERTIB_ITEMS.find((r) => r.id === selectedRuleId) || TATA_TERTIB_ITEMS[0];

  // Calculate predicted stage based purely on Ringan, Sedang, Berat counts
  const currentRingan = (currentStudent?.totalPelanggaranRingan || 0) + (currentRule.tingkat === 'Ringan' ? 1 : 0);
  const currentSedang = (currentStudent?.totalPelanggaranSedang || 0) + (currentRule.tingkat === 'Sedang' ? 1 : 0);
  const currentBerat = (currentStudent?.totalPelanggaranBerat || 0) + (currentRule.tingkat === 'Berat' ? 1 : 0);

  const predictedStage: DisciplinaryStage = determineDisciplinaryStage(
    currentRule.tingkat,
    currentRingan,
    currentSedang,
    currentBerat
  );

  // Autocomplete student filter
  const filteredStudents = students.filter(
    (s) =>
      s.nama.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.nisn.includes(searchStudent) ||
      s.kelas.toLowerCase().includes(searchStudent.toLowerCase())
  );

  // Rules filtering with search & severity pills
  const filteredRules = TATA_TERTIB_ITEMS.filter((r) => {
    const matchSearch =
      r.uraian.toLowerCase().includes(searchRule.toLowerCase()) ||
      r.kode.toLowerCase().includes(searchRule.toLowerCase()) ||
      r.pasalTitle.toLowerCase().includes(searchRule.toLowerCase()) ||
      r.kategori.toLowerCase().includes(searchRule.toLowerCase());
    
    const matchSeverity = severityFilter === 'all' || r.tingkat === severityFilter;
    const matchPasal = searchRule ? true : r.pasal === activePasalTab;

    return matchSearch && matchSeverity && matchPasal;
  });

  const getSeverityBadge = (severity: ViolationSeverity) => {
    switch (severity) {
      case 'Berat':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Pelanggaran Berat
          </span>
        );
      case 'Sedang':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Pelanggaran Sedang
          </span>
        );
      case 'Ringan':
      default:
        return (
          <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Pelanggaran Ringan
          </span>
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentStudent) {
      setErrorMessage('Harap pilih data siswa yang bersangkutan sebelum menyimpan.');
      return;
    }

    setIsSubmitting(true);

    const newViolation: ViolationRecord = {
      id: `viol-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      studentId: currentStudent.id,
      studentName: currentStudent.nama,
      kelas: currentStudent.kelas,
      pasalId: currentRule.id,
      pasalNumber: currentRule.pasal,
      pasalTitle: currentRule.pasalTitle,
      kodePasal: currentRule.kode,
      uraian: currentRule.uraian,
      tingkat: currentRule.tingkat,
      poin: 0,
      tanggal: customTanggal,
      waktu: customWaktu,
      lokasi: lokasi.trim() || 'Lingkungan Sekolah',
      guruPencatat: guruPencatat.trim() || 'Petugas Piket / Kesiswaan',
      tahapPembinaan: predictedStage,
      statusSurat: 'Diterbitkan',
      catatanKhusus: catatanKhusus.trim(),
      noWaOrtu: currentStudent.noWaOrtu,
      namaOrtu: currentStudent.namaOrtu,
    };

    // Simulate snappy submission feedback
    setTimeout(() => {
      onSaveViolation(newViolation);
      setIsSubmitting(false);
      setSuccessSaved(true);
      setTimeout(() => {
        onClose();
      }, 500);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] via-[#2F4CB7] to-[#3B5BDB] px-5 sm:px-7 py-4 flex items-center justify-between text-white shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">Formulir Catatan Pelanggaran</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30 hidden sm:inline-block">
                  Resmi SMPN 1 Kandangan
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Pencatatan disiplin, pembinaan bertingkat, dan notifikasi otomatis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-blue-100 hover:text-white cursor-pointer"
            title="Tutup Form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* ========================================================
              SECTION 1: DATA SISWA
          ======================================================== */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Data Siswa Terkait
                </h4>
              </div>
              {currentStudent && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1E3A8A] border border-blue-200">
                  Kelas {currentStudent.kelas}
                </span>
              )}
            </div>

            {/* If not preselected or wanting to change student */}
            {!preselectedStudentId ? (
              <div className="space-y-3">
                {/* Searchable Autocomplete Input */}
                <div ref={studentSearchRef} className="relative">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Cari Nama Siswa / NISN / Kelas:
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={searchStudent}
                      onFocus={() => setIsStudentDropdownOpen(true)}
                      onChange={(e) => {
                        setSearchStudent(e.target.value);
                        setIsStudentDropdownOpen(true);
                      }}
                      placeholder="Ketik minimal 1 huruf untuk mencari siswa..."
                      className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#3B5BDB]/40 focus:border-[#3B5BDB] bg-white transition-all text-slate-900 placeholder:text-slate-400"
                    />
                    {searchStudent && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchStudent('');
                          setIsStudentDropdownOpen(false);
                        }}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Dropdown List */}
                  {isStudentDropdownOpen && (
                    <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl divide-y divide-slate-100 animate-fade-in">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.slice(0, 15).map((s) => {
                          const isSelected = selectedStudentId === s.id;
                          return (
                            <div
                              key={s.id}
                              onClick={() => {
                                setSelectedStudentId(s.id);
                                setSearchStudent(s.nama);
                                setIsStudentDropdownOpen(false);
                                setErrorMessage(null);
                              }}
                              className={`p-3 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                                isSelected
                                  ? 'bg-blue-50 text-[#1E3A8A] font-semibold'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                                  {s.nama.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{s.nama}</div>
                                  <div className="text-[11px] text-slate-500">
                                    NISN: <span className="font-mono">{s.nisn}</span> · Wali: {s.namaOrtu} ({s.noWaOrtu})
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-[11px] font-bold text-slate-700 border border-slate-200">
                                  {s.kelas}
                                </span>
                                {isSelected && <Check className="w-4 h-4 text-[#3B5BDB]" />}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-500">
                          Tidak ditemukan siswa dengan kata kunci "{searchStudent}".
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Student Card Summary */}
                {currentStudent ? (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1E3A8A] to-[#3B5BDB] text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-sm">
                        {currentStudent.nama.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">{currentStudent.nama}</span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#1E3A8A] text-white">
                            {currentStudent.kelas}
                          </span>
                        </div>
                        <div className="text-slate-600 text-[11px] mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>NISN: <strong className="font-mono text-slate-800">{currentStudent.nisn}</strong></span>
                          <span>·</span>
                          <span>Wali: {currentStudent.namaOrtu}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1 text-slate-700 font-mono">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            {currentStudent.noWaOrtu}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col items-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                      <div className="text-[11px] font-medium text-slate-500">Riwayat Kasus Siswa:</div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Pelanggaran Ringan">
                          R: {currentStudent.totalPelanggaranRingan}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200" title="Pelanggaran Sedang">
                          S: {currentStudent.totalPelanggaranSedang}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200" title="Pelanggaran Berat">
                          B: {currentStudent.totalPelanggaranBerat}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-800 flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Silakan ketik atau pilih nama siswa dari kotak pencarian di atas.</span>
                  </div>
                )}
              </div>
            ) : (
              currentStudent && (
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] text-white font-bold flex items-center justify-center shrink-0">
                      {currentStudent.nama.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>{currentStudent.nama}</span>
                        <span className="px-2 py-0.5 rounded-md bg-[#1E3A8A] text-white text-[11px] font-bold">
                          {currentStudent.kelas}
                        </span>
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        NISN: {currentStudent.nisn} · Orang Tua: {currentStudent.namaOrtu} ({currentStudent.noWaOrtu})
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block">Riwayat Kasus</span>
                    <span className="font-semibold text-slate-800 text-xs">
                      R:{currentStudent.totalPelanggaranRingan} · S:{currentStudent.totalPelanggaranSedang} · B:{currentStudent.totalPelanggaranBerat}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>

          {/* ========================================================
              SECTION 2: DETAIL PELANGGARAN TATA TERTIB
          ======================================================== */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Pilih Jenis & Kode Pelanggaran Tata Tertib
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Klasifikasi resmi Buku Pedoman Tata Tertib SMPN 1 Kandangan
                  </p>
                </div>
              </div>

              {/* Keyword Search for Rules */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchRule}
                  onChange={(e) => setSearchRule(e.target.value)}
                  placeholder="Cari pasal, kode, kata kunci..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#3B5BDB]/40 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Filter Tabs: Pasal & Tingkat Pelanggaran */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              {/* Category / Pasal Tabs */}
              <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/80 rounded-xl">
                {PASAL_LIST.map((p) => (
                  <button
                    type="button"
                    key={p.num}
                    onClick={() => {
                      setActivePasalTab(p.num);
                      setSearchRule('');
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      activePasalTab === p.num && !searchRule
                        ? 'bg-[#1E3A8A] text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Severity Pills Filter */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-semibold text-slate-500">Filter Tingkat:</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'all', label: 'Semua Tingkat' },
                    { id: 'Ringan', label: 'Ringan' },
                    { id: 'Sedang', label: 'Sedang' },
                    { id: 'Berat', label: 'Berat' },
                  ].map((lvl) => (
                    <button
                      type="button"
                      key={lvl.id}
                      onClick={() => setSeverityFilter(lvl.id)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                        severityFilter === lvl.id
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Rules List Container */}
            <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-2.5 bg-slate-50/70">
              {filteredRules.length > 0 ? (
                filteredRules.map((rule) => {
                  const isSelected = selectedRuleId === rule.id;

                  return (
                    <div
                      key={rule.id}
                      onClick={() => setSelectedRuleId(rule.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#3B5BDB] bg-white ring-2 ring-[#3B5BDB]/30 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            {rule.kode}
                          </span>
                          <span className="font-bold text-slate-900">{rule.pasalTitle}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {getSeverityBadge(rule.tingkat)}
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="mt-1.5 text-slate-800 font-medium leading-relaxed">
                        {rule.uraian}
                      </p>
                      
                      <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Sanksi Prosedural: <strong className="text-slate-700">{rule.sanksiDefault}</strong></span>
                        <span className="text-slate-400 font-mono">Pasal {rule.pasal}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  Tidak ditemukan jenis pelanggaran yang sesuai dengan filter.
                </div>
              )}
            </div>

            {/* Currently Selected Rule Banner */}
            {currentRule && (
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#1E3A8A] uppercase tracking-wider">
                    Pelanggaran Terpilih:
                  </span>
                  {getSeverityBadge(currentRule.tingkat)}
                </div>
                <div className="font-bold text-slate-900 text-sm">
                  [{currentRule.kode}] {currentRule.uraian}
                </div>
                <div className="text-[11px] text-slate-600">
                  Prosedur Penanganan: <em>{currentRule.sanksiDefault}</em>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================
              SECTION 3: TINDAK LANJUT & PENJENJANGAN OTOMATIS
          ======================================================== */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 rounded-2xl p-4 sm:p-5 border border-blue-200/90 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Tindak Lanjut & Penjenjangan Pembinaan
              </h4>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#1E3A8A]">
                  Otomasi Penjenjangan Tanggung Jawab Pembinaan:
                </div>
                <div className="text-base font-extrabold text-[#1E3A8A] tracking-tight mt-0.5">
                  {predictedStage}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Sistem menetapkan tahapan dan penanggung jawab secara berjenjang berdasarkan akumulasi kasus: 
                  <span className="font-semibold text-slate-800"> Guru Piket ➔ Wali Kelas ➔ Koordinator BK ➔ Wakasek Kesiswaan ➔ Kepala Sekolah</span>.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================
              SECTION 4: KETERANGAN, WAKTU, LOKASI & PETUGAS
          ======================================================== */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold text-xs">
                4
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Waktu, Lokasi, Petugas & Keterangan
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Tanggal & Waktu */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Tanggal & Waktu
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomTanggal(getRealtimeDateYMD());
                        setCustomWaktu(getRealtimeTimeHM());
                      }}
                      className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer ${
                        customTanggal === getRealtimeDateYMD()
                          ? 'bg-blue-100 text-[#1E3A8A] font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomTanggal(addDaysToDateStr(getRealtimeDateYMD(), -1))}
                      className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer ${
                        customTanggal === addDaysToDateStr(getRealtimeDateYMD(), -1)
                          ? 'bg-blue-100 text-[#1E3A8A] font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Kemarin
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    required
                    value={customTanggal}
                    onChange={(e) => setCustomTanggal(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#3B5BDB]/40 bg-white"
                  />
                  <input
                    type="time"
                    required
                    value={customWaktu}
                    onChange={(e) => setCustomWaktu(e.target.value)}
                    className="w-24 text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#3B5BDB]/40 bg-white text-center font-mono"
                  />
                </div>
              </div>

              {/* Lokasi Kejadian */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lokasi Kejadian
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={lokasi}
                    onChange={(e) => setLokasi(e.target.value)}
                    placeholder="Contoh: Halaman Upacara / Kantin"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#3B5BDB]/40 bg-white"
                  />
                </div>
                {/* Lokasi Chips */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {LOKASI_PRESETS.slice(0, 3).map((loc) => (
                    <button
                      type="button"
                      key={loc}
                      onClick={() => setLokasi(loc)}
                      className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors cursor-pointer"
                    >
                      {loc.split(' / ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guru / Petugas Pencatat */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guru / Petugas Pencatat
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={guruPencatat}
                    onChange={(e) => setGuruPencatat(e.target.value)}
                    placeholder="Nama Petugas Pencatat"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#3B5BDB]/40 bg-white font-medium"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Otomatis terisi akun yang sedang aktif
                </span>
              </div>
            </div>

            {/* Catatan Khusus & Barang Bukti */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Keterangan Tambahan / Kronologi & Barang Bukti (Opsional)
              </label>
              <textarea
                rows={3}
                value={catatanKhusus}
                onChange={(e) => setCatatanKhusus(e.target.value)}
                placeholder="Tuliskan kronologi singkat, saksi mata, atau rincian barang bukti yang diamankan (contoh: HP disita sementara, atribut seragam tidak sesuai, rokok, dsb)..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#3B5BDB]/40 bg-white text-slate-800 placeholder:text-slate-400 leading-relaxed"
              />
            </div>
          </div>
        </form>

        {/* Modal Sticky Bottom Action Bar */}
        <div className="px-5 sm:px-7 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            {currentStudent ? (
              <span>Target: <strong className="text-slate-800">{currentStudent.nama}</strong> ({currentStudent.kelas})</span>
            ) : (
              <span className="text-rose-600 font-semibold">* Belum memilih siswa</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!currentStudent || isSubmitting}
              className={`flex-2 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                currentStudent && !isSubmitting
                  ? 'bg-gradient-to-r from-[#1E3A8A] via-[#2F4CB7] to-[#3B5BDB] hover:from-[#1E3A8A] hover:to-[#2F4CB7] text-white active:scale-98 shadow-blue-900/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Menyimpan Catatan...</span>
                </>
              ) : successSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Simpan Catatan Pelanggaran</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
